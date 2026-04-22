// Short-lived signed token issued after a valid password when 2FA is required.
// The user POSTs this token + their TOTP code to /api/auth/2fa to complete login.
import crypto from "crypto";

const CHALLENGE_TTL_MS = 5 * 60_000;

function secret(): string {
  return process.env.CRON_SECRET || "fallback";
}

export function signChallenge(userId: string, issuedAt: number = Date.now()): string {
  const payload = `${userId}:${issuedAt}`;
  const sig = crypto
    .createHmac("sha256", secret())
    .update(payload)
    .digest("hex")
    .slice(0, 32);
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyChallenge(challenge: string): { userId: string } | null {
  try {
    const decoded = Buffer.from(challenge, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return null;
    const [userId, issuedAt, sig] = parts;
    const expected = crypto
      .createHmac("sha256", secret())
      .update(`${userId}:${issuedAt}`)
      .digest("hex")
      .slice(0, 32);
    if (sig !== expected) return null;
    const age = Date.now() - Number(issuedAt);
    if (!Number.isFinite(age) || age < 0 || age > CHALLENGE_TTL_MS) return null;
    return { userId };
  } catch {
    return null;
  }
}
