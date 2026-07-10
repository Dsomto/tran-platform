import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { getTrackChangeDeadline, isTrackChangeOpen } from "@/lib/system-settings";
import { recordAudit, auditMetaFromRequest } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRACKS = ["SOC_ANALYSIS", "ETHICAL_HACKING", "GRC"] as const;
type Track = (typeof TRACKS)[number];

// Intern switches their own specialisation track. Allowed only while the
// track-change window is open — the deadline is enforced here, never trusted
// from the client, so a stale page cannot slip a change through after close.
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const deadline = await getTrackChangeDeadline();
    if (!isTrackChangeOpen(deadline)) {
      return Response.json(
        { error: "Track changes are closed. The deadline has passed." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const track = typeof body?.track === "string" ? body.track : "";
    if (!(TRACKS as readonly string[]).includes(track)) {
      return Response.json({ error: "Pick a valid track." }, { status: 400 });
    }

    const intern = await prisma.intern.findUnique({
      where: { userId: session.id },
      select: { id: true, track: true },
    });
    if (!intern) return Response.json({ error: "No intern record found." }, { status: 404 });

    if (intern.track === track) {
      return Response.json({ success: true, track, unchanged: true });
    }

    const previous = intern.track;
    await prisma.intern.update({
      where: { id: intern.id },
      data: { track: track as Track },
    });

    await recordAudit({
      actor: session,
      action: "intern.track.change",
      targetType: "INTERN",
      targetId: intern.id,
      details: { from: previous, to: track },
      ...auditMetaFromRequest(request),
    });

    return Response.json({ success: true, track, previous });
  } catch (error) {
    logger.error("intern_track_change_failed", error);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
