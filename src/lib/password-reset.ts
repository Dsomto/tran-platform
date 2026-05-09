import crypto from "crypto";

// One-hour validity. Long enough that recipients in different timezones can
// click the link without rushing; short enough that a leaked email screenshot
// expires the link before most attackers find it.
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

// Generate a 32-byte url-safe random token (256 bits). The plaintext token
// goes in the email; we store its sha256 hash in the DB so a DB read does
// not let the reader use the link.
export function generateResetToken(): { token: string; tokenHash: string } {
  const bytes = crypto.randomBytes(32);
  const token = bytes.toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
