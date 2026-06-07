import { NextRequest } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { recordAudit, auditMetaFromRequest } from "@/lib/audit";
import { requireApiSuperAdmin } from "@/lib/api-auth";

// Directly provision GRADER accounts from a pasted list of name + email — for
// graders brought on to score stage reports. Each entry creates (or reuses) a
// User with role GRADER (no Intern record, no track), sets a fresh temp
// password, and queues a login email. They sign in with their EMAIL + temp
// password and set a new password on first login.
//
// POST { raw: string }   Super-admin only. Idempotent per email (re-running
// resets the password and re-sends the email). An existing ADMIN / SUPER_ADMIN
// is never downgraded to GRADER.

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

// Unambiguous alphabet (no 0/O/1/l/I) for a readable temp password.
const PW_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
function generatePassword(len = 10): string {
  const bytes = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += PW_ALPHABET[bytes[i] % PW_ALPHABET.length];
  return out;
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return { firstName: parts[0] ?? "", lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
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
        <p style="margin:0;font-size:13px;opacity:0.9;">Grader access</p>
      </div>
      <div style="background:white;padding:32px;border-radius:16px;margin-top:20px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="color:#0F172A;margin:0 0 16px;">Hi ${firstName},</h2>
        <p style="color:#334155;line-height:1.7;margin:0 0 16px;">
          You've been added as a <strong>grader</strong> on the UBI cybersecurity internship
          platform. Use the details below to log in, then change your password right away.
        </p>
        <div style="background:#F1F5F9;border:1px solid #E2E8F0;border-radius:10px;padding:16px 20px;margin:20px 0;">
          <p style="margin:0 0 8px;color:#0F172A;font-size:14px;"><strong>Email:</strong> ${email}</p>
          <p style="margin:0;color:#0F172A;font-size:14px;"><strong>Temporary password:</strong>
            <span style="font-family:monospace;background:#E2E8F0;padding:2px 6px;border-radius:4px;">${tempPassword}</span>
          </p>
        </div>
        <div style="text-align:center;margin:24px 0;">
          <a href="${loginUrl}" style="display:inline-block;background:#2563EB;color:white;padding:11px 26px;border-radius:9999px;font-size:14px;font-weight:600;text-decoration:none;">
            Log in to grade
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
    const auth = await requireApiSuperAdmin();
    if (auth.response) return auth.response;
    const admin = auth.session;
    const body = await request.json().catch(() => ({}));

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
        const email = e.email.toLowerCase().trim();
        const { firstName, lastName } = splitName(e.name);

        const existing = await prisma.user.findUnique({
          where: { email },
          select: { id: true, role: true },
        });

        let userId: string;
        let status: "created" | "existing-updated";
        if (existing) {
          // Never downgrade an admin to grader; otherwise (re)set role + password.
          const keepRole = existing.role === "ADMIN" || existing.role === "SUPER_ADMIN";
          await prisma.user.update({
            where: { id: existing.id },
            data: {
              password: await hashPassword(tempPassword),
              ...(keepRole ? {} : { role: "GRADER" }),
            },
          });
          userId = existing.id;
          status = "existing-updated";
        } else {
          const user = await prisma.user.create({
            data: { email, password: await hashPassword(tempPassword), firstName, lastName, role: "GRADER" },
          });
          userId = user.id;
          status = "created";
        }

        await prisma.emailQueueItem.create({
          data: {
            userId,
            toEmail: email,
            kind: "GENERAL",
            subject: "Your UBI grader login",
            body: renderLoginEmail({ firstName: firstName || email.split("@")[0], email, tempPassword, loginUrl }),
            status: "PENDING",
            context: { type: "direct-provision-grader", email },
          },
        });
        results.push({ email, name: e.name, status });
      } catch (err) {
        logger.error("provision_grader_failed", err, { email: e.email });
        results.push({ email: e.email, name: e.name, status: "error" });
      }
    }

    const created = results.filter((r) => r.status === "created").length;
    const existing = results.filter((r) => r.status === "existing-updated").length;
    const failed = results.filter((r) => r.status === "error").length;

    await recordAudit({
      actor: admin,
      action: "graders.direct-provision",
      targetType: "USER",
      targetId: "bulk",
      details: { total: entries.length, created, existing, failed },
      ...auditMetaFromRequest(request),
    });

    return Response.json({ total: entries.length, created, existing, failed, results });
  } catch (error) {
    logger.error("provision_graders_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const maxDuration = 300;
