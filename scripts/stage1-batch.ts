import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

/**
 * Read-only. Emits a JSON array of ungraded Stage 1 reports for the grading
 * workflow: { reportId, email, name, link }. LIMIT and SKIP page it.
 *
 *   LIMIT=12 npx tsx scripts/stage1-batch.ts > /tmp/batch.json
 */

const prisma = new PrismaClient();

async function main() {
  const limit = process.env.LIMIT ? parseInt(process.env.LIMIT) : 1000;
  const skip = process.env.SKIP ? parseInt(process.env.SKIP) : 0;

  const reports = await prisma.stageReport.findMany({
    where: { stage: "STAGE_1" as never, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
    orderBy: { submittedAt: "asc" },
    skip,
    take: limit,
    include: {
      intern: { select: { user: { select: { firstName: true, lastName: true, email: true } } } },
    },
  });

  const out = reports.map((r) => ({
    reportId: r.id,
    email: r.intern.user.email,
    name: `${r.intern.user.firstName} ${r.intern.user.lastName}`,
    link: r.reportUrl ?? r.attachmentUrl ?? "",
  }));
  console.log(JSON.stringify(out, null, 2));
}

main()
  .catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
