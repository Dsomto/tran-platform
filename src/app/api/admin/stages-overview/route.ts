import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/logger";

// Stage-level overview for /admin/assignments.
// One row per stage: deadline, passing score, intern counts, submission funnel.
const STAGES = [
  "STAGE_0",
  "STAGE_1",
  "STAGE_2",
  "STAGE_3",
  "STAGE_4",
] as const;

export async function GET() {
  try {
    await requireAdmin();

    const [windows, internCounts, reportCounts] = await Promise.all([
      prisma.stageWindow.findMany({
        where: { stage: { in: STAGES as unknown as string[] } as never },
      }),
      prisma.intern.groupBy({
        by: ["currentStage"],
        where: { isActive: true },
        _count: { _all: true },
      }),
      prisma.stageReport.groupBy({
        by: ["stage", "status"],
        _count: { _all: true },
      }),
    ]);

    const windowByStage = new Map(windows.map((w) => [w.stage, w]));
    const internCountByStage = new Map(
      internCounts.map((r) => [r.currentStage, r._count._all])
    );

    // Build a per-stage status tally.
    const statusByStage = new Map<string, Record<string, number>>();
    for (const row of reportCounts) {
      const s = String(row.stage);
      const tally = statusByStage.get(s) ?? {};
      tally[row.status] = row._count._all;
      statusByStage.set(s, tally);
    }

    const now = Date.now();
    const rows = STAGES.map((stage) => {
      const w = windowByStage.get(stage as never);
      const tally = statusByStage.get(stage) ?? {};
      const submitted = (tally.SUBMITTED ?? 0) + (tally.UNDER_REVIEW ?? 0);
      const graded = tally.GRADED ?? 0;
      const passed = tally.PASSED ?? 0;
      const failed = tally.FAILED ?? 0;

      // An admin "close" is represented by submitUntil being in the past.
      const isClosed = w ? new Date(w.submitUntil).getTime() < now : false;

      return {
        stage,
        label: `Stage ${stage.replace("STAGE_", "")}`,
        activeFrom: w?.activeFrom.toISOString() ?? null,
        submitUntil: w?.submitUntil.toISOString() ?? null,
        passingScore: w?.passingScore ?? null,
        isClosed,
        atStage: internCountByStage.get(stage) ?? 0,
        submitted,
        graded,
        passed,
        failed,
      };
    });

    return Response.json({ stages: rows });
  } catch (err) {
    logger.error("stages_overview_failed", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
