// Sending applicant-facing email is delicate, so it is locked to ONE login
// account — not to a role. Both the owner and the co-super-admin hold the
// SUPER_ADMIN role, so a role check can't separate them; we gate on the exact
// email instead. Every other admin / super-admin is blocked from sending.
//
// This module has no server-only dependencies so it can be imported from both
// API routes and client components (which read the email from /api/auth/me).
export const EMAIL_SENDER_EMAIL = "dsomto891@gmail.com";

export function canSendEmails(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase() === EMAIL_SENDER_EMAIL;
}
