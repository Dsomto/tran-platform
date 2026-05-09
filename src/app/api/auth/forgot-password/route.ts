import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { generateResetToken, PASSWORD_RESET_TTL_MS } from "@/lib/password-reset";
import { sendPasswordResetEmail } from "@/lib/email";
import { publicAppUrl } from "@/lib/public-url";

// Forgot-password request. Always returns the same OK shape to avoid
// leaking whether a given email is registered. If the email exists, we
// create a PasswordResetToken and email the recipient. If not, we silently
// drop it.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, firstName: true, email: true },
    });

    if (user) {
      const { token, tokenHash } = generateResetToken();
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt, requestIp: ip },
      });
      const resetUrl = `${publicAppUrl()}/reset-password?token=${token}`;
      try {
        await sendPasswordResetEmail({
          to: user.email,
          firstName: user.firstName,
          resetUrl,
        });
      } catch (err) {
        logger.error("password_reset_email_failed", err, { email });
      }
    }

    // Always return the same response — don't tell the caller whether the
    // email exists in the system.
    return Response.json({
      ok: true,
      message:
        "If that email is registered, a reset link is on its way. The link expires in 1 hour.",
    });
  } catch (error) {
    logger.error("forgot_password_failed", error);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
