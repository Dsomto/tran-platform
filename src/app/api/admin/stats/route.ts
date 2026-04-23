import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return new Response(null, { status: 404 });
    }

    const [
      totalInterns,
      activeInterns,
      pendingApplications,
      totalTeams,
      totalAssignments,
      stageDistribution,
      trackDistribution,
    ] = await Promise.all([
      prisma.intern.count(),
      prisma.intern.count({ where: { isActive: true } }),
      prisma.application.count({ where: { status: "PENDING" } }),
      prisma.team.count(),
      prisma.assignment.count(),
      prisma.intern.groupBy({
        by: ["currentStage"],
        _count: { id: true },
        where: { isActive: true },
      }),
      prisma.intern.groupBy({
        by: ["track"],
        _count: { id: true },
        where: { isActive: true },
      }),
    ]);

    return Response.json({
      totalInterns,
      activeInterns,
      pendingApplications,
      totalTeams,
      totalAssignments,
      stageDistribution: stageDistribution.map((s) => ({
        stage: s.currentStage,
        count: s._count.id,
      })),
      trackDistribution: trackDistribution.map((t) => ({
        track: t.track,
        count: t._count.id,
      })),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
