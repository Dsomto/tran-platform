import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { hashResetToken } from "@/lib/password-reset";
import { hashPassword } from "@/lib/auth";

// Consume a reset token + set a new password. Single-use: marks consumedAt
// so the same token can't be replayed. Bumps tokenVersion so any active
// session for the user is invalidated (forces re-login with the new password).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body?.token === "string" ? body.token : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!token) {
      return Response.json({ error: "Missing reset token." }, { status: 400 });
    }
    if (newPassword.length < 12) {
      return Response.json(
        { error: "Password must be at least 12 characters." },
        { status: 400 }
      );
    }
    if (newPassword.length > 200) {
      return Response.json(
        { error: "Password is too long (max 200 characters)." },
        { status: 400 }
      );
    }

    const tokenHash = hashResetToken(token);
    const row = await prisma.passwordResetToken.findFirst({
      where: { tokenHash },
    });
    if (!row) {
      return Response.json({ error: "This reset link is invalid." }, { status: 400 });
    }
    if (row.consumedAt) {
      return Response.json(
        { error: "This reset link has already been used. Request a new one." },
        { status: 400 }
      );
    }
    if (row.expiresAt.getTime() < Date.now()) {
      return Response.json(
        { error: "This reset link has expired. Request a new one." },
        { status: 400 }
      );
    }

    const hashed = await hashPassword(newPassword);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: row.userId },
        data: {
          password: hashed,
          tokenVersion: { increment: 1 },
          failedLoginCount: 0,
          lockedUntil: null,
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: row.id },
        data: { consumedAt: new Date() },
      }),
    ]);

    return Response.json({ ok: true });
  } catch (error) {
    logger.error("reset_password_failed", error);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
