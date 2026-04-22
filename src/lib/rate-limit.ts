// Simple in-memory token-bucket rate limiter.
// Single-process only — if you scale to multiple Next.js instances,
// replace the Map with a Redis-backed implementation.

import { NextRequest } from "next/server";

type Bucket = { tokens: number; lastRefill: number };
const buckets = new Map<string, Bucket>();

// Periodically evict idle buckets so memory doesn't grow unbounded.
let lastSweep = Date.now();
function sweep() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of buckets.entries()) {
    if (now - v.lastRefill > 10 * 60_000) buckets.delete(k);
  }
}

export function getClientKey(req: NextRequest, userKey?: string | null): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return userKey ? `u:${userKey}` : `ip:${ip}`;
}

export interface RateLimitOptions {
  // Max sustained requests per window.
  max: number;
  // Window length in ms.
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
}

export function rateLimit(
  key: string,
  { max, windowMs }: RateLimitOptions
): RateLimitResult {
  sweep();
  const now = Date.now();
  const refillRate = max / windowMs; // tokens per ms
  const existing = buckets.get(key);
  const bucket: Bucket = existing ?? { tokens: max, lastRefill: now };

  // Refill based on elapsed time.
  const elapsed = now - bucket.lastRefill;
  bucket.tokens = Math.min(max, bucket.tokens + elapsed * refillRate);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    const deficit = 1 - bucket.tokens;
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: Math.ceil(deficit / refillRate),
    };
  }

  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return { ok: true, remaining: Math.floor(bucket.tokens), retryAfterMs: 0 };
}

export function rateLimitResponse(result: RateLimitResult): Response {
  return Response.json(
    { error: "Too many requests. Slow down." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)),
      },
    }
  );
}

// Preset configs for common endpoints.
export const RATE_LIMITS = {
  // Public form submits — harsher.
  publicForm: { max: 5, windowMs: 60_000 },
  // Login attempts — prevent credential stuffing.
  login: { max: 10, windowMs: 5 * 60_000 },
  // Report save/submit — more generous since drafts autosave.
  reportWrite: { max: 30, windowMs: 60_000 },
  // Flag submissions — prevent brute-force.
  flagSubmit: { max: 20, windowMs: 60_000 },
  // Grader actions — generous.
  graderAction: { max: 60, windowMs: 60_000 },
} as const;
