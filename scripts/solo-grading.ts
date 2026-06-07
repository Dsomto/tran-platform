// Temporary single-grader-mode toggle. When on, the first submitted grade
// on /admin/reports finalises the report immediately — no grader 2 of 2,
// no divergence tiebreak. Off-by-default; flip on for one super-admin
// drain, flip off before resuming the normal two-grader flow.
//
// Usage:
//   npx tsx scripts/solo-grading.ts on    # turn solo grading on
//   npx tsx scripts/solo-grading.ts off   # turn solo grading off
//   npx tsx scripts/solo-grading.ts       # show current state

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const arg = (process.argv[2] ?? "").toLowerCase();
  const action = arg === "on" || arg === "off" ? arg : "status";

  if (action === "status") {
    const row = await prisma.systemSetting.findUnique({
      where: { key: "singleton" },
      select: { soloGradingEnabled: true, updatedAt: true },
    });
    const on = row?.soloGradingEnabled === true;
    console.log(`Solo grading: ${on ? "ON" : "OFF"}`);
    if (row?.updatedAt) console.log(`Last toggled: ${row.updatedAt.toISOString()}`);
    console.log(`\nUsage:`);
    console.log(`  npx tsx scripts/solo-grading.ts on`);
    console.log(`  npx tsx scripts/solo-grading.ts off`);
    await prisma.$disconnect();
    return;
  }

  const enabled = action === "on";
  await prisma.systemSetting.upsert({
    where: { key: "singleton" },
    create: { key: "singleton", soloGradingEnabled: enabled },
    update: { soloGradingEnabled: enabled },
  });
  console.log(`Solo grading is now ${enabled ? "ON" : "OFF"}.`);
  if (enabled) {
    console.log(
      "\nFirst grade on a report will finalise it. There is no grader 2 of 2 and no divergence tiebreak."
    );
    console.log("Run with 'off' to restore the two-grader flow.");
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
