import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// Resend webhook receiver. Resend signs each payload with HMAC-SHA256
// using a shared secret you configure in their dashboard. We verify the
// signature, parse the event, and update the matching EmailQueueItem
// (or log if we can't match) so the admin /admin/emails view shows
// real delivery status — bounced, complained — not just "we tried".
//
// Configure on Resend: dashboard → Webhooks → Add endpoint:
//   URL:    https://ubuntubridgeinitiatives.org/api/webhooks/resend
//   Secret: paste into RESEND_WEBHOOK_SECRET in Vercel env
// Events to subscribe to:
//   email.delivered    — recipient's mail server accepted
//   email.bounced      — hard bounce (bad address, mailbox full, etc.)
//   email.complained   — recipient hit "report spam"
//   email.delivery_delayed — soft bounce, will retry
export async function POST(request: NextRequest) {
  try {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) {
      // Webhook not configured — accept and discard so Resend doesn't queue
      // failed deliveries to us. This makes the route idempotent during
      // initial setup before the env is wired.
      return Response.json({ ok: true, configured: false });
    }

    const raw = await request.text();
    const signature = request.headers.get("svix-signature") || request.headers.get("resend-signature");
    const timestamp = request.headers.get("svix-timestamp") || request.headers.get("resend-timestamp");
    const id = request.headers.get("svix-id") || request.headers.get("resend-id");

    if (!signature || !timestamp || !id) {
      return Response.json({ error: "Missing signature headers" }, { status: 401 });
    }

    // Resend uses Svix-style signing: signed payload is `${id}.${timestamp}.${rawBody}`.
    // The header carries one or more `v1,base64-hmac` entries, comma-separated.
    const signedPayload = `${id}.${timestamp}.${raw}`;
    const expected = crypto
      .createHmac("sha256", secret.startsWith("whsec_") ? Buffer.from(secret.slice(6), "base64") : secret)
      .update(signedPayload)
      .digest("base64");

    const provided = signature
      .split(" ")
      .map((s) => s.trim())
      .filter((s) => s.startsWith("v1,"))
      .map((s) => s.slice(3));

    const matched = provided.some((p) => {
      try {
        return crypto.timingSafeEqual(Buffer.from(p, "base64"), Buffer.from(expected, "base64"));
      } catch {
        return false;
      }
    });

    if (!matched) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Reject events older than 5 minutes — protects against replay if a
    // signed payload leaks. Timestamps are seconds since epoch.
    const age = Math.abs(Date.now() / 1000 - parseInt(timestamp));
    if (age > 300) {
      return Response.json({ error: "Stale event" }, { status: 401 });
    }

    const event = JSON.parse(raw) as {
      type?: string;
      data?: { email_id?: string; to?: string[]; bounce?: { message?: string }; subject?: string };
    };
    const type = event.type ?? "";
    const recipient = event.data?.to?.[0]?.toLowerCase();
    const subject = event.data?.subject;

    // Find the matching queue row by recipient + subject. Resend's email_id
    // isn't stored on EmailQueueItem (we send via SMTP, not the API), so
    // we match on (toEmail, subject, most recent SENT). It's not
    // collision-free if you send the same subject to the same recipient
    // twice; but at our volume that's fine.
    if (recipient && subject) {
      const row = await prisma.emailQueueItem.findFirst({
        where: { toEmail: recipient, subject, status: "SENT" },
        orderBy: { sentAt: "desc" },
      });
      if (row) {
        if (type === "email.bounced" || type === "email.complained") {
          await prisma.emailQueueItem.update({
            where: { id: row.id },
            data: {
              status: "FAILED",
              failReason: `${type}: ${event.data?.bounce?.message ?? "no detail"}`.slice(0, 500),
            },
          });
          logger.info("resend_webhook_marked_failed", { type, recipient, queueItemId: row.id });
        } else if (type === "email.delivered") {
          // Already SENT, nothing to update — log for analytics.
          logger.info("resend_webhook_delivered", { recipient, queueItemId: row.id });
        }
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    logger.error("resend_webhook_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
