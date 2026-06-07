import { NextRequest, NextResponse } from "next/server";

// Edge-runtime gate for /ops/* and /admin/* — a lightweight filter that
// rejects requests with no session cookie at all. The authoritative role
// check still lives in each page (requireSuperAdmin / requireAdmin) and
// in the per-segment layout. This middleware is defense-in-depth, written
// to run in the Edge runtime without pulling in any Node-only crypto
// libraries.
//
// Returns 404 (not 401/403) so the route surface itself is not advertised
// to external scans for unauthenticated requests.

export function middleware(req: NextRequest) {
  const token = req.cookies.get("session-token")?.value;
  if (!token) {
    return new NextResponse(null, { status: 404 });
  }
  // Cookie is present. Page-level requireSuperAdmin / requireAdmin will
  // verify the JWT, check token version, and enforce role from there.
  return NextResponse.next();
}

export const config = {
  matcher: ["/ops/:path*", "/ops", "/admin/:path*", "/admin"],
};
