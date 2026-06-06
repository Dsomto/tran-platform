import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

/**
 * Solo-finalize every Grader Six grade. The two-grader rule is suspended for
 * Cohort 1 Stage 0 because Saturday's deadline does not allow time for a
 * second pass — the programme head approved skipping the second grader on
 * the morning of 6 June 2026.
 *
 * For each ReportGrade where graderId = Grader Six AND the parent
 * StageReport is still SUBMITTED or UNDER_REVIEW:
 *   - Set StageReport.score = the Grader Six score (no averaging)
 *   - Set StageReport.feedback = a short, intern-facing message:
 *       - pass (>=70): "Well done. You cleared Stage 0. See you at Stage 1."
 *         plus one short positive line distilled from the detailed feedback
 *       - fail (<70): "You did not clear Stage 0 this cohort." plus one
 *         specific gap distilled from the detailed feedback
 *   - Set status = GRADED, gradedAt = now, divergent = false
 *
 * The detailed paragraph-style feedback stays on the ReportGrade row so
 * super-admins and audit have the full reasoning. Only the StageReport
 * cover message is the short version interns see.
 *
 * Usage:
 *   npx tsx scripts/finalize-grader-six-solo.ts            # inspect
 *   COMMIT=1 npx tsx scripts/finalize-grader-six-solo.ts   # write
 */

const prisma = new PrismaClient();
const COMMIT = process.env.COMMIT === "1";
const PASS_MARK = 70;

function distillForIntern(feedback: string, score: number): string {
  // Find the first sentence that names a specific concrete gap or strength.
  // Prefer sentences mentioning a deliverable label (D1-D4), an ISC2 canon,
  // an SD ticket number, a citation, or a Sankofa-specific concept.
  const sentences = feedback
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
  const passing = score >= PASS_MARK;

  if (passing) {
    const positive = sentences.find((s) =>
      /\b(strong|clean|solid|sharp|confident|genuinely|correctly|right|cleanly|specific|well|excellent)\b/i.test(s),
    );
    const note = positive ?? sentences[0] ?? "";
    return (
      "Well done. You cleared Stage 0 and we will see you at Stage 1.\n\n" +
      "One thing that stood out: " +
      note
    );
  } else {
    const negative = sentences.find((s) =>
      /\b(missed|missing|did not|does not|fabricated|invented|wrong|absent|incomplete|not match|not name|no.*canon|template|placeholder|outline)\b/i.test(s),
    );
    const note = negative ?? sentences[0] ?? "";
    return (
      "You did not clear Stage 0 in this cohort.\n\n" +
      "The main gap: " +
      note +
      "\n\n" +
      "We thank you for your effort and wish you well in your continued cybersecurity learning."
    );
  }
}

(async () => {
  const grader = await prisma.user.findUnique({
    where: { email: "grader6@ubuntubridgeinitiatives.org" },
    select: { id: true },
  });
  if (!grader) {
    console.error("Grader Six account not found");
    process.exit(2);
  }

  const grades = await prisma.reportGrade.findMany({
    where: {
      graderId: grader.id,
      score: { not: null },
      feedback: { not: null },
    },
    include: {
      report: {
        select: {
          id: true,
          status: true,
          intern: { select: { user: { select: { firstName: true, lastName: true } } } },
        },
      },
    },
  });

  const eligible = grades.filter(
    (g) => g.report.status === "SUBMITTED" || g.report.status === "UNDER_REVIEW",
  );

  console.log(`Found ${grades.length} grades by Grader Six total.`);
  console.log(`Of these, ${eligible.length} have a parent report that is still not finalised.\n`);

  let passed = 0;
  let failed = 0;
  for (const g of eligible) {
    const score = g.score!;
    const detailed = g.feedback!;
    const internMsg = distillForIntern(detailed, score);
    const isPass = score >= PASS_MARK;
    if (isPass) passed++;
    else failed++;
    const name = `${g.report.intern.user.firstName} ${g.report.intern.user.lastName}`;
    console.log(`${isPass ? "PASS" : "FAIL"}  ${String(score).padStart(3)}  ${name}`);
    if (COMMIT) {
      await prisma.stageReport.update({
        where: { id: g.report.id },
        data: {
          status: "GRADED",
          score,
          feedback: internMsg,
          gradedAt: new Date(),
          divergent: false,
        },
      });
    }
  }
  console.log(
    `\n${COMMIT ? "Wrote" : "Would write"} ${eligible.length} finalisations: ${passed} pass, ${failed} fail.`,
  );
  if (!COMMIT) console.log("INSPECT mode. Re-run with COMMIT=1 to actually finalise.");
  await prisma.$disconnect();
})();
