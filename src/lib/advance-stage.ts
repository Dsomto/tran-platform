import { prisma } from "./db";
import { logger } from "./logger";
import { sendStageAdvanced, sendEliminationEmail } from "./email";

/** All 10 stage enum values, in order. */
const STAGE_ORDER = [
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
type StageEnum = (typeof STAGE_ORDER)[number];

export type AdvanceResult = {
  advanced: boolean;
  fromStage: StageEnum;
  toStage: StageEnum | null;
  earned: number;
  required: number;
  eliminated: boolean;
  finalist: boolean;
};

/**
 * After a task is graded (or auto-graded), decide whether the intern has
 * cleared the room for their current stage and, if so, bump them forward.
 *
 * Rules:
 *   - Sum graded submissions for all assignments in the Room for the intern's
 *     current stage.
 *   - If `earned ≥ room.totalPoints * room.passThreshold / 100`, advance.
 *   - At STAGE_4 (capstone):
 *       · < 50% → deactivate intern + fire elimination email.
 *       · ≥ 85% cumulative across STAGE_0..STAGE_4 → mark finalist.
 */
export async function maybeAdvanceStage(internId: string): Promise<AdvanceResult | null> {
  const intern = await prisma.intern.findUnique({
    where: { id: internId },
    include: { user: true },
  });
  if (!intern) return null;

  const currentStage = intern.currentStage as StageEnum;
  const idx = STAGE_ORDER.indexOf(currentStage);
  if (idx < 0) return null;

  const room = await prisma.room.findUnique({
    where: { stage: currentStage },
    include: { assignments: { select: { id: true, maxPoints: true } } },
  });
  if (!room || room.assignments.length === 0) {
    return {
      advanced: false,
      fromStage: currentStage,
      toStage: null,
      earned: 0,
      required: 0,
      eliminated: false,
      finalist: false,
    };
  }

  const assignmentIds = room.assignments.map((a) => a.id);
  const gradedSubs = await prisma.submission.findMany({
    where: {
      internId,
      assignmentId: { in: assignmentIds },
      status: "GRADED",
    },
    select: { score: true, assignmentId: true },
  });

  const earned = gradedSubs.reduce((sum, s) => sum + (s.score ?? 0), 0);
  const required = Math.ceil((room.totalPoints * room.passThreshold) / 100);
  const ungradedRequired = assignmentIds.length > gradedSubs.length;

  if (earned < required || ungradedRequired) {
    return {
      advanced: false,
      fromStage: currentStage,
      toStage: null,
      earned,
      required,
      eliminated: false,
      finalist: false,
    };
  }

  const nextStage = STAGE_ORDER[idx + 1] ?? null;

  // Stage 4 capstone → check elimination / finalist signals.
  let eliminated = false;
  let finalist = intern.finalist;
  if (currentStage === "STAGE_4") {
    if (earned < Math.ceil(room.totalPoints * 0.5)) {
      eliminated = true;
    } else {
      const foundationRooms = await prisma.room.findMany({
        where: { stage: { in: ["STAGE_0", "STAGE_1", "STAGE_2", "STAGE_3", "STAGE_4"] } },
        include: { assignments: { select: { id: true } } },
      });
      const allIds = foundationRooms.flatMap((r) => r.assignments.map((a) => a.id));
      const allSubs = await prisma.submission.findMany({
        where: { internId, assignmentId: { in: allIds }, status: "GRADED" },
        select: { score: true },
      });
      const cumulative = allSubs.reduce((sum, s) => sum + (s.score ?? 0), 0);
      const cumulativeTotal = foundationRooms.reduce((sum, r) => sum + r.totalPoints, 0);
      if (cumulativeTotal > 0 && cumulative / cumulativeTotal >= 0.85) {
        finalist = true;
      }
    }
  }

  if (eliminated) {
    await prisma.intern.update({
      where: { id: internId },
      data: { isActive: false },
    });
    await prisma.stageHistory.create({
      data: {
        internId,
        fromStage: currentStage,
        toStage: currentStage,
        reason: "Eliminated at capstone (< 50% of STAGE_4 room).",
      },
    });
    logger.info("intern_eliminated", { internId, earned, required });
    sendEliminationEmail(
      intern.user.email,
      intern.user.firstName,
      earned,
      room.totalPoints
    ).catch((e) => logger.error("elimination_email_failed", e, { internId }));
    return {
      advanced: false,
      fromStage: currentStage,
      toStage: null,
      earned,
      required,
      eliminated: true,
      finalist: false,
    };
  }

  if (!nextStage) {
    // Already at STAGE_9 — nothing above to advance to.
    if (finalist !== intern.finalist) {
      await prisma.intern.update({ where: { id: internId }, data: { finalist } });
    }
    return {
      advanced: false,
      fromStage: currentStage,
      toStage: null,
      earned,
      required,
      eliminated: false,
      finalist,
    };
  }

  await prisma.intern.update({
    where: { id: internId },
    data: {
      currentStage: nextStage,
      finalist,
    },
  });
  await prisma.stageHistory.create({
    data: {
      internId,
      fromStage: currentStage,
      toStage: nextStage,
      reason: `Passed ${currentStage} room with ${earned}/${room.totalPoints}.`,
    },
  });
  await prisma.pointLog.create({
    data: {
      internId,
      points: 0,
      reason: `Advanced from ${currentStage} to ${nextStage}`,
    },
  });

  logger.info("intern_stage_advanced", {
    internId,
    fromStage: currentStage,
    toStage: nextStage,
    earned,
    finalist,
  });
  sendStageAdvanced(
    intern.user.email,
    intern.user.firstName,
    currentStage,
    nextStage,
    earned,
    room.totalPoints
  ).catch((e) => logger.error("stage_advanced_email_failed", e, { internId }));

  return {
    advanced: true,
    fromStage: currentStage,
    toStage: nextStage,
    earned,
    required,
    eliminated: false,
    finalist,
  };
}

/** Add points to Intern.points and write a PointLog row — used by auto-grade. */
export async function awardPoints(
  internId: string,
  points: number,
  reason: string
): Promise<void> {
  if (points === 0) return;
  await prisma.$transaction([
    prisma.intern.update({
      where: { id: internId },
      data: { points: { increment: points } },
    }),
    prisma.pointLog.create({
      data: { internId, points, reason },
    }),
  ]);
}
