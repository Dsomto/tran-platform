import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { Prisma } from "@/generated/prisma";

// Custom email broadcaster. Admin filters the applicant pool, hand-picks
// recipients, writes a message, and sends.
//
// Like the decision emails, this does NOT send inline — it ENQUEUES
// EmailQueueItem rows (status PENDING). The /api/cron/email-drain cron
// delivers them gradually, lease-protected, with retries. So a broadcast to
// thousands is a couple of fast DB writes, never an SMTP fan-out that times out.
//
// GET  ?status=&track=&country=&stage=  — applicants matching the filters.
// POST { subject, message, applicationIds[] } — enqueue the email to each.

const CHUNK = 200;

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const p = new URL(request.url).searchParams;
  const where: Prisma.PublicApplicationWhereInput = {};

  const status = p.get("status");
  if (status && status !== "all") where.status = status;

  const track = p.get("track");
  if (track) where.trackInterest = { contains: track, mode: "insensitive" };

  const country = p.get("country");
  if (country) where.country = { contains: country, mode: "insensitive" };

  const stage = p.get("stage");
  if (stage && stage !== "all" && Number.isFinite(Number(stage))) {
    where.stage = Number(stage);
  }

  // Capped — this list is for picking recipients in the UI, not a data export.
  const applicants = await prisma.publicApplication.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 2000,
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true,
      trackInterest: true,
      country: true,
      stage: true,
    },
  });

  return Response.json({ applicants, total: applicants.length });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const ids: string[] = Array.isArray(body?.applicationIds)
      ? body.applicationIds.filter((x: unknown): x is string => typeof x === "string")
      : [];

    if (!subject) return Response.json({ error: "A subject is required." }, { status: 400 });
    if (!message) return Response.json({ error: "A message is required." }, { status: 400 });
    if (ids.length === 0) {
      return Response.json({ error: "Pick at least one recipient." }, { status: 400 });
    }

    const applicants = await prisma.publicApplication.findMany({
      where: { id: { in: ids } },
      select: { id: true, email: true },
    });
    if (applicants.length === 0) {
      return Response.json({ error: "None of the selected recipients exist." }, { status: 409 });
    }

    // Attach the queue row to a User where one exists (e.g. approved interns);
    // a plain applicant has no account, so userId stays null — same as the
    // rejection-email path.
    const users = await prisma.user.findMany({
      where: { email: { in: applicants.map((a) => a.email.toLowerCase()) } },
      select: { id: true, email: true },
    });
    const userByEmail = new Map(users.map((u) => [u.email, u.id]));

    const html = renderBroadcastEmail({ message });
    const rows: Prisma.EmailQueueItemCreateManyInput[] = applicants.map((a) => ({
      userId: userByEmail.get(a.email.toLowerCase()) ?? null,
      kind: "GENERAL",
      toEmail: a.email,
      subject,
      body: html,
      status: "PENDING",
      context: { type: "broadcast", applicationId: a.id },
    }));

    let queued = 0;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      await prisma.emailQueueItem.createMany({ data: chunk });
      queued += chunk.length;
    }

    return Response.json({ queued, requested: ids.length });
  } catch (error) {
    logger.error("broadcast_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Wrap the admin's plain-text message in the standard branded shell. The
// message is HTML-escaped — admins type plain text, not markup — and newlines
// become line breaks.
function renderBroadcastEmail({ message }: { message: string }): string {
  const safe = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
  return `
    <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#F8FAFC;padding:40px 20px;">
      <div style="background:linear-gradient(135deg,#2563EB,#0891B2);padding:32px;border-radius:16px;text-align:center;color:white;">
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;">UBI</h1>
        <p style="margin:0;font-size:13px;opacity:0.9;">Ubuntu Bridge Initiative</p>
      </div>
      <div style="background:white;padding:32px;border-radius:16px;margin-top:20px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="color:#334155;line-height:1.7;font-size:14px;">${safe}</div>
      </div>
      <p style="text-align:center;color:#94A3B8;font-size:12px;margin-top:24px;">
        Ubuntu Bridge Initiative · ubuntubridgeinitiatives.org
      </p>
    </div>
  `;
}

// Enqueuing is a handful of DB writes; 300s is ample headroom even for a
// broadcast to several thousand recipients.
export const maxDuration = 300;
