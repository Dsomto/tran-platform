import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { generateBase32Secret, otpauthUri } from "@/lib/totp";

// Creates a pending 2FA secret if one doesn't already exist (or rotates it
// when the caller passes `rotate: true`). The secret is NOT enabled until
// the user verifies a code via /api/account/2fa/verify.
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const rotate = body?.rotate === true;

    let secret = user.totpSecret;
    if (!secret || rotate) {
      secret = generateBase32Secret(20);
      await prisma.user.update({
        where: { id: user.id },
        data: { totpSecret: secret, totpEnabled: false },
      });
    }

    const issuer = "UBI";
    const uri = otpauthUri({
      secret,
      accountName: user.email,
      issuer,
    });

    return Response.json({
      secret,
      issuer,
      accountName: user.email,
      otpauthUri: uri,
      enabled: user.totpEnabled,
    });
  } catch (error) {
    logger.error("2fa_setup_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
