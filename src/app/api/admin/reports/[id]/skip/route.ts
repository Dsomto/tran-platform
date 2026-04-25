import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isGrader } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { recordAudit, auditMetaFromRequest } from "@/lib/audit";

// Conflict-of-interest skip. The grader marks a report as one they cannot
// review fairly (e.g. they personally know the intern). The report is
// removed from this grader's queue permanently and another grader picks it
// up. We never expose who skipped — only that someone did.
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

    const report = await prisma.stageReport.findUnique({
      where: { id },
      include: { grades: { select: { graderId: true, gradedAt: true } } },
    });
    if (!report) return Response.json({ error: "Report not found" }, { status: 404 });

    // If this grader already submitted a grade, skipping doesn't make sense.
    const myGrade = report.grades.find((g) => g.graderId === session!.id);
    if (myGrade?.gradedAt) {
      return Response.json(
        { error: "You have already graded this report; skip no longer applies." },
        { status: 409 }
      );
    }

    if (report.skippedByGraderIds.includes(session!.id)) {
      return Response.json({ ok: true, alreadySkipped: true });
    }

    // If the grader had an open (unsubmitted) claim, drop it before adding
    // the skip flag so the slot is freed for someone else.
    if (myGrade && !myGrade.gradedAt) {
      await prisma.reportGrade.delete({
        where: { reportId_graderId: { reportId: id, graderId: session!.id } },
      });
    }

    await prisma.stageReport.update({
      where: { id },
      data: {
        skippedByGraderIds: { push: session!.id },
      },
    });

    // Recompute parent status if dropping the claim left zero grades.
    const remaining = await prisma.reportGrade.findMany({
      where: { reportId: id },
      orderBy: { createdAt: "asc" },
    });
    if (myGrade && !myGrade.gradedAt) {
      await prisma.stageReport.update({
        where: { id },
        data: {
          status: remaining.length === 0 ? "SUBMITTED" : "UNDER_REVIEW",
          graderId: remaining[0]?.graderId ?? null,
          claimedAt: remaining[0]?.claimedAt ?? null,
        },
      });
    }

    await recordAudit({
      actor: session!,
      action: "report.skip",
      targetType: "REPORT",
      targetId: id,
      details: { stage: report.stage, internId: report.internId },
      ...auditMetaFromRequest(request),
    });

    return Response.json({ ok: true });
  } catch (error) {
    logger.error("skip_report_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
