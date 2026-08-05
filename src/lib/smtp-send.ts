import nodemailer from "nodemailer";
import { logger } from "./logger";

/**
 * Shared, paced SMTP sender for every bulk send path (the email-drain cron and
 * the admin retry route).
 *
 * Why this exists
 * ---------------
 * Live mail goes through Resend, which enforces a hard 2 requests/second cap.
 * A previous run held one long-lived pooled connection open at ~2.5/s, got
 * roughly forty messages through, and was then IP-blocked: TCP still connects
 * but the server closes before the 220 greeting. Critically, every reconnect
 * attempt resets the penalty timer, so a naive retry loop makes the block
 * last longer and marks a whole batch FAILED that was never actually
 * undeliverable.
 *
 * The rules that follow from that, all enforced here:
 *
 *   1. At most one message per SEND_INTERVAL_MS, sent sequentially.
 *   2. A fresh connection per message — no pooling.
 *   3. On a block signature, abort the entire run immediately and leave the
 *      remaining rows untouched for a later run. Never keep reconnecting.
 *   4. Distinguish a permanent rejection (bad mailbox) from a transient one
 *      (rate limit, timeout) so the caller marks rows correctly instead of
 *      burning a real recipient to FAILED over a throttle.
 */

/** Resend allows 2/s; we send at 1/s to stay clear of the edge. */
export const SEND_INTERVAL_MS = 1000;

/** Give up on a row after this many genuine transient failures. */
export const MAX_ATTEMPTS = 3;

export const MAIL_FROM =
  `"Somto from Ubuntu Bridge Initiative" <noreply@ubuntubridgeinitiatives.org>`;

export type SendOutcome =
  | { kind: "sent" }
  | { kind: "permanent"; reason: string }
  | { kind: "transient"; reason: string }
  /** Provider-level block. The run must stop; the row was not attempted. */
  | { kind: "blocked"; reason: string };

export type Recipient = {
  toEmail: string;
  subject: string;
  body: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/**
 * A fresh single-use transport. Pooling is deliberately off — reusing one
 * connection across a batch is what triggered the block.
 */
function freshTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    // Match src/lib/email.ts: throw rather than let nodemailer hang on a
    // half-built connection with undefined credentials.
    throw new Error(
      `SMTP env not configured (host=${host ? "set" : "missing"}, user=${user ? "set" : "missing"}, pass=${pass ? "set" : "missing"})`
    );
  }
  // No pooling: a pooled connection held across a batch is what triggered the
  // provider block, and pooled sockets also go stale across lambda freeze/thaw.
  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: { user, pass },
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    socketTimeout: 30_000,
  });
}

/**
 * Is this error the provider shutting us out rather than rejecting one
 * message? The signature is a socket that closes before or during the
 * greeting, which nodemailer surfaces as a connection-class code with no SMTP
 * response code attached.
 */
function isBlockSignature(err: unknown): boolean {
  const e = err as { code?: string; responseCode?: number; message?: string };
  if (typeof e?.responseCode === "number") return false; // the server spoke; not a block
  const code = e?.code ?? "";
  if (code === "ECONNECTION" || code === "ESOCKET" || code === "ECONNRESET") return true;
  const msg = (e?.message ?? "").toLowerCase();
  return (
    msg.includes("unexpected socket close") ||
    msg.includes("connection closed") ||
    msg.includes("socket close")
  );
}

/**
 * Permanent means the mailbox will never accept this message — a 5xx from the
 * server, or an envelope the library itself rejected. Everything else is
 * transient and must not consume a permanent failure.
 */
export function classifySmtpError(err: unknown): { permanent: boolean; reason: string } {
  const e = err as { code?: string; responseCode?: number; message?: string; name?: string };
  const reason = `${e?.name ?? "Error"}: ${e?.message ?? String(err)}`.slice(0, 500);
  const rc = e?.responseCode;

  if (typeof rc === "number") {
    // 4xx is "try again later" by definition; 421/450/451/452 are the usual
    // throttle codes. Only a true 5xx is permanent.
    return { permanent: rc >= 500 && rc < 600, reason };
  }
  // EENVELOPE = malformed/rejected address. No amount of retrying fixes it.
  if (e?.code === "EENVELOPE") return { permanent: true, reason };
  return { permanent: false, reason };
}

export type PacedSendResult<T> = {
  sent: number;
  permanent: number;
  transient: number;
  /** Rows never attempted, because the run aborted or ran out of time. */
  skipped: T[];
  /** Set when the provider blocked us; the caller should surface it loudly. */
  blockedReason: string | null;
  /** True when the time budget stopped the run before the list was finished. */
  timedOut: boolean;
};

/**
 * Send `items` one at a time, paced, calling `onResult` after each so the
 * caller can mark its own row inside the same loop. Aborts the whole run on a
 * provider block.
 *
 * `deadline` is an absolute epoch-ms budget: the loop stops cleanly before it
 * would be killed mid-flight, leaving the rest for the next run.
 */
export async function pacedSend<T extends Recipient>(
  items: T[],
  onResult: (item: T, outcome: SendOutcome) => Promise<void>,
  opts: { deadline?: number; intervalMs?: number } = {}
): Promise<PacedSendResult<T>> {
  const interval = opts.intervalMs ?? SEND_INTERVAL_MS;
  const result: PacedSendResult<T> = {
    sent: 0, permanent: 0, transient: 0, skipped: [], blockedReason: null, timedOut: false,
  };

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Stop cleanly rather than get killed mid-send. One interval of headroom
    // plus the socket timeout is enough for the message in flight.
    if (opts.deadline && Date.now() + interval + 30_000 > opts.deadline) {
      result.timedOut = true;
      result.skipped.push(...items.slice(i));
      break;
    }

    if (i > 0) await sleep(interval);

    const transporter = freshTransport();
    try {
      await transporter.sendMail({
        from: MAIL_FROM,
        to: item.toEmail,
        subject: item.subject,
        html: item.body,
      });
      result.sent++;
      await onResult(item, { kind: "sent" });
    } catch (err) {
      if (isBlockSignature(err)) {
        const reason = err instanceof Error ? err.message : String(err);
        logger.error("smtp_provider_block", err, { sentBeforeBlock: result.sent });
        result.blockedReason = reason;
        // The row was not delivered and was not rejected — leave it alone so a
        // later run picks it up untouched, and stop hammering.
        result.skipped.push(...items.slice(i));
        await onResult(item, { kind: "blocked", reason });
        break;
      }
      const { permanent, reason } = classifySmtpError(err);
      if (permanent) result.permanent++;
      else result.transient++;
      await onResult(item, permanent ? { kind: "permanent", reason } : { kind: "transient", reason });
    } finally {
      transporter.close();
    }
  }

  return result;
}
