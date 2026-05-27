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

// POST: publish results — bulk promote/fail graded reports based on a threshold.
// Queues a result email for every graded report. Idempotent-ish: re-running
// with the same threshold is safe; re-running with a different threshold
// re-evaluates and enqueues again (so use with care).
export async function POST(request: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    const body = await request.json();

    // Reset: undo a publish so the stage can be re-published.
    if (body?.action === "reset") {
      return await handleReset(request, admin, body);
    }
    // Pending flow: sort graded reports into pending buckets on a cutoff, swap
    // one intern between buckets (logged), or finalize (commit promote/eliminate).
    if (body?.action === "apply-cutoff") {
      return await handleApplyCutoff(request, admin, body);
    }
    if (body?.action === "swap") {
      return await handleSwap(request, admin, body);
    }
    if (body?.action === "finalize") {
      return await handleFinalize(request, admin, body);
    }

    const { stage, passingScore, dryRun } = body ?? {};

    if (!isStageKey(stage)) {
      return Response.json({ error: "Invalid stage" }, { status: 400 });
    }
    const threshold = Number(passingScore);
    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
      return Response.json({ error: "passingScore must be 0-100" }, { status: 400 });
    }

    // Block publishing if any reports for this stage are still waiting on a
    // super-admin tiebreak — otherwise those interns silently miss the
    // results email and stay stuck on UNDER_REVIEW.
    const divergentPending = await prisma.stageReport.count({
      where: { stage, divergent: true },
    });
    if (divergentPending > 0) {
      return Response.json(
        {
          error: `${divergentPending} report${divergentPending === 1 ? "" : "s"} for this stage still need a tiebreak. Resolve those before publishing.`,
          divergentPending,
        },
        { status: 409 }
      );
    }

    const graded = await prisma.stageReport.findMany({
      where: { stage, status: "GRADED" },
      include: {
        intern: {
          include: { user: true },
        },
      },
    });

    if (graded.length === 0) {
      return Response.json({ error: "No graded reports to publish for this stage" }, { status: 409 });
    }

    // Per-intern overrides — supplied from the review UI when an admin swaps
    // individuals between the threshold-derived buckets. Shape:
    //   { overrides: { "<internId>": "pass" | "fail" } }
    // Any internId listed forces that outcome regardless of score; everyone
    // else falls through the threshold comparison below. Audit-logged with
    // the publish action so the override decision is recoverable.
    const rawOverrides = body?.overrides;
    const overrides = new Map<string, "pass" | "fail">();
    if (rawOverrides && typeof rawOverrides === "object") {
      const entries = Object.entries(rawOverrides);
      if (entries.length > 1000) {
        return Response.json({ error: "Too many overrides supplied" }, { status: 400 });
      }
      for (const [k, v] of entries) {
        if (typeof k === "string" && (v === "pass" || v === "fail")) {
          overrides.set(k, v);
        }
      }
    }

    const willPass: typeof graded = [];
    const willFail: typeof graded = [];
    const appliedOverrides: {
      internId: string;
      reportId: string;
      email: string;
      fullName: string;
      score: number;
      thresholdOutcome: "pass" | "fail";
      forcedOutcome: "pass" | "fail";
    }[] = [];
    for (const r of graded) {
      const forced = overrides.get(r.intern.id);
      const thresholdOutcome: "pass" | "fail" = (r.score ?? 0) >= threshold ? "pass" : "fail";
      if (forced && forced !== thresholdOutcome) {
        appliedOverrides.push({
          internId: r.intern.id,
          reportId: r.id,
          email: r.intern.user.email,
          fullName: `${r.intern.user.firstName} ${r.intern.user.lastName}`.trim(),
          score: r.score ?? 0,
          thresholdOutcome,
          forcedOutcome: forced,
        });
      }
      const passes = forced ? forced === "pass" : thresholdOutcome === "pass";
      if (passes) willPass.push(r);
      else willFail.push(r);
    }

    if (dryRun) {
      return Response.json({
        dryRun: true,
        willPass: willPass.length,
        willFail: willFail.length,
        overridesApplied: appliedOverrides.length,
      });
    }

    // Upsert the stage window so future reads see the threshold.
    await prisma.stageWindow.upsert({
      where: { stage },
      create: {
        stage,
        passingScore: Math.round(threshold),
      },
      update: { passingScore: Math.round(threshold) },
    });

    const stageNum = stage.replace("STAGE_", "");
    const nextStage = `STAGE_${Number(stageNum) + 1}` as StageKey;
    const origin = process.env.PUBLIC_APP_URL || "https://ubuntubridgeinitiatives.org";
    const slackUrl = process.env.SLACK_CHANNEL_URL || "";

    // Promote passers and queue pass emails.
    for (const r of willPass) {
      await prisma.stageReport.update({
        where: { id: r.id },
        data: { status: "PASSED" },
      });
      // Advance intern currentStage if this was their current stage (don't regress).
      if (isStageKey(nextStage) && r.intern.currentStage === stage) {
        await prisma.intern.update({
          where: { id: r.intern.id },
          data: { currentStage: nextStage },
        });
        await prisma.stageHistory.create({
          data: {
            internId: r.intern.id,
            fromStage: stage,
            toStage: nextStage,
            promotedBy: "stage-publish",
            reason: `Passed with score ${r.score} (threshold ${Math.round(threshold)})`,
          },
        });
      }

      const certUrl = certificateUrl({
        origin,
        reportId: r.id,
        internId: r.intern.id,
      });

      await prisma.emailQueueItem.create({
        data: {
          userId: r.intern.user.id,
          toEmail: r.intern.user.email,
          kind: "STAGE_PASSED",
          subject: `Stage ${stageNum} — You've made it`,
          body: renderResultEmail({
            firstName: r.intern.user.firstName,
            stageNumber: stageNum,
            passed: true,
            score: r.score ?? 0,
            feedback: r.feedback ?? "",
            passingScore: Math.round(threshold),
            certUrl,
            slackUrl,
          }),
          context: {
            reportId: r.id,
            stage,
            score: r.score,
            passingScore: Math.round(threshold),
            certUrl,
          },
        },
      });
    }

    // Fail others and queue fail emails.
    for (const r of willFail) {
      await prisma.stageReport.update({
        where: { id: r.id },
        data: { status: "FAILED" },
      });
      await prisma.emailQueueItem.create({
        data: {
          userId: r.intern.user.id,
          toEmail: r.intern.user.email,
          kind: "STAGE_FAILED",
          subject: `Stage ${stageNum} — Your results`,
          body: renderResultEmail({
            firstName: r.intern.user.firstName,
            stageNumber: stageNum,
            passed: false,
            score: r.score ?? 0,
            feedback: r.feedback ?? "",
            passingScore: Math.round(threshold),
            certUrl: null,
            slackUrl,
          }),
          context: {
            reportId: r.id,
            stage,
            score: r.score,
            passingScore: Math.round(threshold),
          },
        },
      });
    }

    await recordAudit({
      actor: admin,
      action: "stage-results.publish",
      targetType: "STAGE_RESULTS",
      targetId: stage,
      details: {
        stage,
        threshold: Math.round(threshold),
        passed: willPass.length,
        failed: willFail.length,
        overridesApplied: appliedOverrides.length,
        overrides: appliedOverrides,
      },
      ...auditMetaFromRequest(request),
    });

    return Response.json({
      published: true,
      passed: willPass.length,
      failed: willFail.length,
      threshold: Math.round(threshold),
      overridesApplied: appliedOverrides.length,
    });
  } catch (error) {
    logger.error("publish_stage_results_failed", error);
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

  // 2. Drop result emails for this stage still waiting to send.
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

// Apply a cutoff: sort every graded report for the stage into a pending bucket
// based on the combined final score (0.8*report + 0.2*terminal%). Persists the
// cutoff on the StageWindow. Re-running re-sorts everyone and overrides prior
// manual swaps by design — the cutoff is the source of truth until finalize.
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

  const reports = await prisma.stageReport.findMany({
    where: { stage, status: { in: ["GRADED", "PENDING_PROMOTION", "PENDING_ELIMINATION"] } },
    select: { id: true, internId: true, score: true },
  });
  if (reports.length === 0) {
    return Response.json({ error: "No graded reports to sort for this stage" }, { status: 409 });
  }

  const { maxPoints, earnedByIntern } = await stageTerminalScores(stage);
  const round = Math.round(threshold);
  let pendingPromotion = 0;
  let pendingElimination = 0;
  for (const r of reports) {
    const terminalPct =
      maxPoints > 0 ? Math.round(((earnedByIntern.get(r.internId) ?? 0) / maxPoints) * 100) : null;
    const finalScore = combinedFinalScore(r.score, terminalPct);
    const status = finalScore >= round ? "PENDING_PROMOTION" : "PENDING_ELIMINATION";
    await prisma.stageReport.update({
      where: { id: r.id },
      data: { status, terminalScore: terminalPct, finalScore },
    });
    if (status === "PENDING_PROMOTION") pendingPromotion++;
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
    details: { stage, threshold: round, pendingPromotion, pendingElimination, reSorted: reports.length },
    ...auditMetaFromRequest(request),
  });

  return Response.json({ applied: true, threshold: round, pendingPromotion, pendingElimination });
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
      // Advance only if still on this stage (don't regress someone already ahead).
      if (isStageKey(nextStage) && r.intern.currentStage === stage) {
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
