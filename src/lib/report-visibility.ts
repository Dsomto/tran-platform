const RELEASED_REPORT_STATUSES = new Set(["PASSED", "FAILED"]);
const PRIVATE_PENDING_REPORT_STATUSES = new Set(["PENDING_PROMOTION", "PENDING_ELIMINATION"]);

export function isReportResultReleased(status: string | null | undefined): boolean {
  return status != null && RELEASED_REPORT_STATUSES.has(status);
}

export function publicReportStatus(status: string): string {
  return PRIVATE_PENDING_REPORT_STATUSES.has(status) ? "GRADED" : status;
}

export function redactUnreleasedReportResult<
  T extends {
    status: string;
    score?: number | null;
    feedback?: string | null;
    terminalScore?: number | null;
    finalScore?: number | null;
  },
>(report: T): T {
  if (isReportResultReleased(report.status)) return report;

  const redacted = {
    ...report,
    status: publicReportStatus(report.status),
    score: null,
    feedback: null,
  };

  if ("terminalScore" in redacted) {
    (redacted as T & { terminalScore: null }).terminalScore = null;
  }
  if ("finalScore" in redacted) {
    (redacted as T & { finalScore: null }).finalScore = null;
  }

  return redacted;
}
