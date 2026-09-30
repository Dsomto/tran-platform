export const FINALIST_PROJECT_DEADLINE_ISO = "2026-10-06T22:00:00.000Z";

export const FINALIST_PROJECT_DEADLINE_MS = Date.parse(FINALIST_PROJECT_DEADLINE_ISO);

export function finalistProjectSubmissionsClosed(now = Date.now()): boolean {
  return now >= FINALIST_PROJECT_DEADLINE_MS;
}
