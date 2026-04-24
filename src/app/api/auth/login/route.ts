import { NextRequest } from "next/server";
import { login, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { signChallenge } from "@/lib/login-challenge";
import { rateLimit, rateLimitResponse, getClientKey, RATE_LIMITS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const rl = await rateLimit(getClientKey(request), RATE_LIMITS.login);
    if (!rl.ok) return rateLimitResponse(rl);

    const body = await request.json().catch(() => ({}));
    const identifier: string | undefined = body?.identifier ?? body?.email;
    const password: string | undefined = body?.password;

    const invalid = () =>
      Response.json({ error: "Invalid credentials" }, { status: 401 });

    if (!identifier || !password) {
      return invalid();
    }

    const result = await login(identifier, password);

    if (!result.ok) {
      if (result.reason === "locked") {
        // Tell the user explicitly they're locked — otherwise they won't know
        // why repeated tries keep failing and will panic-rotate passwords.
        const mins = result.lockedUntil
          ? Math.max(1, Math.ceil((result.lockedUntil.getTime() - Date.now()) / 60_000))
          : 15;
        return Response.json(
          { error: `Account temporarily locked. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` },
          { status: 423 }
        );
      }
      return invalid();
    }

    // If the user has 2FA enabled, don't set the session cookie yet.
    const userRow = await prisma.user.findUnique({
      where: { id: result.user.id },
      select: { totpEnabled: true },
    });

    if (userRow?.totpEnabled) {
      const challenge = signChallenge(result.user.id);
      return Response.json({ needs2FA: true, challenge });
    }

    const cookieStore = await cookies();
    cookieStore.set("session-token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    });

    return Response.json({ user: result.user });
  } catch (error) {
    logger.error("login_route_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
