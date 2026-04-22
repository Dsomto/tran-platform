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
    const { internIds } = await request.json();

    if (!internIds || !Array.isArray(internIds) || internIds.length === 0) {
      return Response.json({ error: "internIds array is required" }, { status: 400 });
    }

    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) {
      return Response.json({ error: "Team not found" }, { status: 404 });
    }

    await prisma.intern.updateMany({
      where: { id: { in: internIds } },
      data: { teamId: id },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Add team members error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
