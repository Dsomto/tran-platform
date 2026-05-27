import "dotenv/config"; // loads .env — same as the other working ops scripts
import { writeFileSync } from "node:fs";
import { PrismaClient } from "../src/generated/prisma";

/**
 * One-off operational reset: Stage 0 was opened for testing, so some interns
 * accumulated auto-graded ("system marks") scores. This clears that work so
 * they start again:
 *   - deletes Submission rows on Stage 0 FLAG / MULTIPLE_CHOICE tasks
 *   - reverses the points those awards granted (Intern.points) and removes the
 *     matching "Auto-graded: <title>" PointLog rows (also undoes double-awards)
 *
 * Human-graded report scores are NOT touched.
 *
 * Safety: INSPECT ONLY by default (writes a backup + prints counts, no deletes).
 * Re-run with COMMIT=1 to actually apply.
 */
const prisma = new PrismaClient();
const COMMIT = process.env.COMMIT === "1";
const AUTO_KINDS = ["FLAG", "MULTIPLE_CHOICE"] as const;

async function main() {
  const assignments = await prisma.assignment.findMany({
    where: { stage: "STAGE_0", kind: { in: AUTO_KINDS as unknown as ("FLAG" | "MULTIPLE_CHOICE")[] } },
    select: { id: true, title: true, kind: true },
  });
  const assignmentIds = assignments.map((a) => a.id);
  const reasons = assignments.map((a) => `Auto-graded: ${a.title}`);

  const submissions = await prisma.submission.findMany({
    where: { assignmentId: { in: assignmentIds } },
    select: { id: true, internId: true, assignmentId: true, score: true, status: true, submittedAt: true },
  });

  const pointLogs = await prisma.pointLog.findMany({
    where: { reason: { in: reasons } },
    select: { id: true, internId: true, points: true, reason: true, createdAt: true },
  });

  const internIds = [...new Set([...submissions.map((s) => s.internId), ...pointLogs.map((p) => p.internId)])];
  const interns = await prisma.intern.findMany({
    where: { id: { in: internIds } },
    select: {
      id: true,
      points: true,
      currentStage: true,
      user: { select: { email: true, firstName: true, lastName: true } },
    },
  });

  const reverseByIntern = new Map<string, number>();
  for (const p of pointLogs) reverseByIntern.set(p.internId, (reverseByIntern.get(p.internId) ?? 0) + p.points);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = `scripts/backup-stage0-clear-${stamp}.json`;
  writeFileSync(
    backupFile,
    JSON.stringify({ when: new Date().toISOString(), stage: "STAGE_0", autoKinds: AUTO_KINDS, assignments, submissions, pointLogs, interns }, null, 2)
  );

  let totalPts = 0;
  for (const v of reverseByIntern.values()) totalPts += v;

  console.log("=== STAGE 0 AUTO-SCORE CLEAR ===");
  console.log("mode:", COMMIT ? "COMMIT (will delete)" : "INSPECT ONLY (no deletes)");
  console.log("backup written:", backupFile);
  console.log("auto-graded Stage 0 tasks:", assignments.length);
  for (const a of assignments) console.log("   -", a.kind, "|", a.title);
  console.log("submissions to delete:", submissions.length);
  console.log("pointLog rows to delete:", pointLogs.length);
  console.log("interns affected:", internIds.length);
  console.log("total points to reverse:", totalPts);
  console.log("per-intern points reversal:");
  for (const it of interns) {
    const rev = reverseByIntern.get(it.id) ?? 0;
    const name = `${it.user?.firstName ?? ""} ${it.user?.lastName ?? ""}`.trim();
    console.log(`   ${it.user?.email ?? it.id} ${name} [${it.currentStage}]: ${it.points} -> ${it.points - rev} (-${rev})`);
  }

  if (!COMMIT) {
    console.log("\nINSPECT ONLY — no changes made. Re-run with COMMIT=1 to apply.");
    return;
  }

  for (const [internId, pts] of reverseByIntern) {
    if (pts !== 0) await prisma.intern.update({ where: { id: internId }, data: { points: { decrement: pts } } });
  }
  const delLogs = await prisma.pointLog.deleteMany({ where: { reason: { in: reasons } } });
  const delSubs = await prisma.submission.deleteMany({ where: { assignmentId: { in: assignmentIds } } });

  console.log(`\nCOMMITTED: reversed points for ${reverseByIntern.size} interns, deleted ${delLogs.count} pointLogs, ${delSubs.count} submissions.`);
  console.log("backup:", backupFile);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
