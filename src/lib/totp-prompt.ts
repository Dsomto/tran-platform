// Ask the operator for their current 6-digit 2FA code before a send. The
// server (guardEmailSend) re-verifies it against the authorised account's TOTP
// secret, so this is just the input step. Returns the cleaned code, or null if
// the operator cancelled the prompt.
export function promptTotpCode(): string | null {
  const raw = window.prompt("Enter your current 6-digit 2FA code to authorise sending:");
  if (raw == null) return null;
  return raw.replace(/\s+/g, "");
}
