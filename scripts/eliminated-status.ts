import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

// Read-only. Lists eliminated interns, how long ago, and whether they fall in
// the new 7-day grace (so they can log back in once it deploys). Writes nothing.
const prisma = new PrismaClient();
const GRACE_DAYS = 7;

async function main() {
  const elim = await prisma.intern.findMany({
    where: { eliminatedAt: { not: null } },
    select: {
      eliminatedAt: true,
      user: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { eliminatedAt: "desc" },
  });

  const now = Date.now();
  let inGrace = 0;
  let pastGrace = 0;
  console.log(`Eliminated interns (account still present, not purged): ${elim.length}\n`);
  for (const e of elim) {
    const ms = now - new Date(e.eliminatedAt as Date).getTime();
    const days = ms / (24 * 60 * 60 * 1000);
    const grace = days < GRACE_DAYS;
    if (grace) inGrace++;
    else pastGrace++;
  }
  console.log(`Within the new ${GRACE_DAYS}-day grace (regain access on deploy): ${inGrace}`);
  console.log(`Past ${GRACE_DAYS} days (would stay locked / be purge-eligible): ${pastGrace}\n`);

  console.log("Most recent eliminations:");
  for (const e of elim.slice(0, 15)) {
    const days = (now - new Date(e.eliminatedAt as Date).getTime()) / (24 * 60 * 60 * 1000);
    const tag = days < GRACE_DAYS ? "in-grace" : "PAST-GRACE";
    console.log(`  ${days.toFixed(1)}d ago  ${tag.padEnd(10)} ${e.user.firstName} ${e.user.lastName} <${e.user.email}>`);
  }
  console.log("\n(read-only — nothing modified)");
}

main()
  .catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
