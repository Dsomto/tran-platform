import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "individual";
    const limit = parseInt(url.searchParams.get("limit") || "50");

    if (type === "team") {
      const teams = await prisma.team.findMany({
        include: {
          _count: { select: { members: true } },
        },
        orderBy: { totalPoints: "desc" },
        take: limit,
      });

      return Response.json({
        leaderboard: teams.map((team, i) => ({
          rank: i + 1,
          id: team.id,
          name: team.name,
          points: team.totalPoints,
          memberCount: team._count.members,
        })),
      });
    }

    // Individual leaderboard
    const interns = await prisma.intern.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        team: { select: { name: true } },
      },
      orderBy: { points: "desc" },
      take: limit,
    });

    return Response.json({
      leaderboard: interns.map((intern, i) => ({
        rank: i + 1,
        id: intern.id,
        name: `${intern.user.firstName} ${intern.user.lastName}`,
        avatarUrl: intern.user.avatarUrl,
        points: intern.points,
        stage: intern.currentStage,
        track: intern.track,
        team: intern.team?.name || null,
      })),
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
