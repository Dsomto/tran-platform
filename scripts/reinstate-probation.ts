import { config } from "dotenv"; config(); config({ path: ".env.local" });
import { PrismaClient } from "../src/generated/prisma";
const p = new PrismaClient();

/**
 * Reinstate the 6 Stage 2 probation interns and advance them to Stage 3, the
 * same end-state the platform's finalize produces for a passer, but WITHOUT
 * queuing the standard pass email (they already received the probation letter).
 * Their real sub-cutoff score is kept and a [PROBATION] note is prepended to
 * the report feedback so it is obvious they came through on probation.
 *
 *   npx tsx scripts/reinstate-probation.ts          # DRY RUN
 *   COMMIT=1 npx tsx scripts/reinstate-probation.ts # apply
 */
const COMMIT = process.env.COMMIT === "1";
const STAGE = "STAGE_2";
const NEXT = "STAGE_3";
const CUTOFF = 70;
const REPORT_IDS = [
  "6a3571afe0e54f099366eede", // Nicole
  "6a35172098d6c7843907c05a", // Maryjudith
  "6a3551974f13e4da13baa25a", // Ayodeji
  "6a3451c638101dd15b6e13e8", // Orji
  "6a3444801a0dd2c26eb2816f", // Benjamin
  "6a3552b1b560995dd34d2d2d", // Adeoye
];

async function withRetry<T>(fn: () => Promise<T>, n = Number(process.env.RETRIES ?? 50)): Promise<T> {
  let last: unknown;
  for (let i = 0; i < n; i++) {
    try { return await fn(); } catch (e) { last = e; process.stdout.write(`retry ${i + 1}... `); await new Promise(r => setTimeout(r, 15000)); }
  }
  throw last;
}

async function main() {
  console.log(`Mode: ${COMMIT ? "COMMIT" : "DRY RUN"}\n`);
  const reports = await withRetry(() => p.stageReport.findMany({
    where: { id: { in: REPORT_IDS } },
    include: { intern: { include: { user: true } } },
  }));
  console.log(`Loaded ${reports.length}/6 probation reports\n`);

  let done = 0;
  for (const r of reports) {
    const u = r.intern.user;
    const name = `${u.firstName} ${u.lastName}`.trim();
    const score = r.finalScore ?? r.score ?? 0;
    const probationNote = `[PROBATION] Admitted to Stage 3 on a one-time probation despite a Stage 2 score of ${score}, below the ${CUTOFF} cutoff. `;
    const newFeedback = (r.feedback ?? "").startsWith("[PROBATION]") ? r.feedback : probationNote + (r.feedback ?? "");

    console.log(`${COMMIT ? "APPLY" : "WOULD"}  ${name} <${u.email}>`);
    console.log(`   report ${r.id}: status ${r.status} -> PASSED (score ${score} kept)`);
    console.log(`   intern  ${r.intern.id}: isActive ${r.intern.isActive} -> true, currentStage ${r.intern.currentStage} -> ${NEXT}, eliminatedAt -> null`);
    console.log(`   publicApplication.stageStatus -> active ; + StageHistory ${STAGE} -> ${NEXT} ; feedback marked [PROBATION]`);

    if (!COMMIT) { console.log(); continue; }

    await withRetry(() => p.$transaction([
      p.stageReport.update({ where: { id: r.id }, data: { status: "PASSED" as never, finalizedAt: new Date(), feedback: newFeedback } }),
      p.intern.update({ where: { id: r.intern.id }, data: { isActive: true, eliminatedAt: null, currentStage: NEXT as never } }),
      p.publicApplication.updateMany({ where: { email: u.email.toLowerCase() }, data: { stageStatus: "active" } }),
      p.stageHistory.create({ data: { internId: r.intern.id, fromStage: STAGE as never, toStage: NEXT as never, promotedBy: "probation-reinstate", reason: `Probation pass (score ${score}, cutoff ${CUTOFF})` } }),
    ]));
    console.log(`   committed\n`);
    done++;
  }
  console.log(`${COMMIT ? `Committed ${done}/${reports.length}` : `Dry run only. Re-run with COMMIT=1 to apply.`}`);
}

main().catch((e) => { console.error("FAILED:", (e as Error).message ?? e); process.exit(1); }).finally(() => p.$disconnect());
