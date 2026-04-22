import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const teams = await prisma.team.findMany({
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: { select: { members: true } },
      },
      orderBy: { totalPoints: "desc" },
    });

    return Response.json({ teams });
  } catch (error) {
    console.error("Get teams error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }

    const { name, description } = await request.json();

    if (!name) {
      return Response.json({ error: "Team name is required" }, { status: 400 });
    }

    const team = await prisma.team.create({
      data: { name, description: description || null },
    });

    return Response.json({ team }, { status: 201 });
  } catch (error) {
    console.error("Create team error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
