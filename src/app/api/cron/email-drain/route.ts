import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import nodemailer from "nodemailer";

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

    const url = new URL(request.url);
    const batch = Math.min(
      1000,
      Math.max(1, parseInt(url.searchParams.get("limit") || "300") || 300)
    );

    // Lease step: stamp lockedAt on up to `batch` PENDING rows. updateMany
    // is atomic per-document on Mongo — two concurrent drains won't both
    // win the same row because the second drain's where clause excludes
    // rows whose lockedAt is fresh.
    const leaseAt = new Date();
    const staleCutoff = new Date(Date.now() - STALE_LEASE_MS);
    const candidates = await prisma.emailQueueItem.findMany({
      where: {
        status: "PENDING",
        OR: [{ lockedAt: null }, { lockedAt: { lt: staleCutoff } }],
      },
      orderBy: { enqueuedAt: "asc" },
      take: batch,
      select: { id: true },
    });
    if (!candidates.length) {
      return Response.json({ drained: 0, remaining: 0 });
    }
    await prisma.emailQueueItem.updateMany({
      where: { id: { in: candidates.map((c) => c.id) } },
      data: { lockedAt: leaseAt },
    });

    // Re-fetch with full bodies for sending. Filter to rows whose lockedAt
    // is exactly leaseAt — anyone whose lockedAt got overwritten by a faster
    // concurrent drain is no longer ours, and we skip them.
    const pending = await prisma.emailQueueItem.findMany({
      where: { id: { in: candidates.map((c) => c.id) }, lockedAt: leaseAt },
    });

    if (!pending.length) {
      const remaining = await prisma.emailQueueItem.count({ where: { status: "PENDING" } });
      return Response.json({ drained: 0, remaining, note: "No rows survived lease step" });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.zoho.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
    });

    const from = `"Somto from Ubuntu Bridge Initiative" <noreply@ubuntubridgeinitiatives.org>`;

    let sent = 0;
    let failed = 0;

    for (const item of pending) {
      try {
        await transporter.sendMail({
          from,
          to: item.toEmail,
          subject: item.subject,
          html: item.body,
        });
        await prisma.emailQueueItem.update({
          where: { id: item.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
            attempts: item.attempts + 1,
            lockedAt: null,
          },
        });
        sent++;
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        const nextAttempts = item.attempts + 1;
        await prisma.emailQueueItem.update({
          where: { id: item.id },
          data: {
            status: nextAttempts >= 3 ? "FAILED" : "PENDING",
            attempts: nextAttempts,
            failReason: msg.slice(0, 500),
            lockedAt: null,
          },
        });
        logger.error("email_drain_item_failed", err, { itemId: item.id, attempts: nextAttempts });
      }
    }

    transporter.close();

    const remaining = await prisma.emailQueueItem.count({ where: { status: "PENDING" } });
    return Response.json({ sent, failed, drained: sent + failed, remaining });
  } catch (error) {
    logger.error("email_drain_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Vercel Cron sends GET with Bearer auth; external schedulers may POST.
export const GET = handleDrain;
export const POST = handleDrain;
