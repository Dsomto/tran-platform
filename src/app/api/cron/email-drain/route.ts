import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import nodemailer from "nodemailer";

// FIFO drain of queued emails. Defaults to 300/run (Zoho soft cap).
// Run daily via Vercel cron (GET) or any external scheduler (POST).
// Auth: Bearer CRON_SECRET in Authorization header.
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

    const pending = await prisma.emailQueueItem.findMany({
      where: { status: "PENDING" },
      orderBy: { enqueuedAt: "asc" },
      take: batch,
    });

    if (!pending.length) {
      return Response.json({ drained: 0, remaining: 0 });
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

    const from = `"The Root Access Network" <${process.env.SMTP_USER}>`;

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
          data: { status: "SENT", sentAt: new Date(), attempts: item.attempts + 1 },
        });
        sent++;
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        const nextAttempts = item.attempts + 1;
        // Mark permanently FAILED after 3 attempts; otherwise leave PENDING.
        await prisma.emailQueueItem.update({
          where: { id: item.id },
          data: {
            status: nextAttempts >= 3 ? "FAILED" : "PENDING",
            attempts: nextAttempts,
            failReason: msg.slice(0, 500),
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
