import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { TOKEN_TO_STAGE, STAGE_TOKENS } from "./lib/stage-routes";

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
  h.set("x-pathname", pathname);
  return h;
}

export function proxy(request: NextRequest) {
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
