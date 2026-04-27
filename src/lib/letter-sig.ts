import crypto from "crypto";
import { flagSigningSecret } from "./secrets";

// HMAC signature that goes on the dynamic acceptance letter URL. Without a
// valid sig the letter page renders a 404, so an attacker can't craft an
// arbitrary letter (e.g. ?name=Random%20Person) and pass it off as real.
//
// Truncated to 16 hex chars — full 64 is overkill for a public-facing URL
// where the only threat is forgery. Brute-forcing 16 hex (64 bits) is not
// feasible at HTTP rates.
export function signLetter(name: string, track: string): string {
  return crypto
    .createHmac("sha256", flagSigningSecret())
    .update(`letter:acceptance:${name}:${track}`)
    .digest("hex")
    .slice(0, 16);
}

export function verifyLetter(name: string, track: string, sig: string): boolean {
  if (!sig || typeof sig !== "string") return false;
  const expected = signLetter(name, track);
  // Constant-time compare; both sides are equal length by construction.
  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
