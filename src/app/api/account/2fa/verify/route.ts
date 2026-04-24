import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { verifyTotp } from "@/lib/totp";
import { rateLimit, rateLimitResponse, getClientKey, RATE_LIMITS } from "@/lib/rate-limit";

// Verifies a TOTP code and enables 2FA on the user's account.
// Call this right after /setup once the user has scanned the QR.
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

    const rl = await rateLimit(getClientKey(request, session.id), {
      max: 8,
      windowMs: 60_000,
    });
    if (!rl.ok) return rateLimitResponse(rl);

    const { code } = await request.json().catch(() => ({}));
    if (typeof code !== "string") {
      return Response.json({ error: "Code is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });
    if (!user.totpSecret) {
      return Response.json(
        { error: "No 2FA secret pending. Run setup first." },
        { status: 409 }
      );
    }

    if (!verifyTotp(user.totpSecret, code)) {
      return Response.json({ error: "Incorrect code" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { totpEnabled: true, totpLastUsedAt: new Date() },
    });

    return Response.json({ enabled: true });
  } catch (error) {
    logger.error("2fa_verify_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
