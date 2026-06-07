import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { TOKEN_TO_STAGE, STAGE_TOKENS } from "./lib/stage-routes";

type PrivilegedRole = "GRADER" | "ADMIN" | "SUPER_ADMIN";
type RouteAuth = "admin" | "ops";

/**
 * Path-token routing for TRAN's foundation rooms.
 *
 * Each of the five foundation rooms is reached via a hard-to-guess path token
 * (instead of a subdomain, because Vercel Hobby doesn't support wildcards):
 *
 *   domain.com/<token-0>/... → /subdomains/stage-0/...
 *   domain.com/<token-1>/... → /subdomains/stage-1/...
 *   ... and so on for stages 2-4
 *
 * Tokens live in src/lib/stage-routes.ts — rotate them there to change the URLs.
 *
 * For local development, both path-token and the legacy subdomain form
 * (stage-N.localhost:3000) are accepted so existing bookmarks still work.
 */
const STAGE_SLUGS = new Set(Object.keys(STAGE_TOKENS));

function extractStageFromHost(host: string | null): string | null {
  if (!host) return null;
  const hostname = host.split(":")[0].toLowerCase();
  const firstLabel = hostname.split(".")[0];
  return STAGE_SLUGS.has(firstLabel) ? firstLabel : null;
}

function extractStageFromPath(pathname: string): { stage: string; rest: string } | null {
  // First path segment: /<token>/...
  const match = pathname.match(/^\/([a-z0-9]{6,32})(\/.*)?$/i);
  if (!match) return null;
  const [, token, rest] = match;
  const stage = TOKEN_TO_STAGE[token.toLowerCase()];
  if (!stage) return null;
  return { stage, rest: rest || "" };
}

// Forward the original pathname so server layouts can read it via headers().
// Used by DashboardLayout to detect when we're already on /dashboard/onboarding
// and avoid an NDA redirect loop.
function withPathnameHeader(request: NextRequest, pathname: string) {
  const h = new Headers(request.headers);
  // Defense-in-depth: drop the CVE-2025-29927 vector header so a client can
  // never smuggle it through (the installed Next.js already patches it).
  h.delete("x-middleware-subrequest");
  // Always set x-pathname ourselves — overwriting any client-supplied value so
  // layouts can't be tricked by a spoofed pathname.
  h.set("x-pathname", pathname);
  return h;
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> | null {
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

function base64UrlToJson<T>(value: string): T | null {
  const bytes = base64UrlToBytes(value);
  if (!bytes) return null;
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    return null;
  }
}

function timingSafeEqual(a: Uint8Array<ArrayBuffer>, b: Uint8Array<ArrayBuffer>): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function verifiedSessionRole(token: string | undefined): Promise<PrivilegedRole | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = base64UrlToJson<{ alg?: string; typ?: string }>(encodedHeader);
  if (header?.alg !== "HS256") return null;

  const payload = base64UrlToJson<{ exp?: number; role?: string }>(encodedPayload);
  if (!payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  if (
    payload.role !== "GRADER" &&
    payload.role !== "ADMIN" &&
    payload.role !== "SUPER_ADMIN"
  ) {
    return null;
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const expected = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`))
  );
  const actual = base64UrlToBytes(encodedSignature);
  if (!actual || !timingSafeEqual(expected, actual)) return null;
  return payload.role;
}

function authBoundary(pathname: string): RouteAuth | null {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";
  if (pathname === "/ops" || pathname.startsWith("/ops/")) return "ops";
  return null;
}

function forbiddenRewrite(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/_not-found";
  url.search = "";
  return url;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const requestHeaders = withPathnameHeader(request, pathname);

  // Never rewrite API routes, Next internals, static assets.
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/subdomains/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const boundary = authBoundary(pathname);
  if (boundary) {
    const role = await verifiedSessionRole(request.cookies.get("session-token")?.value);
    const allowed =
      boundary === "ops"
        ? role === "SUPER_ADMIN"
        : role === "GRADER" || role === "ADMIN" || role === "SUPER_ADMIN";
    if (!allowed) {
      return NextResponse.rewrite(forbiddenRewrite(request), {
        request: { headers: requestHeaders },
        status: 404,
      });
    }
  }

  // Path-token routing (production on any single domain).
  const fromPath = extractStageFromPath(pathname);
  if (fromPath) {
    const url = request.nextUrl.clone();
    url.pathname = `/subdomains/${fromPath.stage}${fromPath.rest}`;
    url.search = search;
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  // Subdomain routing fallback (local dev on stage-N.localhost:3000).
  const host = request.headers.get("host");
  const stage = extractStageFromHost(host);
  if (stage) {
    const url = request.nextUrl.clone();
    url.pathname = `/subdomains/${stage}${pathname === "/" ? "" : pathname}`;
    url.search = search;
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
