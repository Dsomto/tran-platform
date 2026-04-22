import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";

// Self-attestation: intern confirms they've joined the Slack workspace.
// Real verification would need Slack OAuth; this is honest-enough for now
// and the admin can see who hasn't confirmed.
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const joined = body?.joined !== false; // default true

    const intern = await prisma.intern.findUnique({ where: { userId: session.id } });
    if (!intern) return Response.json({ error: "Intern profile not found" }, { status: 404 });

    const updated = await prisma.intern.update({
      where: { id: intern.id },
      data: {
        slackJoined: joined,
        slackJoinedAt: joined ? new Date() : null,
      },
    });

    return Response.json({
      slackJoined: updated.slackJoined,
      slackJoinedAt: updated.slackJoinedAt,
    });
  } catch (error) {
    logger.error("slack_joined_toggle_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
