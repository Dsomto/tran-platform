import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
const prisma = new PrismaClient();

/**
 * Per-grader Stage-0 grading leaderboard.
 *
 *   npx tsx scripts/grader-stats.ts
 *
 * Includes every account that CAN grade: GRADER, ADMIN, SUPER_ADMIN.
 * That covers the named graders, the five grader1..5 seeds, the system
 * batch grader (Grader Six), and the super-admins. Sorted: people who
 * have submitted at least one grade first (most to least), then idle
 * accounts at the bottom alphabetised.
 */

(async () => {
  const users = await prisma.user.findMany({
    where: { role: { in: ["GRADER", "ADMIN", "SUPER_ADMIN"] } },
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  });

  type Row = {
    name: string;
    email: string;
    role: string;
    done: number;
    inProgress: number;
    flagged: number;
    averageScore: number | null;
  };
  const rows: Row[] = [];

  for (const u of users) {
    const grades = await prisma.reportGrade.findMany({
      where: { graderId: u.id },
      select: { score: true, gradedAt: true, aiFlagged: true },
    });
    const done = grades.filter((x) => x.gradedAt !== null);
    const inProgress = grades.filter((x) => x.gradedAt === null);
    const scores = done.map((x) => x.score).filter((x): x is number => x !== null);
    rows.push({
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      role: u.role,
      done: done.length,
      inProgress: inProgress.length,
      flagged: done.filter((x) => x.aiFlagged).length,
      averageScore: scores.length ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length) : null,
    });
  }

  const active = rows.filter((r) => r.done > 0 || r.inProgress > 0).sort((a, b) => b.done - a.done || b.inProgress - a.inProgress);
  const idle = rows.filter((r) => r.done === 0 && r.inProgress === 0).sort((a, b) => a.name.localeCompare(b.name));

  console.log("\n# Grader leaderboard — Stage 0\n");
  console.log(`${"Name".padEnd(28)} ${"Role".padEnd(13)} Done  InProg  Flagged  AvgScore`);
  console.log("-".repeat(78));
  for (const r of active) {
    console.log(
      `${r.name.padEnd(28)} ${r.role.padEnd(13)} ${String(r.done).padStart(4)}  ${String(r.inProgress).padStart(6)}  ${String(r.flagged).padStart(7)}  ${r.averageScore !== null ? String(r.averageScore).padStart(8) : "       —"}`
    );
  }
  console.log("\n# Have not started any grading yet:\n");
  for (const r of idle) {
    console.log(`  ${r.name.padEnd(28)} ${r.role.padEnd(13)} ${r.email}`);
  }

  const totalDone = rows.reduce((s, r) => s + r.done, 0);
  const totalInProgress = rows.reduce((s, r) => s + r.inProgress, 0);
  console.log("\n-".repeat(40));
  console.log(`Total grades submitted:   ${totalDone}`);
  console.log(`Total claims in progress: ${totalInProgress}`);
  console.log(`Active accounts:          ${active.length}`);
  console.log(`Idle accounts:            ${idle.length}`);

  const queue = await prisma.stageReport.groupBy({
    by: ["status"],
    where: { stage: "STAGE_0" },
    _count: { _all: true },
  });
  console.log(`\nStage 0 report status:`);
  for (const q of queue) console.log(`  ${q.status}: ${q._count._all}`);

  await prisma.$disconnect();
})();
