import "dotenv/config";
import { writeFileSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma";

/**
 * One-off operational migrator: applies the rewritten task JSON files in
 *   prisma/seed-rooms-scenarios/<stage>/*.json
 * onto the live Assignment rows, in place, keyed by (room.slug, order).
 *
 * SAFETY:
 *   - INSPECT-ONLY by default. Writes a per-stage backup JSON + prints a diff.
 *     Never touches the DB.
 *   - Refuses to overwrite any task that already has Submission rows against it
 *     (a content change mid-flight rewrites the prompt under work intern have
 *     already done). Override with FORCE=1 only with explicit user direction.
 *   - Per-stage scope. STAGE env var is required (no "all stages" mode by design).
 *   - Per-task atomic transaction on commit. Each task is its own unit; a failure
 *     mid-stage leaves earlier tasks committed and later ones untouched.
 *   - Idempotent. Re-running with no JSON changes is a no-op.
 *
 * USAGE:
 *   # INSPECT — shows what would change, no DB writes:
 *   STAGE=stage-0 npx tsx scripts/migrate-stage-content.ts
 *
 *   # COMMIT — actually applies:
 *   STAGE=stage-0 COMMIT=1 npx tsx scripts/migrate-stage-content.ts
 *
 *   # COMMIT + FORCE — overrides the "has submissions" guard.
 *   # ONLY use this when the user has explicitly authorised overwriting
 *   # a task whose prompt has already been submitted against.
 *   STAGE=stage-0 COMMIT=1 FORCE=1 npx tsx scripts/migrate-stage-content.ts
 */

const prisma = new PrismaClient();

const STAGE = process.env.STAGE; // e.g. "stage-0"
const COMMIT = process.env.COMMIT === "1";
const FORCE = process.env.FORCE === "1";

// Map JSON-folder stage slug → DB Room.slug. Keep in sync with prisma/seed-rooms.ts.
const STAGE_TO_SLUG: Record<string, string> = {
  "stage-0": "induction-at-the-gate",
  "stage-1": "ciphers-and-secrets",
  "stage-2": "the-attack-surface",
  "stage-3": "inside-the-walls",
  "stage-4": "the-debrief",
};

type TaskScenario = {
  order: number;
  title: string;
  description: string;
  maxPoints: number;
  kind: "FLAG" | "WRITEUP" | "MULTIPLE_CHOICE" | "UPLOAD";
  widget:
    | "NONE"
    | "WEB_TERMINAL"
    | "CIPHER_TOOLS"
    | "STEGO_VIEWER"
    | "LOG_VIEWER"
    | "VULN_APP_SIM"
    | "PORT_SCANNER"
    | "FILE_DOWNLOAD"
    | "DIAGRAM_UPLOAD"
    | "MCQ_QUIZ"
    | "WRITEUP_PAD";
  widgetConfig?: Record<string, unknown> | null;
  flagSalt?: string | null;
  choices?: string[] | null;
  correctIndex?: number | null;
  minWords?: number | null;
};

function loadTasks(stage: string): TaskScenario[] {
  const dir = path.join(process.cwd(), "prisma", "seed-rooms-scenarios", stage);
  const entries = readdirSync(dir).filter((f) => f.endsWith(".json"));
  const out: TaskScenario[] = [];
  for (const f of entries) {
    const raw = readFileSync(path.join(dir, f), "utf8");
    out.push(JSON.parse(raw));
  }
  return out.sort((a, b) => a.order - b.order);
}

function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): string[] {
  const changed: string[] = [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const k of keys) {
    const a = JSON.stringify(before[k] ?? null);
    const b = JSON.stringify(after[k] ?? null);
    if (a !== b) changed.push(k);
  }
  return changed;
}

async function main() {
  if (!STAGE || !STAGE_TO_SLUG[STAGE]) {
    console.error("ERROR: STAGE env var required. One of:", Object.keys(STAGE_TO_SLUG).join(", "));
    process.exit(2);
  }
  const slug = STAGE_TO_SLUG[STAGE];
  const tasks = loadTasks(STAGE);

  const room = await prisma.room.findUnique({ where: { slug } });
  if (!room) {
    console.error(`ERROR: no Room with slug=${slug} in DB. Seed-rooms.ts has not run yet.`);
    process.exit(2);
  }

  const existing = await prisma.assignment.findMany({
    where: { roomId: room.id },
    select: {
      id: true, order: true, title: true, description: true, maxPoints: true,
      kind: true, widget: true, widgetConfig: true, flagSalt: true,
      choices: true, correctIndex: true, minWords: true,
      _count: { select: { submissions: true } },
    },
    orderBy: { order: "asc" },
  });

  console.log(`\n=== ${STAGE} → Room(${slug}) ===`);
  console.log(`Mode: ${COMMIT ? "COMMIT" : "INSPECT (dry-run)"}${FORCE ? " + FORCE" : ""}`);
  console.log(`Tasks in JSON: ${tasks.length}, in DB: ${existing.length}\n`);

  const backupPath = path.join(
    process.cwd(),
    "scripts",
    `backup-${STAGE}-migrate-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  writeFileSync(backupPath, JSON.stringify(existing, null, 2));
  console.log(`Backup written: ${backupPath}\n`);

  let toCreate = 0, toUpdate = 0, skipped = 0, unchanged = 0;
  const operations: Array<() => Promise<void>> = [];

  for (const t of tasks) {
    const found = existing.find((e) => e.order === t.order);
    const proposed = {
      title: t.title,
      description: t.description,
      maxPoints: t.maxPoints,
      kind: t.kind,
      widget: t.widget,
      widgetConfig: (t.widgetConfig ?? null) as unknown,
      flagSalt: t.flagSalt ?? null,
      choices: (t.choices ?? null) as unknown,
      correctIndex: t.correctIndex ?? null,
      minWords: t.minWords ?? null,
    };

    if (!found) {
      toCreate++;
      console.log(`  + NEW   order=${t.order} "${t.title}" (${t.maxPoints} pts, ${t.kind})`);
      if (COMMIT) {
        operations.push(async () => {
          await prisma.assignment.create({
            data: {
              roomId: room.id,
              stage: room.stage,
              order: t.order,
              dueDate: null,
              ...proposed,
              widgetConfig: proposed.widgetConfig as object,
              choices: proposed.choices as object,
            },
          });
        });
      }
      continue;
    }

    const current = {
      title: found.title,
      description: found.description,
      maxPoints: found.maxPoints,
      kind: found.kind,
      widget: found.widget,
      widgetConfig: found.widgetConfig,
      flagSalt: found.flagSalt,
      choices: found.choices,
      correctIndex: found.correctIndex,
      minWords: found.minWords,
    };
    const changedFields = diffFields(current as Record<string, unknown>, proposed as Record<string, unknown>);

    if (changedFields.length === 0) {
      unchanged++;
      console.log(`  =       order=${t.order} "${t.title}" — unchanged`);
      continue;
    }

    if (found._count.submissions > 0 && !FORCE) {
      skipped++;
      console.log(
        `  ! SKIP  order=${t.order} "${t.title}" — has ${found._count.submissions} submission(s); ` +
          `diff in: ${changedFields.join(", ")}. Use FORCE=1 only with explicit user authorisation.`,
      );
      continue;
    }

    toUpdate++;
    console.log(
      `  ~ UPDATE order=${t.order} "${t.title}" — diff in: ${changedFields.join(", ")} ` +
        `(${found._count.submissions} submission(s)${found._count.submissions > 0 ? ", FORCED" : ""})`,
    );
    if (COMMIT) {
      operations.push(async () => {
        await prisma.assignment.update({
          where: { id: found.id },
          data: {
            ...proposed,
            widgetConfig: proposed.widgetConfig as object,
            choices: proposed.choices as object,
          },
        });
      });
    }
  }

  // Tasks in DB but not in JSON (we don't delete — surface them)
  const orphans = existing.filter((e) => !tasks.find((t) => t.order === e.order));
  for (const o of orphans) {
    console.log(
      `  ? ORPHAN order=${o.order} "${o.title}" — present in DB, absent in JSON. ` +
        `Not deleting. Decide manually.`,
    );
  }

  console.log("\n--- Summary ---");
  console.log(`  + NEW:       ${toCreate}`);
  console.log(`  ~ UPDATE:    ${toUpdate}`);
  console.log(`  ! SKIPPED:   ${skipped} (has submissions; pass FORCE=1 to override)`);
  console.log(`  = UNCHANGED: ${unchanged}`);
  console.log(`  ? ORPHANS:   ${orphans.length} (in DB, absent in JSON)`);
  console.log(`  Mode: ${COMMIT ? "COMMIT" : "INSPECT — no writes performed"}\n`);

  if (!COMMIT) {
    console.log("Dry run complete. Re-run with COMMIT=1 to apply.");
    return;
  }

  for (const op of operations) {
    await op();
  }

  // Refresh Room.totalPoints from sum of task maxPoints (matches seed-rooms.ts behavior).
  const updatedTasks = await prisma.assignment.findMany({
    where: { roomId: room.id },
    select: { maxPoints: true },
  });
  const newTotal = updatedTasks.reduce((s, a) => s + a.maxPoints, 0);
  if (newTotal !== room.totalPoints) {
    await prisma.room.update({ where: { id: room.id }, data: { totalPoints: newTotal } });
    console.log(`Room.totalPoints: ${room.totalPoints} → ${newTotal}`);
  }

  console.log(`\nDone. ${operations.length} task operation(s) committed.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
