import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";

const MAX_PAGE_SIZE = 100;

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(request.url);
    const stage = url.searchParams.get("stage");
    const track = url.searchParams.get("track");
    const teamId = url.searchParams.get("teamId");
    const q = url.searchParams.get("q")?.trim();
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1") || 1);
    const rawLimit = parseInt(url.searchParams.get("limit") || "50") || 50;
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, rawLimit));

    const where: Record<string, unknown> = { isActive: true };
    if (stage) where.currentStage = stage;
    if (track) where.track = track;
    if (teamId) where.teamId = teamId;
    if (q && q.length > 0) {
      // Search across the linked User's firstName, lastName, email.
      where.user = {
        is: {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
      };
    }

    const [interns, total] = await Promise.all([
      prisma.intern.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
          team: { select: { id: true, name: true } },
        },
        orderBy: { points: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.intern.count({ where }),
    ]);

    return Response.json({
      interns,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error("get_interns_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
