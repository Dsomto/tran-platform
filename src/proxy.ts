import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Subdomain proxy for TRAN's foundation rooms.
 *
 * Each of the five foundation rooms is reachable on its own subdomain:
 *   stage-0.<ROOT_DOMAIN> → /subdomains/stage-0/...
 *   stage-1.<ROOT_DOMAIN> → /subdomains/stage-1/...
 *   stage-2.<ROOT_DOMAIN> → /subdomains/stage-2/...
 *   stage-3.<ROOT_DOMAIN> → /subdomains/stage-3/...
 *   stage-4.<ROOT_DOMAIN> → /subdomains/stage-4/...
 *
 * In production ROOT_DOMAIN = "ubinitiative.org" — so `stage-0.ubinitiative.org`
 * resolves to the files under `src/app/subdomains/stage-0/`.  Locally during
 * development we accept `stage-0.localhost:3000` (Chrome/Firefox resolve
 * `*.localhost` to 127.0.0.1 without /etc/hosts edits).
 *
 * `/api/*` and Next internals (`_next`, favicon, static) bypass the rewrite so
 * API routes stay mounted at the normal path.
 */
const STAGE_SLUGS = new Set(["stage-0", "stage-1", "stage-2", "stage-3", "stage-4"]);

function extractStageFromHost(host: string | null): string | null {
  if (!host) return null;
  const hostname = host.split(":")[0].toLowerCase();
  const firstLabel = hostname.split(".")[0];
  return STAGE_SLUGS.has(firstLabel) ? firstLabel : null;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Never rewrite API routes, Next internals, static assets.
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/subdomains/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  const host = request.headers.get("host");
  const stage = extractStageFromHost(host);
  if (!stage) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/subdomains/${stage}${pathname === "/" ? "" : pathname}`;
  url.search = search;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
