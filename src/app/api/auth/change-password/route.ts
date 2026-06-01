import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession, hashPassword, createTokenForUser, SESSION_MAX_AGE_SECONDS, sessionCookieOptions } from "@/lib/auth";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// Set a new password while logged in. Used for:
//   1. First-login flow — interns who still have a non-null
//      PublicApplication.loginPassword (the temp one we generated) are gated
//      to this endpoint until they pick their own.
//   2. Any later self-service password change.
//
// On success:
//   - User.password is replaced with the bcrypt hash of the new password.
//   - PublicApplication.loginPassword is cleared (it was the temp, plain-text
//     password stored only so we could put it in the credentials email; once
//     the intern has set their own there is no reason to keep it). This
//     doubles as the "first-login change done" signal so the gate stops
//     redirecting.
//   - User.tokenVersion is bumped — invalidates every other live session for
//     this user (a stolen cookie can't survive the change).
//   - A fresh session cookie is issued so THIS browser stays signed in.
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Not authenticated." }, { status: 401 });
    }
    const rl = await rateLimit(`change-password:${session.id}`, RATE_LIMITS.login);
    if (!rl.ok) return rateLimitResponse(rl);

    const body = await request.json().catch(() => ({}));
    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword || !newPassword) {
      return Response.json({ error: "Both current and new password are required." }, { status: 400 });
    }
    if (newPassword.length < 12) {
      return Response.json(
        { error: "New password must be at least 12 characters." },
        { status: 400 }
      );
    }
    if (newPassword.length > 200) {
      return Response.json(
        { error: "New password is too long (max 200 characters)." },
        { status: 400 }
      );
    }
    if (newPassword === currentPassword) {
      return Response.json(
        { error: "New password must be different from the current one." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, email: true, password: true },
    });
    if (!user) {
      return Response.json({ error: "Account not found." }, { status: 404 });
    }

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return Response.json({ error: "Current password is incorrect." }, { status: 401 });
    }

    const hashed = await hashPassword(newPassword);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashed,
          tokenVersion: { increment: 1 },
          failedLoginCount: 0,
          lockedUntil: null,
        },
      }),
      // Clear the temp password on the linked application (matched by email,
      // which is unique on PublicApplication). updateMany so a missing record
      // — admins/graders — is a no-op rather than an error.
      prisma.publicApplication.updateMany({
        where: { email: user.email },
        data: { loginPassword: null },
      }),
    ]);

    // Re-issue this browser's session with the new tokenVersion so the user
    // stays signed in. All OTHER sessions for this user are now invalid.
    const fresh = await createTokenForUser(user.id);
    const cookieStore = await cookies();
    cookieStore.set("session-token", fresh, sessionCookieOptions(SESSION_MAX_AGE_SECONDS));

    logger.info("password_changed", { userId: user.id });
    return Response.json({ ok: true });
  } catch (error) {
    logger.error("change_password_failed", error);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
