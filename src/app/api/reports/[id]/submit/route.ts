import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { rateLimit, rateLimitResponse, getClientKey, RATE_LIMITS } from "@/lib/rate-limit";

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

    const report = await prisma.stageReport.findUnique({ where: { id } });
    if (!report) return Response.json({ error: "Report not found" }, { status: 404 });
    if (report.internId !== intern.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Terminal states cannot be re-submitted.
    if (report.status === "PASSED") {
      return Response.json(
        { error: "This stage has already been passed" },
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

    // Bump version on resubmit (anything that was already SUBMITTED/UNDER_REVIEW/FAILED).
    const isResubmit =
      report.status === "SUBMITTED" ||
      report.status === "UNDER_REVIEW" ||
      report.status === "FAILED";

    const updated = await prisma.stageReport.update({
      where: { id: report.id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        version: isResubmit ? report.version + 1 : report.version,
        // Clear grader lock and previous grade on resubmit so it re-enters the queue.
        graderId: null,
        claimedAt: null,
        score: null,
        feedback: null,
        gradedAt: null,
      },
    });

    return Response.json({ report: updated });
  } catch (error) {
    logger.error("submit_report_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
