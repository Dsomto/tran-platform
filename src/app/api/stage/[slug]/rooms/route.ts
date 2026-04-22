import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { STAGE_SLUGS, STAGE_SLUG_TO_ENUM, StageSlug, getDoorSession } from "@/lib/stage-login";

/**
 * GET /api/stage/[slug]/rooms
 *
 * Returns the Room record + per-intern task state (score / status) for the
 * current stage. Authenticated via the per-stage door cookie.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!STAGE_SLUGS.includes(slug as StageSlug)) {
      return Response.json({ error: "Unknown stage" }, { status: 404 });
    }
    const session = await getDoorSession(slug as StageSlug);
    if (!session) {
      return Response.json({ error: "Not authenticated for this stage" }, { status: 401 });
    }

    const room = await prisma.room.findUnique({
      where: { stage: STAGE_SLUG_TO_ENUM[slug as StageSlug] },
      include: {
        assignments: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            maxPoints: true,
            kind: true,
            widget: true,
            order: true,
            choices: true,
            minWords: true,
          },
        },
      },
    });
    if (!room) {
      return Response.json({ error: "Room not set up yet" }, { status: 404 });
    }

    const submissions = await prisma.submission.findMany({
      where: {
        internId: session.internId,
        assignmentId: { in: room.assignments.map((a) => a.id) },
      },
      select: { assignmentId: true, status: true, score: true, feedback: true, gradedAt: true },
    });
    const byAssignment = new Map(submissions.map((s) => [s.assignmentId, s]));

    return Response.json({
      room: {
        id: room.id,
        slug: room.slug,
        title: room.title,
        codename: room.codename,
        synopsis: room.synopsis,
        briefing: room.briefing,
        debrief: room.debrief,
        learningObjectives: room.learningObjectives,
        themeColor: room.themeColor,
        totalPoints: room.totalPoints,
        passThreshold: room.passThreshold,
      },
      tasks: room.assignments.map((a) => ({
        id: a.id,
        order: a.order ?? 0,
        title: a.title,
        description: a.description,
        maxPoints: a.maxPoints,
        kind: a.kind,
        widget: a.widget,
        choices: a.choices,
        minWords: a.minWords,
        submission: byAssignment.get(a.id) ?? null,
      })),
    });
  } catch (err) {
    logger.error("stage_rooms_failed", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
