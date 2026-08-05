import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { MAX_ATTEMPTS, SEND_INTERVAL_MS, pacedSend, smtpConfigured } from "@/lib/smtp-send";

// FIFO drain of queued emails with a lease to prevent double-send.
//
// Lease protocol:
//   1. updateMany: flip up to N rows from PENDING to PENDING (no status change)
//      while stamping lockedAt = now. Only rows whose lockedAt is null or
//      older than the stale threshold are touched. Other concurrent drains
//      (manual triggers + scheduled cron) won't grab the same rows.
//   2. findMany of rows with our exact lockedAt timestamp — those are ours.
//   3. Send each, mark SENT or FAILED.
//   4. If we crash before step 3 completes, the lockedAt timestamp ages out
//      after STALE_LEASE_MS and the next drain can re-claim those rows.
const STALE_LEASE_MS = 5 * 60 * 1000;

async function handleDrain(request: NextRequest): Promise<Response> {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      return Response.json({ error: "CRON_SECRET not configured" }, { status: 500 });
    }
    const auth = request.headers.get("authorization") || "";
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!smtpConfigured()) {
      return Response.json({ error: "SMTP env not configured" }, { status: 500 });
    }

    // Sending is paced at one message per second, so the batch size that
    // actually fits is set by the function's time budget, not by how many rows
    // are waiting. Claiming far more than we can send just leases rows we then
    // have to release. MAX_BUDGET_MS leaves headroom under `maxDuration`.
    const MAX_BUDGET_MS = 270_000;
    const startedAt = Date.now();
    const deadline = startedAt + MAX_BUDGET_MS;
    const fitsInBudget = Math.floor(MAX_BUDGET_MS / SEND_INTERVAL_MS) - 10;

    const url = new URL(request.url);
    const requested = Math.max(1, parseInt(url.searchParams.get("limit") || "200") || 200);
    const batch = Math.min(requested, fitsInBudget);

    // Lease step. A row is claimable if it is PENDING and either unlocked or
    // lock-stale. We re-assert that exact condition inside the updateMany so
    // a row another drain already grabbed is never stolen.
    const leaseAt = new Date();
    const staleCutoff = new Date(Date.now() - STALE_LEASE_MS);
    const candidates = await prisma.emailQueueItem.findMany({
      where: {
        status: "PENDING",
        OR: [
          // never locked — value is null, OR the field is absent from the
          // document entirely (Prisma omits unset optional fields on Mongo
          // create, and `lockedAt: null` does NOT match a missing field).
          { lockedAt: null },
          { lockedAt: { isSet: false } },
          { lockedAt: { lt: staleCutoff } },
        ],
      },
      orderBy: { enqueuedAt: "asc" },
      take: batch,
      select: { id: true },
    });
    if (!candidates.length) {
      // Report the REAL pending count, never a hardcoded 0 — so a cron run
      // pointed at an empty or wrong database is obvious from the response.
      const remaining = await prisma.emailQueueItem.count({ where: { status: "PENDING" } });
      return Response.json({ drained: 0, remaining, note: "No claimable rows" });
    }
    const candidateIds = candidates.map((c) => c.id);

    const claimed = await prisma.emailQueueItem.updateMany({
      where: {
        id: { in: candidateIds },
        status: "PENDING",
        OR: [
          // never locked — value is null, OR the field is absent from the
          // document entirely (Prisma omits unset optional fields on Mongo
          // create, and `lockedAt: null` does NOT match a missing field).
          { lockedAt: null },
          { lockedAt: { isSet: false } },
          { lockedAt: { lt: staleCutoff } },
        ],
      },
      data: { lockedAt: leaseAt },
    });
    if (!claimed.count) {
      const remaining = await prisma.emailQueueItem.count({ where: { status: "PENDING" } });
      return Response.json({ drained: 0, remaining, note: "No rows claimed" });
    }

    // Re-fetch the rows we just stamped, for sending. Match lockedAt with
    // `gte: leaseAt` rather than exact equality — a millisecond serialization
    // difference between the write and the read must not make our own rows
    // invisible (the bug that left the queue stuck). Restricting to our own
    // candidateIds + status PENDING keeps another run's rows out.
    const pending = await prisma.emailQueueItem.findMany({
      where: {
        id: { in: candidateIds },
        status: "PENDING",
        lockedAt: { gte: leaseAt },
      },
      orderBy: { enqueuedAt: "asc" },
    });

    if (!pending.length) {
      const remaining = await prisma.emailQueueItem.count({ where: { status: "PENDING" } });
      return Response.json({ drained: 0, remaining, note: "No rows survived lease step" });
    }

    // Send paced, one connection per message, aborting on a provider block.
    // Every branch below clears lockedAt, so a row is never left leased.
    const outcome = await pacedSend(
      pending,
      async (item, result) => {
        if (result.kind === "sent") {
          await prisma.emailQueueItem.update({
            where: { id: item.id },
            data: {
              status: "SENT",
              sentAt: new Date(),
              attempts: item.attempts + 1,
              failReason: null,
              lockedAt: null,
            },
          });
          return;
        }

        if (result.kind === "blocked") {
          // Not delivered and not rejected. Release the lease without burning
          // an attempt so the row is retried cleanly once the block clears.
          await prisma.emailQueueItem.update({
            where: { id: item.id },
            data: { failReason: `Provider block: ${result.reason}`.slice(0, 500), lockedAt: null },
          });
          return;
        }

        // A 5xx is the mailbox refusing us for good — fail it now rather than
        // mailing a dead address twice more. A throttle or timeout is not the
        // recipient's fault and keeps its retries.
        const nextAttempts = item.attempts + 1;
        const exhausted = nextAttempts >= MAX_ATTEMPTS;
        await prisma.emailQueueItem.update({
          where: { id: item.id },
          data: {
            status: result.kind === "permanent" || exhausted ? "FAILED" : "PENDING",
            attempts: nextAttempts,
            failReason: result.reason,
            lockedAt: null,
          },
        });
        logger.error("email_drain_item_failed", new Error(result.reason), {
          itemId: item.id, attempts: nextAttempts, permanent: result.kind === "permanent",
        });
      },
      { deadline }
    );

    // Anything we never attempted must not stay leased, or it waits out the
    // full stale window before another drain can touch it.
    const untouched = outcome.skipped.map((s) => s.id);
    if (untouched.length) {
      await prisma.emailQueueItem.updateMany({
        where: { id: { in: untouched }, status: "PENDING" },
        data: { lockedAt: null },
      });
    }

    const remaining = await prisma.emailQueueItem.count({ where: { status: "PENDING" } });
    const failed = outcome.permanent + outcome.transient;
    return Response.json({
      sent: outcome.sent,
      failed,
      drained: outcome.sent + failed,
      remaining,
      skipped: untouched.length,
      timedOut: outcome.timedOut,
      blocked: outcome.blockedReason,
      ...(outcome.blockedReason
        ? { note: "Provider blocked the connection. Stop sending and wait at least 5 minutes — reconnecting sooner extends the block." }
        : {}),
    });
  } catch (error) {
    logger.error("email_drain_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Vercel Cron sends GET with Bearer auth; external schedulers may POST.
export const GET = handleDrain;
export const POST = handleDrain;

// On Vercel Pro: explicit 5-minute budget for a single drain run. A typical
// drain of 100 emails (the configured limit) finishes in 10–20s, but during
// a Resend outage we may sit on long retries. 300s gives the cron room to
// finish gracefully instead of getting killed mid-batch.
export const maxDuration = 300;
