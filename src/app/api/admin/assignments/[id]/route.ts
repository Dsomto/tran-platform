import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { recordAudit, auditMetaFromRequest } from "@/lib/audit";

// Detail view for one assignment — full submissions list + analytics.
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        submissions: {
          include: {
            intern: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true },
                },
              },
            },
          },
          orderBy: { submittedAt: "desc" },
        },
      },
    });

    if (!assignment) {
      return Response.json({ error: "Assignment not found" }, { status: 404 });
    }

    const eligible = await prisma.intern.count({
      where: { isActive: true, currentStage: assignment.stage },
    });

    const counts = {
      total: assignment.submissions.length,
      pending: 0,
      submitted: 0,
      graded: 0,
      late: 0,
      passing: 0,
      failing: 0,
    };
    for (const s of assignment.submissions) {
      if (s.status === "PENDING") counts.pending++;
      else if (s.status === "SUBMITTED") counts.submitted++;
      else if (s.status === "GRADED") counts.graded++;
      else if (s.status === "LATE") counts.late++;
      if (
        assignment.passingScore != null &&
        typeof s.score === "number"
      ) {
        if (s.score >= assignment.passingScore) counts.passing++;
        else counts.failing++;
      }
    }

    return Response.json({
      assignment: {
        id: assignment.id,
        order: assignment.order,
        title: assignment.title,
        description: assignment.description,
        stage: assignment.stage,
        track: assignment.track,
        kind: assignment.kind,
        widget: assignment.widget,
        dueDate: assignment.dueDate ? assignment.dueDate.toISOString() : null,
        maxPoints: assignment.maxPoints,
        passingScore: assignment.passingScore,
        isClosed: assignment.isClosed,
        closedAt: assignment.closedAt ? assignment.closedAt.toISOString() : null,
        publishedAt: assignment.publishedAt ? assignment.publishedAt.toISOString() : null,
      },
      analytics: {
        eligible,
        ...counts,
      },
      submissions: assignment.submissions.map((s) => ({
        id: s.id,
        internId: s.internId,
        internName: `${s.intern.user.firstName} ${s.intern.user.lastName}`.trim(),
        internEmail: s.intern.user.email,
        status: s.status,
        score: s.score,
        feedback: s.feedback,
        submittedAt: s.submittedAt ? s.submittedAt.toISOString() : null,
        gradedAt: s.gradedAt ? s.gradedAt.toISOString() : null,
      })),
    });
  } catch (err) {
    logger.error("admin_assignment_detail_failed", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH — update deadline, passingScore, isClosed on a single assignment.
// Setting isClosed=true stamps closedAt. Setting passingScore stamps
// publishedAt on first set.
export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await request.json().catch(() => ({}));

    const data: Record<string, unknown> = {};
    const changes: Record<string, unknown> = {};

    if ("dueDate" in body) {
      if (body.dueDate === null || body.dueDate === "") {
        data.dueDate = null;
        changes.dueDate = null;
      } else {
        const d = new Date(body.dueDate);
        if (isNaN(d.getTime())) {
          return Response.json({ error: "Invalid dueDate" }, { status: 400 });
        }
        data.dueDate = d;
        changes.dueDate = d.toISOString();
      }
    }

    if ("isClosed" in body) {
      const v = Boolean(body.isClosed);
      data.isClosed = v;
      data.closedAt = v ? new Date() : null;
      changes.isClosed = v;
    }

    if ("passingScore" in body) {
      if (body.passingScore === null) {
        data.passingScore = null;
        data.publishedAt = null;
        changes.passingScore = null;
      } else {
        const n = Number(body.passingScore);
        if (!Number.isFinite(n) || n < 0 || n > 100) {
          return Response.json(
            { error: "passingScore must be 0-100" },
            { status: 400 }
          );
        }
        data.passingScore = Math.round(n);
        // Only stamp publishedAt on first publish; don't move it on edits.
        const existing = await prisma.assignment.findUnique({
          where: { id },
          select: { publishedAt: true },
        });
        if (!existing?.publishedAt) data.publishedAt = new Date();
        changes.passingScore = Math.round(n);
      }
    }

    if (Object.keys(data).length === 0) {
      return Response.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.assignment.update({
      where: { id },
      data,
    });

    await recordAudit({
      actor: admin,
      action: "assignment.update",
      targetType: "OTHER",
      targetId: id,
      details: { changes },
      ...auditMetaFromRequest(request),
    });

    return Response.json({
      assignment: {
        id: updated.id,
        dueDate: updated.dueDate ? updated.dueDate.toISOString() : null,
        isClosed: updated.isClosed,
        passingScore: updated.passingScore,
        closedAt: updated.closedAt ? updated.closedAt.toISOString() : null,
        publishedAt: updated.publishedAt ? updated.publishedAt.toISOString() : null,
      },
    });
  } catch (err) {
    logger.error("admin_assignment_update_failed", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
