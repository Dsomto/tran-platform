import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { certificateUrl } from "@/lib/certificate-link";
import { recordAudit, auditMetaFromRequest } from "@/lib/audit";

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

// GET: summarise the state of a stage's reports — status counts + score distribution.
// Used by /admin/stage-results to show what will happen if a given threshold is applied.
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const stage = url.searchParams.get("stage");
    if (!isStageKey(stage)) {
      return Response.json({ error: "Invalid stage" }, { status: 400 });
    }

    const reports = await prisma.stageReport.findMany({
      where: { stage },
      select: { id: true, status: true, score: true },
    });

    const byStatus: Record<string, number> = {};
    const scores: number[] = [];
    for (const r of reports) {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      if (r.status === "GRADED" && typeof r.score === "number") scores.push(r.score);
    }
    scores.sort((a, b) => a - b);

    const summary = {
      total: reports.length,
      byStatus,
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

    return Response.json({ stage, summary });
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
    const admin = await requireAdmin();
    const body = await request.json();
    const { stage, passingScore, dryRun } = body ?? {};

    if (!isStageKey(stage)) {
      return Response.json({ error: "Invalid stage" }, { status: 400 });
    }
    const threshold = Number(passingScore);
    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
      return Response.json({ error: "passingScore must be 0-100" }, { status: 400 });
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

    const willPass: typeof graded = [];
    const willFail: typeof graded = [];
    for (const r of graded) {
      if ((r.score ?? 0) >= threshold) willPass.push(r);
      else willFail.push(r);
    }

    if (dryRun) {
      return Response.json({
        dryRun: true,
        willPass: willPass.length,
        willFail: willFail.length,
      });
    }

    // Upsert the stage window so future reads see the threshold.
    const now = new Date();
    await prisma.stageWindow.upsert({
      where: { stage },
      create: {
        stage,
        activeFrom: now,
        submitUntil: now,
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
      },
      ...auditMetaFromRequest(request),
    });

    return Response.json({
      published: true,
      passed: willPass.length,
      failed: willFail.length,
      threshold: Math.round(threshold),
    });
  } catch (error) {
    logger.error("publish_stage_results_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
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
      </div>
      <p style="text-align:center;color:#94A3B8;font-size:12px;margin-top:24px;">
        Ubuntu Bridge Initiative · ubuntubridgeinitiatives.org
      </p>
    </div>
  `;
}
