import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { sendGradeNotification } from "@/lib/email";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const rawScore = body.score;
    const feedback: string | null = typeof body.feedback === "string" ? body.feedback.trim() : null;

    const score = typeof rawScore === "number" ? rawScore : parseInt(rawScore);
    if (!Number.isFinite(score) || score < 0) {
      return Response.json({ error: "score must be a non-negative number" }, { status: 400 });
    }

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        assignment: { select: { title: true, maxPoints: true } },
        intern: { include: { user: { select: { email: true, firstName: true } } } },
      },
    });
    if (!submission) {
      return Response.json({ error: "Submission not found" }, { status: 404 });
    }
    if (score > submission.assignment.maxPoints) {
      return Response.json(
        { error: `score cannot exceed maxPoints (${submission.assignment.maxPoints})` },
        { status: 400 }
      );
    }

    const updated = await prisma.submission.update({
      where: { id },
      data: {
        score,
        feedback,
        status: "GRADED",
        gradedAt: new Date(),
      },
    });

    // Award points to the intern (scored portion). Uses a PointLog for audit.
    await prisma.intern.update({
      where: { id: submission.internId },
      data: { points: { increment: score } },
    });
    await prisma.pointLog.create({
      data: {
        internId: submission.internId,
        points: score,
        reason: `Graded: ${submission.assignment.title}`,
        awardedBy: session.id,
      },
    });

    sendGradeNotification(
      submission.intern.user.email,
      submission.intern.user.firstName,
      submission.assignment.title,
      score,
      submission.assignment.maxPoints,
      feedback
    ).catch((err) =>
      logger.error("grade_notification_failed", err, {
        email: submission.intern.user.email,
        submissionId: id,
      })
    );

    return Response.json({ submission: updated });
  } catch (error) {
    logger.error("grade_submission_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
