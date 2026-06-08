import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  createTokenForUser,
  sessionCookieOptions,
  SESSION_MAX_AGE_SECONDS,
  getSession,
} from "@/lib/auth";
import { requireApiSuperAdmin } from "@/lib/api-auth";
import { recordAudit, auditMetaFromRequest } from "@/lib/audit";
import { logger } from "@/lib/logger";

// Super-admin impersonates an intern's session so they can see the
// dashboard exactly as that intern sees it.
//
// Mechanics:
//   - Save the admin's current session-token in an `admin-shadow` cookie.
//   - Mint a fresh session-token for the target intern's userId.
//   - Replace `session-token` with the intern's token.
//   - When the admin clicks "Stop impersonating", the partner endpoint
//     swaps back: re-issues a fresh admin token from the shadow cookie's
//     userId, restores session-token, clears the shadow.
//
// Audited at start AND stop. Only the SUPER_ADMIN role can initiate.
export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiSuperAdmin();
    if (auth.response) return auth.response;
    const admin = auth.session;

    const body = await request.json();
    const internId = typeof body?.internId === "string" ? body.internId : null;
    if (!internId) {
      return Response.json({ error: "internId is required" }, { status: 400 });
    }

    const intern = await prisma.intern.findUnique({
      where: { id: internId },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } } },
    });
    if (!intern) {
      return Response.json({ error: "Intern not found" }, { status: 404 });
    }
    // Belt-and-braces: don't allow impersonating another admin / super-admin
    // through this endpoint. Only INTERN role.
    if (intern.user.role !== "INTERN") {
      return Response.json(
        { error: "This endpoint only impersonates intern accounts." },
        { status: 403 }
      );
    }

    const cookieStore = await cookies();
    const currentSessionToken = cookieStore.get("session-token")?.value;
    if (!currentSessionToken) {
      return Response.json({ error: "No current session" }, { status: 401 });
    }

    // Mint a token for the intern user.
    const internToken = await createTokenForUser(intern.user.id);

    // Park the admin token in admin-shadow. Same cookie config (httpOnly,
    // secure, sameSite=lax) so the cookie protections match.
    cookieStore.set(
      "admin-shadow",
      currentSessionToken,
      sessionCookieOptions(SESSION_MAX_AGE_SECONDS)
    );
    cookieStore.set(
      "session-token",
      internToken,
      sessionCookieOptions(SESSION_MAX_AGE_SECONDS)
    );

    await recordAudit({
      actor: admin,
      action: "impersonate.start",
      targetType: "USER",
      targetId: intern.user.id,
      details: {
        internId: intern.id,
        internEmail: intern.user.email,
        internName: `${intern.user.firstName} ${intern.user.lastName}`.trim(),
        internStage: intern.currentStage,
      },
      ...auditMetaFromRequest(request),
    });

    return Response.json({
      ok: true,
      impersonating: {
        internId: intern.id,
        userId: intern.user.id,
        email: intern.user.email,
        name: `${intern.user.firstName} ${intern.user.lastName}`.trim(),
        stage: intern.currentStage,
      },
    });
  } catch (error) {
    logger.error("impersonate_start_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Return current impersonation state so the UI can show the "you are
// viewing as X" banner.
export async function GET() {
  try {
    const cookieStore = await cookies();
    const shadow = cookieStore.get("admin-shadow")?.value;
    if (!shadow) {
      return Response.json({ impersonating: false });
    }
    const session = await getSession();
    if (!session) {
      return Response.json({ impersonating: false });
    }
    return Response.json({
      impersonating: true,
      asUserId: session.id,
      asName: `${session.firstName} ${session.lastName}`.trim(),
      asEmail: session.email,
    });
  } catch (error) {
    logger.error("impersonate_status_failed", error);
    return Response.json({ impersonating: false });
  }
}
