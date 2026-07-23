const ADVANCED_STAGE_START = 5;

export function isAdvancedStageKey(stage: string): boolean {
  const stageNumber = Number(stage.replace("STAGE_", ""));
  return Number.isInteger(stageNumber) && stageNumber >= ADVANCED_STAGE_START;
}

export function advancedCadenceError(
  stage: string,
  activeFrom: Date | null,
  submitUntil: Date | null
): string | null {
  if (!isAdvancedStageKey(stage)) return null;
  if (!activeFrom || !submitUntil) {
    return "Advanced stages require both a Monday start and a submission deadline";
  }

  const validStart =
    activeFrom.getUTCDay() === 1 &&
    activeFrom.getUTCHours() === 8 &&
    activeFrom.getUTCMinutes() === 0 &&
    activeFrom.getUTCSeconds() === 0;
  const validDeadline =
    submitUntil.getUTCDay() === 5 &&
    submitUntil.getUTCHours() === 17 &&
    submitUntil.getUTCMinutes() === 10 &&
    submitUntil.getUTCSeconds() === 0;
  const sameWeeklyWindow = submitUntil.getTime() - activeFrom.getTime() === 378_600_000;

  if (!validStart || !validDeadline || !sameWeeklyWindow) {
    return "Advanced-stage cadence is normally Monday 09:00 WAT to Friday 18:10 WAT";
  }
  return null;
}

export function stageTimingChanged(
  previous: { activeFrom: Date | null; submitUntil: Date | null } | null,
  activeFrom: Date | null,
  submitUntil: Date | null
): boolean {
  const previousStart = previous?.activeFrom?.getTime() ?? null;
  const previousDeadline = previous?.submitUntil?.getTime() ?? null;
  return previousStart !== (activeFrom?.getTime() ?? null) ||
    previousDeadline !== (submitUntil?.getTime() ?? null);
}
