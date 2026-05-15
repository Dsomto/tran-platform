import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { renderPublicAcceptanceEmail, renderPublicRejectionEmail } from "@/lib/email";
import { Prisma } from "@/generated/prisma";

// Batch the decision emails. Approving / rejecting an applicant only records
// the decision — no email goes out then. This endpoint hands the emails for a
// decision pool to the delivery queue.
//
// IMPORTANT — this does NOT send email. It ENQUEUES EmailQueueItem rows
// (status PENDING). The /api/cron/email-drain cron then sends them gradually,
// lease-protected, with retries. Enqueuing thousands of rows is a couple of
// fast DB writes, so this can never time out the way a synchronous fan-out of
// 5,000 SMTP sends would.
//
// POST body: { type: "welcome" | "rejection" }
//
// De-dupe: a successful enqueue stamps welcomeEmailSentAt / rejectionEmailSentAt
// on the PublicApplication. The claim is done with an atomic updateMany on the
// still-null rows, so two admins clicking at the same moment each claim a
// disjoint set — nobody is enqueued twice. (The field name says "SentAt"; with
// the queue it means "handed to the delivery queue at" — the cron delivers
// within minutes, and any permanent failure is visible + retryable in
// /admin/emails.)
//
// GET — returns how many emails are still pending in each pool, for the admin
// UI button counts.

const CHUNK = 200;

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [welcomePending, rejectionPending] = await Promise.all([
    prisma.publicApplication.count({
      where: { status: "approved", welcomeEmailSentAt: null },
    }),
    prisma.publicApplication.count({
      where: { status: "rejected", rejectionEmailSentAt: null },
    }),
  ]);
  return Response.json({ welcomePending, rejectionPending });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const type = body?.type;
    if (type !== "welcome" && type !== "rejection") {
      return Response.json(
        { error: "type must be 'welcome' or 'rejection'" },
        { status: 400 }
      );
    }

    return type === "welcome" ? enqueueWelcome() : enqueueRejection();
  } catch (error) {
    logger.error("send_pending_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function enqueueWelcome(): Promise<Response> {
  const pool = await prisma.publicApplication.findMany({
    where: { status: "approved", welcomeEmailSentAt: null },
    select: {
      id: true,
      email: true,
      fullName: true,
      trackInterest: true,
      internId: true,
      loginPassword: true,
    },
  });
  if (pool.length === 0) {
    return Response.json({ type: "welcome", total: 0, queued: 0, skipped: 0 });
  }

  // Onboarding-incomplete rows have no usable credentials. Never email a dead
  // login — leave them un-stamped and report them as skipped so an admin can
  // re-approve them.
  const ready = pool.filter((a) => a.internId && a.loginPassword);
  let skipped = pool.length - ready.length;
  if (ready.length === 0) {
    return Response.json({ type: "welcome", total: pool.length, queued: 0, skipped });
  }

  // Atomic claim: stamp the still-null rows. A concurrent run's `null` filter
  // then excludes everything we just stamped.
  const claimAt = new Date();
  await prisma.publicApplication.updateMany({
    where: { id: { in: ready.map((a) => a.id) }, welcomeEmailSentAt: null },
    data: { welcomeEmailSentAt: claimAt },
  });
  const claimed = await prisma.publicApplication.findMany({
    where: { id: { in: ready.map((a) => a.id) }, welcomeEmailSentAt: claimAt },
    select: { id: true },
  });
  const claimedIds = new Set(claimed.map((r) => r.id));
  const mine = ready.filter((a) => claimedIds.has(a.id));
  if (mine.length === 0) {
    return Response.json({ type: "welcome", total: pool.length, queued: 0, skipped });
  }

  // Welcome emails need a User to attach the queue row to. An approved
  // applicant should always have one; if not, onboarding is inconsistent —
  // release the claim and skip rather than enqueue an orphan.
  const users = await prisma.user.findMany({
    where: { email: { in: mine.map((a) => a.email.toLowerCase()) } },
    select: { id: true, email: true },
  });
  const userByEmail = new Map(users.map((u) => [u.email, u.id]));
  const orphans = mine.filter((a) => !userByEmail.has(a.email.toLowerCase()));
  const sendable = mine.filter((a) => userByEmail.has(a.email.toLowerCase()));
  if (orphans.length) {
    await prisma.publicApplication.updateMany({
      where: { id: { in: orphans.map((a) => a.id) }, welcomeEmailSentAt: claimAt },
      data: { welcomeEmailSentAt: null },
    });
    skipped += orphans.length;
  }

  const rows: Prisma.EmailQueueItemCreateManyInput[] = sendable.map((a) => {
    const { subject, html } = renderPublicAcceptanceEmail({
      fullName: a.fullName,
      trackInterest: a.trackInterest,
      internId: a.internId ?? undefined,
      tempPassword: a.loginPassword ?? undefined,
    });
    return {
      userId: userByEmail.get(a.email.toLowerCase()),
      kind: "GENERAL",
      toEmail: a.email,
      subject,
      body: html,
      status: "PENDING",
      context: { type: "acceptance", applicationId: a.id },
    };
  });

  const queued = await enqueueChunked(rows, sendable.map((a) => a.id), "welcome");
  return Response.json({ type: "welcome", total: pool.length, queued, skipped });
}

async function enqueueRejection(): Promise<Response> {
  const pool = await prisma.publicApplication.findMany({
    where: { status: "rejected", rejectionEmailSentAt: null },
    select: { id: true, email: true, fullName: true },
  });
  if (pool.length === 0) {
    return Response.json({ type: "rejection", total: 0, queued: 0 });
  }

  const claimAt = new Date();
  await prisma.publicApplication.updateMany({
    where: { id: { in: pool.map((a) => a.id) }, rejectionEmailSentAt: null },
    data: { rejectionEmailSentAt: claimAt },
  });
  const claimed = await prisma.publicApplication.findMany({
    where: { id: { in: pool.map((a) => a.id) }, rejectionEmailSentAt: claimAt },
    select: { id: true },
  });
  const claimedIds = new Set(claimed.map((r) => r.id));
  const mine = pool.filter((a) => claimedIds.has(a.id));
  if (mine.length === 0) {
    return Response.json({ type: "rejection", total: pool.length, queued: 0 });
  }

  // Rejected applicants normally have no User account — userId stays null.
  const users = await prisma.user.findMany({
    where: { email: { in: mine.map((a) => a.email.toLowerCase()) } },
    select: { id: true, email: true },
  });
  const userByEmail = new Map(users.map((u) => [u.email, u.id]));

  const rows: Prisma.EmailQueueItemCreateManyInput[] = mine.map((a) => {
    const { subject, html } = renderPublicRejectionEmail({ fullName: a.fullName });
    return {
      userId: userByEmail.get(a.email.toLowerCase()) ?? null,
      kind: "GENERAL",
      toEmail: a.email,
      subject,
      body: html,
      status: "PENDING",
      context: { type: "rejection", applicationId: a.id },
    };
  });

  const queued = await enqueueChunked(rows, mine.map((a) => a.id), "rejection");
  return Response.json({ type: "rejection", total: pool.length, queued });
}

/**
 * Insert the queue rows in chunks. If a chunk fails, release the claim
 * (welcomeEmailSentAt / rejectionEmailSentAt -> null) on every row from the
 * failed chunk onward, so the next run retries them cleanly. Returns how many
 * rows were actually enqueued.
 */
async function enqueueChunked(
  rows: Prisma.EmailQueueItemCreateManyInput[],
  appIds: string[],
  type: "welcome" | "rejection"
): Promise<number> {
  let queued = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    try {
      await prisma.emailQueueItem.createMany({ data: chunk });
      queued += chunk.length;
    } catch (err) {
      logger.error("send_pending_enqueue_chunk_failed", err, { type, from: i });
      const remaining = appIds.slice(i);
      if (type === "welcome") {
        await prisma.publicApplication.updateMany({
          where: { id: { in: remaining } },
          data: { welcomeEmailSentAt: null },
        });
      } else {
        await prisma.publicApplication.updateMany({
          where: { id: { in: remaining } },
          data: { rejectionEmailSentAt: null },
        });
      }
      break;
    }
  }
  return queued;
}

// Enqueuing is a handful of DB writes; 300s is ample headroom even for a
// first big send of several thousand rows.
export const maxDuration = 300;
