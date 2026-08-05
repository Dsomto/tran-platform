import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { guardEmailSend } from "@/lib/email-send-guard";
import { logger } from "@/lib/logger";
import { MAX_ATTEMPTS, SEND_INTERVAL_MS, pacedSend, smtpConfigured } from "@/lib/smtp-send";

// Retry one or many EmailQueueItem rows immediately, without waiting for the
// drain cron. POST body: { ids: string[], totpCode }
//
// Two rules this route has to respect, because it mails real people:
//
//   1. Never send a row that has already gone out. A row is skipped if it is
//      already SENT, or if a live drain currently holds its lease — retrying
//      either one delivers the same message to the recipient twice.
//   2. Mark the way the drain marks. A rate limit or timeout is not the
//      recipient's fault and must not burn the row to FAILED; only a genuine
//      5xx rejection, or exhausting MAX_ATTEMPTS, does that.
//
// Sending is paced through the shared sender at one message per second,
// because the provider IP-blocks bursts.
const STALE_LEASE_MS = 5 * 60 * 1000;
const MAX_BUDGET_MS = 270_000;

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    // Retrying re-sends mail: locked to the single authorised account + 2FA.
    const blocked = await guardEmailSend(session, body?.totpCode);
    if (blocked) return blocked;

    const ids: unknown = body?.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json(
        { error: "ids must be a non-empty array of EmailQueueItem ids" },
        { status: 400 }
      );
    }
    // At one message per second this is the most that fits the time budget.
    const maxPerRequest = Math.floor(MAX_BUDGET_MS / SEND_INTERVAL_MS) - 10;
    if (ids.length > maxPerRequest) {
      return Response.json(
        { error: `Maximum ${maxPerRequest} retries per request (sending is paced at one per second).` },
        { status: 400 }
      );
    }
    const idStrings = ids.filter((x): x is string => typeof x === "string");

    if (!smtpConfigured()) {
      return Response.json({ error: "SMTP env not configured" }, { status: 500 });
    }

    const items = await prisma.emailQueueItem.findMany({ where: { id: { in: idStrings } } });
    if (items.length === 0) {
      return Response.json({ error: "No matching email rows found" }, { status: 404 });
    }

    // Filter before sending, and say exactly why each row was held back.
    const staleCutoff = Date.now() - STALE_LEASE_MS;
    const skipped: Array<{ id: string; reason: string }> = [];
    const sendable = items.filter((item) => {
      if (item.status === "SENT") {
        skipped.push({ id: item.id, reason: "Already sent — retrying would deliver a duplicate." });
        return false;
      }
      if (item.lockedAt && item.lockedAt.getTime() > staleCutoff) {
        skipped.push({ id: item.id, reason: "A drain run is sending this right now." });
        return false;
      }
      return true;
    });

    if (sendable.length === 0) {
      return Response.json({ sent: 0, failed: 0, total: items.length, skipped, results: [] });
    }

    // Claim the rows for the duration of this request so a drain starting
    // mid-retry cannot pick up the same message.
    const leaseAt = new Date();
    await prisma.emailQueueItem.updateMany({
      where: { id: { in: sendable.map((s) => s.id) } },
      data: { lockedAt: leaseAt },
    });

    const results: Array<{ id: string; ok: boolean; error?: string }> = [];
    const outcome = await pacedSend(
      sendable,
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
          results.push({ id: item.id, ok: true });
          return;
        }

        if (result.kind === "blocked") {
          // Never delivered, never rejected — release without burning an attempt.
          await prisma.emailQueueItem.update({
            where: { id: item.id },
            data: { failReason: `Provider block: ${result.reason}`.slice(0, 500), lockedAt: null },
          });
          results.push({ id: item.id, ok: false, error: `Provider block: ${result.reason}` });
          return;
        }

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
        results.push({ id: item.id, ok: false, error: result.reason });
      },
      { deadline: Date.now() + MAX_BUDGET_MS }
    );

    // Release anything the run never reached, so it is not stuck under our lease.
    const untouched = outcome.skipped.map((s) => s.id);
    if (untouched.length) {
      await prisma.emailQueueItem.updateMany({
        where: { id: { in: untouched }, status: { not: "SENT" } },
        data: { lockedAt: null },
      });
      for (const id of untouched) {
        if (!results.some((r) => r.id === id)) {
          skipped.push({ id, reason: outcome.blockedReason ? "Run stopped by provider block." : "Ran out of time this request." });
        }
      }
    }

    return Response.json({
      sent: outcome.sent,
      failed: outcome.permanent + outcome.transient,
      total: items.length,
      skipped,
      blocked: outcome.blockedReason,
      timedOut: outcome.timedOut,
      results,
      ...(outcome.blockedReason
        ? { note: "Provider blocked the connection. Wait at least 5 minutes before retrying — reconnecting sooner extends the block." }
        : {}),
    });
  } catch (error) {
    logger.error("retry_emails_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Paced sending makes this long-running: 200 messages takes ~200 seconds.
export const maxDuration = 300;
