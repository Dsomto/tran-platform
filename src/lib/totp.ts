// RFC 6238 TOTP — self-contained, no external deps.
// Uses HMAC-SHA1 with 30-second steps and 6-digit codes (the standard most
// authenticator apps default to).

import crypto from "crypto";

const DIGITS = 6;
const STEP_SECONDS = 30;

// ── Base32 (RFC 4648 without padding) ────────────────────────
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateBase32Secret(bytes = 20): string {
  const buf = crypto.randomBytes(bytes);
  let bits = 0;
  let value = 0;
  let out = "";
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return out;
}

function base32Decode(s: string): Buffer {
  const clean = s.toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

// ── HOTP → TOTP ──────────────────────────────────────────────
function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  // 64-bit big-endian counter
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter & 0xffffffff, 4);
  const hmac = crypto.createHmac("sha1", secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const code = bin % 10 ** DIGITS;
  return code.toString().padStart(DIGITS, "0");
}

export function generateTotp(secretBase32: string, when: Date = new Date()): string {
  const counter = Math.floor(when.getTime() / 1000 / STEP_SECONDS);
  return hotp(base32Decode(secretBase32), counter);
}

// Verify code against the current window and ±1 step (tolerates clock skew).
export function verifyTotp(
  secretBase32: string,
  code: string,
  when: Date = new Date()
): boolean {
  const cleaned = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;
  const secret = base32Decode(secretBase32);
  const counter = Math.floor(when.getTime() / 1000 / STEP_SECONDS);
  for (let drift = -1; drift <= 1; drift++) {
    const expected = hotp(secret, counter + drift);
    if (timingSafeEqual(expected, cleaned)) return true;
  }
  return false;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return crypto.timingSafeEqual(ba, bb);
}

// ── otpauth:// URI for QR codes ──────────────────────────────
export function otpauthUri(opts: {
  secret: string;
  accountName: string;   // typically user email
  issuer: string;        // Shown in the user's authenticator app, e.g. "UBI"
}): string {
  const { secret, accountName, issuer } = opts;
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}`;
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
