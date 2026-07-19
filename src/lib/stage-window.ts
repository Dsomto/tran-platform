type StageWindowTiming = {
  status: string;
  activeFrom: Date | null;
  submitUntil?: Date | null;
};

export function stageWindowHasStarted(
  window: StageWindowTiming | null | undefined,
  now = Date.now()
): boolean {
  return Boolean(
    window?.status === "OPEN" &&
    (!window.activeFrom || window.activeFrom.getTime() <= now)
  );
}

export function stageWindowAcceptsSubmissions(
  window: StageWindowTiming | null | undefined,
  now = Date.now()
): boolean {
  return Boolean(
    stageWindowHasStarted(window, now) &&
    (!window?.submitUntil || now <= window.submitUntil.getTime())
  );
}
