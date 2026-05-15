import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { renderPublicAcceptanceEmail, renderPublicRejectionEmail } from "@/lib/email";
import { Prisma } from "@/generated/prisma";
import { nextInternId } from "@/lib/intern-id";
import { onboardApprovedApplicant } from "@/lib/onboard";

// Batch the decision emails — and, for the welcome pool, COMMIT the decision.
//
// Approving an applicant only parks them in the "queued_approved" pending
// list; rejecting sets status "rejected". Neither sends an email or creates an
// account on its own. This endpoint hands those pools to the delivery queue:
//
//  - welcome  → for each queued_approved applicant: mint a UBI ID + password,
//               flip status to "approved", create the backing User + Intern,
//               then enqueue the welcome email. THIS is where someone actually
//               becomes an intern.
//  - rejection → enqueue the decline email for each rejected applicant.
//
// IMPORTANT — this does NOT send email. It ENQUEUES EmailQueueItem rows
// (status PENDING). The /api/cron/email-drain cron then sends them gradually,
// lease-protected, with retries.
//
// POST body: { type: "welcome" | "rejection", applicationId?: string }
//
// De-dupe: the welcome pool is claimed by the atomic status flip
// (queued_approved → approved) — a concurrent run can't commit the same
// applicant twice. The rejection pool stamps rejectionEmailSentAt.
//
// GET — returns how many emails are still pending in each pool, for the admin
// UI button counts.

const CHUNK = 200;

// MongoDB stores an optional field that was never written as ABSENT, not null.
// Prisma's `{ field: null }` filter matches an explicit null but NOT an absent
// field. The rejected pool is keyed off rejectionEmailSentAt, so match
// "absent OR explicitly null" to catch every rejected applicant still owing a
// decline email, regardless of how their document was created.
const rejectionUnsent: Prisma.PublicApplicationWhereInput = {
  OR: [{ rejectionEmailSentAt: null }, { rejectionEmailSentAt: { isSet: false } }],
};

// Temporary login password — stored in plain text on the application just long
// enough to render the welcome email, then hashed on first login.
function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pw = "";
  for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;

  // ?preview=welcome|rejection — render the template with sample data so an
  // admin can see exactly what goes out before queueing anything.
  const preview = params.get("preview");
  if (preview === "welcome") {
    return Response.json(
      renderPublicAcceptanceEmail({
        fullName: "Jane Doe",
        trackInterest: "SOC Analysis",
        internId: "UBI-2025-0001",
        tempPassword: "Ax7Kp2Qm9",
      })
    );
  }
  if (preview === "rejection") {
    return Response.json(renderPublicRejectionEmail({ fullName: "Jane Doe" }));
  }

  // ?list=welcome|rejection — the actual applicants still owing that email,
  // for the Decision Emails page. Capped at 500; `total` is the full count.
  const list = params.get("list");
  if (list === "welcome" || list === "rejection") {
    const where: Prisma.PublicApplicationWhereInput =
      list === "welcome"
        ? { status: "queued_approved" }
        : { status: "rejected", ...rejectionUnsent };
    const [applicants, total] = await Promise.all([
      prisma.publicApplication.findMany({
        where,
        orderBy: { createdAt: "asc" },
        take: 500,
        select: { id: true, fullName: true, email: true, trackInterest: true, createdAt: true },
      }),
      prisma.publicApplication.count({ where }),
    ]);
    return Response.json({ applicants, total });
  }

  // default — pending counts for the button badges.
  const [welcomePending, rejectionPending] = await Promise.all([
    prisma.publicApplication.count({
      where: { status: "queued_approved" },
    }),
    prisma.publicApplication.count({
      where: { status: "rejected", ...rejectionUnsent },
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

    // Optional: enqueue just one applicant (the per-row "Send" button on the
    // Decision Emails page). Omitted -> the whole pending pool.
    const onlyId = typeof body?.applicationId === "string" ? body.applicationId : undefined;

    return type === "welcome" ? enqueueWelcome(onlyId) : enqueueRejection(onlyId);
  } catch (error) {
    logger.error("send_pending_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function enqueueWelcome(onlyId?: string): Promise<Response> {
  const pool = await prisma.publicApplication.findMany({
    where: { status: "queued_approved", ...(onlyId ? { id: onlyId } : {}) },
    select: { id: true, email: true, fullName: true, trackInterest: true },
  });
  if (pool.length === 0) {
    return Response.json({ type: "welcome", total: 0, queued: 0, skipped: 0 });
  }

  // Sending the welcome email is the COMMIT point — this is where an approved
  // applicant actually becomes an intern. For each one: mint a UBI ID and a
  // temporary password, flip status queued_approved -> approved (the flip is
  // the atomic claim, so a concurrent run can't double-commit), then create
  // the backing User + Intern. If onboarding fails, roll the applicant back to
  // the pending list and skip them rather than ship dead login credentials.
  const claimAt = new Date();
  const committed: {
    id: string;
    email: string;
    fullName: string;
    trackInterest: string;
    internId: string;
    loginPassword: string;
  }[] = [];
  let skipped = 0;

  for (const a of pool) {
    const internId = await nextInternId();
    const loginPassword = generatePassword();
    const claim = await prisma.publicApplication.updateMany({
      where: { id: a.id, status: "queued_approved" },
      data: {
        status: "approved",
        stage: 0,
        stageStatus: "active",
        internId,
        loginPassword,
        welcomeEmailSentAt: claimAt,
      },
    });
    // count 0 -> another run already committed this applicant; skip silently.
    if (claim.count === 0) continue;

    try {
      await onboardApprovedApplicant({
        email: a.email,
        fullName: a.fullName,
        trackInterest: a.trackInterest,
        loginPassword,
      });
    } catch (err) {
      logger.error("welcome_onboard_failed", err, { applicationId: a.id, email: a.email });
      await prisma.publicApplication.update({
        where: { id: a.id },
        data: {
          status: "queued_approved",
          stage: -1,
          stageStatus: "none",
          internId: null,
          loginPassword: null,
          welcomeEmailSentAt: null,
        },
      });
      skipped++;
      continue;
    }
    committed.push({ ...a, internId, loginPassword });
  }

  if (committed.length === 0) {
    return Response.json({ type: "welcome", total: pool.length, queued: 0, skipped });
  }

  // Attach each welcome email to the User just created for the intern.
  const users = await prisma.user.findMany({
    where: { email: { in: committed.map((a) => a.email.toLowerCase()) } },
    select: { id: true, email: true },
  });
  const userByEmail = new Map(users.map((u) => [u.email, u.id]));

  const rows: Prisma.EmailQueueItemCreateManyInput[] = committed.map((a) => {
    const { subject, html } = renderPublicAcceptanceEmail({
      fullName: a.fullName,
      trackInterest: a.trackInterest,
      internId: a.internId,
      tempPassword: a.loginPassword,
    });
    return {
      userId: userByEmail.get(a.email.toLowerCase()) ?? null,
      kind: "GENERAL",
      toEmail: a.email,
      subject,
      body: html,
      status: "PENDING",
      context: { type: "acceptance", applicationId: a.id },
    };
  });

  const queued = await enqueueChunked(rows, committed.map((a) => a.id), "welcome");
  return Response.json({ type: "welcome", total: pool.length, queued, skipped });
}

async function enqueueRejection(onlyId?: string): Promise<Response> {
  const pool = await prisma.publicApplication.findMany({
    where: { status: "rejected", ...rejectionUnsent, ...(onlyId ? { id: onlyId } : {}) },
    select: { id: true, email: true, fullName: true },
  });
  if (pool.length === 0) {
    return Response.json({ type: "rejection", total: 0, queued: 0 });
  }

  const claimAt = new Date();
  await prisma.publicApplication.updateMany({
    where: { id: { in: pool.map((a) => a.id) }, ...rejectionUnsent },
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
