import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { rateLimit, rateLimitResponse, getClientKey, RATE_LIMITS } from "@/lib/rate-limit";
import { stageRank } from "@/lib/stage-login";

class ConcurrentSubmissionError extends Error {}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

    const rl = await rateLimit(getClientKey(req, session.id), RATE_LIMITS.reportWrite);
    if (!rl.ok) return rateLimitResponse(rl);

    const { id } = await ctx.params;
    const intern = await prisma.intern.findUnique({ where: { userId: session.id } });
    if (!intern) return Response.json({ error: "Intern profile not found" }, { status: 404 });
    if (!intern.isActive) {
      return Response.json({ error: "Account is inactive" }, { status: 403 });
    }

    const report = await prisma.stageReport.findUnique({ where: { id } });
    if (!report) return Response.json({ error: "Report not found" }, { status: 404 });
    if (report.internId !== intern.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    // Reject submissions for stages the intern has not reached. The draft
    // could have been created before currentStage was reset (or via the old,
    // ungated POST), so we guard at submit too.
    if (stageRank(report.stage) > stageRank(intern.currentStage)) {
      return Response.json(
        { error: "You have not reached this stage yet" },
        { status: 403 }
      );
    }

    // Terminal states cannot be re-submitted. A FAILED report means the stage
    // decision is final (elimination), so it is locked just like PASSED.
    if (report.status === "PASSED" || report.status === "FAILED") {
      return Response.json(
        { error: "This stage report has already been decided and can no longer be re-submitted" },
        { status: 409 }
      );
    }

    // Stage status check — admin must have it OPEN for submissions.
    const window = await prisma.stageWindow.findUnique({
      where: { stage: report.stage },
    });
    if (!window || window.status !== "OPEN") {
      return Response.json(
        { error: "This stage is not currently accepting submissions" },
        { status: 409 }
      );
    }

    if (!report.executiveSummary?.trim() || !report.reportUrl?.trim()) {
      return Response.json(
        { error: "Executive summary and report link are required before submitting" },
        { status: 400 }
      );
    }

    const wasSubmitted = report.submittedAt !== null;
    const maxAdvancedSubmissions =
      report.stage === "STAGE_8" || report.stage === "STAGE_9"
        ? 1
        : report.stage === "STAGE_5" || report.stage === "STAGE_6" || report.stage === "STAGE_7"
          ? 2
          : null;
    if (wasSubmitted && maxAdvancedSubmissions !== null && report.version >= maxAdvancedSubmissions) {
      return Response.json(
        {
          error: maxAdvancedSubmissions === 1
            ? "This Advanced project permits one submission and no revisions."
            : "The single revision allowed for this Advanced project has already been used.",
        },
        { status: 409 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const claimed = await tx.stageReport.updateMany({
        where: {
          id: report.id,
          version: report.version,
          status: report.status,
          submittedAt: report.submittedAt,
        },
        data: {
          status: "SUBMITTED",
          submittedAt: new Date(),
          version: wasSubmitted ? report.version + 1 : report.version,
          // Clear grader lock and previous grade on resubmit so it re-enters the queue.
          graderId: null,
          claimedAt: null,
          score: null,
          finalScore: null,
          terminalScore: null,
          feedback: null,
          gradedAt: null,
          divergent: false,
          qaVerified: null,
          qaVerifiedAt: null,
          qaVerifiedById: null,
        },
      });

      if (claimed.count !== 1) throw new ConcurrentSubmissionError();
      if (wasSubmitted) {
        await tx.reportGrade.deleteMany({ where: { reportId: report.id } });
      }
      return tx.stageReport.findUniqueOrThrow({ where: { id: report.id } });
    });

    return Response.json({ report: updated });
  } catch (error) {
    if (error instanceof ConcurrentSubmissionError) {
      return Response.json(
        { error: "This report changed while it was being submitted. Refresh and try again." },
        { status: 409 }
      );
    }
    // Log details server-side; never leak Prisma error names to the user.
    logger.error("submit_report_failed", error);
    return Response.json(
      { error: "Could not submit your report. Please try again." },
      { status: 500 }
    );
  }
}
