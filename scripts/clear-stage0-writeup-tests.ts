import "dotenv/config";
import { writeFileSync } from "node:fs";
import { PrismaClient } from "../src/generated/prisma";

/**
 * One-off cleanup: delete the test submissions on Stage 0 task-9 (Ethics
 * dilemma) and task-10 (Password-policy critique) that blocked the
 * assignment-content migrator from updating those task descriptions.
 *
 * Background:
 *   - Stage 0 was opened for testing earlier in the project. Auto-graded
 *     submissions (FLAG, MCQ) were cleared by clear-stage0-autoscores.ts,
 *     but WRITEUP submissions were untouched — that script only targeted
 *     auto-graded kinds.
 *   - 5 leftover WRITEUP submissions (3 on task-9, 2 on task-10) caused the
 *     migrator's submission-safety guard to skip those task descriptions,
 *     so the live cohort would have seen the old shorter prompts on those
 *     two tasks while every other task got the new content.
 *
 * This script:
 *   1. Looks up Stage 0 task-9 and task-10 by Room slug + order.
 *   2. Fetches every Submission on those two assignments.
 *   3. Fetches every PointLog row whose reason matches "Auto-graded: <title>",
 *      "Graded: <title>", or "Re-graded: <title>" for those assignments.
 *   4. Sums the reversed points per intern.
 *   5. In one transaction: deletes the submissions, deletes the matching
 *      PointLog rows, decrements each affected intern's running points
 *      total by the sum.
 *
 * Safety:
 *   - INSPECT-ONLY by default — writes a backup JSON of everything it would
 *     touch, prints the plan, returns without writing.
 *   - Set COMMIT=1 to actually run the deletes.
 *   - Scoped to exactly these two task IDs; cannot delete elsewhere.
 *
 * Usage:
 *   npx tsx scripts/clear-stage0-writeup-tests.ts            # inspect
 *   COMMIT=1 npx tsx scripts/clear-stage0-writeup-tests.ts   # apply
 */

const prisma = new PrismaClient();
const COMMIT = process.env.COMMIT === "1";

const STAGE_0_SLUG = "induction-at-the-gate";
const TARGET_ORDERS = [9, 10];

async function main() {
  const room = await prisma.room.findUnique({
    where: { slug: STAGE_0_SLUG },
    include: {
      assignments: {
        where: { order: { in: TARGET_ORDERS } },
        select: { id: true, order: true, title: true, kind: true },
      },
    },
  });

  if (!room) {
    console.error(`ERROR: no Room with slug=${STAGE_0_SLUG}`);
    process.exit(2);
  }
  if (room.assignments.length === 0) {
    console.error(`ERROR: no assignments at orders ${TARGET_ORDERS.join(", ")} on Room ${room.slug}`);
    process.exit(2);
  }

  console.log(`\n=== Cleanup target ===`);
  console.log(`Room: ${room.title} (${room.slug})`);
  console.log(`Assignments:`);
  for (const a of room.assignments) {
    console.log(`  - order=${a.order} kind=${a.kind} "${a.title}" id=${a.id}`);
  }

  const assignmentIds = room.assignments.map((a) => a.id);
  const titleById = new Map(room.assignments.map((a) => [a.id, a.title]));

  const submissions = await prisma.submission.findMany({
    where: { assignmentId: { in: assignmentIds } },
    include: {
      intern: {
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      },
    },
  });

  console.log(`\n=== Submissions to delete (${submissions.length}) ===`);
  for (const s of submissions) {
    console.log(
      `  - submission=${s.id} intern=${s.intern.user.firstName} ${s.intern.user.lastName} ` +
        `(${s.intern.user.email}) task="${titleById.get(s.assignmentId) ?? "?"}" ` +
        `status=${s.status} score=${s.score} contentLen=${s.content.length}`
    );
  }

  // PointLog rows for these tasks. Two grading reason formats are in use:
  //   - "Auto-graded: <title>"      (auto-grade flow on the answer route)
  //   - "Graded: <title>"            (manual grade, first time, on the
  //                                   submissions/[id] PATCH route)
  //   - "Re-graded: <title>"         (manual re-grade)
  // We match all three, scoped to the two task titles.
  const reasons: string[] = [];
  for (const a of room.assignments) {
    reasons.push(`Auto-graded: ${a.title}`);
    reasons.push(`Graded: ${a.title}`);
    reasons.push(`Re-graded: ${a.title}`);
  }
  const pointLogs = await prisma.pointLog.findMany({
    where: { reason: { in: reasons } },
  });

  console.log(`\n=== PointLog rows to delete (${pointLogs.length}) ===`);
  for (const pl of pointLogs) {
    console.log(
      `  - pointLog=${pl.id} intern=${pl.internId} points=${pl.points} reason="${pl.reason}"`
    );
  }

  const pointsToReverse = new Map<string, number>();
  for (const pl of pointLogs) {
    pointsToReverse.set(pl.internId, (pointsToReverse.get(pl.internId) ?? 0) + pl.points);
  }

  console.log(`\n=== Intern.points decrements (${pointsToReverse.size} intern(s)) ===`);
  for (const [internId, points] of pointsToReverse) {
    console.log(`  - intern=${internId} decrement=${points}`);
  }

  const backupPath = `scripts/backup-stage-0-writeup-cleanup-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}.json`;
  writeFileSync(
    backupPath,
    JSON.stringify(
      {
        room: { id: room.id, slug: room.slug, title: room.title },
        assignments: room.assignments,
        submissions,
        pointLogs,
        pointsToReverse: Object.fromEntries(pointsToReverse),
      },
      null,
      2
    )
  );
  console.log(`\nBackup written: ${backupPath}`);

  if (!COMMIT) {
    console.log(`\nMode: INSPECT — no deletes performed.`);
    console.log(`Re-run with COMMIT=1 to apply:`);
    console.log(`  COMMIT=1 npx tsx scripts/clear-stage0-writeup-tests.ts`);
    return;
  }

  console.log(`\nMode: COMMIT — deleting...`);

  const ops = [
    prisma.submission.deleteMany({ where: { id: { in: submissions.map((s) => s.id) } } }),
    prisma.pointLog.deleteMany({ where: { id: { in: pointLogs.map((pl) => pl.id) } } }),
    ...Array.from(pointsToReverse).map(([internId, points]) =>
      prisma.intern.update({
        where: { id: internId },
        data: { points: { decrement: points } },
      })
    ),
  ];
  await prisma.$transaction(ops);

  console.log(
    `\nDone. ${submissions.length} submission(s), ${pointLogs.length} PointLog row(s) ` +
      `deleted. Reversed points on ${pointsToReverse.size} intern(s).`
  );
  console.log(`\nNext step — re-run the migrator (no FORCE needed):`);
  console.log(`  STAGE=stage-0 COMMIT=1 npx tsx scripts/migrate-stage-content.ts`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
