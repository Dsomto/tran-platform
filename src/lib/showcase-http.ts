import type { NextRequest } from "next/server";
import { requireApiAdmin } from "./api-auth";
import { auditMetaFromRequest } from "./audit";
import { rateLimit, rateLimitResponse, type RateLimitOptions } from "./rate-limit";
import { signalHash } from "./showcase-vote";

export const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: NO_STORE });
}

// CSRF: the voter cookie is SameSite=Lax, and every state-changing showcase
// request must also come from our own origin with a JSON body.
export function crossSiteRejection(req: NextRequest): Response | null {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  let sameOrigin = false;
  try {
    sameOrigin = Boolean(origin && host && new URL(origin).host === host);
  } catch {
    sameOrigin = false;
  }
  if (!sameOrigin) return json({ error: "Request blocked." }, 403);
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json({ error: "Request blocked." }, 415);
  }
  return null;
}

export function requestIp(req: NextRequest): string | null {
  return auditMetaFromRequest(req).ip;
}

// Rate-limit keys use the keyed network hash, never the raw IP.
export async function limitBy(
  scope: string,
  subject: string | null,
  opts: RateLimitOptions,
): Promise<Response | null> {
  const result = await rateLimit(`showcase:${scope}:${subject ?? "unknown"}`, opts);
  return result.ok ? null : rateLimitResponse(result);
}

export function networkKey(req: NextRequest): string | null {
  return signalHash(requestIp(req));
}

export const SHOWCASE_LIMITS = {
  codePerNetwork: { max: 10, windowMs: 15 * 60_000 },
  codePerEmail: { max: 3, windowMs: 15 * 60_000 },
  verifyPerNetwork: { max: 20, windowMs: 15 * 60_000 },
  verifyPerEmail: { max: 8, windowMs: 15 * 60_000 },
  ballotPerNetwork: { max: 20, windowMs: 15 * 60_000 },
  // Resend allows 2 sends/second account-wide. Keep code mail at 1/s.
  codeMailGlobal: { max: 1, windowMs: 1000 },
} as const;

// Admin gate for showcase result/control endpoints: 401 without a session,
// 403 for any non-admin role, and never cacheable.
export async function requireShowcaseAdmin() {
  const auth = await requireApiAdmin();
  if (auth.session) return auth;
  const status = auth.response.status === 401 ? 401 : 403;
  return { session: null, response: json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, status) } as const;
}
