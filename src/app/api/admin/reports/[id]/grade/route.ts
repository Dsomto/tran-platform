import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isGrader } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { recordAudit, auditMetaFromRequest } from "@/lib/audit";
import { combineFeedback, isDivergent, averageScore } from "@/lib/grading";

// Two-grader flow: this grader fills in their own ReportGrade row.
//
// When both grader rows are filled:
//   - if the scores differ by more than DIVERGENCE_THRESHOLD, the report is
//     flagged divergent and stays UNDER_REVIEW for super-admin tiebreak.
//   - otherwise, the average score and combined feedback are written onto
//     StageReport and status flips to GRADED.
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!isGrader(session)) {
      return new Response(null, { status: 404 });
    }

    const { id } = await ctx.params;
    const body = await request.json();
    const { score, feedback } = body ?? {};

    if (typeof score !== "number" || !Number.isFinite(score)) {
      return Response.json({ error: "Score must be a number" }, { status: 400 });
    }
    const intScore = Math.round(score);
    if (intScore < 0 || intScore > 100) {
      return Response.json({ error: "Score must be between 0 and 100" }, { status: 400 });
    }
    if (typeof feedback !== "string" || !feedback.trim()) {
      return Response.json({ error: "Feedback is required" }, { status: 400 });
    }
    if (feedback.length > 10000) {
      return Response.json({ error: "Feedback too long (max 10,000 chars)" }, { status: 400 });
    }

    const report = await prisma.stageReport.findUnique({
      where: { id },
      include: { grades: { orderBy: { createdAt: "asc" } } },
    });
    if (!report) return Response.json({ error: "Report not found" }, { status: 404 });

    const isSuper = session!.role === "SUPER_ADMIN";
    const myGrade = report.grades.find((g) => g.graderId === session!.id);

    if (!myGrade && !isSuper) {
      return Response.json({ error: "You did not claim this report" }, { status: 403 });
    }
    if (report.grades.length >= 2 && !myGrade) {
      return Response.json({ error: "This report already has two graders" }, { status: 409 });
    }
    if (report.status !== "UNDER_REVIEW" && report.status !== "SUBMITTED") {
      return Response.json(
        { error: `Cannot grade a report in status ${report.status}` },
        { status: 409 }
      );
    }

    const trimmedFeedback = feedback.trim();
    const nowGrade = myGrade
      ? await prisma.reportGrade.update({
          where: { id: myGrade.id },
          data: { score: intScore, feedback: trimmedFeedback, gradedAt: new Date() },
        })
      : await prisma.reportGrade.create({
          data: {
            reportId: report.id,
            graderId: session!.id,
            score: intScore,
            feedback: trimmedFeedback,
            gradedAt: new Date(),
          },
        });

    const allGrades = await prisma.reportGrade.findMany({
      where: { reportId: report.id },
      orderBy: { createdAt: "asc" },
    });
    const submittedGrades = allGrades.filter(
      (g) => g.score !== null && g.score !== undefined && g.feedback
    );
    const bothInPlace = allGrades.length === 2 && submittedGrades.length === 2;

    let updated = report;
    let divergent = false;
    if (bothInPlace) {
      const [a, b] = submittedGrades;
      divergent = isDivergent(a.score!, b.score!);
      if (divergent) {
        updated = await prisma.stageReport.update({
          where: { id: report.id },
          data: { divergent: true, status: "UNDER_REVIEW" },
          include: { grades: true },
        }) as never;
      } else {
        updated = await prisma.stageReport.update({
          where: { id: report.id },
          data: {
            status: "GRADED",
            score: averageScore(submittedGrades.map((g) => g.score!)),
            feedback: combineFeedback(
              submittedGrades.map((g) => ({ score: g.score!, feedback: g.feedback! }))
            ),
            gradedAt: new Date(),
            divergent: false,
          },
          include: { grades: true },
        }) as never;
      }
    }

    await recordAudit({
      actor: session!,
      action: "report.grade",
      targetType: "REPORT",
      targetId: report.id,
      details: {
        stage: report.stage,
        score: intScore,
        feedbackLength: trimmedFeedback.length,
        internId: report.internId,
        bothInPlace,
        divergent,
        gradeRowId: nowGrade.id,
      },
      ...auditMetaFromRequest(request),
    });

    return Response.json({
      report: updated,
      bothInPlace,
      divergent,
      gradesSoFar: allGrades.length,
    });
  } catch (error) {
    logger.error("grade_report_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
