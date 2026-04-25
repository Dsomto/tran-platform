import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { recordAudit, auditMetaFromRequest } from "@/lib/audit";
import { STALE_CLAIM_HOURS } from "@/lib/grading";

// Super-admin action: drop any ReportGrade row that has been claimed but not
// graded for more than STALE_CLAIM_HOURS. The slot returns to the queue so
// another grader can pick it up. Reports left with zero grades flip back to
// SUBMITTED. This protects against graders who claim and disappear.
export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperAdmin();

    const cutoff = new Date(Date.now() - STALE_CLAIM_HOURS * 60 * 60 * 1000);

    const stale = await prisma.reportGrade.findMany({
      where: { gradedAt: null, claimedAt: { lt: cutoff } },
      select: { id: true, reportId: true, graderId: true },
    });

    if (stale.length === 0) {
      return Response.json({ released: 0, reportsTouched: 0 });
    }

    await prisma.reportGrade.deleteMany({
      where: { id: { in: stale.map((s) => s.id) } },
    });

    const reportIds = Array.from(new Set(stale.map((s) => s.reportId)));
    let touched = 0;
    for (const reportId of reportIds) {
      const remaining = await prisma.reportGrade.findMany({
        where: { reportId },
        orderBy: { createdAt: "asc" },
      });
      await prisma.stageReport.update({
        where: { id: reportId },
        data: {
          status: remaining.length === 0 ? "SUBMITTED" : "UNDER_REVIEW",
          graderId: remaining[0]?.graderId ?? null,
          claimedAt: remaining[0]?.claimedAt ?? null,
        },
      });
      touched += 1;
    }

    await recordAudit({
      actor: session,
      action: "report.release_stale",
      targetType: "OTHER",
      targetId: "stale-release",
      details: {
        cutoffHours: STALE_CLAIM_HOURS,
        releasedClaims: stale.length,
        reportsTouched: touched,
      },
      ...auditMetaFromRequest(request),
    });

    return Response.json({ released: stale.length, reportsTouched: touched });
  } catch (error) {
    logger.error("release_stale_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
