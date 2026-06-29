import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

/**
 * Read-only. Dumps one intern's Stage 1 footprint so we can see whether the
 * in-platform write-ups (Task 3/6/7/10) are stored in the DB as gradeable
 * text, alongside the capstone report link. Writes nothing.
 *
 *   EMAIL=someone@example.com npx tsx scripts/dump-intern-stage1.ts
 */

const prisma = new PrismaClient();

async function main() {
  const email = process.env.EMAIL;
  if (!email) throw new Error("EMAIL env var required");

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!user) throw new Error(`No user ${email}`);
  const intern = await prisma.intern.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!intern) throw new Error("No intern row");

  console.log(`${user.firstName} ${user.lastName}  internId=${intern.id}\n`);

  // The capstone report
  const report = await prisma.stageReport.findFirst({
    where: { internId: intern.id, stage: "STAGE_1" as never },
  });
  console.log("=== StageReport (capstone) ===");
  console.log(JSON.stringify(report, null, 2)?.slice(0, 1500));

  // In-platform submissions for stage 1 assignments
  const subs = await prisma.submission.findMany({
    where: { internId: intern.id },
    include: { assignment: { select: { stage: true, title: true, kind: true, order: true } } },
    orderBy: { submittedAt: "asc" },
  });
  const s1 = subs.filter((s) => s.assignment?.stage === "STAGE_1");
  const writeups = s1.filter((s) => s.assignment?.kind === "WRITEUP");
  console.log(`\n=== Stage 1 WRITEUPS: ${writeups.length} (full text) ===`);
  for (const s of writeups) {
    console.log(`\n========== [Task ${s.assignment?.order}] ${s.assignment?.title} ==========`);
    console.log(s.content ?? "(empty)");
  }
  console.log("\n(read-only — nothing modified)");
}

main()
  .catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
