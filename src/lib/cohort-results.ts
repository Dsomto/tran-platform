// Cohort 1 totals reconstructed from finalized stage audit entries and the
// explicit probation reinstatement actions that followed those finalizations.
// These totals are independent of account retention and must not be replaced
// with StageReport row counts until the deleted historical rows are restored.
export const COHORT_1_OFFICIAL_PASS_COUNTS: Readonly<Record<string, number>> = {
  STAGE_0: 259,
  STAGE_1: 226,
  STAGE_2: 190,
  STAGE_3: 176,
  STAGE_4: 169,
};

export function getCohort1OfficialPassCount(stage: string): number | undefined {
  return COHORT_1_OFFICIAL_PASS_COUNTS[stage];
}
