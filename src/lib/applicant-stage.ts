import { prisma } from "./db";
import { logger } from "./logger";
import { renderStagePassedEmail, renderStageEliminatedEmail } from "./email";
import { Prisma, type Stage } from "@/generated/prisma";

const STAGE_ENUM: Stage[] = [
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
];

/**
 * PublicApplication.stage (0-10) → Intern Stage enum. Stage 10 ("finalist")
 * has no enum value, so it caps at STAGE_9 — the finalist flag is set
 * separately by the caller.
 */
function stageEnum(n: number): Stage {
  return STAGE_ENUM[Math.max(0, Math.min(9, n))];
}

type AppRow = { id: string; email: string; fullName: string; stage: number };

/**
 * Mirror an admin stage decision (made on PublicApplication from the
 * /admin/applicants screen) onto the backing Intern rows — the records that
 * actually gate dashboard access — and enqueue the stage emails.
 *
 * The calling route updates the PublicApplication rows itself; this handles
 * only the Intern side + the email queue.
 *
 *   advance    — `apps[].stage` is the NEW stage. Intern.currentStage moves to
 *                match; stage 10 sets Intern.finalist instead.
 *   eliminate  — Intern.isActive -> false.
 *
 * Emails are QUEUED into EmailQueueItem (PENDING) — never sent inline — so a
 * bulk action over a large cohort cannot time out. The email-drain cron
 * delivers them. An applicant with no backing Intern still gets the email
 * queued; only the intern-side update is skipped.
 *
 * Never throws: a failure here is logged but must not abort the route's
 * already-committed PublicApplication update.
 */
export async function syncApplicantStages(
  apps: AppRow[],
  action: "advance" | "eliminate"
): Promise<void> {
  if (apps.length === 0) return;
  try {
    const emails = apps.map((a) => a.email.toLowerCase().trim());
    const users = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: {
        id: true,
        email: true,
        intern: { select: { id: true, currentStage: true } },
      },
    });
    const byEmail = new Map(users.map((u) => [u.email, u]));

    const historyRows: Prisma.StageHistoryCreateManyInput[] = [];
    const queueRows: Prisma.EmailQueueItemCreateManyInput[] = [];

    if (action === "eliminate") {
      const internIds: string[] = [];
      for (const app of apps) {
        const u = byEmail.get(app.email.toLowerCase().trim());
        if (u?.intern) {
          internIds.push(u.intern.id);
          historyRows.push({
            internId: u.intern.id,
            fromStage: u.intern.currentStage,
            toStage: u.intern.currentStage,
            reason: "Eliminated by admin (applicant review).",
          });
        }
        const { subject, html } = renderStageEliminatedEmail({ fullName: app.fullName });
        queueRows.push({
          userId: u?.id ?? null,
          kind: "STAGE_FAILED",
          toEmail: app.email,
          subject,
          body: html,
          status: "PENDING",
          context: { type: "stage_eliminated", applicationId: app.id },
        });
      }
      if (internIds.length) {
        await prisma.intern.updateMany({
          where: { id: { in: internIds } },
          data: { isActive: false, eliminatedAt: new Date() },
        });
      }
    } else {
      // advance — group intern updates by target stage so each is one DB op.
      const byTarget = new Map<Stage, string[]>();
      const finalistInternIds: string[] = [];
      for (const app of apps) {
        const u = byEmail.get(app.email.toLowerCase().trim());
        if (u?.intern) {
          if (app.stage >= 10) {
            finalistInternIds.push(u.intern.id);
            historyRows.push({
              internId: u.intern.id,
              fromStage: u.intern.currentStage,
              toStage: u.intern.currentStage,
              reason: "Promoted to finalist by admin (applicant review).",
            });
          } else {
            const target = stageEnum(app.stage);
            const bucket = byTarget.get(target) ?? [];
            bucket.push(u.intern.id);
            byTarget.set(target, bucket);
            historyRows.push({
              internId: u.intern.id,
              fromStage: u.intern.currentStage,
              toStage: target,
              reason: `Advanced to Stage ${app.stage} by admin (applicant review).`,
            });
          }
        }
        const { subject, html } = renderStagePassedEmail({
          fullName: app.fullName,
          newStage: app.stage,
        });
        queueRows.push({
          userId: u?.id ?? null,
          kind: "STAGE_PASSED",
          toEmail: app.email,
          subject,
          body: html,
          status: "PENDING",
          context: { type: "stage_passed", applicationId: app.id },
        });
      }
      for (const [target, ids] of byTarget) {
        await prisma.intern.updateMany({
          where: { id: { in: ids } },
          data: { currentStage: target },
        });
      }
      if (finalistInternIds.length) {
        await prisma.intern.updateMany({
          where: { id: { in: finalistInternIds } },
          data: { finalist: true },
        });
      }
    }

    if (historyRows.length) {
      await prisma.stageHistory.createMany({ data: historyRows });
    }
    if (queueRows.length) {
      await prisma.emailQueueItem.createMany({ data: queueRows });
    }
  } catch (err) {
    logger.error("sync_applicant_stages_failed", err, { count: apps.length, action });
  }
}
