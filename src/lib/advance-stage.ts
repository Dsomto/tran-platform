import { prisma } from "./db";

// `maybeAdvanceStage` (raw room-threshold auto-advance) was removed: it was
// never wired up and its scoring formula conflicted with the cutoff /
// 0.8*report + 0.2*terminal% flow used by /api/admin/stage-results. The only
// surviving export is `awardPoints` — called from the answer route after a
// successful auto-grade.

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
