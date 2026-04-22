import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { createToken } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { verifyChallenge } from "@/lib/login-challenge";
import { verifyTotp } from "@/lib/totp";
import { logger } from "@/lib/logger";
import { rateLimit, rateLimitResponse, getClientKey, RATE_LIMITS } from "@/lib/rate-limit";

// Accepts { challenge, code } from the client after a 2FA-required login.
// Verifies the challenge token and the TOTP code, then issues the session cookie.
export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(getClientKey(request), RATE_LIMITS.login);
    if (!rl.ok) return rateLimitResponse(rl);

    const { challenge, code } = await request.json().catch(() => ({}));
    if (typeof challenge !== "string" || typeof code !== "string") {
      return Response.json({ error: "Challenge and code are required" }, { status: 400 });
    }

    const parsed = verifyChallenge(challenge);
    if (!parsed) {
      return Response.json(
        { error: "Challenge expired. Log in again." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: parsed.userId } });
    if (!user || !user.totpEnabled || !user.totpSecret) {
      return Response.json({ error: "2FA not configured" }, { status: 409 });
    }

    if (!verifyTotp(user.totpSecret, code)) {
      return Response.json({ error: "Incorrect code" }, { status: 401 });
    }

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatarUrl: user.avatarUrl,
    };
    const token = createToken(sessionUser);

    await prisma.user.update({
      where: { id: user.id },
      data: { totpLastUsedAt: new Date() },
    });

    const cookieStore = await cookies();
    cookieStore.set("session-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return Response.json({ user: sessionUser });
  } catch (error) {
    logger.error("2fa_challenge_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
