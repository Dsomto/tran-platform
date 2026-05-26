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
    // Bound the batch and only accept strings so we don't shovel arbitrary
    // payload shapes into the DB.
    if (internIds.length > 500) {
      return Response.json({ error: "Maximum 500 interns per request" }, { status: 400 });
    }
    const cleanIds = internIds.filter((x: unknown): x is string => typeof x === "string");

    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) {
      return Response.json({ error: "Team not found" }, { status: 404 });
    }

    // Resolve which IDs are real interns before any write. This closes the
    // unconstrained-write IDOR (mass-assigning random object IDs to a team)
    // and lets us tell the caller exactly which IDs were ignored.
    const existing = await prisma.intern.findMany({
      where: { id: { in: cleanIds } },
      select: { id: true },
    });
    const existingIds = existing.map((i) => i.id);
    const unknownIds = cleanIds.filter((id: string) => !existingIds.includes(id));

    if (existingIds.length === 0) {
      return Response.json(
        { error: "None of the supplied internIds match a real intern." },
        { status: 400 }
      );
    }

    const result = await prisma.intern.updateMany({
      where: { id: { in: existingIds } },
      data: { teamId: id },
    });

    return Response.json({
      success: true,
      assigned: result.count,
      ignored: unknownIds,
    });
  } catch (error) {
    console.error("Add team members error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
