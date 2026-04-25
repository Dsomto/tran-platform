import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// POST /api/intern/sign-nda
// Body: { typedName: string }
//
// Validates that the typed name matches the intern's first + last name, then
// stamps Intern.ndaSignedAt. Idempotent — already-signed interns get a 200
// with the existing timestamp returned.
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Not signed in" }, { status: 401 });
    }

    const intern = await prisma.intern.findUnique({
      where: { userId: session.id },
      select: { id: true, ndaSignedAt: true },
    });
    if (!intern) {
      return Response.json({ error: "Not an intern" }, { status: 403 });
    }

    if (intern.ndaSignedAt) {
      return Response.json({
        ok: true,
        alreadySigned: true,
        signedAt: intern.ndaSignedAt.toISOString(),
      });
    }

    const body = await request.json().catch(() => ({}));
    const typedName = typeof body.typedName === "string" ? body.typedName.trim() : "";
    if (!typedName) {
      return Response.json({ error: "Type your name to sign" }, { status: 400 });
    }

    // Loose match — case-insensitive, ignore extra spaces.
    const expected = `${session.firstName} ${session.lastName}`.trim().toLowerCase().replace(/\s+/g, " ");
    const got = typedName.toLowerCase().replace(/\s+/g, " ");
    if (expected !== got) {
      return Response.json(
        {
          error: `The name on the agreement must match your account. Type \"${session.firstName} ${session.lastName}\".`,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.intern.update({
      where: { id: intern.id },
      data: { ndaSignedAt: new Date(), ndaSignedName: typedName },
      select: { ndaSignedAt: true },
    });

    return Response.json({
      ok: true,
      alreadySigned: false,
      signedAt: updated.ndaSignedAt?.toISOString() ?? null,
    });
  } catch (error) {
    logger.error("sign_nda_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
