import { NextRequest } from "next/server";
import { login } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { signChallenge } from "@/lib/login-challenge";
import { rateLimit, rateLimitResponse, getClientKey, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(getClientKey(request), RATE_LIMITS.login);
    if (!rl.ok) return rateLimitResponse(rl);

    const body = await request.json();
    const identifier: string | undefined = body.identifier ?? body.email;
    const password: string | undefined = body.password;

    if (!identifier || !password) {
      return Response.json(
        { error: "Email (or intern ID) and password are required" },
        { status: 400 }
      );
    }

    const result = await login(identifier, password);
    if (!result) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
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

    // No 2FA — issue the session cookie as usual.
    const cookieStore = await cookies();
    cookieStore.set("session-token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return Response.json({ user: result.user });
  } catch (error) {
    console.error("Login error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
