import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  createTokenForUser,
  sessionCookieOptions,
  SESSION_MAX_AGE_SECONDS,
  verifyToken,
} from "@/lib/auth";
import { recordAudit, auditMetaFromRequest } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db";

// Stop impersonating. Reads the admin-shadow cookie (set when impersonation
// started), verifies it still decodes to a real super-admin, mints a fresh
// session-token for that admin, and clears the shadow.
//
// This endpoint deliberately does NOT require requireApiSuperAdmin — at the
// moment of "stop" the active session is the intern's, not the admin's.
// The shadow cookie carries the original admin's identity; we verify that
// directly.
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const shadow = cookieStore.get("admin-shadow")?.value;
    if (!shadow) {
      return Response.json({ error: "Not impersonating" }, { status: 400 });
    }

    const decoded = verifyToken(shadow);
    if (!decoded) {
      // Shadow is stale or forged — clear it and refuse.
      cookieStore.delete("admin-shadow");
      return Response.json({ error: "Shadow session invalid" }, { status: 401 });
    }

    // Refuse to swap back to a non-super-admin (defensive — the shadow
    // should always be a super-admin since only super-admin can start
    // impersonation, but verify against the live DB anyway).
    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true },
    });
    if (!adminUser || adminUser.role !== "SUPER_ADMIN") {
      cookieStore.delete("admin-shadow");
      return Response.json({ error: "Shadow user is not a super-admin" }, { status: 403 });
    }

    // Mint a fresh token for the admin (don't replay the parked one — it's
    // partially expired, and a fresh one gives the admin a clean hour).
    const adminToken = await createTokenForUser(adminUser.id);

    cookieStore.set(
      "session-token",
      adminToken,
      sessionCookieOptions(SESSION_MAX_AGE_SECONDS)
    );
    cookieStore.delete("admin-shadow");

    await recordAudit({
      actor: {
        id: adminUser.id,
        email: adminUser.email,
        firstName: "",
        lastName: "",
        role: "SUPER_ADMIN",
        avatarUrl: null,
      },
      action: "impersonate.stop",
      targetType: "USER",
      targetId: adminUser.id,
      details: { restoredAdminId: adminUser.id },
      ...auditMetaFromRequest(request),
    });

    return Response.json({ ok: true });
  } catch (error) {
    logger.error("impersonate_stop_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
