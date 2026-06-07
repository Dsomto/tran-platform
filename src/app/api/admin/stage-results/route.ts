import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { certificateUrl } from "@/lib/certificate-link";
import { recordAudit, auditMetaFromRequest } from "@/lib/audit";
import { stageTerminalScores, combinedFinalScore } from "@/lib/stage-score";
import { Prisma } from "@/generated/prisma";

const STAGE_KEYS = [
  "STAGE_0",
  "STAGE_1",
  "STAGE_2",
  "STAGE_3",
  "STAGE_4",
  "STAGE_5",
  "STAGE_6",
  "STAGE_7",
  "STAGE_8",
  "STAGE_9",
] as const;
type StageKey = (typeof STAGE_KEYS)[number];
function isStageKey(v: unknown): v is StageKey {
  return typeof v === "string" && (STAGE_KEYS as readonly string[]).includes(v);
}

type PendingRow = {
  reportId: string;
  internId: string;
  fullName: string;
  email: string;
  reportScore: number;
  terminalScore: number | null;
  finalScore: number;
  feedback: string | null;
  reportUrl: string | null;
  qaVerified: boolean;
  qaVerifiedAt: string | null;
};

// GET: summarise the state of a stage's reports — status counts + score distribution.
// Used by /admin/stage-results to show what will happen if a given threshold is applied.
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin();
    const url = new URL(request.url);
    const stage = url.searchParams.get("stage");
    if (!isStageKey(stage)) {
      return Response.json({ error: "Invalid stage" }, { status: 400 });
    }

    const reports = await prisma.stageReport.findMany({
      where: { stage },
      select: { id: true, status: true, score: true, divergent: true },
    });

    const byStatus: Record<string, number> = {};
    const scores: number[] = [];
    let divergentCount = 0;
    for (const r of reports) {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      if (r.divergent) divergentCount++;
      if (r.status === "GRADED" && typeof r.score === "number") scores.push(r.score);
    }
    scores.sort((a, b) => a - b);

    const summary = {
      total: reports.length,
      byStatus,
      // Reports stuck waiting for super-admin tiebreak. Surfaced separately so
      // the admin notices them before publishing — publishing while divergent
      // reports exist would silently exclude those interns from the result email.
      divergentPending: divergentCount,
      graded: scores.length,
      min: scores[0] ?? null,
      max: scores[scores.length - 1] ?? null,
      median: scores.length ? scores[Math.floor(scores.length / 2)] : null,
      mean:
        scores.length > 0
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
          : null,
      // Buckets of 10.
      histogram: bucketHistogram(scores),
    };

    // Persisted pending buckets (post-cutoff) — drives the two-tab review UI.
    const pendingReports = await prisma.stageReport.findMany({
      where: { stage, status: { in: ["PENDING_PROMOTION", "PENDING_ELIMINATION"] } },
      select: {
        id: true,
        status: true,
        score: true,
        terminalScore: true,
        finalScore: true,
        feedback: true,
        reportUrl: true,
        qaVerified: true,
        qaVerifiedAt: true,
        intern: {
          select: { id: true, user: { select: { firstName: true, lastName: true, email: true } } },
        },
      },
      orderBy: { finalScore: "desc" },
    });
    let pending: { cutoff: number | null; promotion: PendingRow[]; elimination: PendingRow[] } | null =
      null;
    if (pendingReports.length > 0) {
      const win = await prisma.stageWindow.findUnique({
        where: { stage },
        select: { passingScore: true },
      });
      const toRow = (r: (typeof pendingReports)[number]): PendingRow => ({
        reportId: r.id,
        internId: r.intern.id,
        fullName: `${r.intern.user.firstName} ${r.intern.user.lastName}`.trim(),
        email: r.intern.user.email,
        reportScore: r.score ?? 0,
        terminalScore: r.terminalScore,
        finalScore: r.finalScore ?? 0,
        feedback: r.feedback,
        reportUrl: r.reportUrl,
        qaVerified: r.qaVerified === true,
        qaVerifiedAt: r.qaVerifiedAt ? r.qaVerifiedAt.toISOString() : null,
      });
      pending = {
        cutoff: win?.passingScore ?? null,
        promotion: pendingReports.filter((r) => r.status === "PENDING_PROMOTION").map(toRow),
        elimination: pendingReports.filter((r) => r.status === "PENDING_ELIMINATION").map(toRow),
      };
    }

    // Optional named-buckets mode: when `?threshold=N` is provided we also
    // return who would PASS and who would FAIL by name + score. Used by the
    // /admin/stage-results "review before publish" view, so the super-admin
    // can swap individuals between the two buckets before committing.
    const thresholdParam = url.searchParams.get("threshold");
    const t = thresholdParam !== null ? Number(thresholdParam) : NaN;
    if (Number.isFinite(t) && t >= 0 && t <= 100) {
      const graded = await prisma.stageReport.findMany({
        where: { stage, status: "GRADED" },
        select: {
          id: true,
          score: true,
          intern: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true, email: true } },
            },
          },
        },
        orderBy: { score: "desc" },
      });
      const willPass: { reportId: string; internId: string; fullName: string; email: string; score: number }[] = [];
      const willFail: typeof willPass = [];
      for (const r of graded) {
        const row = {
          reportId: r.id,
          internId: r.intern.id,
          fullName: `${r.intern.user.firstName} ${r.intern.user.lastName}`.trim(),
          email: r.intern.user.email,
          score: r.score ?? 0,
        };
        if ((r.score ?? 0) >= t) willPass.push(row);
        else willFail.push(row);
      }
      return Response.json({ stage, summary, pending, buckets: { threshold: t, willPass, willFail } });
    }

    return Response.json({ stage, summary, pending });
  } catch (error) {
    logger.error("stage_results_summary_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: stage-results action dispatcher.
//
// All publishing flows through the audited cutoff -> pending -> swap -> finalize
// path. The legacy direct-publish branch (POST with no `action` field, which
// used report.score instead of the 0.8*report + 0.2*terminal% combined score,
// and skipped the pending review step) has been removed — it gave a different
// outcome for the same intern depending on which path the admin hit.
export async function POST(request: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    const body = await request.json();

    if (body?.action === "reset") {
      return await handleReset(request, admin, body);
    }
    if (body?.action === "apply-cutoff") {
      return await handleApplyCutoff(request, admin, body);
    }
    if (body?.action === "swap") {
      return await handleSwap(request, admin, body);
    }
    if (body?.action === "update-score") {
      return await handleUpdateScore(request, admin, body);
    }
    if (body?.action === "toggle-qa-verified") {
      return await handleToggleQaVerified(request, admin, body);
    }
    if (body?.action === "finalize") {
      return await handleFinalize(request, admin, body);
    }

    return Response.json(
      {
        error:
          "Unknown action. Use action='apply-cutoff' | 'swap' | 'update-score' | 'toggle-qa-verified' | 'finalize' | 'reset'. The legacy direct-publish path was removed; publishing goes through the cutoff/pending/finalize flow on /admin/stage-results.",
      },
      { status: 400 }
    );
  } catch (error) {
    logger.error("stage_results_dispatch_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Reset a published stage so it can be published again.
//
// Always: reverts this stage's PASSED / FAILED reports back to GRADED, and
// deletes result emails for this stage that are still PENDING in the queue
// (so a re-publish doesn't double-email anyone — already-sent emails stand).
//
// moveInternsBack=true also regresses interns the publish promoted: anyone
// still sitting at the next stage with a PASSED report here is moved back,
// and the publish's stage-history rows are removed. Interns who already
// progressed beyond the next stage are left untouched.
async function handleReset(
  request: NextRequest,
  admin: Awaited<ReturnType<typeof requireSuperAdmin>>,
  body: { stage?: unknown; moveInternsBack?: unknown }
): Promise<Response> {
  const stage = body.stage;
  if (!isStageKey(stage)) {
    return Response.json({ error: "Invalid stage" }, { status: 400 });
  }
  const moveInternsBack = body.moveInternsBack === true;

  const published = await prisma.stageReport.findMany({
    where: { stage, status: { in: ["PASSED", "FAILED"] } },
    select: { id: true, status: true, internId: true },
  });
  if (published.length === 0) {
    return Response.json(
      { error: "Nothing to reset — this stage has no published results." },
      { status: 409 }
    );
  }

  // 1. Revert report statuses so the stage can be re-published.
  await prisma.stageReport.updateMany({
    where: { stage, status: { in: ["PASSED", "FAILED"] } },
    data: { status: "GRADED" },
  });

  // 2. Drop result emails for this stage still waiting to send. We filter by
  // `kind` AND the subject prefix written by handleFinalize. MongoDB+Prisma
  // doesn't expose nested-JSON `path` filters, so we cannot match on
  // context.stage directly. KEEP THIS IN SYNC with the subject format in
  // handleFinalize ("Stage N — …"); changing the format there without
  // updating this query will leave a re-publish double-emailing anyone.
  const stageNum = stage.replace("STAGE_", "");
  const cancelled = await prisma.emailQueueItem.deleteMany({
    where: {
      kind: { in: ["STAGE_PASSED", "STAGE_FAILED"] },
      status: "PENDING",
      subject: { startsWith: `Stage ${stageNum} ` },
    },
  });

  // 3. Optionally move promoted interns back to this stage.
  let internsMovedBack = 0;
  if (moveInternsBack) {
    const nextStage = `STAGE_${Number(stageNum) + 1}`;
    if (isStageKey(nextStage)) {
      const passedInternIds = published
        .filter((r) => r.status === "PASSED")
        .map((r) => r.internId);
      const moved = await prisma.intern.updateMany({
        where: { id: { in: passedInternIds }, currentStage: nextStage },
        data: { currentStage: stage },
      });
      internsMovedBack = moved.count;
      await prisma.stageHistory.deleteMany({
        where: {
          internId: { in: passedInternIds },
          fromStage: stage,
          toStage: nextStage,
          promotedBy: "stage-publish",
        },
      });
    }
  }

  await recordAudit({
    actor: admin,
    action: "stage-results.reset",
    targetType: "STAGE_RESULTS",
    targetId: stage,
    details: {
      stage,
      reportsReverted: published.length,
      internsMovedBack,
      emailsCancelled: cancelled.count,
      moveInternsBack,
    },
    ...auditMetaFromRequest(request),
  });

  return Response.json({
    reset: true,
    reportsReverted: published.length,
    internsMovedBack,
    emailsCancelled: cancelled.count,
  });
}

// Apply a cutoff: sort newly graded reports for the stage into a pending bucket
// based on the combined final score (0.8*report + 0.2*terminal%). Existing
// pending rows are preserved so score edits, feedback edits, and manual pass/fail
// swaps made in Result Review persist while admins add newly graded people.
async function handleApplyCutoff(
  request: NextRequest,
  admin: Awaited<ReturnType<typeof requireSuperAdmin>>,
  body: { stage?: unknown; passingScore?: unknown }
): Promise<Response> {
  const stage = body.stage;
  if (!isStageKey(stage)) {
    return Response.json({ error: "Invalid stage" }, { status: 400 });
  }
  const threshold = Number(body.passingScore);
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
    return Response.json({ error: "passingScore must be 0-100" }, { status: 400 });
  }

  const divergentPending = await prisma.stageReport.count({
    where: { stage, divergent: true },
  });
  if (divergentPending > 0) {
    return Response.json(
      {
        error: `${divergentPending} report${divergentPending === 1 ? "" : "s"} for this stage still need a tiebreak. Resolve those before applying a cutoff.`,
        divergentPending,
      },
      { status: 409 }
    );
  }

  const existingPending = await prisma.stageReport.findMany({
    where: { stage, status: { in: ["PENDING_PROMOTION", "PENDING_ELIMINATION"] } },
    select: { id: true, status: true },
  });

  const reports = await prisma.stageReport.findMany({
    where: { stage, status: "GRADED" },
    select: { id: true, internId: true, score: true, status: true },
  });
  if (reports.length === 0 && existingPending.length === 0) {
    return Response.json({ error: "No graded reports to sort for this stage" }, { status: 409 });
  }

  const { maxPoints, earnedByIntern } = await stageTerminalScores(stage);
  const round = Math.round(threshold);
  let pendingPromotion = existingPending.filter((r) => r.status === "PENDING_PROMOTION").length;
  let pendingElimination = existingPending.filter((r) => r.status === "PENDING_ELIMINATION").length;

  for (const r of reports) {
    const terminalPct =
      maxPoints > 0 ? Math.round(((earnedByIntern.get(r.internId) ?? 0) / maxPoints) * 100) : null;
    const finalScore = combinedFinalScore(r.score, terminalPct);
    const newStatus = finalScore >= round ? "PENDING_PROMOTION" : "PENDING_ELIMINATION";
    await prisma.stageReport.update({
      where: { id: r.id },
      data: { status: newStatus, terminalScore: terminalPct, finalScore },
    });
    if (newStatus === "PENDING_PROMOTION") pendingPromotion++;
    else pendingElimination++;
  }

  await prisma.stageWindow.upsert({
    where: { stage },
    create: { stage, passingScore: round, cutoffAppliedAt: new Date(), cutoffById: admin.id },
    update: { passingScore: round, cutoffAppliedAt: new Date(), cutoffById: admin.id },
  });

  await recordAudit({
    actor: admin,
    action: "stage-results.apply-cutoff",
    targetType: "STAGE_RESULTS",
    targetId: stage,
    details: {
      stage,
      threshold: round,
      pendingPromotion,
      pendingElimination,
      newlySorted: reports.length,
      preservedPending: existingPending.length,
    },
    ...auditMetaFromRequest(request),
  });

  return Response.json({
    applied: true,
    threshold: round,
    pendingPromotion,
    pendingElimination,
    newlySorted: reports.length,
    preservedPending: existingPending.length,
  });
}

// Swap one intern between the two pending buckets. Logged to StageDecisionLog.
async function handleSwap(
  request: NextRequest,
  admin: Awaited<ReturnType<typeof requireSuperAdmin>>,
  body: { stage?: unknown; internId?: unknown; reportId?: unknown; to?: unknown; reason?: unknown }
): Promise<Response> {
  const to = body.to;
  if (to !== "promote" && to !== "eliminate") {
    return Response.json({ error: "to must be 'promote' or 'eliminate'" }, { status: 400 });
  }
  const target = to === "promote" ? "PENDING_PROMOTION" : "PENDING_ELIMINATION";

  const report =
    typeof body.reportId === "string"
      ? await prisma.stageReport.findUnique({
          where: { id: body.reportId },
          select: { id: true, internId: true, stage: true, status: true },
        })
      : isStageKey(body.stage) && typeof body.internId === "string"
        ? await prisma.stageReport.findUnique({
            where: { internId_stage: { internId: body.internId, stage: body.stage } },
            select: { id: true, internId: true, stage: true, status: true },
          })
        : null;

  if (!report) {
    return Response.json({ error: "Report not found" }, { status: 404 });
  }
  if (report.status !== "PENDING_PROMOTION" && report.status !== "PENDING_ELIMINATION") {
    return Response.json(
      { error: "This report is not in a pending state. Apply a cutoff first." },
      { status: 409 }
    );
  }
  if (report.status === target) {
    return Response.json({ swapped: false, alreadyThere: true, status: target });
  }

  const reason = typeof body.reason === "string" ? body.reason.slice(0, 500) : null;
  await prisma.$transaction([
    prisma.stageReport.update({ where: { id: report.id }, data: { status: target } }),
    prisma.stageDecisionLog.create({
      data: {
        internId: report.internId,
        stage: report.stage,
        reportId: report.id,
        fromStatus: report.status,
        toStatus: target,
        actorId: admin.id,
        reason,
      },
    }),
  ]);

  await recordAudit({
    actor: admin,
    action: "stage-results.swap",
    targetType: "STAGE_RESULTS",
    targetId: report.stage,
    details: { internId: report.internId, reportId: report.id, from: report.status, to: target, reason },
    ...auditMetaFromRequest(request),
  });

  return Response.json({ swapped: true, status: target });
}

// Update a pending report's score (and optionally its feedback). Recomputes
// the combined final score against the current StageWindow cutoff and re-buckets
// the report into PENDING_PROMOTION / PENDING_ELIMINATION accordingly. Logged
// to StageDecisionLog when the new score flips the bucket, so the audit trail
// names the score change as the cause.
async function handleUpdateScore(
  request: NextRequest,
  admin: Awaited<ReturnType<typeof requireSuperAdmin>>,
  body: { reportId?: unknown; score?: unknown; feedback?: unknown; reason?: unknown }
): Promise<Response> {
  if (typeof body.reportId !== "string") {
    return Response.json({ error: "reportId is required" }, { status: 400 });
  }
  const newScore = Number(body.score);
  if (!Number.isFinite(newScore) || newScore < 0 || newScore > 100) {
    return Response.json({ error: "score must be 0-100" }, { status: 400 });
  }
  const newFeedback =
    typeof body.feedback === "string" ? body.feedback : undefined;
  const reason =
    typeof body.reason === "string" ? body.reason.slice(0, 500) : null;

  const report = await prisma.stageReport.findUnique({
    where: { id: body.reportId },
    select: {
      id: true,
      internId: true,
      stage: true,
      status: true,
      score: true,
      feedback: true,
      terminalScore: true,
    },
  });
  if (!report) {
    return Response.json({ error: "Report not found" }, { status: 404 });
  }
  if (
    report.status !== "PENDING_PROMOTION" &&
    report.status !== "PENDING_ELIMINATION"
  ) {
    return Response.json(
      { error: "This report is not in a pending state. Apply a cutoff first." },
      { status: 409 }
    );
  }

  const round = Math.round(newScore);
  const win = await prisma.stageWindow.findUnique({
    where: { stage: report.stage },
    select: { passingScore: true },
  });
  const cutoff = win?.passingScore ?? 0;
  const finalScore = combinedFinalScore(round, report.terminalScore);
  const newStatus =
    finalScore >= cutoff ? "PENDING_PROMOTION" : "PENDING_ELIMINATION";

  const flipped = newStatus !== report.status;
  const ops: Prisma.PrismaPromise<unknown>[] = [
    prisma.stageReport.update({
      where: { id: report.id },
      data: {
        score: round,
        finalScore,
        status: newStatus,
        ...(newFeedback !== undefined ? { feedback: newFeedback } : {}),
      },
    }),
  ];
  if (flipped) {
    ops.push(
      prisma.stageDecisionLog.create({
        data: {
          internId: report.internId,
          stage: report.stage,
          reportId: report.id,
          fromStatus: report.status,
          toStatus: newStatus,
          actorId: admin.id,
          reason: reason ?? `Score updated to ${round} (final ${finalScore}, cutoff ${cutoff}).`,
        },
      })
    );
  }
  await prisma.$transaction(ops);

  await recordAudit({
    actor: admin,
    action: "stage-results.update-score",
    targetType: "STAGE_RESULTS",
    targetId: report.stage,
    details: {
      reportId: report.id,
      internId: report.internId,
      previousScore: report.score,
      newScore: round,
      finalScore,
      previousStatus: report.status,
      newStatus,
      feedbackChanged: newFeedback !== undefined && newFeedback !== report.feedback,
      reason,
    },
    ...auditMetaFromRequest(request),
  });

  return Response.json({
    updated: true,
    reportId: report.id,
    score: round,
    finalScore,
    status: newStatus,
    flipped,
  });
}

async function handleToggleQaVerified(
  request: NextRequest,
  admin: Awaited<ReturnType<typeof requireSuperAdmin>>,
  body: { reportId?: unknown; verified?: unknown }
): Promise<Response> {
  if (typeof body.reportId !== "string") {
    return Response.json({ error: "reportId is required" }, { status: 400 });
  }
  if (typeof body.verified !== "boolean") {
    return Response.json({ error: "verified must be true or false" }, { status: 400 });
  }

  const report = await prisma.stageReport.findUnique({
    where: { id: body.reportId },
    select: { id: true, internId: true, stage: true, status: true, qaVerified: true },
  });
  if (!report) {
    return Response.json({ error: "Report not found" }, { status: 404 });
  }
  if (report.status !== "PENDING_PROMOTION" && report.status !== "PENDING_ELIMINATION") {
    return Response.json(
      { error: "QA verification is only available while results are pending review." },
      { status: 409 }
    );
  }

  const verifiedAt = body.verified ? new Date() : null;
  await prisma.stageReport.update({
    where: { id: report.id },
    data: {
      qaVerified: body.verified,
      qaVerifiedAt: verifiedAt,
      qaVerifiedById: body.verified ? admin.id : null,
    },
  });

  await recordAudit({
    actor: admin,
    action: body.verified ? "stage-results.qa-verify" : "stage-results.qa-unverify",
    targetType: "STAGE_RESULTS",
    targetId: report.stage,
    details: {
      reportId: report.id,
      internId: report.internId,
      previousQaVerified: report.qaVerified === true,
      qaVerified: body.verified,
    },
    ...auditMetaFromRequest(request),
  });

  return Response.json({
    updated: true,
    reportId: report.id,
    qaVerified: body.verified,
    qaVerifiedAt: verifiedAt ? verifiedAt.toISOString() : null,
  });
}

// Finalize: commit the pending buckets. Promotions → PASSED + advance stage +
// congrats email; eliminations → FAILED + eliminate (isActive=false) + email.
// Each intern is committed in its own transaction (status change + email queued
// together), so a mid-run failure never drops a mail and re-running finalizes
// only whoever is still pending — no double-sends.
async function handleFinalize(
  request: NextRequest,
  admin: Awaited<ReturnType<typeof requireSuperAdmin>>,
  body: { stage?: unknown }
): Promise<Response> {
  const stage = body.stage;
  if (!isStageKey(stage)) {
    return Response.json({ error: "Invalid stage" }, { status: 400 });
  }

  const pending = await prisma.stageReport.findMany({
    where: { stage, status: { in: ["PENDING_PROMOTION", "PENDING_ELIMINATION"] } },
    include: { intern: { include: { user: true } } },
  });
  if (pending.length === 0) {
    return Response.json(
      { error: "Nothing pending to finalize. Apply a cutoff first." },
      { status: 409 }
    );
  }

  const window = await prisma.stageWindow.findUnique({ where: { stage } });
  const threshold = window?.passingScore ?? 0;
  const stageNum = stage.replace("STAGE_", "");
  const nextStage = `STAGE_${Number(stageNum) + 1}` as StageKey;
  const origin = process.env.PUBLIC_APP_URL || "https://ubuntubridgeinitiatives.org";
  const slackUrl = process.env.SLACK_CHANNEL_URL || "";

  let promoted = 0;
  let eliminated = 0;
  for (const r of pending) {
    const score = r.finalScore ?? r.score ?? 0;
    if (r.status === "PENDING_PROMOTION") {
      const certUrl = certificateUrl({ origin, reportId: r.id, internId: r.intern.id });
      const ops: Prisma.PrismaPromise<unknown>[] = [
        prisma.stageReport.update({ where: { id: r.id }, data: { status: "PASSED" } }),
        prisma.emailQueueItem.create({
          data: {
            userId: r.intern.user.id,
            toEmail: r.intern.user.email,
            kind: "STAGE_PASSED",
            subject: `Stage ${stageNum} — You've made it`,
            body: renderResultEmail({
              firstName: r.intern.user.firstName,
              stageNumber: stageNum,
              passed: true,
              score,
              feedback: r.feedback ?? "",
              passingScore: threshold,
              certUrl,
              slackUrl,
            }),
            context: {
              reportId: r.id,
              stage,
              finalScore: r.finalScore,
              reportScore: r.score,
              terminalScore: r.terminalScore,
              passingScore: threshold,
              certUrl,
            },
          },
        }),
      ];
      // Advance only if still on this stage (don't regress someone already
      // ahead). STAGE_4 promotion is the foundation graduation — no STAGE_5
      // Room exists, so don't move currentStage; flip `Intern.finalist`
      // instead so the dashboard / downstream selection can recognise them.
      if (stage === "STAGE_4") {
        ops.push(
          prisma.intern.update({ where: { id: r.intern.id }, data: { finalist: true } }),
          prisma.stageHistory.create({
            data: {
              internId: r.intern.id,
              fromStage: stage,
              toStage: stage,
              promotedBy: "stage-finalize",
              reason: `Graduated foundation (final ${score}, cutoff ${threshold})`,
            },
          })
        );
      } else if (isStageKey(nextStage) && r.intern.currentStage === stage) {
        ops.push(
          prisma.intern.update({ where: { id: r.intern.id }, data: { currentStage: nextStage } }),
          prisma.stageHistory.create({
            data: {
              internId: r.intern.id,
              fromStage: stage,
              toStage: nextStage,
              promotedBy: "stage-finalize",
              reason: `Promoted with final ${score} (cutoff ${threshold})`,
            },
          })
        );
      }
      await prisma.$transaction(ops);
      promoted++;
    } else {
      // PENDING_ELIMINATION → FAILED + eliminate (terminal). Phase 4 will swap
      // in the alumni-community / device-pitch email content.
      await prisma.$transaction([
        prisma.stageReport.update({ where: { id: r.id }, data: { status: "FAILED" } }),
        prisma.intern.update({
          where: { id: r.intern.id },
          data: { isActive: false, eliminatedAt: new Date() },
        }),
        prisma.emailQueueItem.create({
          data: {
            userId: r.intern.user.id,
            toEmail: r.intern.user.email,
            kind: "STAGE_FAILED",
            subject: `Stage ${stageNum} — Your results`,
            body: renderResultEmail({
              firstName: r.intern.user.firstName,
              stageNumber: stageNum,
              passed: false,
              score,
              feedback: r.feedback ?? "",
              passingScore: threshold,
              certUrl: null,
              slackUrl,
            }),
            context: {
              reportId: r.id,
              stage,
              finalScore: r.finalScore,
              reportScore: r.score,
              terminalScore: r.terminalScore,
              passingScore: threshold,
            },
          },
        }),
      ]);
      eliminated++;
    }
  }

  await recordAudit({
    actor: admin,
    action: "stage-results.finalize",
    targetType: "STAGE_RESULTS",
    targetId: stage,
    details: { stage, threshold, promoted, eliminated },
    ...auditMetaFromRequest(request),
  });

  return Response.json({ finalized: true, promoted, eliminated, threshold });
}

function bucketHistogram(scores: number[]): { bucket: string; count: number }[] {
  const buckets = [
    "0-9", "10-19", "20-29", "30-39", "40-49",
    "50-59", "60-69", "70-79", "80-89", "90-100",
  ];
  const counts = new Array(10).fill(0);
  for (const s of scores) {
    const idx = Math.min(9, Math.floor(s / 10));
    counts[idx]++;
  }
  return buckets.map((bucket, i) => ({ bucket, count: counts[i] }));
}

function renderResultEmail(opts: {
  firstName: string;
  stageNumber: string;
  passed: boolean;
  score: number;
  feedback: string;
  passingScore: number;
  certUrl: string | null;
  slackUrl: string;
}): string {
  const {
    firstName,
    stageNumber,
    passed,
    score,
    feedback,
    passingScore,
    certUrl,
    slackUrl,
  } = opts;
  const headline = passed
    ? `Congratulations — you've passed Stage ${stageNumber}.`
    : `Your Stage ${stageNumber} results are in.`;
  const cta = passed
    ? `Stage ${Number(stageNumber) + 1} is now open to you. Log in to continue.`
    : `You did not meet the passing threshold for this stage. Your grader's feedback is below.`;
  const safeFeedback = feedback
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");

  const certBlock =
    passed && certUrl
      ? `
        <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:16px;margin:20px 0;text-align:center;">
          <p style="margin:0 0 10px;color:#1E40AF;font-size:14px;font-weight:600;">Your certificate of completion is ready</p>
          <p style="margin:0 0 14px;color:#1E3A8A;font-size:13px;">Download a signed PDF with your name for this stage.</p>
          <a href="${certUrl}" style="display:inline-block;background:#2563EB;color:white;padding:10px 22px;border-radius:9999px;font-size:13px;font-weight:600;text-decoration:none;">
            Download certificate (PDF)
          </a>
        </div>`
      : "";

  const slackBlock =
    passed && slackUrl
      ? `
        <div style="border-top:1px solid #E2E8F0;margin-top:20px;padding-top:20px;">
          <p style="margin:0 0 10px;color:#334155;font-size:14px;">
            <strong>Join the cohort channel.</strong> This is where announcements, mentor office-hours, and cohort help happen.
          </p>
          <a href="${slackUrl}" style="display:inline-block;background:#4A154B;color:white;padding:9px 18px;border-radius:9999px;font-size:13px;font-weight:600;text-decoration:none;">
            Join the Slack channel
          </a>
        </div>`
      : "";

  // For eliminated participants: a warm community note. No links here — the
  // alumni-community / device-pitch details go out in a separate follow-up email.
  const communityBlock = !passed
    ? `
        <div style="border-top:1px solid #E2E8F0;margin-top:20px;padding-top:20px;">
          <p style="margin:0;color:#334155;font-size:14px;line-height:1.7;">
            This isn't the end of the road. You remain part of the UBI community — we'll be in
            touch by email about alumni opportunities, including the chance to pitch for device
            and equipment support. Thank you for the work and effort you put in.
          </p>
        </div>`
    : "";

  return `
    <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#F8FAFC;padding:40px 20px;">
      <div style="background:linear-gradient(135deg,#2563EB,#0891B2);padding:32px;border-radius:16px;text-align:center;color:white;">
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;">UBI</h1>
        <p style="margin:0;font-size:13px;opacity:0.9;">Ubuntu Bridge Initiative</p>
      </div>
      <div style="background:white;padding:32px;border-radius:16px;margin-top:20px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="color:#0F172A;margin:0 0 16px;">Hi ${firstName},</h2>
        <p style="color:#334155;line-height:1.7;margin:0 0 16px;">${headline}</p>
        <div style="background:${passed ? "#F0FDF4" : "#FEF2F2"};border-left:4px solid ${passed ? "#16A34A" : "#DC2626"};padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0;">
          <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.6;">
            <strong>Your score:</strong> ${score} / 100 &nbsp;·&nbsp; <strong>Passing:</strong> ${passingScore}
          </p>
        </div>
        ${certBlock}
        <h3 style="color:#0F172A;margin:24px 0 8px;font-size:16px;">Grader feedback</h3>
        <div style="color:#475569;line-height:1.7;font-size:14px;background:#F8FAFC;border-radius:8px;padding:16px;">${safeFeedback}</div>
        <p style="color:#475569;line-height:1.7;margin:24px 0 0;">${cta}</p>
        ${slackBlock}
        ${communityBlock}
      </div>
      <p style="text-align:center;color:#94A3B8;font-size:12px;margin-top:24px;">
        Ubuntu Bridge Initiative · ubuntubridgeinitiatives.org
      </p>
    </div>
  `;
}

// On Vercel Pro: 5-minute budget. Publishing a cohort of 500 interns fans
// out N email queue inserts + N intern updates + N stage-history rows, all
// in sequence. Easily fits in 300s; the explicit budget stops a long publish
// from hitting the default and getting killed.
export const maxDuration = 300;
