import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isGrader } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { MAX_ACTIVE_CLAIMS_PER_GRADER } from "@/lib/grading";

// Two-grader flow: each report receives up to 2 ReportGrade rows.
// Claim succeeds only if all of these hold:
//   (a) report is SUBMITTED or UNDER_REVIEW
//   (b) fewer than 2 graders have already claimed
//   (c) this grader has not already claimed it
//   (d) this grader has not skipped it for conflict-of-interest
//   (e) this grader has fewer than MAX_ACTIVE_CLAIMS_PER_GRADER open claims
export async function POST(
  _req: NextRequest,
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
      include: { grades: true },
    });
    if (!report) return Response.json({ error: "Report not found" }, { status: 404 });

    if (report.status !== "SUBMITTED" && report.status !== "UNDER_REVIEW") {
      return Response.json(
        { error: `Report is not claimable (status: ${report.status})` },
        { status: 409 }
      );
    }
    if (report.grades.some((g) => g.graderId === session!.id)) {
      return Response.json({ error: "You have already claimed this report" }, { status: 409 });
    }
    if (report.grades.length >= 2) {
      return Response.json({ error: "This report already has two graders" }, { status: 409 });
    }
    if (report.skippedByGraderIds.includes(session!.id)) {
      return Response.json(
        { error: "You marked this report as a conflict of interest. Another grader will pick it up." },
        { status: 409 }
      );
    }

    const openClaims = await prisma.reportGrade.count({
      where: { graderId: session!.id, gradedAt: null },
    });
    if (openClaims >= MAX_ACTIVE_CLAIMS_PER_GRADER) {
      return Response.json(
        {
          error: `You already have ${openClaims} open claims. Finish or release one before taking a new report (cap: ${MAX_ACTIVE_CLAIMS_PER_GRADER}).`,
        },
        { status: 409 }
      );
    }

    try {
      await prisma.reportGrade.create({
        data: { reportId: report.id, graderId: session!.id },
      });
    } catch {
      return Response.json({ error: "Report is no longer claimable" }, { status: 409 });
    }

    await prisma.stageReport.update({
      where: { id: report.id },
      data: {
        status: "UNDER_REVIEW",
        graderId: report.graderId ?? session!.id,
        claimedAt: report.claimedAt ?? new Date(),
      },
    });

    const fresh = await prisma.stageReport.findUnique({
      where: { id },
      include: {
        grades: true,
        intern: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
      },
    });

    return Response.json({ report: fresh });
  } catch (error) {
    logger.error("claim_report_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Release a claim (drops this grader's row). If no grades remain, the report
// returns to SUBMITTED so it re-enters the open queue.
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!isGrader(session)) {
      return new Response(null, { status: 404 });
    }

    const { id } = await ctx.params;

    const grade = await prisma.reportGrade.findUnique({
      where: { reportId_graderId: { reportId: id, graderId: session!.id } },
    });
    if (!grade) {
      return Response.json({ error: "You do not hold this claim" }, { status: 409 });
    }
    if (grade.gradedAt) {
      return Response.json({ error: "Cannot release a grade that has already been submitted" }, { status: 409 });
    }

    await prisma.reportGrade.delete({ where: { id: grade.id } });

    const remaining = await prisma.reportGrade.findMany({
      where: { reportId: id },
      orderBy: { createdAt: "asc" },
    });

    await prisma.stageReport.update({
      where: { id },
      data: {
        status: remaining.length === 0 ? "SUBMITTED" : "UNDER_REVIEW",
        graderId: remaining[0]?.graderId ?? null,
        claimedAt: remaining[0]?.claimedAt ?? null,
      },
    });

    return Response.json({ ok: true });
  } catch (error) {
    logger.error("release_report_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
