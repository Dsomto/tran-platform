import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

// Read-only. Counts StageReport by stage + status, and lists STAGE_2
// submissions awaiting grading with their links. Writes nothing.
const prisma = new PrismaClient();

async function main() {
  const reports = await prisma.stageReport.findMany({
    select: { stage: true, status: true },
  });
  const byStageStatus: Record<string, Record<string, number>> = {};
  for (const r of reports) {
    byStageStatus[r.stage] ??= {};
    byStageStatus[r.stage][r.status] = (byStageStatus[r.stage][r.status] ?? 0) + 1;
  }
  console.log("StageReport counts by stage and status:");
  for (const stage of Object.keys(byStageStatus).sort()) {
    console.log(`  ${stage}:`, JSON.stringify(byStageStatus[stage]));
  }

  const s2 = await prisma.stageReport.findMany({
    where: { stage: "STAGE_2" as never, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
    orderBy: { submittedAt: "asc" },
    include: { intern: { select: { user: { select: { firstName: true, lastName: true, email: true } } } } },
  });
  console.log(`\nSTAGE_2 reports awaiting grading: ${s2.length}`);
  for (const r of s2.slice(0, 10)) {
    console.log(`  ${r.intern.user.firstName} ${r.intern.user.lastName} <${r.intern.user.email}>  ${r.reportUrl ?? r.attachmentUrl ?? "(no link)"}`);
  }

  // Stage 2 in-platform assignments (write-ups) and submission counts
  const s2asg = await prisma.assignment.findMany({
    where: { stage: "STAGE_2" as never },
    select: { id: true, title: true, kind: true, order: true, _count: { select: { submissions: true } } },
    orderBy: { order: "asc" },
  });
  console.log(`\nSTAGE_2 assignments (in-platform tasks):`);
  for (const a of s2asg) {
    console.log(`  [${a.order}] ${a.title}  kind=${a.kind}  submissions=${a._count.submissions}`);
  }
  console.log("\n(read-only — nothing modified)");
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); }).finally(() => prisma.$disconnect());
