import assert from "node:assert/strict";
import test from "node:test";
import {
  advancedAdvanceTarget,
  percentileFromRank,
  rankAdvancedStage,
  type AdvancedRankingCandidate,
  type AdvancedScoreRecord,
} from "./advanced-ranking";

const track = "SOC_ANALYSIS" as const;

function candidates(count: number): AdvancedRankingCandidate[] {
  return Array.from({ length: count }, (_, index) => ({
    reportId: `report-${index + 1}`,
    internId: `intern-${index + 1}`,
    track,
    currentFinalScore: 100 - index,
    currentReportScore: 100 - index,
    gateFailed: false,
  }));
}

function records(stage: "STAGE_5" | "STAGE_6" | "STAGE_7" | "STAGE_8" | "STAGE_9", rows: AdvancedRankingCandidate[]): AdvancedScoreRecord[] {
  return rows.map((row) => ({
    internId: row.internId,
    track: row.track,
    stage,
    score: row.currentFinalScore,
  }));
}

test("percentile rank is 100 for first and 0 for last", () => {
  assert.equal(percentileFromRank(1, 5), 100);
  assert.equal(percentileFromRank(5, 5), 0);
  assert.equal(percentileFromRank(1, 1), 100);
});

test("Stage 5 eliminates the bottom 20 percent per track", () => {
  const rows = candidates(20);
  const result = rankAdvancedStage("STAGE_5", rows, records("STAGE_5", rows))[0];
  assert.equal(result.advanceTarget, 16);
  assert.equal(result.rows.filter((row) => row.selected).length, 16);
});

test("all scored candidates remain in the percentile cohort", () => {
  const rows = candidates(20);
  rows[0].gateFailed = true;
  const scoreRows = records("STAGE_5", rows).map((row) => ({
    ...row,
    gateFailed: row.internId === rows[0].internId,
  }));
  const result = rankAdvancedStage("STAGE_5", rows, scoreRows)[0];
  assert.equal(result.eligible, 20);
  assert.equal(result.advanceTarget, 16);
  assert.equal(result.rows.find((row) => row.rank === 1)?.percentile, 100);
  assert.equal(result.rows.find((row) => row.rank === 20)?.percentile, 0);
  assert.equal(result.rows.find((row) => row.rank === 1)?.cohortSize, 20);
  assert.equal(result.rows.find((row) => row.gateFailed)?.selected, true);
  assert.equal(result.gateFailed, 0);
});

test("published elimination rates produce exact deterministic targets", () => {
  assert.equal(advancedAdvanceTarget("STAGE_5", 93), 75);
  assert.equal(advancedAdvanceTarget("STAGE_5", 56), 45);
  assert.equal(advancedAdvanceTarget("STAGE_5", 20), 16);
  assert.equal(advancedAdvanceTarget("STAGE_6", 20), 15);
  assert.equal(advancedAdvanceTarget("STAGE_7", 15), 11);
  assert.equal(advancedAdvanceTarget("STAGE_8", 20), 6);
  assert.equal(advancedAdvanceTarget("STAGE_9", 6), 3);
});

test("Stage 8 advances six using cumulative weighted percentiles", () => {
  const rows = candidates(10);
  const history = (["STAGE_5", "STAGE_6", "STAGE_7", "STAGE_8"] as const).flatMap((stage) =>
    records(stage, rows)
  );
  const result = rankAdvancedStage("STAGE_8", rows, history)[0];
  assert.equal(result.advanceTarget, 6);
  assert.equal(result.rows.filter((row) => row.selected).length, 6);
  assert.equal(result.rows[0].cumulativePercentile, 100);
});

test("Stage 9 advances three and surfaces an exact boundary tie", () => {
  const rows = candidates(5);
  rows[2].currentFinalScore = 90;
  rows[2].currentReportScore = 90;
  rows[3].currentFinalScore = 90;
  rows[3].currentReportScore = 90;
  rows[4].currentFinalScore = 80;
  rows[4].currentReportScore = 80;
  const history = (["STAGE_5", "STAGE_6", "STAGE_7", "STAGE_8", "STAGE_9"] as const).flatMap((stage) =>
    records(stage, rows)
  );
  const result = rankAdvancedStage("STAGE_9", rows, history)[0];
  assert.equal(result.advanceTarget, 3);
  assert.equal(result.boundaryTie, true);
  assert.deepEqual(result.boundaryReportIds.sort(), ["report-3", "report-4"]);
});
