import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

/**
 * Read-only. Who graded this week and how many.
 * Counts ReportGrade rows with a gradedAt timestamp since the start of the
 * current week (Monday 00:00 local). Writes nothing.
 *
 *   npx tsx scripts/graders-this-week.ts
 *   DAYS=7 npx tsx scripts/graders-this-week.ts   # last N days instead of since Monday
 */

const prisma = new PrismaClient();

function startOfWeek(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  return d;
}

async function main() {
  const days = process.env.DAYS ? parseInt(process.env.DAYS) : null;
  let since: Date;
  if (days && days > 0) {
    since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - days + 1);
  } else {
    since = startOfWeek();
  }

  const grades = await prisma.reportGrade.findMany({
    where: { gradedAt: { gte: since } },
    include: {
      grader: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  const tally = new Map<string, { name: string; email: string; count: number }>();
  for (const g of grades) {
    const key = g.grader.email;
    const name = `${g.grader.firstName} ${g.grader.lastName}`.trim();
    const cur = tally.get(key) ?? { name, email: key, count: 0 };
    cur.count += 1;
    tally.set(key, cur);
  }

  const rows = [...tally.values()].sort((a, b) => b.count - a.count);

  console.log(`Grades submitted since ${since.toISOString()} (${days ? `last ${days} days` : "this week, since Monday"}):`);
  console.log(`Total grades: ${grades.length}  ·  Graders active: ${rows.length}\n`);
  for (const r of rows) {
    console.log(`  ${String(r.count).padStart(4)}  ${r.name.padEnd(28)} ${r.email}`);
  }
  console.log("\n(read-only — nothing modified)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
