import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { certificateUrl, letterUrl, passLetterUrl } from "@/lib/certificate-link";
import { recordAudit, auditMetaFromRequest } from "@/lib/audit";
import { stageTerminalScores, combinedFinalScore } from "@/lib/stage-score";
import { Prisma } from "@/generated/prisma";
import { requireApiSuperAdmin } from "@/lib/api-auth";
import type { SessionUser } from "@/lib/auth";

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
    const auth = await requireApiSuperAdmin();
    if (auth.response) return auth.response;
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
        attachmentUrl: true,
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
        // Some interns left reportUrl blank and uploaded their work via the
        // attachment field instead. Fall back so the review tab still surfaces
        // a clickable link instead of "No submission link".
        reportUrl: r.reportUrl ?? r.attachmentUrl ?? null,
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
    const auth = await requireApiSuperAdmin();
    if (auth.response) return auth.response;
    const admin = auth.session;
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
    if (body?.action === "finalize-non-submitters") {
      return await handleFinalizeNonSubmitters(request, admin, body);
    }

    return Response.json(
      {
        error:
          "Unknown action. Use action='apply-cutoff' | 'swap' | 'update-score' | 'toggle-qa-verified' | 'finalize' | 'finalize-non-submitters' | 'reset'. The legacy direct-publish path was removed; publishing goes through the cutoff/pending/finalize flow on /admin/stage-results.",
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
  admin: SessionUser,
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
  admin: SessionUser,
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
  admin: SessionUser,
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
  admin: SessionUser,
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
  admin: SessionUser,
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

// Process the non-submitter tier — active interns still sitting on this stage
// who never submitted a Stage X capstone at all. They get a softer email
// inviting them to keep coming to town halls + their account is deactivated
// alongside the failed cohort.
//
// Idempotent: re-running checks for an existing pending no-submission email
// from this run (same kind + subject) and skips anyone already queued.
async function handleFinalizeNonSubmitters(
  request: NextRequest,
  admin: SessionUser,
  body: { stage?: unknown }
): Promise<Response> {
  const stage = body.stage;
  if (!isStageKey(stage)) {
    return Response.json({ error: "Invalid stage" }, { status: 400 });
  }
  const stageNum = stage.replace("STAGE_", "");
  const subject = `Stage ${stageNum} — A note on your submission`;

  // Anyone still active on this stage with no StageReport row for the stage.
  const internsOnStage = await prisma.intern.findMany({
    where: { isActive: true, currentStage: stage },
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
  });
  const internIdsWithReport = new Set(
    (await prisma.stageReport.findMany({ where: { stage }, select: { internId: true } })).map(
      (r) => r.internId
    )
  );
  const nonSubmitters = internsOnStage.filter((i) => !internIdsWithReport.has(i.id));

  // Skip anyone already queued the same subject (idempotent re-run).
  const alreadyQueuedUserIds = new Set(
    (
      await prisma.emailQueueItem.findMany({
        where: {
          subject,
          status: { in: ["PENDING", "SENT"] },
          userId: { in: nonSubmitters.map((i) => i.user.id) },
        },
        select: { userId: true },
      })
    )
      .map((e) => e.userId)
      .filter((id): id is string => id !== null)
  );

  let emailed = 0;
  let deactivated = 0;
  for (const intern of nonSubmitters) {
    const skipEmail = alreadyQueuedUserIds.has(intern.user.id);
    const ops: Prisma.PrismaPromise<unknown>[] = [
      prisma.intern.update({
        where: { id: intern.id },
        data: { isActive: false, eliminatedAt: new Date() },
      }),
      // Mirror PublicApplication.stageStatus — auth.ts uses THIS field as
      // the login gate. Without it a non-submitter with a fresh password
      // can still log in until their JWT expires.
      prisma.publicApplication.updateMany({
        where: { email: intern.user.email.toLowerCase() },
        data: { stageStatus: "eliminated" },
      }),
    ];
    if (!skipEmail) {
      ops.push(
        prisma.emailQueueItem.create({
          data: {
            userId: intern.user.id,
            toEmail: intern.user.email,
            kind: "GENERAL",
            subject,
            body: renderNoSubmissionEmail({
              firstName: intern.user.firstName,
              stageNumber: stageNum,
            }),
            context: { stage, reason: "non-submission-deactivation" },
          },
        })
      );
    }
    await prisma.$transaction(ops);
    deactivated++;
    if (!skipEmail) emailed++;
  }

  await recordAudit({
    actor: admin,
    action: "stage-results.finalize-non-submitters",
    targetType: "STAGE_RESULTS",
    targetId: stage,
    details: {
      stage,
      candidates: nonSubmitters.length,
      deactivated,
      emailed,
      skippedAlreadyQueued: alreadyQueuedUserIds.size,
    },
    ...auditMetaFromRequest(request),
  });

  return Response.json({
    finalized: true,
    candidates: nonSubmitters.length,
    deactivated,
    emailed,
    skippedAlreadyQueued: alreadyQueuedUserIds.size,
  });
}

// Finalize: commit the pending buckets. Promotions → PASSED + advance stage +
// congrats email; eliminations → FAILED + eliminate (isActive=false) + email.
// Each intern is committed in its own transaction (status change + email queued
// together), so a mid-run failure never drops a mail and re-running finalizes
// only whoever is still pending — no double-sends.
async function handleFinalize(
  request: NextRequest,
  admin: SessionUser,
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
      const certUrlValue = certificateUrl({ origin, reportId: r.id, internId: r.intern.id });
      const passLetterUrlValue = passLetterUrl({ origin, reportId: r.id, internId: r.intern.id });
      const feedbackUrl = `${origin.replace(/\/$/, "")}/dashboard/reports`;
      const issuedAt = new Date();
      const ops: Prisma.PrismaPromise<unknown>[] = [
        prisma.stageReport.update({
          where: { id: r.id },
          data: { status: "PASSED", finalizedAt: issuedAt },
        }),
        prisma.emailQueueItem.create({
          data: {
            userId: r.intern.user.id,
            toEmail: r.intern.user.email,
            kind: "STAGE_PASSED",
            subject: `You're in. Stage ${Number(stageNum) + 1} opens Monday.`,
            body: renderResultEmail({
              firstName: r.intern.user.firstName,
              stageNumber: stageNum,
              passed: true,
              score,
              passingScore: threshold,
              certUrl: certUrlValue,
              letterPdfUrl: passLetterUrlValue,
              feedbackUrl,
              slackUrl,
              issuedAt,
            }),
            context: {
              reportId: r.id,
              stage,
              finalScore: r.finalScore,
              reportScore: r.score,
              terminalScore: r.terminalScore,
              passingScore: threshold,
              certUrl: certUrlValue,
              passLetterUrl: passLetterUrlValue,
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
      // PENDING_ELIMINATION → FAILED + eliminate (terminal). Email now offers
      // the discontinuation letter (PDF) + a feedback dashboard link. Feedback
      // text itself is no longer inlined in the email.
      const letterPdfUrl = letterUrl({ origin, reportId: r.id, internId: r.intern.id });
      const feedbackUrl = `${origin.replace(/\/$/, "")}/dashboard/reports`;
      const issuedAt = new Date();
      // Credentials wind down 2 days after the result email. This matches the
      // GRACE_MS in scripts/cron/purge-eliminated so the user-facing promise
      // and the actual hard-delete clock are the same. finalizedAt is the
      // single source of truth — both the email and the letter PDF compute
      // effectiveDate from it.
      const effectiveDate = new Date(issuedAt.getTime() + 2 * 24 * 60 * 60 * 1000);
      await prisma.$transaction([
        prisma.stageReport.update({
          where: { id: r.id },
          data: { status: "FAILED", finalizedAt: issuedAt },
        }),
        prisma.intern.update({
          where: { id: r.intern.id },
          data: { isActive: false, eliminatedAt: new Date() },
        }),
        // Mirror PublicApplication.stageStatus — auth.ts uses THIS field as the
        // login-gate signal. Without this mirror an eliminated intern can still
        // sign in with a fresh password until their session expires naturally.
        prisma.publicApplication.updateMany({
          where: { email: r.intern.user.email.toLowerCase() },
          data: { stageStatus: "eliminated" },
        }),
        prisma.emailQueueItem.create({
          data: {
            userId: r.intern.user.id,
            toEmail: r.intern.user.email,
            kind: "STAGE_FAILED",
            subject: `Stage ${stageNum} — your result`,
            body: renderResultEmail({
              firstName: r.intern.user.firstName,
              stageNumber: stageNum,
              passed: false,
              score,
              passingScore: threshold,
              certUrl: null,
              letterPdfUrl,
              feedbackUrl,
              slackUrl,
              issuedAt,
              effectiveDate,
            }),
            context: {
              reportId: r.id,
              stage,
              finalScore: r.finalScore,
              reportScore: r.score,
              terminalScore: r.terminalScore,
              passingScore: threshold,
              letterPdfUrl,
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

// Compute the next Monday from a reference date. Used to say "Stage N opens
// Monday" in result emails — keeps the line correct without hardcoding.
function nextMondayLabel(from: Date): string {
  const d = new Date(from);
  const dow = d.getUTCDay();
  // 1 = Monday. If today is Monday, push to next Monday (7 days) so we don't
  // claim something opens today.
  const delta = dow === 1 ? 7 : (1 - dow + 7) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

// Shared chrome: a clean letterhead with a 6px coloured accent strip,
// readable typography, and a real human sign-off block. Used by every
// programme-office email so they all look like they came from the same desk.
function emailShell(opts: {
  accent: string; // hex, used for the left strip + small accents
  body: string;
  signOff?: string;
}): string {
  const { accent, body, signOff } = opts;
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#F1F5F9;padding:32px 16px;color:#0F172A;">
      <div style="background:white;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,0.06),0 8px 24px rgba(15,23,42,0.06);">
        <div style="display:flex;align-items:stretch;">
          <div style="width:6px;background:${accent};flex-shrink:0;"></div>
          <div style="padding:28px 32px 12px 32px;flex:1;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;color:#64748B;text-transform:uppercase;margin-bottom:2px;">
              Ubuntu Bridge Initiative
            </div>
            <div style="font-size:11px;color:#94A3B8;">Cybersecurity Internship · Cohort 1</div>
          </div>
        </div>
        <div style="padding:8px 32px 32px 38px;">
          ${body}
          ${signOff ?? defaultSignOff()}
        </div>
      </div>
      <p style="text-align:center;color:#94A3B8;font-size:11px;margin:18px 0 0;">
        Sent from the programme office · TRAN, The Root Access Network
      </p>
    </div>
  `;
}

function defaultSignOff(): string {
  return `
    <div style="margin-top:28px;padding-top:20px;border-top:1px solid #E2E8F0;">
      <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.7;">
        — Okoma &amp; Quadri<br/>
        <span style="color:#64748B;font-size:13px;">Programme office, TRAN</span>
      </p>
    </div>`;
}

function ctaButton(href: string, label: string, bg: string): string {
  return `
    <a href="${href}" style="display:inline-block;background:${bg};color:white;padding:11px 24px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.01em;">
      ${label}
    </a>`;
}

// Result email. Feedback is NOT embedded — interns get a link to view it on
// their dashboard. Pass version mentions the Stage N+1 Monday opening, points
// at the cert + Slack. Fail version offers the discontinuation letter and is
// honest about the call.
function renderResultEmail(opts: {
  firstName: string;
  stageNumber: string;
  passed: boolean;
  score: number;
  passingScore: number;
  certUrl: string | null;
  letterPdfUrl: string | null;
  feedbackUrl: string;
  slackUrl: string;
  issuedAt?: Date;
  effectiveDate?: Date;
}): string {
  const {
    firstName,
    stageNumber,
    passed,
    score,
    passingScore,
    certUrl,
    letterPdfUrl,
    feedbackUrl,
    slackUrl,
    issuedAt = new Date(),
    effectiveDate,
  } = opts;
  const nextStageNum = Number(stageNumber) + 1;
  const mondayLabel = nextMondayLabel(issuedAt);

  if (passed) {
    const body = `
      <h1 style="font-size:26px;font-weight:700;line-height:1.25;margin:18px 0 6px;color:#0F172A;">
        You're in, ${firstName}. <br/>
        Stage ${nextStageNum} opens ${mondayLabel}.
      </h1>
      <p style="font-size:15px;line-height:1.65;color:#334155;margin:0 0 22px;">
        Your Stage ${stageNumber} capstone is graded and you made the cohort cutoff.
        The Stage ${nextStageNum} brief drops in your inbox on Sunday evening with the
        reading list and your first exercise. Block out time on Monday afternoon to
        read it properly — Stage ${nextStageNum} moves quicker than Stage ${stageNumber} did.
      </p>

      <div style="display:flex;gap:14px;align-items:baseline;margin:0 0 28px;padding:16px 18px;background:#ECFDF5;border:1px solid #A7F3D0;border-radius:10px;">
        <div style="font-size:34px;font-weight:700;color:#047857;line-height:1;">${score}</div>
        <div style="font-size:13px;color:#065F46;line-height:1.4;">
          <strong>out of 100</strong><br/>
          passing mark was ${passingScore}
        </div>
      </div>

      <p style="font-size:14px;line-height:1.7;color:#334155;margin:0 0 10px;font-weight:600;">
        Two things to do this weekend:
      </p>
      <ol style="font-size:14px;line-height:1.75;color:#334155;margin:0 0 22px;padding-left:20px;">
        <li style="margin-bottom:6px;">
          <strong>Grab your certificate.</strong> It's signed and has a verification
          code on it. Save the PDF; we can reissue if you lose the file.
        </li>
        <li>
          <strong>Join the cohort Slack.</strong> Most of the practical help,
          mentor office hours, and back-and-forth happens there, not on the
          dashboard.
        </li>
      </ol>

      <div style="margin:0 0 18px;">
        ${certUrl ? ctaButton(certUrl, "Download your certificate", "#2563EB") : ""}
        ${slackUrl ? `&nbsp;&nbsp;${ctaButton(slackUrl, "Join the cohort Slack", "#4A154B")}` : ""}
      </div>

      <p style="font-size:13px;line-height:1.6;color:#64748B;margin:24px 0 0;">
        Your reviewer's full notes on the capstone are on your dashboard —
        <a href="${feedbackUrl}" style="color:#2563EB;text-decoration:none;font-weight:600;">open them here</a>.
        Worth reading even though you passed; there are usually one or two
        notes in there you'll want for Stage ${nextStageNum}.
      </p>
    `;
    return emailShell({ accent: "#10B981", body });
  }

  // FAIL — honest, no soft-pedalling, but warm.
  const effectiveLabel = effectiveDate
    ? effectiveDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
    : "";
  const body = `
    <h1 style="font-size:24px;font-weight:700;line-height:1.3;margin:18px 0 6px;color:#0F172A;">
      Hi ${firstName},
    </h1>
    <p style="font-size:15px;line-height:1.65;color:#334155;margin:0 0 18px;">
      We've finished marking your Stage ${stageNumber} submission. You scored ${score}
      against a passing mark of ${passingScore}, so you didn't make this
      cohort's cutoff.
    </p>
    <p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 22px;">
      Saying it plain isn't easy — but it's better than soft-pedalling and
      wasting your time. The reviewer's full notes are on your dashboard.
      Read them if you can. There are usually one or two things in there
      worth knowing regardless of what's next.
    </p>

    <div style="display:flex;gap:14px;align-items:baseline;margin:0 0 22px;padding:16px 18px;background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;">
      <div style="font-size:34px;font-weight:700;color:#B91C1C;line-height:1;">${score}</div>
      <div style="font-size:13px;color:#7F1D1D;line-height:1.4;">
        <strong>out of 100</strong><br/>
        passing mark was ${passingScore}
      </div>
    </div>

    <div style="margin:0 0 22px;padding:18px 20px;background:#F8FAFC;border-radius:10px;">
      <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#0F172A;letter-spacing:0.02em;text-transform:uppercase;">
        What happens now
      </p>
      <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.7;color:#334155;">
        <li style="margin-bottom:6px;">
          Your dashboard credentials wind down ${effectiveLabel ? `on ${effectiveLabel}` : "in two days"}.
          Until then, pull anything you want off — feedback, drafts, references.
        </li>
        <li style="margin-bottom:6px;">
          A formal end-of-programme letter (PDF below) for your records,
          signed by the programme office.
        </li>
        <li>
          You're still on our list for town halls, alumni events, and the
          device-pitch programme. None of that goes away.
        </li>
      </ul>
    </div>

    <div style="margin:0 0 18px;">
      ${letterPdfUrl ? ctaButton(letterPdfUrl, "Download the letter (PDF)", "#0F172A") : ""}
      &nbsp;&nbsp;
      ${ctaButton(feedbackUrl, "Open my reviewer feedback", "#2563EB")}
    </div>

    <p style="font-size:14px;line-height:1.7;color:#334155;margin:24px 0 0;">
      Thank you for the work you put in. Finishing and submitting at all
      puts you ahead of most. Look after yourself.
    </p>
  `;
  return emailShell({ accent: "#DC2626", body });
}

// Soft no-submission email — honest, doesn't lecture, doesn't moralise.
// They didn't show up. We say so, we deactivate the account, we leave the
// door open for the public stuff.
function renderNoSubmissionEmail(opts: {
  firstName: string;
  stageNumber: string;
}): string {
  const { firstName, stageNumber } = opts;
  const body = `
    <h1 style="font-size:24px;font-weight:700;line-height:1.3;margin:18px 0 6px;color:#0F172A;">
      Hi ${firstName},
    </h1>
    <p style="font-size:15px;line-height:1.65;color:#334155;margin:0 0 18px;">
      We didn't receive a Stage ${stageNumber} submission from you before
      the deadline. As a result, your dashboard account will close out as
      part of this cycle's results.
    </p>
    <p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 22px;">
      We get it — life happens, deadlines slip, sometimes the work just
      doesn't come together. We're not here to lecture. One honest note
      though: in any programme like this — anywhere, not just with us —
      putting up the work, even imperfect work, is most of the battle.
      The interns who shipped something half-done are still in the
      programme. Worth remembering for the next thing you apply to,
      wherever that is.
    </p>

    <div style="margin:0 0 22px;padding:18px 20px;background:#F0F9FF;border-left:4px solid #0284C7;border-radius:0 8px 8px 0;">
      <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#0C4A6E;">
        You're still on our list for town halls.
      </p>
      <p style="margin:0;font-size:13px;line-height:1.65;color:#075985;">
        Those are open to anyone who's been part of any cohort. Drop in
        when one comes up — come listen, ask questions, see what people
        are building.
      </p>
    </div>

    <p style="font-size:14px;line-height:1.7;color:#334155;margin:24px 0 0;">
      Thank you for the interest you showed. We hope to see you on the
      other side.
    </p>
  `;
  return emailShell({ accent: "#475569", body });
}

// On Vercel Pro: 5-minute budget. Publishing a cohort of 500 interns fans
// out N email queue inserts + N intern updates + N stage-history rows, all
// in sequence. Easily fits in 300s; the explicit budget stops a long publish
// from hitting the default and getting killed.
export const maxDuration = 300;
