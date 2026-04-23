import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isGrader } from "@/lib/auth";
import { logger } from "@/lib/logger";

// Grader queue. Shows:
//  - unclaimed SUBMITTED reports (FIFO by submittedAt), limited
//  - UNDER_REVIEW reports claimed by this grader (their "in progress" tray)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!isGrader(session)) {
      // 404 instead of 403 — don't leak that this endpoint exists.
      return new Response(null, { status: 404 });
    }

    const url = new URL(request.url);
    const stageFilter = url.searchParams.get("stage");
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20") || 20));

    const baseWhere = stageFilter ? { stage: stageFilter as never } : {};

    const [queue, mine] = await Promise.all([
      prisma.stageReport.findMany({
        where: { ...baseWhere, status: "SUBMITTED", graderId: null },
        orderBy: { submittedAt: "asc" },
        take: limit,
        include: {
          intern: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true, email: true } },
            },
          },
        },
      }),
      prisma.stageReport.findMany({
        where: { ...baseWhere, status: "UNDER_REVIEW", graderId: session!.id },
        orderBy: { claimedAt: "asc" },
        include: {
          intern: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true, email: true } },
            },
          },
        },
      }),
    ]);

    const pendingCount = await prisma.stageReport.count({
      where: { ...baseWhere, status: "SUBMITTED", graderId: null },
    });

    return Response.json({ queue, mine, pendingCount });
  } catch (error) {
    logger.error("grader_queue_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
