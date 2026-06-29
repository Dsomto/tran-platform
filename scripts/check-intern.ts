import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

// Read-only. Look up one or more interns by email OR name substring and show
// their Stage 1 outcome and account state. Writes nothing.
//   QUERY="a@x.com,favour onoko" npx tsx scripts/check-intern.ts
const prisma = new PrismaClient();
const STAGE = process.env.STAGE ?? "STAGE_1";

async function main() {
  const queries = (process.env.QUERY ?? "").split(",").map((q) => q.trim()).filter(Boolean);
  if (!queries.length) throw new Error("QUERY env required (comma-separated emails or names)");

  for (const q of queries) {
    const isEmail = q.includes("@");
    const parts = q.split(/\s+/).filter(Boolean);
    const users = await prisma.user.findMany({
      where: isEmail
        ? { email: { equals: q, mode: "insensitive" } }
        : {
            AND: parts.map((p) => ({
              OR: [
                { firstName: { contains: p, mode: "insensitive" as const } },
                { lastName: { contains: p, mode: "insensitive" as const } },
              ],
            })),
          },
      select: { id: true, firstName: true, lastName: true, email: true },
      take: 10,
    });

    console.log(`\n=== query: "${q}" -> ${users.length} match(es) ===`);
    for (const u of users) {
      const intern = await prisma.intern.findUnique({
        where: { userId: u.id },
        select: { id: true, isActive: true, eliminatedAt: true, currentStage: true },
      });
      const app = await prisma.publicApplication.findFirst({
        where: { email: { equals: u.email, mode: "insensitive" } },
        select: { stageStatus: true },
      });
      console.log(`\n${u.firstName} ${u.lastName}  <${u.email}>`);
      console.log(`  account: isActive=${intern?.isActive}  eliminatedAt=${intern?.eliminatedAt ?? "null"}  stageStatus=${app?.stageStatus ?? "?"}  currentStage=${intern?.currentStage}`);
      if (!intern) { console.log("  (no intern row)"); continue; }
      const report = await prisma.stageReport.findFirst({
        where: { internId: intern.id, stage: STAGE as never },
        include: { grades: { select: { score: true, grader: { select: { email: true } } } } },
      });
      if (!report) { console.log(`  no ${STAGE} report`); continue; }
      const score = report.finalScore ?? report.score;
      console.log(`  ${STAGE}: status=${report.status}  score=${score ?? "ungraded"}  gradedAt=${report.gradedAt ? "yes" : "no"}  finalizedAt=${report.finalizedAt ?? "null"}`);
      console.log(`  grades: ${report.grades.map((g) => `${g.grader.email}=${g.score}`).join(", ") || "none"}`);
      if (report.feedback) console.log(`  feedback: ${report.feedback.slice(0, 180).replace(/\n/g, " ")}...`);
    }
  }
  console.log("\n(read-only — nothing modified)");
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); }).finally(() => prisma.$disconnect());
