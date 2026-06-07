// Sending applicant-facing email is locked to ONE login account, not a role
// (both the owner and the co-super-admin hold SUPER_ADMIN). The gating email
// address itself is sensitive — shipping it to the client bundle would
// reveal who that account is to every intern. So this module is server-only;
// clients read the resolved boolean from /api/auth/me's
// `permissions.emailSendAllowed` field instead of importing the function.
import "server-only";

export const EMAIL_SENDER_EMAIL = "dsomto891@gmail.com";

export function canSendEmails(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase() === EMAIL_SENDER_EMAIL;
}
