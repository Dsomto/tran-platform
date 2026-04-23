import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/logger";

// Returns every assignment with submission counts attached — so the admin
// list page can show "X started, Y submitted" without a separate query
// per row.
export async function GET() {
  try {
    await requireAdmin();

    const assignments = await prisma.assignment.findMany({
      orderBy: [{ stage: "asc" }, { order: "asc" }, { title: "asc" }],
      include: {
        _count: { select: { submissions: true } },
      },
    });

    // Status counts per assignment (submitted / graded / late).
    const statusGrouped = await prisma.submission.groupBy({
      by: ["assignmentId", "status"],
      _count: { _all: true },
    });
    const statusByAssignment = new Map<string, Record<string, number>>();
    for (const row of statusGrouped) {
      const key = row.assignmentId;
      const existing = statusByAssignment.get(key) ?? {};
      existing[row.status] = row._count._all;
      statusByAssignment.set(key, existing);
    }

    // Total active interns per stage (denominator for "how many eligible").
    const eligibleGrouped = await prisma.intern.groupBy({
      by: ["currentStage"],
      where: { isActive: true },
      _count: { _all: true },
    });
    const eligibleByStage = new Map<string, number>();
    for (const row of eligibleGrouped) {
      eligibleByStage.set(row.currentStage, row._count._all);
    }

    const result = assignments.map((a) => {
      const counts = statusByAssignment.get(a.id) ?? {};
      const submitted = (counts.SUBMITTED ?? 0) + (counts.LATE ?? 0);
      const graded = counts.GRADED ?? 0;
      const pending = counts.PENDING ?? 0;
      const total = a._count.submissions;
      return {
        id: a.id,
        order: a.order,
        title: a.title,
        stage: a.stage,
        track: a.track,
        kind: a.kind,
        dueDate: a.dueDate ? a.dueDate.toISOString() : null,
        maxPoints: a.maxPoints,
        passingScore: a.passingScore,
        isClosed: a.isClosed,
        closedAt: a.closedAt ? a.closedAt.toISOString() : null,
        publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
        // Analytics
        eligible: eligibleByStage.get(a.stage) ?? 0,
        started: total,           // any submission row exists at all
        submitted,
        graded,
        pending,
      };
    });

    return Response.json({ assignments: result });
  } catch (err) {
    logger.error("admin_assignments_analytics_list_failed", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
