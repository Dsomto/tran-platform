import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }

    const { id } = await params;
    const { points, reason } = await request.json();

    if (!points || !reason) {
      return Response.json(
        { error: "Points and reason are required" },
        { status: 400 }
      );
    }

    const intern = await prisma.intern.findUnique({ where: { id } });
    if (!intern) {
      return Response.json({ error: "Intern not found" }, { status: 404 });
    }

    const [updated] = await Promise.all([
      prisma.intern.update({
        where: { id },
        data: { points: { increment: points } },
      }),
      prisma.pointLog.create({
        data: {
          internId: id,
          points,
          reason,
          awardedBy: session.id,
        },
      }),
      // Update team points if intern is in a team
      intern.teamId
        ? prisma.team.update({
            where: { id: intern.teamId },
            data: { totalPoints: { increment: points } },
          })
        : Promise.resolve(),
    ]);

    return Response.json({ intern: updated });
  } catch (error) {
    console.error("Points error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
