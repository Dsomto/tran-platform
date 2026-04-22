import crypto from "crypto";

/**
 * Per-intern flag derivation.
 *
 * Every FLAG task carries a `flagSalt` (public-ish, stored on the Assignment).
 * The actual expected flag is derived per intern so copy-paste collusion fails:
 *
 *   flag = "TRAN{" + hmac_sha256(flagSalt, internId)[:16] + "}"
 *
 * The same derivation is computed client-side by widgets so the simulated
 * scenario renders the intern-specific secret (e.g. the file contents in a
 * WEB_TERMINAL, the row returned by a mock SQLi, the passphrase extracted
 * from a stego PNG).
 */
export function computeFlag(flagSalt: string, internId: string): string {
  const mac = crypto
    .createHmac("sha256", flagSalt)
    .update(internId)
    .digest("hex");
  return `TRAN{${mac.slice(0, 16)}}`;
}

/** Case-insensitive, whitespace-trimmed flag comparison. */
export function flagsEqual(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * A deterministic "secret" derived from a (salt, internId) pair without the
 * TRAN{} wrapper — used by widgets that need to produce arbitrary intern-unique
 * values (e.g. a fake hash digest the intern must compute against).
 */
export function deriveSecret(salt: string, internId: string, len = 16): string {
  return crypto
    .createHmac("sha256", salt)
    .update(internId)
    .digest("hex")
    .slice(0, len);
}
