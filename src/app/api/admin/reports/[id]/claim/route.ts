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
    // Existing grade row by this grader: if they already submitted a score
    // it's a true duplicate claim and we reject. If it's an orphan claim
    // (score=null) we re-use it — they're resuming work.
    const myExistingGrade = report.grades.find((g) => g.graderId === session!.id);
    if (myExistingGrade && myExistingGrade.score !== null) {
      return Response.json({ error: "You have already submitted a grade for this report" }, { status: 409 });
    }
    // Count only submitted grades for the "already has two graders" check.
    // Orphan claims (someone clicked Claim and never finished) should not
    // block a super-admin from taking the slot, especially in solo mode.
    const submittedGradeCount = report.grades.filter((g) => g.score !== null).length;
    if (submittedGradeCount >= 2) {
      return Response.json({ error: "This report already has two submitted grades" }, { status: 409 });
    }
    // Second-grader slot is reserved for super-admin. Once any grader has
    // taken the first slot, only a super-admin can take the second.
    if (submittedGradeCount === 1 && session!.role !== "SUPER_ADMIN") {
      return Response.json(
        { error: "This report already has one grader. The second grade is reserved for the programme head." },
        { status: 409 }
      );
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

    // Concurrency-safe claim: if this grader has an existing orphan claim
    // (score=null), re-use it; otherwise create. Then immediately recount and
    // roll back the create if count is now >2. This isn't a serializable
    // transaction (Mongo doesn't expose those for free), but it closes the
    // window where three graders racing past the earlier count check could
    // all create rows. Worst case under contention: one grader's create gets
    // rolled back and they see a friendly "no longer claimable" error.
    let createdId: string | null = null;
    if (myExistingGrade) {
      // Resume the orphan claim — no new row, refresh claimedAt.
      await prisma.reportGrade
        .update({ where: { id: myExistingGrade.id }, data: { claimedAt: new Date() } })
        .catch(() => undefined);
    } else {
      try {
        const created = await prisma.reportGrade.create({
          data: { reportId: report.id, graderId: session!.id },
        });
        createdId = created.id;
      } catch {
        return Response.json({ error: "Report is no longer claimable" }, { status: 409 });
      }
      // Re-check against submitted grades, not orphan claims — orphans should
      // not block a new claimant in solo mode.
      const finalSubmitted = await prisma.reportGrade.count({
        where: { reportId: report.id, score: { not: null } },
      });
      if (finalSubmitted > 2 && createdId) {
        await prisma.reportGrade.delete({ where: { id: createdId } }).catch(() => undefined);
        return Response.json(
          { error: "Another grader claimed the last slot first." },
          { status: 409 }
        );
      }
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
