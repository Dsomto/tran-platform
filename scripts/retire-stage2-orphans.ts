import "dotenv/config";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma";

/**
 * Retire (hide) the Stage 2 in-platform tasks that became the Drive capstone.
 * Tasks 9 ("Write the Finding") and 10 ("Brief the CISO") are now deliverables
 * D3 of the capstone, so they should no longer appear as desk tasks.
 *
 * This NEVER deletes — it sets isClosed=true (reversible: set false to restore).
 * Dry-run by default. Re-run with COMMIT=1 to apply. FORCE=1 to close a task
 * that already has submissions (don't, unless you mean it).
 *
 *   npx tsx scripts/retire-stage2-orphans.ts            # inspect
 *   COMMIT=1 npx tsx scripts/retire-stage2-orphans.ts   # apply
 */

const prisma = new PrismaClient();
const COMMIT = process.env.COMMIT === "1";
const FORCE = process.env.FORCE === "1";
const STAGE = "STAGE_2";
const ORDERS = [9, 10];

async function main() {
  console.log(`=== Retire ${STAGE} orphan tasks (order ${ORDERS.join(", ")}) ===`);
  console.log(`Mode: ${COMMIT ? "COMMIT" : "INSPECT (dry-run)"}\n`);

  const targets = await prisma.assignment.findMany({
    where: { stage: STAGE as never, order: { in: ORDERS } },
    select: {
      id: true,
      order: true,
      title: true,
      isClosed: true,
      closedAt: true,
      _count: { select: { submissions: true } },
    },
    orderBy: { order: "asc" },
  });

  if (targets.length === 0) {
    console.log("No matching tasks found — nothing to do (already removed?).");
    return;
  }

  const backupPath = path.join(
    process.cwd(),
    "scripts",
    `backup-${STAGE}-retire-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  writeFileSync(backupPath, JSON.stringify(targets, null, 2));
  console.log(`Backup written: ${backupPath}\n`);

  for (const t of targets) {
    const subs = t._count.submissions;
    let state: string;
    if (t.isClosed) state = "already hidden — skip";
    else if (subs > 0 && !FORCE) state = `HAS ${subs} submission(s) — SKIP (use FORCE=1 to override)`;
    else state = "WILL HIDE";
    console.log(`  order=${t.order} "${t.title}" — ${state}`);
  }

  if (!COMMIT) {
    console.log("\nDry run complete. Re-run with COMMIT=1 to apply.");
    return;
  }

  let hidden = 0;
  for (const t of targets) {
    if (t.isClosed) continue;
    if (t._count.submissions > 0 && !FORCE) continue;
    await prisma.assignment.update({
      where: { id: t.id },
      data: { isClosed: true, closedAt: new Date() },
    });
    hidden++;
    console.log(`  ✓ hid order=${t.order} "${t.title}"`);
  }
  console.log(`\nDone. ${hidden} task(s) hidden (isClosed=true).`);
  console.log("Reversible: set isClosed=false on those rows to restore them.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
