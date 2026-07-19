export const ADVANCED_RANKING_STAGES = [
  "STAGE_5",
  "STAGE_6",
  "STAGE_7",
  "STAGE_8",
  "STAGE_9",
] as const;

export type AdvancedRankingStage = (typeof ADVANCED_RANKING_STAGES)[number];
export type AdvancedRankingTrack = "SOC_ANALYSIS" | "ETHICAL_HACKING" | "GRC";

export const ADVANCED_STAGE_WEIGHTS: Record<AdvancedRankingStage, number> = {
  STAGE_5: 1,
  STAGE_6: 1,
  STAGE_7: 1.5,
  STAGE_8: 2,
  STAGE_9: 2.5,
};

export type AdvancedSelectionPolicy = {
  stage: AdvancedRankingStage;
  basis: "CURRENT_STAGE_PERCENTILE" | "CUMULATIVE_WEIGHTED_PERCENTILE";
  eliminationRate: number | null;
  fixedAdvancePerTrack: number | null;
  label: string;
};

export const ADVANCED_SELECTION_POLICIES: Record<
  AdvancedRankingStage,
  AdvancedSelectionPolicy
> = {
  STAGE_5: {
    stage: "STAGE_5",
    basis: "CURRENT_STAGE_PERCENTILE",
    eliminationRate: 0.2,
    fixedAdvancePerTrack: null,
    label: "Eliminate the bottom 20% within each track",
  },
  STAGE_6: {
    stage: "STAGE_6",
    basis: "CURRENT_STAGE_PERCENTILE",
    eliminationRate: 0.25,
    fixedAdvancePerTrack: null,
    label: "Eliminate the bottom 25% within each track",
  },
  STAGE_7: {
    stage: "STAGE_7",
    basis: "CURRENT_STAGE_PERCENTILE",
    eliminationRate: 0.33,
    fixedAdvancePerTrack: null,
    label: "Eliminate the bottom 33% within each track",
  },
  STAGE_8: {
    stage: "STAGE_8",
    basis: "CUMULATIVE_WEIGHTED_PERCENTILE",
    eliminationRate: null,
    fixedAdvancePerTrack: 6,
    label: "Advance the top 6 in each track by cumulative weighted percentile",
  },
  STAGE_9: {
    stage: "STAGE_9",
    basis: "CUMULATIVE_WEIGHTED_PERCENTILE",
    eliminationRate: null,
    fixedAdvancePerTrack: 3,
    label: "Select the top 3 in each track by cumulative weighted percentile",
  },
};

export type AdvancedRankingCandidate = {
  reportId: string;
  internId: string;
  track: AdvancedRankingTrack;
  currentFinalScore: number;
  currentReportScore: number;
  gateFailed: boolean;
};

export type AdvancedScoreRecord = {
  internId: string;
  track: AdvancedRankingTrack;
  stage: AdvancedRankingStage;
  score: number;
  gateFailed?: boolean;
};

export type AdvancedRankedCandidate = AdvancedRankingCandidate & {
  rank: number | null;
  cohortSize: number;
  percentile: number | null;
  cumulativePercentile: number | null;
  selected: boolean;
  incomplete: boolean;
  selectionMetric: number | null;
  selectionReason: string;
};

export type AdvancedTrackRanking = {
  track: AdvancedRankingTrack;
  eligible: number;
  gateFailed: number;
  incomplete: number;
  advanceTarget: number;
  boundaryTie: boolean;
  boundaryReportIds: string[];
  rows: AdvancedRankedCandidate[];
};

const TRACKS: AdvancedRankingTrack[] = ["SOC_ANALYSIS", "ETHICAL_HACKING", "GRC"];

export function isAdvancedRankingStage(value: string): value is AdvancedRankingStage {
  return (ADVANCED_RANKING_STAGES as readonly string[]).includes(value);
}

export function advancedSelectionPolicy(stage: AdvancedRankingStage): AdvancedSelectionPolicy {
  return ADVANCED_SELECTION_POLICIES[stage];
}

export function advancedAdvanceTarget(
  stage: AdvancedRankingStage,
  eligibleCount: number
): number {
  const policy = advancedSelectionPolicy(stage);
  if (policy.fixedAdvancePerTrack !== null) {
    return Math.min(policy.fixedAdvancePerTrack, eligibleCount);
  }
  return eligibleCount - Math.floor(eligibleCount * policy.eliminationRate!);
}

export function percentileFromRank(rank: number, cohortSize: number): number {
  if (cohortSize <= 1) return 100;
  return round2(((cohortSize - rank) / (cohortSize - 1)) * 100);
}

function stageIndex(stage: AdvancedRankingStage): number {
  return ADVANCED_RANKING_STAGES.indexOf(stage);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function rankingKey(row: Pick<AdvancedRankedCandidate, "selectionMetric" | "currentFinalScore" | "currentReportScore">): string {
  return [row.selectionMetric?.toFixed(2) ?? "missing", row.currentFinalScore, row.currentReportScore].join(":");
}

function percentileMap(records: AdvancedScoreRecord[]): Map<string, number> {
  const byStageTrack = new Map<string, AdvancedScoreRecord[]>();
  for (const record of records) {
    if (record.gateFailed === true) continue;
    const key = `${record.stage}:${record.track}`;
    const list = byStageTrack.get(key) ?? [];
    list.push(record);
    byStageTrack.set(key, list);
  }

  const result = new Map<string, number>();
  for (const rows of byStageTrack.values()) {
    rows.sort((left, right) => right.score - left.score || left.internId.localeCompare(right.internId));
    let priorScore: number | null = null;
    let rank = 0;
    rows.forEach((row, index) => {
      if (priorScore === null || row.score !== priorScore) rank = index + 1;
      priorScore = row.score;
      result.set(`${row.stage}:${row.internId}`, percentileFromRank(rank, rows.length));
    });
  }
  return result;
}

export function rankAdvancedStage(
  stage: AdvancedRankingStage,
  candidates: AdvancedRankingCandidate[],
  scoreRecords: AdvancedScoreRecord[]
): AdvancedTrackRanking[] {
  const policy = advancedSelectionPolicy(stage);
  const percentiles = percentileMap(scoreRecords);
  const includedStages = ADVANCED_RANKING_STAGES.slice(0, stageIndex(stage) + 1);

  return TRACKS.map((track) => {
    const trackCandidates = candidates.filter((candidate) => candidate.track === track);
    const rows: AdvancedRankedCandidate[] = trackCandidates.map((candidate) => {
      const stagePercentiles = includedStages.map((includedStage) => ({
        stage: includedStage,
        value: percentiles.get(`${includedStage}:${candidate.internId}`),
      }));
      const incomplete = stagePercentiles.some((entry) => entry.value === undefined);
      const currentPercentile = percentiles.get(`${stage}:${candidate.internId}`) ?? null;
      const cumulativePercentile = incomplete
        ? null
        : round2(
            stagePercentiles.reduce(
              (sum, entry) => sum + entry.value! * ADVANCED_STAGE_WEIGHTS[entry.stage],
              0
            ) /
              stagePercentiles.reduce(
                (sum, entry) => sum + ADVANCED_STAGE_WEIGHTS[entry.stage],
                0
              )
          );
      const selectionMetric =
        policy.basis === "CURRENT_STAGE_PERCENTILE"
          ? currentPercentile
          : cumulativePercentile;

      return {
        ...candidate,
        rank: null,
        cohortSize: 0,
        percentile: currentPercentile,
        cumulativePercentile,
        selected: false,
        incomplete,
        selectionMetric,
        selectionReason: candidate.gateFailed
          ? "Automatic fail gate recorded before ranking"
          : incomplete
            ? "Held: one or more required advanced-stage scores are missing"
            : policy.label,
      };
    });

    const eligibleRows = rows
      .filter((row) => !row.gateFailed && !row.incomplete && row.selectionMetric !== null)
      .sort(
        (left, right) =>
          right.selectionMetric! - left.selectionMetric! ||
          right.currentFinalScore - left.currentFinalScore ||
          right.currentReportScore - left.currentReportScore ||
          left.internId.localeCompare(right.internId)
      );

    rows.forEach((row) => {
      row.cohortSize = eligibleRows.length;
    });

    let priorKey: string | null = null;
    let rank = 0;
    eligibleRows.forEach((row, index) => {
      const key = rankingKey(row);
      if (priorKey === null || key !== priorKey) rank = index + 1;
      priorKey = key;
      row.rank = rank;
    });

    const advanceTarget = advancedAdvanceTarget(stage, eligibleRows.length);

    eligibleRows.forEach((row, index) => {
      row.selected = index < advanceTarget;
      row.selectionReason = row.selected
        ? `${policy.label}; provisional rank ${row.rank} of ${eligibleRows.length}`
        : `${policy.label}; provisional rank ${row.rank} of ${eligibleRows.length} falls below the advance boundary`;
    });

    const lastSelected = advanceTarget > 0 ? eligibleRows[advanceTarget - 1] : null;
    const firstReserve = advanceTarget < eligibleRows.length ? eligibleRows[advanceTarget] : null;
    const boundaryTie = Boolean(
      lastSelected && firstReserve && rankingKey(lastSelected) === rankingKey(firstReserve)
    );
    const boundaryKey = boundaryTie && lastSelected ? rankingKey(lastSelected) : null;
    const boundaryReportIds = boundaryKey
      ? eligibleRows.filter((row) => rankingKey(row) === boundaryKey).map((row) => row.reportId)
      : [];

    return {
      track,
      eligible: eligibleRows.length,
      gateFailed: rows.filter((row) => row.gateFailed).length,
      incomplete: rows.filter((row) => row.incomplete && !row.gateFailed).length,
      advanceTarget,
      boundaryTie,
      boundaryReportIds,
      rows: rows.sort((left, right) => {
        if (left.rank === null && right.rank === null) return left.internId.localeCompare(right.internId);
        if (left.rank === null) return 1;
        if (right.rank === null) return -1;
        return left.rank - right.rank || left.internId.localeCompare(right.internId);
      }),
    };
  });
}
