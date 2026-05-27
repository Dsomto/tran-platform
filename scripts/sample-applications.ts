import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

// READ-ONLY. Samples the application pool to calibrate the recommendation
// scoring — distribution of ageRange / dedication / currentStatus, and a
// spread of free-text answers with their word counts.

const prisma = new PrismaClient();

const words = (s: string | null | undefined) =>
  (s ?? "").trim().split(/\s+/).filter(Boolean).length;

async function main() {
  for (const field of ["ageRange", "dedication", "currentStatus"] as const) {
    const groups = await prisma.publicApplication.groupBy({
      by: [field],
      _count: { _all: true },
    });
    console.log(`\n=== ${field} ===`);
    for (const g of groups.sort((a, b) => b._count._all - a._count._all).slice(0, 15)) {
      console.log(`  ${String(g[field]).slice(0, 60)} -> ${g._count._all}`);
    }
  }

  const total = await prisma.publicApplication.count({ where: { status: "pending" } });
  console.log(`\n=== pending total: ${total} ===`);

  // A spread: oldest, middle, newest pending applications.
  const sample = await prisma.publicApplication.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
    take: 14,
    select: {
      experience: true,
      whyPickYou: true,
      goals: true,
      dedication: true,
      ageRange: true,
      currentStatus: true,
    },
  });
  console.log("\n=== sample applications ===");
  sample.forEach((a, i) => {
    console.log(`\n--- #${i + 1} | age=${a.ageRange} | status=${a.currentStatus} ---`);
    console.log(`  experience  (${words(a.experience)}w): ${(a.experience ?? "").slice(0, 240)}`);
    console.log(`  whyPickYou  (${words(a.whyPickYou)}w): ${(a.whyPickYou ?? "").slice(0, 240)}`);
    console.log(`  goals       (${words(a.goals)}w): ${(a.goals ?? "").slice(0, 160)}`);
    console.log(`  dedication  : ${(a.dedication ?? "").slice(0, 120)}`);
  });
}

main().finally(() => prisma.$disconnect());
