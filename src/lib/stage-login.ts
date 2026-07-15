// Slimmed down: per-stage door login was removed. The main dashboard session
// (cookie-based JWT) is the only auth gate now. This file just exposes the
// stage-slug ↔ enum mapping that other modules still need.

export type StageSlug =
  | "stage-0"
  | "stage-1"
  | "stage-2"
  | "stage-3"
  | "stage-4"
  | "stage-5"
  | "stage-6"
  | "stage-7"
  | "stage-8"
  | "stage-9";

export type StageKey =
  | "STAGE_0"
  | "STAGE_1"
  | "STAGE_2"
  | "STAGE_3"
  | "STAGE_4"
  | "STAGE_5"
  | "STAGE_6"
  | "STAGE_7"
  | "STAGE_8"
  | "STAGE_9";

export const STAGE_SLUGS: StageSlug[] = [
  "stage-0",
  "stage-1",
  "stage-2",
  "stage-3",
  "stage-4",
  "stage-5",
  "stage-6",
  "stage-7",
  "stage-8",
  "stage-9",
];

export const STAGE_SLUG_TO_ENUM: Record<StageSlug, StageKey> = {
  "stage-0": "STAGE_0",
  "stage-1": "STAGE_1",
  "stage-2": "STAGE_2",
  "stage-3": "STAGE_3",
  "stage-4": "STAGE_4",
  "stage-5": "STAGE_5",
  "stage-6": "STAGE_6",
  "stage-7": "STAGE_7",
  "stage-8": "STAGE_8",
  "stage-9": "STAGE_9",
};

export const STAGE_ENUM_TO_SLUG: Record<StageKey, StageSlug> = {
  STAGE_0: "stage-0",
  STAGE_1: "stage-1",
  STAGE_2: "stage-2",
  STAGE_3: "stage-3",
  STAGE_4: "stage-4",
  STAGE_5: "stage-5",
  STAGE_6: "stage-6",
  STAGE_7: "stage-7",
  STAGE_8: "stage-8",
  STAGE_9: "stage-9",
};

/** Numeric rank for "at-or-past this stage" checks. STAGE_X → X. */
export function stageRank(stage: string): number {
  const m = stage.match(/STAGE_(\d+)/);
  return m ? Number(m[1]) : -1;
}
