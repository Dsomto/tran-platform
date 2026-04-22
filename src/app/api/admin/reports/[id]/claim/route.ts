import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isGrader } from "@/lib/auth";
import { logger } from "@/lib/logger";

// Atomic claim: only succeeds if the report is still SUBMITTED with no grader.
// Prevents two graders from picking up the same report.
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!isGrader(session)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await ctx.params;

    const result = await prisma.stageReport.updateMany({
      where: { id, status: "SUBMITTED", graderId: null },
      data: {
        status: "UNDER_REVIEW",
        graderId: session!.id,
        claimedAt: new Date(),
      },
    });

    if (result.count === 0) {
      return Response.json(
        { error: "Report is no longer claimable (already taken or not submitted)" },
        { status: 409 }
      );
    }

    const report = await prisma.stageReport.findUnique({
      where: { id },
      include: {
        intern: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
      },
    });

    return Response.json({ report });
  } catch (error) {
    logger.error("claim_report_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Release a claim without grading (returns report to the queue).
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!isGrader(session)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await ctx.params;

    const result = await prisma.stageReport.updateMany({
      where: { id, graderId: session!.id, status: "UNDER_REVIEW" },
      data: { status: "SUBMITTED", graderId: null, claimedAt: null },
    });

    if (result.count === 0) {
      return Response.json({ error: "You do not hold this claim" }, { status: 409 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    logger.error("release_report_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
