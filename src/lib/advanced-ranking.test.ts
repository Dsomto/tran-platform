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

test("Stage 5 removes 20 percent of the full track cohort", () => {
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
  assert.equal(advancedAdvanceTarget("STAGE_5", 93), 74);
  assert.equal(advancedAdvanceTarget("STAGE_5", 56), 44);
  assert.equal(advancedAdvanceTarget("STAGE_5", 20), 16);
  assert.equal(advancedAdvanceTarget("STAGE_6", 20), 15);
  assert.equal(advancedAdvanceTarget("STAGE_7", 15), 10);
  assert.equal(advancedAdvanceTarget("STAGE_8", 36, 36, "SOC_ANALYSIS"), 18);
  assert.equal(advancedAdvanceTarget("STAGE_8", 22, 22, "ETHICAL_HACKING"), 11);
  assert.equal(advancedAdvanceTarget("STAGE_8", 8, 8, "GRC"), 5);
  assert.equal(advancedAdvanceTarget("STAGE_9", 18, 18, "SOC_ANALYSIS"), 10);
  assert.equal(advancedAdvanceTarget("STAGE_9", 5, 5, "GRC"), 5);
});

test("later percentage stages also count non-submitters before graded attrition", () => {
  assert.equal(advancedAdvanceTarget("STAGE_6", 16, 20), 15);
  assert.equal(advancedAdvanceTarget("STAGE_7", 11, 15), 10);
  assert.equal(advancedAdvanceTarget("STAGE_6", 10, 20), 10);
  assert.equal(advancedAdvanceTarget("STAGE_7", 9, 15), 9);
});

test("non-submitters consume the elimination quota before scored reports", () => {
  const rows = candidates(10);
  const result = rankAdvancedStage(
    "STAGE_5",
    rows,
    records("STAGE_5", rows),
    { SOC_ANALYSIS: 20 }
  )[0];
  assert.equal(result.rows[0].cohortSize, 20);
  assert.equal(result.advanceTarget, 10);
  assert.equal(result.rows.filter((row) => row.selected).length, 10);
  assert.equal(result.rows.at(-1)?.percentile, 52.63);
});

test("only the remaining attrition shortfall comes from graded reports", () => {
  const rows = candidates(18);
  const result = rankAdvancedStage(
    "STAGE_5",
    rows,
    records("STAGE_5", rows),
    { SOC_ANALYSIS: 20 }
  )[0];
  assert.equal(result.advanceTarget, 16);
  assert.equal(result.rows.filter((row) => row.selected).length, 16);
  assert.equal(result.rows.filter((row) => !row.selected).length, 2);
});

test("Stage 5 final cohort counts allocate attrition per track", () => {
  assert.equal(advancedAdvanceTarget("STAGE_5", 83, 92), 73);
  assert.equal(advancedAdvanceTarget("STAGE_5", 44, 56), 44);
  assert.equal(advancedAdvanceTarget("STAGE_5", 20, 21), 16);
});

test("Stage 8 advances the exact SOC target using cumulative weighted percentiles", () => {
  const rows = candidates(36);
  const history = (["STAGE_5", "STAGE_6", "STAGE_7", "STAGE_8"] as const).flatMap((stage) =>
    records(stage, rows)
  );
  const result = rankAdvancedStage("STAGE_8", rows, history)[0];
  assert.equal(result.advanceTarget, 18);
  assert.equal(result.rows.filter((row) => row.selected).length, 18);
  assert.equal(result.rows[0].cumulativePercentile, 100);
});

test("Stage 9 advances ten and surfaces an exact boundary tie", () => {
  const rows = candidates(12);
  rows[9].currentFinalScore = 80;
  rows[9].currentReportScore = 80;
  rows[10].currentFinalScore = 80;
  rows[10].currentReportScore = 80;
  rows[11].currentFinalScore = 70;
  rows[11].currentReportScore = 70;
  const history = (["STAGE_5", "STAGE_6", "STAGE_7", "STAGE_8", "STAGE_9"] as const).flatMap((stage) =>
    records(stage, rows)
  );
  const result = rankAdvancedStage("STAGE_9", rows, history)[0];
  assert.equal(result.advanceTarget, 10);
  assert.equal(result.boundaryTie, true);
  assert.deepEqual(result.boundaryReportIds.sort(), ["report-10", "report-11"]);
});

test("boundary ties keep the exact target and require a recorded QA distinction", () => {
  const rows = candidates(12);
  rows[9].currentFinalScore = 80;
  rows[9].currentReportScore = 80;
  rows[10].currentFinalScore = 80;
  rows[10].currentReportScore = 80;
  rows[11].currentFinalScore = 70;
  rows[11].currentReportScore = 70;
  const history = (["STAGE_5", "STAGE_6", "STAGE_7", "STAGE_8", "STAGE_9"] as const).flatMap((stage) =>
    records(stage, rows)
  );
  const result = rankAdvancedStage("STAGE_9", rows, history)[0];
  const selected = result.rows.filter((row) => row.selected);
  assert.equal(selected.length, 10);
  assert.equal(result.rows.find((row) => row.reportId === "report-11")?.selected, false);
  assert.match(
    result.rows.find((row) => row.reportId === "report-10")?.selectionReason ?? "",
    /boundary tie requires QA/
  );
});
