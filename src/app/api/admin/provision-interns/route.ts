import { NextRequest } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { onboardApprovedApplicant } from "@/lib/onboard";
import { recordAudit, auditMetaFromRequest } from "@/lib/audit";

// Directly provision intern accounts from a pasted list of name + email — for
// people brought in outside the public application flow. For each entry we
// create (or reuse) a User + Intern, set a fresh temp password, and queue a
// login email. They sign in with their EMAIL + temp password and are forced to
// change it on first login (existing first-login flow).
//
// POST { raw: string, track: "SOC_ANALYSIS" | "ETHICAL_HACKING" | "GRC" }
// Super-admin only. Idempotent per email (re-running resets the password and
// re-sends the login email).

const TRACKS = ["SOC_ANALYSIS", "ETHICAL_HACKING", "GRC"] as const;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

// Unambiguous alphabet (no 0/O/1/l/I) for a readable temp password.
const PW_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
function generatePassword(len = 10): string {
  const bytes = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += PW_ALPHABET[bytes[i] % PW_ALPHABET.length];
  return out;
}

// Parse free-form pasted text into { name, email } entries. Handles:
//   "Name: Jane Doe" / "Email: jane@x.com"  (label blocks)
//   "Jane Doe <jane@x.com>"  ·  "Jane Doe, jane@x.com"  ·  bare "jane@x.com"
function parseEntries(raw: string): { name: string; email: string }[] {
  const seen = new Set<string>();
  const entries: { name: string; email: string }[] = [];
  let pendingName = "";
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const nameLabel = line.match(/^name\s*[:\-]\s*(.+)$/i);
    if (nameLabel) {
      pendingName = nameLabel[1].trim();
      continue;
    }
    const m = line.match(EMAIL_RE);
    if (!m) continue;
    const email = m[0].toLowerCase();
    let name = pendingName;
    if (!name) {
      name = line
        .replace(EMAIL_RE, "")
        .replace(/^email\s*[:\-]\s*/i, "")
        .replace(/[<>,]/g, "")
        .trim();
    }
    if (!seen.has(email)) {
      seen.add(email);
      entries.push({ name: name || email.split("@")[0], email });
    }
    pendingName = "";
  }
  return entries;
}

function renderLoginEmail(opts: {
  firstName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}): string {
  const { firstName, email, tempPassword, loginUrl } = opts;
  return `
    <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#F8FAFC;padding:40px 20px;">
      <div style="background:linear-gradient(135deg,#0F172A,#2563EB);padding:32px;border-radius:16px;text-align:center;color:white;">
        <h1 style="margin:0 0 6px;font-size:24px;font-weight:800;">Ubuntu Bridge Initiative</h1>
        <p style="margin:0;font-size:13px;opacity:0.9;">Your login is ready</p>
      </div>
      <div style="background:white;padding:32px;border-radius:16px;margin-top:20px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="color:#0F172A;margin:0 0 16px;">Hi ${firstName},</h2>
        <p style="color:#334155;line-height:1.7;margin:0 0 16px;">
          An account has been created for you on the UBI cybersecurity internship platform. Use the
          details below to log in, then change your password right away.
        </p>
        <div style="background:#F1F5F9;border:1px solid #E2E8F0;border-radius:10px;padding:16px 20px;margin:20px 0;">
          <p style="margin:0 0 8px;color:#0F172A;font-size:14px;"><strong>Email:</strong> ${email}</p>
          <p style="margin:0;color:#0F172A;font-size:14px;"><strong>Temporary password:</strong>
            <span style="font-family:monospace;background:#E2E8F0;padding:2px 6px;border-radius:4px;">${tempPassword}</span>
          </p>
        </div>
        <div style="text-align:center;margin:24px 0;">
          <a href="${loginUrl}" style="display:inline-block;background:#2563EB;color:white;padding:11px 26px;border-radius:9999px;font-size:14px;font-weight:600;text-decoration:none;">
            Log in
          </a>
        </div>
        <p style="color:#64748B;line-height:1.7;font-size:13px;margin:16px 0 0;">
          For your security you'll be asked to set a new password on first login. If you didn't expect
          this email, you can ignore it.
        </p>
      </div>
      <p style="text-align:center;color:#94A3B8;font-size:12px;margin-top:24px;">
        Ubuntu Bridge Initiative · ubuntubridgeinitiatives.org
      </p>
    </div>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    const body = await request.json().catch(() => ({}));

    const track = (TRACKS as readonly string[]).includes(body?.track) ? body.track : "SOC_ANALYSIS";
    const raw = typeof body?.raw === "string" ? body.raw : "";
    const dryRun = body?.dryRun === true;

    const entries = parseEntries(raw);
    if (entries.length === 0) {
      return Response.json({ error: "No valid name + email entries found." }, { status: 400 });
    }
    if (entries.length > 500) {
      return Response.json({ error: "Too many entries (max 500 per batch)." }, { status: 400 });
    }
    if (dryRun) {
      return Response.json({ dryRun: true, parsed: entries.length, entries });
    }

    const origin = process.env.PUBLIC_APP_URL || "https://ubuntubridgeinitiatives.org";
    const loginUrl = `${origin}/login`;
    const results: { email: string; name: string; status: "created" | "existing-updated" | "error" }[] =
      [];

    for (const e of entries) {
      try {
        const tempPassword = generatePassword();
        const { userId, wasExisting } = await onboardApprovedApplicant({
          email: e.email,
          fullName: e.name,
          trackInterest: track,
          loginPassword: tempPassword,
        });
        const firstName = e.name.split(/\s+/)[0] || e.email.split("@")[0];
        await prisma.emailQueueItem.create({
          data: {
            userId,
            toEmail: e.email,
            kind: "GENERAL",
            subject: "Your UBI login",
            body: renderLoginEmail({ firstName, email: e.email, tempPassword, loginUrl }),
            status: "PENDING",
            context: { type: "direct-provision", email: e.email },
          },
        });
        results.push({ email: e.email, name: e.name, status: wasExisting ? "existing-updated" : "created" });
      } catch (err) {
        logger.error("provision_intern_failed", err, { email: e.email });
        results.push({ email: e.email, name: e.name, status: "error" });
      }
    }

    const created = results.filter((r) => r.status === "created").length;
    const existing = results.filter((r) => r.status === "existing-updated").length;
    const failed = results.filter((r) => r.status === "error").length;

    await recordAudit({
      actor: admin,
      action: "interns.direct-provision",
      targetType: "INTERN",
      targetId: "bulk",
      details: { track, total: entries.length, created, existing, failed },
      ...auditMetaFromRequest(request),
    });

    return Response.json({ total: entries.length, created, existing, failed, results });
  } catch (error) {
    logger.error("provision_interns_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const maxDuration = 300;
