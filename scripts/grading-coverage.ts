import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

/**
 * Read-only grading coverage report. Writes NOTHING.
 *
 *   - How many reports exist, broken down by status.
 *   - How many submitted grades each report has (0 / 1 / 2 graders).
 *   - Per grader: how many reports they have submitted a grade on.
 *   - Per report: who graded it and what score they gave.
 *
 * Optional STAGE env var scopes to one stage (e.g. STAGE_1).
 *
 * Usage:
 *   npx tsx scripts/grading-coverage.ts
 *   STAGE=STAGE_1 npx tsx scripts/grading-coverage.ts
 */

const prisma = new PrismaClient();
const STAGE = process.env.STAGE;

async function main() {
  const reports = await prisma.stageReport.findMany({
    where: { ...(STAGE ? { stage: STAGE as never } : {}) },
    include: {
      grades: {
        include: { grader: { select: { email: true, firstName: true, lastName: true } } },
      },
      intern: { select: { user: { select: { firstName: true, lastName: true } } } },
    },
    orderBy: [{ stage: "asc" }, { createdAt: "asc" }],
  });

  const byStatus: Record<string, number> = {};
  const bySubmittedCount: Record<number, number> = { 0: 0, 1: 0, 2: 0 };
  const byGrader: Record<string, number> = {};

  console.log(`=== Grading coverage${STAGE ? ` — ${STAGE}` : ""} ===`);
  console.log(`Total reports: ${reports.length}\n`);

  console.log("--- Per report: status · graders · scores ---");
  for (const r of reports) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;

    const submitted = r.grades.filter((g) => g.score !== null && g.feedback);
    bySubmittedCount[Math.min(submitted.length, 2)] += 1;
    for (const g of submitted) {
      byGrader[g.grader.email] = (byGrader[g.grader.email] ?? 0) + 1;
    }

    const name = `${r.intern.user.firstName} ${r.intern.user.lastName}`;
    const graderList =
      r.grades.length === 0
        ? "no graders"
        : r.grades
            .map((g) => {
              const who = g.grader.email;
              return g.score !== null ? `${who}=${g.score}` : `${who}=(claimed, unsubmitted)`;
            })
            .join(", ");
    const flags = [r.divergent ? "DIVERGENT" : ""].filter(Boolean).join(" ");
    console.log(`  ${r.stage}  ${r.status.padEnd(18)} ${name.padEnd(28)} [${graderList}] ${flags}`);
  }

  console.log("\n--- Reports by status ---");
  for (const [status, n] of Object.entries(byStatus).sort()) {
    console.log(`  ${status.padEnd(20)} ${n}`);
  }

  console.log("\n--- Reports by # of submitted grades ---");
  console.log(`  0 graders   ${bySubmittedCount[0]}`);
  console.log(`  1 grader    ${bySubmittedCount[1]}  (graded once — awaiting grader 2 of 2)`);
  console.log(`  2 graders   ${bySubmittedCount[2]}`);

  console.log("\n--- Grades submitted per grader ---");
  for (const [email, n] of Object.entries(byGrader).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${email.padEnd(45)} ${n}`);
  }

  console.log("\n(read-only report — nothing was modified)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
