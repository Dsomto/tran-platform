import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Delete a team. Super-admin only. Members are NOT deleted — their teamId is
// cleared so they become unassigned and can be placed on another team.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }

    const { id } = await params;
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) {
      return Response.json({ error: "Team not found" }, { status: 404 });
    }

    // Un-assign members first so no Intern is left pointing at a deleted team.
    await prisma.intern.updateMany({
      where: { teamId: id },
      data: { teamId: null },
    });
    await prisma.team.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete team error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
