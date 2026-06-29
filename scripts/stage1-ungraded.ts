import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

/**
 * Read-only. Lists Stage 1 reports that still need hand grading, with the
 * document link, the intern, status, and how many grades are already on them.
 * Writes nothing.
 *
 *   npx tsx scripts/stage1-ungraded.ts
 */

const prisma = new PrismaClient();

async function main() {
  const reports = await prisma.stageReport.findMany({
    where: {
      stage: "STAGE_1" as never,
      status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
    },
    orderBy: { submittedAt: "asc" },
    include: {
      grades: { select: { score: true, grader: { select: { email: true } } } },
      intern: {
        select: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
    },
  });

  console.log(`Stage 1 reports still SUBMITTED/UNDER_REVIEW: ${reports.length}\n`);
  for (const r of reports) {
    const name = `${r.intern.user.firstName} ${r.intern.user.lastName}`;
    const submitted = r.grades.filter((g) => g.score !== null);
    const who = submitted.map((g) => g.grader.email).join(",") || "none";
    const url = r.reportUrl ?? r.attachmentUrl ?? "(no link)";
    console.log(`${name}  <${r.intern.user.email}>`);
    console.log(`  id=${r.id}  status=${r.status}  submittedGrades=${submitted.length} [${who}]`);
    console.log(`  link: ${url}`);
    if (r.executiveSummary) {
      console.log(`  summary: ${r.executiveSummary.slice(0, 120).replace(/\n/g, " ")}`);
    }
    console.log("");
  }
  console.log("(read-only — nothing modified)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
