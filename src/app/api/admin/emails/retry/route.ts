import { NextRequest } from "next/server";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";

// Retry one or many EmailQueueItem rows immediately (not waiting for cron).
// POST body: { ids: string[] }
//
// For each id: build a fresh SMTP transport, send the stored body verbatim,
// update the row to SENT or stay/move to FAILED with the new failReason.
// Reuses the same per-call transport pattern as the email-drain cron.
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const ids: unknown = body?.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json({ error: "ids must be a non-empty array of EmailQueueItem ids" }, { status: 400 });
    }
    if (ids.length > 200) {
      return Response.json({ error: "Maximum 200 retries per request" }, { status: 400 });
    }
    const idStrings = ids.filter((x): x is string => typeof x === "string");

    const items = await prisma.emailQueueItem.findMany({
      where: { id: { in: idStrings } },
    });
    if (items.length === 0) {
      return Response.json({ error: "No matching email rows found" }, { status: 404 });
    }

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587");
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) {
      return Response.json({ error: "SMTP env not configured" }, { status: 500 });
    }
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
      auth: { user, pass },
    });

    const from = `"Somto from Ubuntu Bridge Initiative" <noreply@ubuntubridgeinitiatives.org>`;

    let sent = 0;
    let failed = 0;
    const results: Array<{ id: string; ok: boolean; error?: string }> = [];

    for (const item of items) {
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
            failReason: null,
          },
        });
        sent++;
        results.push({ id: item.id, ok: true });
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        await prisma.emailQueueItem.update({
          where: { id: item.id },
          data: {
            status: "FAILED",
            attempts: item.attempts + 1,
            failReason: msg.slice(0, 500),
          },
        });
        results.push({ id: item.id, ok: false, error: msg });
      }
    }

    transporter.close();

    return Response.json({ sent, failed, total: items.length, results });
  } catch (error) {
    logger.error("retry_emails_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
