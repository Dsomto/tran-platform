import { prisma } from "@/lib/db";
import { verifyTotp } from "@/lib/totp";
import { canSendEmails } from "@/lib/email-permissions";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import type { SessionUser } from "@/lib/auth";

// Server-side gate for any action that SENDS applicant email. Two layers:
//
//   1. Account lock — the session must be the single authorised account
//      (canSendEmails). Role can't distinguish the owner from the co-super-
//      admin, so we gate on the exact email.
//   2. 2FA step-up — a fresh 6-digit TOTP code must be supplied and verified
//      against that account's secret AT SEND TIME, not just the enrollment the
//      admin layout enforces at login. This protects against a hijacked
//      session: holding the cookie is not enough to send.
//
// Attempts are rate-limited per account so a stolen session cannot brute-force
// the six digits. Returns a ready-to-return error Response when blocked, or
// null when the action may proceed.
//
// `deniedMessage` is shown when the caller is not the authorised account, so
// each call site can phrase it for its own action ("send emails", "reject
// applicants", …).
export async function guardAuthorisedAction(
  session: SessionUser | null,
  code: unknown,
  deniedMessage = "Only the authorised account can perform this action."
): Promise<Response | null> {
  if (!session || !canSendEmails(session.email)) {
    return Response.json({ error: deniedMessage }, { status: 403 });
  }

  const rl = await rateLimit(`authorised-action:${session.id}`, RATE_LIMITS.login);
  if (!rl.ok) return rateLimitResponse(rl);

  const totpCode = typeof code === "string" ? code.replace(/\s+/g, "") : "";
  if (!/^\d{6}$/.test(totpCode)) {
    return Response.json({ error: "A 6-digit 2FA code is required." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { totpEnabled: true, totpSecret: true },
  });
  if (!user?.totpEnabled || !user.totpSecret) {
    return Response.json({ error: "2FA is not set up on this account." }, { status: 409 });
  }
  if (!verifyTotp(user.totpSecret, totpCode)) {
    return Response.json({ error: "Incorrect 2FA code." }, { status: 401 });
  }

  return null;
}

// Convenience wrapper for the email-sending routes.
export function guardEmailSend(
  session: SessionUser | null,
  code: unknown
): Promise<Response | null> {
  return guardAuthorisedAction(session, code, "Only the authorised account can send emails.");
}
