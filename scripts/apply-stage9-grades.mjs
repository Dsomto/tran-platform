import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";

config({ quiet: true });
config({ path: ".env.local", override: true, quiet: true });

const { PrismaClient } = await import("../src/generated/prisma/index.js");
const prisma = new PrismaClient();
const COMMIT = process.env.COMMIT === "1";
const STAGE = "STAGE_9";
const decisions = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "marking-guides/stage9-assessor-decisions.json"), "utf8")
);

async function main() {
  const assessed = decisions.filter((row) => row.technicalScore90 !== null);
  const noSubmission = decisions.filter((row) => row.reviewState === "NO_SUBMISSION");
  if (decisions.length !== 34 || assessed.length !== 33 || noSubmission.length !== 1) {
    throw new Error(`Expected 34 decisions, 33 assessed and one non-submitter; found ${decisions.length}/${assessed.length}/${noSubmission.length}`);
  }
  if (assessed.some((row) => !Number.isInteger(row.technicalScore90) || row.technicalScore90 < 0 || row.technicalScore90 > 90)) {
    throw new Error("Every assessed Stage 9A technical score must be an integer from 0 to 90");
  }
  if (assessed.some((row) => typeof row.feedback !== "string" || row.feedback.length < 1000)) {
    throw new Error("Every assessed row must carry the full detailed feedback");
  }

  const actor = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN", email: { contains: "dsomto" } },
    select: { id: true, email: true, role: true },
  });
  if (!actor) throw new Error("Somto's super-admin account was not found");

  const existing = await prisma.stageReport.findMany({
    where: { stage: STAGE, internId: { in: decisions.map((row) => row.internId) } },
    select: { id: true, internId: true, status: true, reportUrl: true, submittedAt: true },
  });
  const byIntern = new Map(existing.map((row) => [row.internId, row]));
  const create = assessed.filter((row) => !byIntern.has(row.internId));
  const update = assessed.filter((row) => byIntern.has(row.internId));
  if (create.length !== 1 || create[0].email.toLowerCase() !== "mercynuella330@gmail.com") {
    throw new Error(`Expected only Mercy's authorized report to require creation; found ${create.map((row) => row.email).join(", ")}`);
  }
  if (update.some((row) => byIntern.get(row.internId)?.status !== "SUBMITTED")) {
    throw new Error("An existing Stage 9 report is no longer in SUBMITTED state");
  }

  console.log(JSON.stringify({
    mode: COMMIT ? "COMMIT" : "DRY_RUN",
    assessed: assessed.length,
    updateReports: update.length,
    createAuthorizedReport: create.map((row) => ({ name: row.name, email: row.email, url: row.folderUrl, score: row.technicalScore90 })),
    noSubmission: noSubmission.map((row) => ({ name: row.name, email: row.email })),
    qaVerifiedBy: actor.email,
  }, null, 2));
  if (!COMMIT) return;

  const gradedAt = new Date();
  for (const row of update) {
    const report = byIntern.get(row.internId);
    await prisma.stageReport.update({
      where: { id: report.id },
      data: {
        score: row.technicalScore90,
        feedback: row.feedback,
        gradedAt,
        status: "GRADED",
        qaVerified: true,
        qaVerifiedAt: gradedAt,
        qaVerifiedById: actor.id,
        finalScore: null,
        terminalScore: null,
        advancedRank: null,
        advancedCohortSize: null,
        advancedPercentile: null,
        advancedCumulativePercentile: null,
        advancedSelectionRule: null,
        finalizedAt: null,
      },
    });
  }

  const mercy = create[0];
  await prisma.stageReport.create({
    data: {
      internId: mercy.internId,
      stage: STAGE,
      executiveSummary: "Programme-authorized Stage 9A direct submission attached administratively after the portal submission exception.",
      reportUrl: mercy.folderUrl,
      status: "GRADED",
      version: 1,
      score: mercy.technicalScore90,
      feedback: mercy.feedback,
      submittedAt: gradedAt,
      gradedAt,
      qaVerified: true,
      qaVerifiedAt: gradedAt,
      qaVerifiedById: actor.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: "stage9.grades.apply",
      targetType: "STAGE_RESULTS",
      targetId: STAGE,
      details: {
        assessed: assessed.length,
        updated: update.length,
        mercyAuthorizedReportCreated: true,
        noSubmission: noSubmission[0].email,
        source: "stage9-assessor-decisions.json",
      },
    },
  });

  const after = await prisma.stageReport.findMany({
    where: { stage: STAGE, internId: { in: decisions.map((row) => row.internId) } },
    select: { status: true, score: true, qaVerified: true },
  });
  console.log(JSON.stringify({
    committed: true,
    reports: after.length,
    graded: after.filter((row) => row.status === "GRADED").length,
    scored: after.filter((row) => row.score !== null).length,
    qaVerified: after.filter((row) => row.qaVerified === true).length,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
