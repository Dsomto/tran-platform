import { config } from "dotenv";

config();
config({ path: ".env.local" });

import { PrismaClient, Stage } from "../src/generated/prisma";
import {
  ADVANCED_RANKING_STAGES,
  rankAdvancedStage,
  type AdvancedRankingCandidate,
  type AdvancedRankingTrack,
  type AdvancedScoreRecord,
} from "../src/lib/advanced-ranking";

/**
 * Read-only Stage 9 integrity review. It uses the same percentile engine as
 * the admin finalization flow and never changes reports or intern status.
 *
 *   npx tsx scripts/advanced-track-ranking.ts > advanced-ranking.csv
 *   REQUIRE_QA=0 npx tsx scripts/advanced-track-ranking.ts
 */
const prisma = new PrismaClient();
const REQUIRE_QA = process.env.REQUIRE_QA !== "0";
const FINAL_STAGE = Stage.STAGE_9;
const TRACKS: AdvancedRankingTrack[] = ["SOC_ANALYSIS", "ETHICAL_HACKING", "GRC"];
const REVIEWABLE = new Set([
  "GRADED",
  "PENDING_PROMOTION",
  "PENDING_ELIMINATION",
  "PASSED",
  "FAILED",
]);

function csv(value: unknown): string {
  const valueText = String(value ?? "");
  return /[",\n]/.test(valueText) ? `"${valueText.replaceAll('"', '""')}"` : valueText;
}

async function main() {
  const reports = await prisma.stageReport.findMany({
    where: { stage: { in: ADVANCED_RANKING_STAGES as unknown as Stage[] } },
    select: {
      id: true,
      internId: true,
      stage: true,
      status: true,
      score: true,
      finalScore: true,
      divergent: true,
      qaVerified: true,
      advancedGateFailed: true,
      intern: {
        select: {
          id: true,
          track: true,
          isActive: true,
          user: { select: { email: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  const currentReports = reports.filter((report) => report.stage === FINAL_STAGE);
  const heldCurrent = currentReports.filter((report) =>
    !report.intern.isActive ||
    !REVIEWABLE.has(report.status) ||
    report.divergent ||
    (REQUIRE_QA && report.qaVerified !== true) ||
    (report.finalScore ?? report.score) === null
  );
  const current = currentReports.filter((report) => !heldCurrent.includes(report));

  const candidates: AdvancedRankingCandidate[] = current.map((report) => ({
    reportId: report.id,
    internId: report.internId,
    track: report.intern.track as AdvancedRankingTrack,
    currentFinalScore: (report.finalScore ?? report.score)!,
    currentReportScore: report.score!,
    gateFailed: report.advancedGateFailed === true,
  }));
  const scoreRecords: AdvancedScoreRecord[] = reports.flatMap((report) => {
    const score = report.finalScore ?? report.score;
    if (
      score === null ||
      !REVIEWABLE.has(report.status) ||
      report.divergent ||
      (REQUIRE_QA && report.qaVerified !== true)
    ) {
      return [];
    }
    return [{
      internId: report.internId,
      track: report.intern.track as AdvancedRankingTrack,
      stage: report.stage as AdvancedScoreRecord["stage"],
      score,
      gateFailed: report.advancedGateFailed === true,
    }];
  });

  const identity = new Map(current.map((report) => [report.internId, {
    name: `${report.intern.user.firstName} ${report.intern.user.lastName}`.trim(),
    email: report.intern.user.email,
  }]));
  const scoresByIntern = new Map<string, Map<string, number>>();
  for (const record of scoreRecords) {
    const scores = scoresByIntern.get(record.internId) ?? new Map<string, number>();
    scores.set(record.stage, record.score);
    scoresByIntern.set(record.internId, scores);
  }

  const ranking = rankAdvancedStage("STAGE_9", candidates, scoreRecords);
  const incomplete = ranking.reduce(
    (count, track) => count + track.rows.filter((row) => row.incomplete).length,
    0
  );
  console.error(
    `Read-only Stage 9 percentile ranking. QA required: ${REQUIRE_QA}. ` +
    `Held current reports: ${heldCurrent.length}. Missing history: ${incomplete}.`
  );
  console.log([
    "track",
    "rank",
    "track_cohort",
    "review_status",
    "name",
    "email",
    "stage_5",
    "stage_6",
    "stage_7",
    "stage_8",
    "stage_9",
    "stage_9_percentile",
    "cumulative_weighted_percentile",
  ].join(","));

  for (const trackResult of ranking) {
    const boundaryIds = new Set(trackResult.boundaryReportIds);
    for (const row of trackResult.rows) {
      const person = identity.get(row.internId)!;
      const scores = scoresByIntern.get(row.internId) ?? new Map<string, number>();
      const reviewStatus = row.gateFailed
        ? "AUTOMATIC_GATE_FAILURE"
        : row.incomplete
          ? "HELD_INCOMPLETE"
          : boundaryIds.has(row.reportId)
            ? "BOUNDARY_REVIEW"
            : row.selected
              ? "PROVISIONAL_TOP_3"
              : "RESERVE";
      console.log([
        trackResult.track,
        row.rank,
        row.cohortSize,
        reviewStatus,
        person.name,
        person.email,
        ...ADVANCED_RANKING_STAGES.map((stage) => scores.get(stage)),
        row.percentile?.toFixed(2),
        row.cumulativePercentile?.toFixed(2),
      ].map(csv).join(","));
    }
  }

  for (const track of TRACKS) {
    if (!ranking.some((result) => result.track === track)) {
      console.error(`${track}: no ranking result generated.`);
    }
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
