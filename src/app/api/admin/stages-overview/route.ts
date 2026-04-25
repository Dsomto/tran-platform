import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/logger";

// One row per stage. Status, intern access count, submission count.
// No deadlines, no passing-score input — those have been removed from
// the admin UI. Passing score is set at publish-results time only.
const STAGES = ["STAGE_0", "STAGE_1", "STAGE_2", "STAGE_3", "STAGE_4"] as const;

export async function GET() {
  try {
    await requireAdmin();

    const [windows, accessCounts, reportCounts] = await Promise.all([
      prisma.stageWindow.findMany({
        where: { stage: { in: STAGES as unknown as string[] } as never },
      }),
      prisma.stageAccess.groupBy({
        by: ["stage"],
        _count: { _all: true },
      }),
      prisma.stageReport.groupBy({
        by: ["stage", "status"],
        _count: { _all: true },
      }),
    ]);

    const windowByStage = new Map(windows.map((w) => [w.stage, w]));
    const accessByStage = new Map(accessCounts.map((r) => [String(r.stage), r._count._all]));

    const statusByStage = new Map<string, Record<string, number>>();
    for (const row of reportCounts) {
      const s = String(row.stage);
      const tally = statusByStage.get(s) ?? {};
      tally[row.status] = row._count._all;
      statusByStage.set(s, tally);
    }

    const rows = STAGES.map((stage) => {
      const w = windowByStage.get(stage as never);
      const tally = statusByStage.get(stage) ?? {};
      const submitted = (tally.SUBMITTED ?? 0) + (tally.UNDER_REVIEW ?? 0);
      const graded = tally.GRADED ?? 0;
      const passed = tally.PASSED ?? 0;
      const failed = tally.FAILED ?? 0;

      return {
        stage,
        label: `Stage ${stage.replace("STAGE_", "")}`,
        status: w?.status ?? "CLOSED",
        openedAt: w?.openedAt?.toISOString() ?? null,
        accessed: accessByStage.get(stage) ?? 0,
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
