import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isGrader } from "@/lib/auth";
import { logger } from "@/lib/logger";

// Two-grader queue logic, with skips and divergence:
//  - "queue":   reports needing a grader (fewer than 2 graders, this grader
//                is not on the report, and this grader has not skipped it).
//                FIFO by submittedAt.
//  - "mine":    reports where this grader has an unfinished ReportGrade row.
//  - "tiebreak": reports flagged divergent (super-admins only).
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!isGrader(session)) {
      return new Response(null, { status: 404 });
    }

    const url = new URL(request.url);
    const stageFilter = url.searchParams.get("stage");
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20") || 20));

    const baseWhere = stageFilter ? { stage: stageFilter as never } : {};

    const candidates = await prisma.stageReport.findMany({
      where: {
        ...baseWhere,
        status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
        submittedAt: { not: null },
        divergent: false,
      },
      orderBy: { submittedAt: "asc" },
      include: {
        grades: { select: { graderId: true } },
        intern: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
      take: limit * 4,
    });

    const claimable = candidates.filter(
      (r) =>
        r.grades.length < 2 &&
        !r.grades.some((g) => g.graderId === session!.id) &&
        !r.skippedByGraderIds.includes(session!.id)
    );
    const queue = claimable.slice(0, limit);

    const mineRows = await prisma.reportGrade.findMany({
      where: {
        graderId: session!.id,
        gradedAt: null,
        ...(stageFilter ? { report: { stage: stageFilter as never } } : {}),
      },
      orderBy: { claimedAt: "asc" },
      include: {
        report: {
          include: {
            grades: { select: { graderId: true } },
            intern: {
              select: {
                id: true,
                user: { select: { firstName: true, lastName: true, email: true } },
              },
            },
          },
        },
      },
    });
    const mine = mineRows.map((g) => g.report);

    const isSuper = session!.role === "SUPER_ADMIN";
    const tiebreak = isSuper
      ? await prisma.stageReport.findMany({
          where: { ...baseWhere, divergent: true },
          orderBy: { updatedAt: "asc" },
          include: {
            grades: { orderBy: { createdAt: "asc" } },
            intern: {
              select: {
                id: true,
                user: { select: { firstName: true, lastName: true, email: true } },
              },
            },
          },
        })
      : [];

    return Response.json({
      queue,
      mine,
      tiebreak,
      pendingCount: claimable.length,
    });
  } catch (error) {
    logger.error("grader_queue_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
