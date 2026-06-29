import "dotenv/config";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma";

/**
 * READ-ONLY export of Stage 1 NON-PASSERS — interns who either did not submit
 * or scored below the cutoff. Writes scripts/stage1-non-passers.csv and prints
 * a category summary so the totals can be sanity-checked before anyone is removed.
 *
 * Reads only. Writes nothing to the database.
 *
 *   npx tsx scripts/export-stage1-nonpassers.ts
 *
 * Verdict source = the platform's own StageReport.status (set by the cutoff):
 *   PENDING_PROMOTION / PASSED          -> passed
 *   PENDING_ELIMINATION / FAILED        -> below cutoff
 *   no report / DRAFT                   -> did not submit
 *   SUBMITTED / UNDER_REVIEW / GRADED*  -> not yet finalised (flagged, not exported)
 *   currentStage >= STAGE_2             -> passed (already advanced past Stage 1)
 */

const prisma = new PrismaClient();
const STAGE = "STAGE_1";
const PASS = new Set(["PENDING_PROMOTION", "PASSED"]);
const FAIL = new Set(["PENDING_ELIMINATION", "FAILED"]);

const rankOf = (s: string) => Number(s.split("_")[1]);

function cell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  const win = await prisma.stageWindow.findUnique({
    where: { stage: STAGE as never },
    select: { passingScore: true, cutoffAppliedAt: true },
  });
  const cutoff = win?.passingScore ?? null;

  const interns = await prisma.intern.findMany({
    select: {
      currentStage: true,
      isActive: true,
      eliminatedAt: true,
      user: { select: { firstName: true, lastName: true, email: true } },
      reports: {
        where: { stage: STAGE as never },
        select: { status: true, score: true, finalScore: true, submittedAt: true },
      },
    },
  });

  const counts: Record<string, number> = {
    PASSED: 0,
    BELOW_CUTOFF: 0,
    NO_SUBMISSION: 0,
    UNGRADED: 0,
    NOT_REACHED: 0,
  };
  const out: Record<string, string | number | boolean>[] = [];

  for (const it of interns) {
    const rank = rankOf(it.currentStage);
    const rep = it.reports[0];
    let cat: keyof typeof counts;

    if (rank >= 2) {
      cat = "PASSED"; // already advanced past Stage 1
    } else if (!rep) {
      cat = rank === 0 ? "NOT_REACHED" : "NO_SUBMISSION";
    } else if (PASS.has(rep.status)) {
      cat = "PASSED";
    } else if (FAIL.has(rep.status)) {
      cat = "BELOW_CUTOFF";
    } else if (rep.status === "DRAFT") {
      cat = "NO_SUBMISSION";
    } else if (rep.status === "GRADED") {
      const fs = rep.finalScore ?? rep.score;
      cat = cutoff != null && fs != null && fs >= cutoff ? "PASSED" : "BELOW_CUTOFF";
    } else {
      cat = "UNGRADED"; // SUBMITTED / UNDER_REVIEW / LATE — not finalised
    }

    counts[cat]++;

    if (cat === "BELOW_CUTOFF" || cat === "NO_SUBMISSION") {
      out.push({
        firstName: it.user.firstName,
        lastName: it.user.lastName,
        email: it.user.email,
        reason: cat === "NO_SUBMISSION" ? "Did not submit" : "Below cutoff",
        status: rep?.status ?? "NO_REPORT",
        finalScore: rep?.finalScore ?? rep?.score ?? "",
        currentStage: it.currentStage,
        active: it.isActive,
      });
    }
  }

  out.sort(
    (a, b) =>
      String(a.reason).localeCompare(String(b.reason)) ||
      String(a.lastName).localeCompare(String(b.lastName)),
  );

  const header = [
    "First Name",
    "Last Name",
    "Email",
    "Reason",
    "Stage 1 Status",
    "Final Score",
    "Current Stage",
    "Active",
  ];
  const lines = [header.join(",")];
  for (const r of out) {
    lines.push(
      [r.firstName, r.lastName, r.email, r.reason, r.status, r.finalScore, r.currentStage, r.active]
        .map(cell)
        .join(","),
    );
  }
  const outPath = path.join(process.cwd(), "scripts", "stage1-non-passers.csv");
  writeFileSync(outPath, lines.join("\n") + "\n");

  console.log("=== Stage 1 non-passers export ===");
  console.log(
    `Cutoff (passingScore): ${cutoff ?? "NOT SET"}${
      win?.cutoffAppliedAt ? `  (applied ${win.cutoffAppliedAt.toISOString()})` : "  (cutoff NOT applied yet)"
    }`,
  );
  console.log(`Total interns scanned: ${interns.length}`);
  console.log("Categories:");
  console.log(`  PASSED ............ ${counts.PASSED}`);
  console.log(`  BELOW_CUTOFF ...... ${counts.BELOW_CUTOFF}`);
  console.log(`  NO_SUBMISSION ..... ${counts.NO_SUBMISSION}`);
  console.log(`  UNGRADED (review) . ${counts.UNGRADED}   <- NOT in the CSV; finalise these first`);
  console.log(`  NOT_REACHED ....... ${counts.NOT_REACHED}   <- still on Stage 0; excluded`);
  console.log(`\nNon-passers exported: ${out.length}  (below cutoff + did not submit)`);
  console.log(`CSV written: ${outPath}`);
  if (counts.UNGRADED > 0) {
    console.log(
      `\n⚠️  ${counts.UNGRADED} Stage 1 report(s) are still SUBMITTED/UNDER_REVIEW/LATE — not yet pass/fail.\n` +
        `   They are EXCLUDED from the CSV. Finalise grading before treating anyone as a non-passer.`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
