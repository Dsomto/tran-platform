import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaClient } from "../src/generated/prisma";
import { combineFeedback, isDivergent, averageScore } from "../src/lib/grading";

/**
 * Apply one or more grades to StageReports as Grader Six.
 *
 * SOLO MODE (set SOLO=1 in the env): write the Grader Six grade AND
 * finalize the report immediately as the sole reviewer — no second
 * grader, no averaging, no divergence check. This is the mode used
 * during the Cohort 1 Stage 0 weekend grading sprint.
 *
 * Two-grader mode (default): mirror the server-side logic of POST
 * /api/admin/reports/[id]/grade:
 *   1. Create or update the Grader Six ReportGrade row.
 *   2. Refetch all grades for the report.
 *   3. If both grades present and non-divergent, write averaged score +
 *      combined feedback to the StageReport, status = GRADED.
 *   4. If both grades present and divergent (per DIVERGENCE_THRESHOLD in
 *      grading.ts), mark divergent = true, status = UNDER_REVIEW.
 *
 * Input file: a JSON array at the path given by INPUT env var.
 *   [
 *     {
 *       "reportId": "6a216...",
 *       "score": 97,
 *       "feedback": "Strong work end to end ...",
 *       "aiFlagged": false,
 *       "aiFlagReason": null
 *     },
 *     ...
 *   ]
 *
 * Usage:
 *   INPUT=/tmp/grades.json npx tsx scripts/apply-grades.ts            # inspect
 *   INPUT=/tmp/grades.json COMMIT=1 npx tsx scripts/apply-grades.ts   # write
 */

const prisma = new PrismaClient();
const COMMIT = process.env.COMMIT === "1";
const SOLO = process.env.SOLO === "1";
const INPUT = process.env.INPUT;
const GRADER_EMAIL = "grader6@ubuntubridgeinitiatives.org";
const PASS_MARK_DEFAULT = 70;

function distillForIntern(feedback: string, score: number, passMark: number): string {
  const sentences = feedback
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
  if (score >= passMark) {
    const positive = sentences.find((s) =>
      /\b(strong|clean|solid|sharp|confident|genuinely|correctly|right|cleanly|specific|well|excellent)\b/i.test(s),
    );
    const note = positive ?? sentences[0] ?? "";
    return "Well done. You cleared Stage 0 and we will see you at Stage 1.\n\nOne thing that stood out: " + note;
  }
  const negative = sentences.find((s) =>
    /\b(missed|missing|did not|does not|fabricated|invented|wrong|absent|incomplete|not match|not name|no.*canon|template|placeholder|outline)\b/i.test(s),
  );
  const note = negative ?? sentences[0] ?? "";
  return (
    "You did not clear Stage 0 in this cohort.\n\nThe main gap: " +
    note +
    "\n\nWe thank you for your effort and wish you well in your continued cybersecurity learning."
  );
}

interface GradeInput {
  reportId: string;
  score: number;
  feedback: string;
  aiFlagged?: boolean;
  aiFlagReason?: string | null;
}

async function main() {
  if (!INPUT) {
    console.error("ERROR: INPUT env var is required (path to a grades JSON file).");
    process.exit(2);
  }
  const grader = await prisma.user.findUnique({
    where: { email: GRADER_EMAIL },
    select: { id: true, email: true },
  });
  if (!grader) {
    console.error(`ERROR: Grader account not found (${GRADER_EMAIL}). Run provision-batch-grader.ts COMMIT=1 first.`);
    process.exit(2);
  }
  const grades: GradeInput[] = JSON.parse(readFileSync(INPUT, "utf-8"));
  if (!Array.isArray(grades) || grades.length === 0) {
    console.error("ERROR: input file is empty or not an array.");
    process.exit(2);
  }

  // Validate every input up front. Bail before writing anything if any fail.
  for (const g of grades) {
    if (!g.reportId || typeof g.reportId !== "string") throw new Error(`bad reportId on entry`);
    if (typeof g.score !== "number" || g.score < 0 || g.score > 100) throw new Error(`bad score on ${g.reportId}: ${g.score}`);
    if (typeof g.feedback !== "string" || g.feedback.trim().length < 30) throw new Error(`feedback too short on ${g.reportId}`);
    if (g.aiFlagged && (!g.aiFlagReason || g.aiFlagReason.trim().length < 15)) {
      throw new Error(`aiFlag set but reason missing or too short on ${g.reportId}`);
    }
  }
  console.log(`Validated ${grades.length} grade(s). Grader: ${grader.email} (${grader.id})`);

  if (!COMMIT) {
    console.log("\nINSPECT mode — no writes. Plan:");
    for (const g of grades) {
      console.log(`  ${g.reportId}  score=${g.score}  feedback=${g.feedback.slice(0, 60)}...  aiFlag=${g.aiFlagged ?? false}`);
    }
    return;
  }

  let written = 0;
  let finalized = 0;
  let divergent = 0;
  for (const g of grades) {
    const report = await prisma.stageReport.findUnique({
      where: { id: g.reportId },
      include: { grades: true },
    });
    if (!report) {
      console.error(`  ✗ ${g.reportId} — report not found, skipping`);
      continue;
    }
    if (report.status === "PASSED" || report.status === "FAILED") {
      console.error(`  ✗ ${g.reportId} — already ${report.status}, skipping`);
      continue;
    }

    const myExisting = report.grades.find((x) => x.graderId === grader.id);
    const intScore = Math.round(g.score);
    const trimmedFb = g.feedback.trim();

    const myRow = myExisting
      ? await prisma.reportGrade.update({
          where: { id: myExisting.id },
          data: {
            score: intScore,
            feedback: trimmedFb,
            gradedAt: new Date(),
            aiFlagged: g.aiFlagged ?? false,
            aiFlagReason: g.aiFlagged ? (g.aiFlagReason ?? null) : null,
          },
        })
      : await prisma.reportGrade.create({
          data: {
            reportId: report.id,
            graderId: grader.id,
            score: intScore,
            feedback: trimmedFb,
            gradedAt: new Date(),
            aiFlagged: g.aiFlagged ?? false,
            aiFlagReason: g.aiFlagged ? (g.aiFlagReason ?? null) : null,
          },
        });

    // SOLO mode: finalize immediately with my grade as the sole reviewer.
    // No second grader, no averaging, no divergence check. Writes the short
    // intern-facing cover message based on the StageWindow pass mark.
    if (SOLO) {
      const sw = await prisma.stageWindow.findFirst({
        where: { stage: report.stage },
        select: { passingScore: true },
      });
      const passMark = sw?.passingScore ?? PASS_MARK_DEFAULT;
      const internMsg = distillForIntern(trimmedFb, intScore, passMark);
      await prisma.stageReport.update({
        where: { id: report.id },
        data: {
          status: "GRADED",
          score: intScore,
          feedback: internMsg,
          gradedAt: new Date(),
          divergent: false,
        },
      });
      written++;
      finalized++;
      const verdict = intScore >= passMark ? "PASS" : "FAIL";
      console.log(`  ✓ ${g.reportId} score=${intScore} [SOLO → GRADED · ${verdict}]  rowId=${myRow.id}`);
      continue;
    }

    // Two-grader mode (default): refetch grades and replicate the finalize
    // step from the grade route.
    const allGrades = await prisma.reportGrade.findMany({
      where: { reportId: report.id },
      orderBy: { createdAt: "asc" },
    });
    const submittedGrades = allGrades.filter(
      (gr) => gr.score !== null && gr.score !== undefined && gr.feedback
    );
    const bothInPlace = allGrades.length === 2 && submittedGrades.length === 2;
    let div = false;
    if (bothInPlace) {
      const [a, b] = submittedGrades;
      div = isDivergent(a.score!, b.score!);
      if (div) {
        await prisma.stageReport.update({
          where: { id: report.id },
          data: { divergent: true, status: "UNDER_REVIEW" },
        });
        divergent++;
      } else {
        await prisma.stageReport.update({
          where: { id: report.id },
          data: {
            status: "GRADED",
            score: averageScore(submittedGrades.map((s) => s.score!)),
            feedback: combineFeedback(
              submittedGrades.map((s) => ({ score: s.score!, feedback: s.feedback! }))
            ),
            gradedAt: new Date(),
            divergent: false,
          },
        });
        finalized++;
      }
    }
    written++;
    console.log(
      `  ✓ ${g.reportId} score=${intScore}${bothInPlace ? (div ? " [divergent → UNDER_REVIEW]" : " [finalized → GRADED]") : " [waiting for peer]"}  rowId=${myRow.id}`
    );
  }

  console.log(`\nWrote ${written} grade(s). Finalized: ${finalized}. Divergent escalations: ${divergent}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
