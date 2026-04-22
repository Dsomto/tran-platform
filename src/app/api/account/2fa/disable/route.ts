import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, verifyPassword } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { verifyTotp } from "@/lib/totp";

// Disable 2FA. Requires BOTH the current password AND a valid TOTP code —
// prevents an attacker who compromises only one factor from disabling it.
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

    const { password, code } = await request.json().catch(() => ({}));
    if (typeof password !== "string" || typeof code !== "string") {
      return Response.json({ error: "Password and code required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });
    if (!user.totpEnabled || !user.totpSecret) {
      return Response.json({ error: "2FA is not currently enabled" }, { status: 409 });
    }

    const passOk = await verifyPassword(password, user.password);
    if (!passOk) return Response.json({ error: "Incorrect password" }, { status: 401 });

    if (!verifyTotp(user.totpSecret, code)) {
      return Response.json({ error: "Incorrect code" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { totpEnabled: false, totpSecret: null, totpLastUsedAt: null },
    });

    return Response.json({ enabled: false });
  } catch (error) {
    logger.error("2fa_disable_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
