type Stage9CredentialReport = {
  stage: string;
  status: string;
  submittedAt?: Date | null;
  score?: number | null;
};

/** Stage 9A progression creates a finalist, not a completed-programme credential. */
export function isStage9BFinalist(report: Stage9CredentialReport): boolean {
  return report.stage === "STAGE_9" && report.status === "PASSED";
}

/**
 * Associates who submitted and were assessed at Stage 9A receive a truthful
 * completion credential even when they did not enter the ten-person final.
 * A missing submission never becomes a certificate through a zero row.
 */
export function isStage9AssessedDeparture(report: Stage9CredentialReport): boolean {
  return report.stage === "STAGE_9"
    && report.status === "FAILED"
    && report.submittedAt instanceof Date
    && report.score !== null
    && report.score !== undefined;
}
