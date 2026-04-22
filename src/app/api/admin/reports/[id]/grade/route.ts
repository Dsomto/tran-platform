import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isGrader } from "@/lib/auth";
import { logger } from "@/lib/logger";

// Grader records score + feedback. No pass/fail decision happens here.
// Status moves to GRADED. The admin later bulk-publishes stage results
// by setting a passing threshold — that action is what promotes or fails
// interns and queues the result email.
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!isGrader(session)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
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

    const report = await prisma.stageReport.findUnique({ where: { id } });
    if (!report) return Response.json({ error: "Report not found" }, { status: 404 });

    const isAdmin = session!.role === "ADMIN" || session!.role === "SUPER_ADMIN";
    if (!isAdmin && report.graderId !== session!.id) {
      return Response.json({ error: "You did not claim this report" }, { status: 403 });
    }
    if (
      report.status !== "UNDER_REVIEW" &&
      report.status !== "SUBMITTED" &&
      report.status !== "GRADED"
    ) {
      return Response.json(
        { error: `Cannot grade a report in status ${report.status}` },
        { status: 409 }
      );
    }

    const updated = await prisma.stageReport.update({
      where: { id: report.id },
      data: {
        status: "GRADED",
        score: intScore,
        feedback: feedback.trim(),
        gradedAt: new Date(),
        graderId: report.graderId ?? session!.id,
      },
    });

    return Response.json({ report: updated });
  } catch (error) {
    logger.error("grade_report_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
