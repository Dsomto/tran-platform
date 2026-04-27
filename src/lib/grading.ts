// Shared constants and helpers for the two-grader flow.

// Two graders score every report. If their scores differ by more than this
// many points, the report does NOT auto-average. It is flagged divergent
// and routed to the super-admin tiebreak queue.
export const DIVERGENCE_THRESHOLD = 15;

// Per-grader cap on simultaneous open claims. Prevents one grader from
// vacuuming the queue and starving the other 9.
export const MAX_ACTIVE_CLAIMS_PER_GRADER = 5;

// A claim left untouched for this long (no grade submitted) gets auto-released
// back to the queue by the stale-release endpoint.
export const STALE_CLAIM_HOURS = 72;

// Format the two graders' feedback into one block the intern reads. We label
// the reviewers A and B in the order the caller provides — typically that's
// claim order from the database (oldest grade row first). We deliberately do
// NOT sort by score: doing so would leak which reviewer was harsher, which
// undermines the anonymity of the two-grader process.
export function combineFeedback(parts: { score: number; feedback: string }[]): string {
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].feedback;
  const labels = ["Reviewer A", "Reviewer B"];
  return parts
    .map((p, i) => `— ${labels[i]} —\n${p.feedback.trim()}`)
    .join("\n\n");
}

export function isDivergent(scoreA: number, scoreB: number): boolean {
  return Math.abs(scoreA - scoreB) > DIVERGENCE_THRESHOLD;
}

export function averageScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((s, n) => s + n, 0) / scores.length);
}
