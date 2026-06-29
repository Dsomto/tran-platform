import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

const JOURNAL =
  process.env.JOURNAL ??
  "/Users/dsomto891/.claude/projects/-Users-dsomto891-hng/48f3b5c9-55e3-4eab-9d82-9d458fc8cdb8/subagents/workflows/wf_919d7133-cdd/journal.jsonl";
const INPUT = process.env.INPUT;
const OUT = process.env.OUT ?? "marking-guides/stage1-grades-six-completed-46.json";
const GRADER_EMAIL = process.env.GRADER_EMAIL ?? "grader6@ubuntubridgeinitiatives.org";
const COMMIT = process.env.COMMIT === "1";

type WorkflowGrade = {
  reportId: string;
  name?: string;
  task3: number;
  task6: number;
  task7: number;
  task10: number;
  capstone: number;
  fabricationPenalty: number;
  reportScore: number;
  cannotAssess: boolean;
  seniorReviewFlag: boolean;
  flagReason?: string;
  missingPieces?: string;
  feedback: string;
};

function loadGrades(): WorkflowGrade[] {
  if (INPUT) {
    const parsed = JSON.parse(readFileSync(INPUT, "utf8"));
    if (!Array.isArray(parsed)) throw new Error(`INPUT must be a JSON array: ${INPUT}`);
    return parsed;
  }

  const grades: WorkflowGrade[] = [];
  const seen = new Set<string>();
  for (const line of readFileSync(JOURNAL, "utf8").split(/\n/)) {
    if (!line.trim()) continue;
    const entry = JSON.parse(line);
    const result = entry?.result;
    if (entry?.type !== "result" || !result?.reportId || typeof result.reportScore !== "number") {
      continue;
    }
    if (seen.has(result.reportId)) {
      throw new Error(`Duplicate workflow grade for ${result.reportId}`);
    }
    seen.add(result.reportId);
    grades.push(result);
  }
  return grades;
}

function validateGrade(g: WorkflowGrade) {
  const calc = Math.max(
    0,
    g.task3 + g.task6 + g.task7 + g.task10 + g.capstone - g.fabricationPenalty,
  );
  if (g.reportScore !== calc) {
    throw new Error(`${g.reportId} arithmetic mismatch: reportScore=${g.reportScore}, calc=${calc}`);
  }
  if (g.reportScore < 0 || g.reportScore > 100) {
    throw new Error(`${g.reportId} score out of range: ${g.reportScore}`);
  }
  if (typeof g.feedback !== "string" || g.feedback.trim().length < 30) {
    throw new Error(`${g.reportId} feedback missing or too short`);
  }
  if (g.feedback.includes("—")) {
    throw new Error(`${g.reportId} feedback contains an em dash`);
  }
}

async function main() {
  const grades = loadGrades();
  for (const grade of grades) validateGrade(grade);

  writeFileSync(OUT, JSON.stringify(grades, null, 2) + "\n");

  const grader = await prisma.user.findUnique({
    where: { email: GRADER_EMAIL },
    select: { id: true, email: true },
  });
  if (!grader) throw new Error(`Grader account not found: ${GRADER_EMAIL}`);

  const cannotAssess = grades.filter((g) => g.cannotAssess);
  console.log(`Mode: ${COMMIT ? "COMMIT" : "DRY RUN"}`);
  console.log(`Loaded ${grades.length} completed workflow grade(s) from ${JOURNAL}`);
  console.log(`Saved extracted JSON to ${OUT}`);
  console.log(`Grader account: ${grader.email}`);
  if (cannotAssess.length) {
    console.log(`cannotAssess entries included by request: ${cannotAssess.length}`);
    for (const g of cannotAssess) {
      console.log(`  - ${g.name ?? "Unknown"} (${g.reportId}) score=${g.reportScore}`);
    }
  }
  console.log("");

  let written = 0;
  let skipped = 0;
  for (const grade of grades) {
    const report = await prisma.stageReport.findUnique({
      where: { id: grade.reportId },
      include: {
        grades: true,
        intern: { select: { user: { select: { firstName: true, lastName: true, email: true } } } },
      },
    });
    if (!report) {
      console.log(`SKIP missing report ${grade.reportId}`);
      skipped++;
      continue;
    }
    if (report.stage !== "STAGE_1") {
      console.log(`SKIP non-STAGE_1 report ${grade.reportId} (${report.stage})`);
      skipped++;
      continue;
    }
    if (report.status !== "SUBMITTED" && report.status !== "UNDER_REVIEW") {
      console.log(`SKIP non-open report ${grade.reportId} (${report.status})`);
      skipped++;
      continue;
    }

    const existing = report.grades.find((g) => g.graderId === grader.id);
    const feedback = grade.feedback.trim();
    const name =
      `${report.intern.user.firstName ?? ""} ${report.intern.user.lastName ?? ""}`.trim() ||
      report.intern.user.email;

    console.log(
      `${COMMIT ? "APPLY" : "WOULD"} ${grade.reportId} score=${grade.reportScore} ${name}` +
        (grade.cannotAssess ? " [cannotAssess]" : ""),
    );

    if (!COMMIT) continue;

    if (existing) {
      await prisma.reportGrade.update({
        where: { id: existing.id },
        data: {
          score: grade.reportScore,
          feedback,
          gradedAt: new Date(),
          aiFlagged: false,
          aiFlagReason: null,
        },
      });
    } else {
      await prisma.reportGrade.create({
        data: {
          reportId: report.id,
          graderId: grader.id,
          score: grade.reportScore,
          feedback,
          gradedAt: new Date(),
          aiFlagged: false,
          aiFlagReason: null,
        },
      });
    }

    await prisma.stageReport.update({
      where: { id: report.id },
      data: {
        status: "GRADED",
        score: grade.reportScore,
        feedback,
        gradedAt: new Date(),
        divergent: false,
      },
    });
    written++;
  }

  console.log("");
  console.log(`${COMMIT ? "Wrote" : "Would write"} ${COMMIT ? written : grades.length - skipped} grade(s). Skipped: ${skipped}.`);
  if (!COMMIT) console.log("No database writes made. Re-run with COMMIT=1 to apply.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
