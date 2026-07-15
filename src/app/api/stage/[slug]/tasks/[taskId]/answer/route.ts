import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { STAGE_SLUGS, STAGE_SLUG_TO_ENUM, StageSlug } from "@/lib/stage-login";
import { getStageAccess } from "@/lib/stage-access";
import { autoGradeSubmission, contentFromAnswer } from "@/lib/auto-grade";
import { awardPoints } from "@/lib/advance-stage";

/**
 * POST /api/stage/[slug]/tasks/[taskId]/answer
 *
 * Accepts { answer: Record<string, unknown> } — the submission payload.
 * Performs auto-grading for FLAG / MCQ tasks, stores the submission, and
 * awards leaderboard points.
 *
 * Stage advancement is intentionally NOT done here. Interns advance only
 * when an admin publishes a stage's results (capstone-driven) and opens the
 * next stage's window — board tasks never auto-promote anyone.
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
    const result = await getStageAccess(slug as StageSlug);
    if (!result.ok) {
      const status = result.reason === "no-session" ? 401 : 403;
      return Response.json({ error: result.reason }, { status });
    }
    const internId = result.access.internId;

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
    if (assignment.track && assignment.track !== result.access.track) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }
    if (assignment.isClosed) {
      return Response.json(
        { error: "This task is closed and no longer accepts answers." },
        { status: 409 }
      );
    }

    // URL gate for WRITEUP tasks that require an external submission link
    // (Google Doc capstones in stages 2-4). The pad just holds the URL + a
    // short abstract; without this check an intern could pass minWords with
    // pure prose and never link the actual deliverable.
    const wc = (assignment.widgetConfig as Record<string, unknown> | null) ?? null;
    if (
      assignment.kind === "WRITEUP" &&
      wc !== null &&
      wc.requiresUrl === true
    ) {
      const text =
        typeof (answer as Record<string, unknown>).text === "string"
          ? ((answer as Record<string, unknown>).text as string)
          : "";
      const urlMatch = text.match(/https?:\/\/[^\s<>"']+/);
      if (!urlMatch) {
        return Response.json(
          {
            error:
              "Submission must include a public link (e.g. a Google Doc URL). Set Doc sharing to 'Anyone with the link → Viewer'.",
          },
          { status: 400 }
        );
      }
      const allowedHosts = Array.isArray(wc.allowedUrlHosts)
        ? (wc.allowedUrlHosts as unknown[]).filter(
            (h): h is string => typeof h === "string"
          )
        : null;
      if (allowedHosts && allowedHosts.length > 0) {
        try {
          const u = new URL(urlMatch[0]);
          const ok = allowedHosts.some(
            (h) => u.hostname === h || u.hostname.endsWith("." + h)
          );
          if (!ok) {
            return Response.json(
              {
                error: `Link host not allowed. This task accepts links from: ${allowedHosts.join(", ")}.`,
              },
              { status: 400 }
            );
          }
        } catch {
          return Response.json(
            { error: "Submitted link is not a valid URL." },
            { status: 400 }
          );
        }
      }
    }

    // Auto-graded tasks lock once solved: re-answering a correctly-graded task
    // must not re-award points (the leaderboard would otherwise inflate).
    const existing = await prisma.submission.findUnique({
      where: { internId_assignmentId: { internId, assignmentId: assignment.id } },
      select: { id: true, status: true, score: true },
    });
    if (existing && existing.status === "GRADED" && (existing.score ?? 0) > 0) {
      return Response.json({
        submissionId: existing.id,
        status: existing.status,
        score: existing.score,
        feedback: "You've already solved this task.",
        autoGraded: true,
        alreadySolved: true,
      });
    }

    const grade = autoGradeSubmission(
      assignment,
      answer as Record<string, unknown>,
      internId
    );

    const content = contentFromAnswer(assignment.kind, answer as Record<string, unknown>);
    const attachmentUrl =
      typeof (answer as Record<string, unknown>).url === "string"
        ? ((answer as Record<string, unknown>).url as string)
        : null;

    const submission = await prisma.submission.upsert({
      where: { internId_assignmentId: { internId: internId, assignmentId: assignment.id } },
      create: {
        internId: internId,
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
        internId,
        grade.score,
        `Auto-graded: ${assignment.title}`
      );
    }

    return Response.json({
      submissionId: submission.id,
      status: submission.status,
      score: submission.score,
      feedback: submission.feedback,
      autoGraded: grade.autoGraded,
    });
  } catch (err) {
    logger.error("stage_answer_failed", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
