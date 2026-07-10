import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  getSession,
  createToken,
  sessionCookieOptions,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth";
import { recordAudit, auditMetaFromRequest } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Letters (any script), marks, spaces, hyphen, apostrophe, period.
// Blocks HTML/scripts while still accepting names like "N'Diaye" or "O'Brien".
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s'’.-]{0,59}$/u;

function clean(v: unknown): string {
  return typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
}

// Lets a user correct their own name. This matters: the name on the
// certificate, letters and completion card is read straight from here, so a
// typo here becomes a typo on their credential.
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const firstName = clean(body?.firstName);
    const lastName = clean(body?.lastName);

    if (!firstName || !lastName) {
      return Response.json({ error: "Both first and last name are required." }, { status: 400 });
    }
    if (!NAME_RE.test(firstName) || !NAME_RE.test(lastName)) {
      return Response.json(
        { error: "Use letters, spaces, hyphens or apostrophes only (max 60 characters)." },
        { status: 400 }
      );
    }
    if (firstName === session.firstName && lastName === session.lastName) {
      return Response.json({ success: true, unchanged: true, firstName, lastName });
    }

    const previous = `${session.firstName} ${session.lastName}`.trim();
    await prisma.user.update({
      where: { id: session.id },
      data: { firstName, lastName },
    });

    // The session is a JWT holding the name, so re-issue it or the dashboard
    // keeps showing the old one until the cookie expires.
    const fresh = createToken({ ...session, firstName, lastName });
    const cookieStore = await cookies();
    cookieStore.set("session-token", fresh, sessionCookieOptions(SESSION_MAX_AGE_SECONDS));

    await recordAudit({
      actor: session,
      action: "account.name.change",
      targetType: "USER",
      targetId: session.id,
      details: { from: previous, to: `${firstName} ${lastName}` },
      ...auditMetaFromRequest(request),
    });

    return Response.json({ success: true, firstName, lastName });
  } catch (error) {
    logger.error("account_name_change_failed", error);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
