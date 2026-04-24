// Rate limiter — Upstash Redis when env vars are set, in-memory fallback otherwise.
//
// The fallback matters for two reasons:
//   1. Local dev works without any Upstash setup.
//   2. If Redis is unreachable, we degrade to per-instance limiting rather than
//      failing open completely.
//
// Required env vars on Vercel for the Redis path:
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN

import { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitOptions {
  max: number;
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
}

export function getClientKey(req: NextRequest, userKey?: string | null): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return userKey ? `u:${userKey}` : `ip:${ip}`;
}

// ── Redis path ──────────────────────────────────────────────────────────────
// Per preset-config we instantiate one Ratelimit instance (cached). Preset
// configs are fixed at module load so the cache never grows unbounded.

const redisClient = (() => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    return new Redis({ url, token });
  } catch {
    return null;
  }
})();

const ratelimitCache = new Map<string, Ratelimit>();

function getRatelimit(opts: RateLimitOptions): Ratelimit | null {
  if (!redisClient) return null;
  const cacheKey = `${opts.max}:${opts.windowMs}`;
  const cached = ratelimitCache.get(cacheKey);
  if (cached) return cached;
  const rl = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(opts.max, `${opts.windowMs} ms`),
    analytics: false,
    prefix: "ubi:rl",
  });
  ratelimitCache.set(cacheKey, rl);
  return rl;
}

// ── In-memory fallback ──────────────────────────────────────────────────────

type Bucket = { tokens: number; lastRefill: number };
const buckets = new Map<string, Bucket>();

let lastSweep = Date.now();
function sweep() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of buckets.entries()) {
    if (now - v.lastRefill > 10 * 60_000) buckets.delete(k);
  }
}

function memoryRateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  sweep();
  const now = Date.now();
  const { max, windowMs } = opts;
  const refillRate = max / windowMs;
  const existing = buckets.get(key);
  const bucket: Bucket = existing ?? { tokens: max, lastRefill: now };
  const elapsed = now - bucket.lastRefill;
  bucket.tokens = Math.min(max, bucket.tokens + elapsed * refillRate);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    const deficit = 1 - bucket.tokens;
    return { ok: false, remaining: 0, retryAfterMs: Math.ceil(deficit / refillRate) };
  }

  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return { ok: true, remaining: Math.floor(bucket.tokens), retryAfterMs: 0 };
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function rateLimit(
  key: string,
  opts: RateLimitOptions
): Promise<RateLimitResult> {
  const rl = getRatelimit(opts);
  if (rl) {
    try {
      const res = await rl.limit(key);
      const retryAfterMs = Math.max(0, res.reset - Date.now());
      return {
        ok: res.success,
        remaining: Math.max(0, res.remaining),
        retryAfterMs,
      };
    } catch {
      // If Redis errors, fall back to in-memory rather than failing requests.
      return memoryRateLimit(key, opts);
    }
  }
  return memoryRateLimit(key, opts);
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

export const RATE_LIMITS = {
  publicForm: { max: 5, windowMs: 60_000 },
  login: { max: 10, windowMs: 5 * 60_000 },
  reportWrite: { max: 30, windowMs: 60_000 },
  flagSubmit: { max: 20, windowMs: 60_000 },
  graderAction: { max: 60, windowMs: 60_000 },
} as const;
