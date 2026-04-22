import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { STAGE_SLUGS, STAGE_SLUG_TO_ENUM, StageSlug, getDoorSession } from "@/lib/stage-login";
import { autoGradeSubmission, contentFromAnswer } from "@/lib/auto-grade";
import { awardPoints, maybeAdvanceStage } from "@/lib/advance-stage";

/**
 * POST /api/stage/[slug]/tasks/[taskId]/answer
 *
 * Accepts { answer: Record<string, unknown> } — the submission payload.
 * Performs auto-grading for FLAG / MCQ tasks, stores the submission, awards
 * points, and (when the room is cleared) advances the intern's stage.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; taskId: string }> }
) {
  try {
    const { slug, taskId } = await params;
    if (!STAGE_SLUGS.includes(slug as StageSlug)) {
      return Response.json({ error: "Unknown stage" }, { status: 404 });
    }
    const session = await getDoorSession(slug as StageSlug);
    if (!session) {
      return Response.json({ error: "Not authenticated for this stage" }, { status: 401 });
    }

    const { answer } = await request.json().catch(() => ({ answer: {} }));
    if (typeof answer !== "object" || answer == null) {
      return Response.json({ error: "answer must be an object" }, { status: 400 });
    }

    const assignment = await prisma.assignment.findUnique({ where: { id: taskId } });
    if (!assignment) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }
    if (assignment.stage !== STAGE_SLUG_TO_ENUM[slug as StageSlug]) {
      return Response.json({ error: "Task belongs to a different stage" }, { status: 400 });
    }

    const grade = autoGradeSubmission(
      assignment,
      answer as Record<string, unknown>,
      session.internId
    );

    const content = contentFromAnswer(assignment.kind, answer as Record<string, unknown>);
    const attachmentUrl =
      typeof (answer as Record<string, unknown>).url === "string"
        ? ((answer as Record<string, unknown>).url as string)
        : null;

    const submission = await prisma.submission.upsert({
      where: { internId_assignmentId: { internId: session.internId, assignmentId: assignment.id } },
      create: {
        internId: session.internId,
        assignmentId: assignment.id,
        content: content.slice(0, 20000),
        attachmentUrl,
        status: grade.status,
        score: grade.autoGraded ? grade.score : null,
        feedback: grade.feedback,
        submittedAt: new Date(),
        gradedAt: grade.autoGraded ? new Date() : null,
      },
      update: {
        content: content.slice(0, 20000),
        attachmentUrl,
        status: grade.status,
        score: grade.autoGraded ? grade.score : null,
        feedback: grade.feedback,
        submittedAt: new Date(),
        gradedAt: grade.autoGraded ? new Date() : null,
      },
    });

    if (grade.autoGraded && grade.score > 0) {
      await awardPoints(
        session.internId,
        grade.score,
        `Auto-graded: ${assignment.title}`
      );
    }

    const advance = grade.autoGraded ? await maybeAdvanceStage(session.internId) : null;

    return Response.json({
      submissionId: submission.id,
      status: submission.status,
      score: submission.score,
      feedback: submission.feedback,
      autoGraded: grade.autoGraded,
      advance,
    });
  } catch (err) {
    logger.error("stage_answer_failed", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
