import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { recordAudit, auditMetaFromRequest } from "@/lib/audit";

// Super-admin tiebreak. When two graders' scores diverge by more than the
// threshold, the report sits in UNDER_REVIEW with divergent=true. A super
// admin reviews both grades and writes the final score + feedback here.
// This is the only path that resolves a divergent report.
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdmin();

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
    if (!report.divergent) {
      return Response.json(
        { error: "This report is not flagged for tiebreak." },
        { status: 409 }
      );
    }

    const updated = await prisma.stageReport.update({
      where: { id },
      data: {
        status: "GRADED",
        score: intScore,
        feedback: feedback.trim(),
        gradedAt: new Date(),
        divergent: false,
      },
    });

    await recordAudit({
      actor: session,
      action: "report.tiebreak",
      targetType: "REPORT",
      targetId: id,
      details: {
        stage: report.stage,
        internId: report.internId,
        finalScore: intScore,
      },
      ...auditMetaFromRequest(request),
    });

    return Response.json({ report: updated });
  } catch (error) {
    logger.error("tiebreak_report_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
