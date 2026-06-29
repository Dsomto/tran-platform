import "dotenv/config";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "../src/generated/prisma";

/**
 * Apply Stage 2 capstone grades to the DB, mirroring apply-stage1-workflow-grades.ts.
 * Sources (deduped by reportId, last wins): marking-guides/stage2-grades-claude.jsonl,
 * marking-guides/stage2-results/<id>.json, marking-guides/stage2-grades-codex.jsonl.
 * cannotAssess reports are HELD (not in the input set) so they stay in the grading queue.
 * Score is RECOMPUTED canonically (round-half-up of rawPoints/120*100 minus fabricationPenalty)
 * so it never trusts a stored conversion. DRY RUN by default; COMMIT=1 writes.
 */
const prisma = new PrismaClient();
const MG = "marking-guides";
const OUT = process.env.OUT ?? join(MG, "stage2-grades-applied.json");
const GRADER_EMAIL = process.env.GRADER_EMAIL ?? "grader6@ubuntubridgeinitiatives.org";
const COMMIT = process.env.COMMIT === "1";

type Grade = {
  reportId: string;
  name?: string;
  d1: number; d2: number; d3: number; d4: number;
  rawPoints: number;
  fabricationPenalty: number;
  reportScore: number;
  cannotAssess?: boolean;
  feedback: string;
};

const halfUp = (x: number) => Math.floor(x + 0.5);
const canonical = (g: Grade) =>
  Math.max(0, Math.min(100, halfUp(((g.d1 + g.d2 + g.d3 + g.d4) / 120) * 100) - g.fabricationPenalty));

function loadMerged(): Grade[] {
  const by = new Map<string, Grade>();
  const addJsonl = (p: string) => {
    let text: string;
    try { text = readFileSync(join(MG, p), "utf8"); } catch { return; }
    for (const line of text.split(/\n/)) {
      if (!line.trim()) continue;
      const r = JSON.parse(line) as Grade;
      if (r?.reportId) by.set(r.reportId, r);
    }
  };
  addJsonl("stage2-grades-claude.jsonl");
  try {
    for (const f of readdirSync(join(MG, "stage2-results"))) {
      if (!f.endsWith(".json")) continue;
      const r = JSON.parse(readFileSync(join(MG, "stage2-results", f), "utf8")) as Grade;
      if (r?.reportId) by.set(r.reportId, r);
    }
  } catch { /* dir may not exist */ }
  addJsonl("stage2-grades-codex.jsonl");
  addJsonl("stage2-grades-partial.jsonl"); // partial re-grades override prior cannotAssess
  return [...by.values()].filter((g) => !g.cannotAssess);
}

function validate(g: Grade) {
  const raw = g.d1 + g.d2 + g.d3 + g.d4;
  if (g.rawPoints !== raw) throw new Error(`${g.reportId} rawPoints ${g.rawPoints} != d1..d4 sum ${raw}`);
  if (raw < 0 || raw > 120) throw new Error(`${g.reportId} rawPoints out of range: ${raw}`);
  const score = canonical(g);
  if (score < 0 || score > 100) throw new Error(`${g.reportId} score out of range: ${score}`);
  if (typeof g.feedback !== "string" || g.feedback.trim().length < 30) throw new Error(`${g.reportId} feedback missing or too short`);
  if (g.feedback.includes("—")) throw new Error(`${g.reportId} feedback contains an em dash`);
}

async function main() {
  const grades = loadMerged();
  for (const g of grades) validate(g);
  writeFileSync(OUT, JSON.stringify(grades, null, 2) + "\n");

  const grader = await prisma.user.findUnique({ where: { email: GRADER_EMAIL }, select: { id: true, email: true } });
  if (!grader) throw new Error(`Grader account not found: ${GRADER_EMAIL}`);

  console.log(`Mode: ${COMMIT ? "COMMIT" : "DRY RUN"}`);
  console.log(`Gradeable grades loaded: ${grades.length}  (cannotAssess held out of this set)`);
  console.log(`Grader account: ${grader.email}`);
  const corrected = grades.filter((g) => g.reportScore !== canonical(g));
  console.log(`Scores recomputed canonically; differ from stored on ${corrected.length} (rounding + conversion fixes).`);
  for (const g of corrected.filter((g) => Math.abs(g.reportScore - canonical(g)) >= 2))
    console.log(`  CORRECTED ${g.name ?? g.reportId}: stored ${g.reportScore} -> ${canonical(g)}`);
  console.log("");

  let written = 0, skipped = 0;
  for (const g of grades) {
    const score = canonical(g);
    const feedback = g.feedback.trim();
    const report = await prisma.stageReport.findUnique({
      where: { id: g.reportId },
      include: { grades: true, intern: { select: { user: { select: { firstName: true, lastName: true, email: true } } } } },
    });
    if (!report) { console.log(`SKIP missing report ${g.reportId}`); skipped++; continue; }
    if (report.stage !== "STAGE_2") { console.log(`SKIP non-STAGE_2 ${g.reportId} (${report.stage})`); skipped++; continue; }
    if (report.status !== "SUBMITTED" && report.status !== "UNDER_REVIEW") { console.log(`SKIP non-open ${g.reportId} (${report.status})`); skipped++; continue; }

    const name = `${report.intern.user.firstName ?? ""} ${report.intern.user.lastName ?? ""}`.trim() || report.intern.user.email;
    console.log(`${COMMIT ? "APPLY" : "WOULD"} ${g.reportId} score=${score} ${name}`);
    if (!COMMIT) continue;

    const existing = report.grades.find((x) => x.graderId === grader.id);
    if (existing) {
      await prisma.reportGrade.update({ where: { id: existing.id }, data: { score, feedback, gradedAt: new Date(), aiFlagged: false, aiFlagReason: null } });
    } else {
      await prisma.reportGrade.create({ data: { reportId: report.id, graderId: grader.id, score, feedback, gradedAt: new Date(), aiFlagged: false, aiFlagReason: null } });
    }
    await prisma.stageReport.update({ where: { id: report.id }, data: { status: "GRADED", score, feedback, gradedAt: new Date(), divergent: false } });
    written++;
  }

  console.log("");
  console.log(`${COMMIT ? "Wrote" : "Would write"} ${COMMIT ? written : grades.length - skipped} grade(s). Skipped: ${skipped}.`);
  if (!COMMIT) console.log("No database writes made. Re-run with COMMIT=1 to apply.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
