import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

/**
 * Finalize reports that have been graded by exactly ONE grader and are still
 * waiting on grader 2 of 2. Each matching report flips from UNDER_REVIEW /
 * SUBMITTED to GRADED, using that single grade's score and feedback verbatim
 * (this mirrors the solo path in POST /api/admin/reports/[id]/grade).
 *
 * A report is eligible when:
 *   - status is UNDER_REVIEW or SUBMITTED (not already GRADED/PASSED/FAILED), and
 *   - exactly one of its ReportGrade rows has a score (one grader submitted), and
 *   - it is not flagged divergent (those are two-grader disagreements, left alone).
 *
 * Optional STAGE env var scopes the run to a single stage (e.g. STAGE_1).
 *
 * Usage:
 *   npx tsx scripts/finalize-single-graded.ts                 # inspect (no writes)
 *   STAGE=STAGE_1 npx tsx scripts/finalize-single-graded.ts   # inspect one stage
 *   COMMIT=1 npx tsx scripts/finalize-single-graded.ts        # write
 */

const prisma = new PrismaClient();
const COMMIT = process.env.COMMIT === "1";
const STAGE = process.env.STAGE;

async function main() {
  const reports = await prisma.stageReport.findMany({
    where: {
      status: { in: ["UNDER_REVIEW", "SUBMITTED"] },
      divergent: false,
      ...(STAGE ? { stage: STAGE as never } : {}),
    },
    include: {
      grades: true,
      intern: { select: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  const eligible = reports
    .map((r) => {
      const submitted = r.grades.filter((g) => g.score !== null && g.feedback);
      return { report: r, submitted };
    })
    .filter((x) => x.submitted.length === 1);

  console.log(
    `Scanned ${reports.length} UNDER_REVIEW/SUBMITTED report(s)${STAGE ? ` in ${STAGE}` : ""}.`,
  );
  console.log(`Of these, ${eligible.length} have exactly one submitted grade (graded by one grader).\n`);

  for (const { report, submitted } of eligible) {
    const grade = submitted[0];
    const name = `${report.intern.user.firstName} ${report.intern.user.lastName}`;
    console.log(`  ${report.stage}  score=${String(grade.score).padStart(3)}  ${name}  (${report.id})`);
    if (COMMIT) {
      await prisma.stageReport.update({
        where: { id: report.id },
        data: {
          status: "GRADED",
          score: grade.score!,
          feedback: grade.feedback!,
          gradedAt: new Date(),
          divergent: false,
        },
      });
    }
  }

  console.log(
    `\n${COMMIT ? "Finalized" : "Would finalize"} ${eligible.length} report(s) to GRADED.`,
  );
  if (!COMMIT && eligible.length > 0) {
    console.log("INSPECT mode — no writes. Re-run with COMMIT=1 to apply.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
