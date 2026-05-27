import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.publicApplication.count();

  const byStatus = await prisma.publicApplication.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const byTrack = await prisma.publicApplication.groupBy({
    by: ["trackInterest"],
    _count: { _all: true },
  });

  const byExperience = await prisma.publicApplication.groupBy({
    by: ["experience"],
    _count: { _all: true },
  });

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const last24h = await prisma.publicApplication.count({
    where: { createdAt: { gte: since } },
  });

  const withWhyPickYou = await prisma.publicApplication.count({
    where: { whyPickYou: { not: null } },
  });

  console.log("=== PUBLIC APPLICATIONS ===");
  console.log("TOTAL:", total);
  console.log("Created in last 24h:", last24h);
  console.log("Have whyPickYou answer:", withWhyPickYou);
  console.log("\nBy status:");
  for (const r of byStatus) console.log(" ", r.status, "->", r._count._all);
  console.log("\nBy track interest:");
  for (const r of byTrack) console.log(" ", r.trackInterest, "->", r._count._all);
  console.log("\nBy experience:");
  for (const r of byExperience) console.log(" ", r.experience, "->", r._count._all);
}

main().finally(() => prisma.$disconnect());
