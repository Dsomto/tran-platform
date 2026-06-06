import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

/**
 * List the next N SUBMITTED or UNDER_REVIEW Stage-N reports that:
 *   - Grader Six has NOT yet graded, AND
 *   - have room for a second grader (grades.length < 2).
 *
 * Output is one line per report:  <reportId> <stage> <internName> <reportUrl>
 *
 * Usage:
 *   STAGE=STAGE_0 LIMIT=5 npx tsx scripts/list-ungraded.ts
 */

const prisma = new PrismaClient();
const STAGE = (process.env.STAGE ?? "STAGE_0") as
  | "STAGE_0" | "STAGE_1" | "STAGE_2" | "STAGE_3" | "STAGE_4";
const LIMIT = Number(process.env.LIMIT ?? "5");
const GRADER_EMAIL = "grader6@ubuntubridgeinitiatives.org";

(async () => {
  const grader = await prisma.user.findUnique({
    where: { email: GRADER_EMAIL },
    select: { id: true },
  });
  if (!grader) {
    console.error("Grader Six account missing");
    process.exit(2);
  }

  const all = await prisma.stageReport.findMany({
    where: {
      stage: STAGE as never,
      status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      submittedAt: { not: null },
    },
    orderBy: { submittedAt: "asc" },
    include: {
      grades: { select: { graderId: true } },
      intern: { select: { user: { select: { firstName: true, lastName: true, email: true } } } },
    },
  });

  const eligible = all.filter(
    (r) =>
      r.grades.length < 2 &&
      !r.grades.some((g) => g.graderId === grader.id) &&
      !r.divergent
  );

  console.log(`# Total ${STAGE} reports needing Grader Six: ${eligible.length}`);
  console.log(`# Showing next ${Math.min(LIMIT, eligible.length)} by submitted-at asc`);
  console.log();
  for (const r of eligible.slice(0, LIMIT)) {
    const name = `${r.intern.user.firstName} ${r.intern.user.lastName}`;
    console.log(`${r.id}\t${name}\t${r.reportUrl}`);
  }
  await prisma.$disconnect();
})();
