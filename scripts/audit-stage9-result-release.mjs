import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";

config();
config({ path: ".env.local", override: true });

const { PrismaClient } = await import("../src/generated/prisma/index.js");
const prisma = new PrismaClient();

const decisions = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "marking-guides/stage9-assessor-decisions.json"), "utf8")
);

function counts(rows, key) {
  return Object.fromEntries(
    [...new Set(rows.map((row) => row[key] ?? "null"))]
      .sort()
      .map((value) => [value, rows.filter((row) => (row[key] ?? "null") === value).length])
  );
}

async function main() {
  const internIds = decisions.map((row) => row.internId);
  const [reports, interns, queue, window] = await Promise.all([
    prisma.stageReport.findMany({
      where: { stage: "STAGE_9", internId: { in: internIds } },
      select: {
        id: true,
        internId: true,
        status: true,
        score: true,
        finalScore: true,
        reportUrl: true,
        submittedAt: true,
        gradedAt: true,
        qaVerified: true,
        finalizedAt: true,
        advancedRank: true,
        advancedCohortSize: true,
        advancedCumulativePercentile: true,
      },
    }),
    prisma.intern.findMany({
      where: { id: { in: internIds } },
      select: {
        id: true,
        currentStage: true,
        isActive: true,
        eliminatedAt: true,
        user: { select: { email: true, firstName: true, lastName: true } },
      },
    }),
    prisma.emailQueueItem.findMany({
      where: { kind: { in: ["STAGE_PASSED", "STAGE_FAILED"] } },
      orderBy: { enqueuedAt: "desc" },
      take: 1000,
      select: { id: true, toEmail: true, subject: true, status: true, context: true, enqueuedAt: true },
    }),
    prisma.stageWindow.findUnique({ where: { stage: "STAGE_9" } }),
  ]);

  const reportByIntern = new Map(reports.map((row) => [row.internId, row]));
  const internById = new Map(interns.map((row) => [row.id, row]));
  const stage9Queue = queue.filter((row) => row.context?.stage === "STAGE_9");
  const missingReports = decisions.filter((row) => !reportByIntern.has(row.internId));
  const mismatches = decisions.flatMap((decision) => {
    const report = reportByIntern.get(decision.internId);
    if (!report || decision.technicalScore90 === null) return [];
    return report.score === decision.technicalScore90 ? [] : [{
      name: decision.name,
      reportId: report.id,
      databaseScore: report.score,
      reviewedScore: decision.technicalScore90,
    }];
  });

  console.log(JSON.stringify({
    cohort: decisions.length,
    decisions: counts(decisions, "reviewState"),
    liveReports: reports.length,
    reportStatuses: counts(reports, "status"),
    qaVerified: reports.filter((row) => row.qaVerified === true).length,
    missingReports: missingReports.map((row) => ({
      name: row.name,
      email: row.email,
      technicalScore90: row.technicalScore90,
      folderUrl: row.folderUrl,
      reviewState: row.reviewState,
      intern: internById.get(row.internId) ?? null,
    })),
    scoreMismatches: mismatches,
    liveInterns: interns.length,
    internStages: counts(interns, "currentStage"),
    activeInterns: interns.filter((row) => row.isActive).length,
    stage9Window: window ? { status: window.status, isLocked: window.isLocked } : null,
    existingStage9ResultQueue: {
      total: stage9Queue.length,
      statuses: counts(stage9Queue, "status"),
      rows: stage9Queue.map((row) => ({
        toEmail: row.toEmail,
        subject: row.subject,
        status: row.status,
        enqueuedAt: row.enqueuedAt,
      })),
    },
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
