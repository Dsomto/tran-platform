"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface Props {
  reportId: string;
  canGrade: boolean;
  currentScore: number | null;
  currentFeedback: string | null;
  status: string;
  alreadyGraded: boolean; // this grader has already submitted their grade
}

export function GradeForm({
  reportId,
  canGrade,
  currentScore,
  currentFeedback,
  status,
  alreadyGraded,
}: Props) {
  const router = useRouter();
  const [score, setScore] = useState<string>(currentScore != null ? String(currentScore) : "");
  const [feedback, setFeedback] = useState(currentFeedback ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const scoreNum = Number(score);
    if (!Number.isFinite(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      setError("Score must be between 0 and 100.");
      return;
    }
    if (feedback.trim().length < 20) {
      setError("Write at least a short paragraph of feedback — participants rely on it.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: scoreNum, feedback }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to grade");
        setSubmitting(false);
        return;
      }
      router.push("/admin/reports");
      router.refresh();
    } catch {
      setError("Network error");
      setSubmitting(false);
    }
  }

  async function release() {
    setReleasing(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/claim`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to release");
        setReleasing(false);
        return;
      }
      router.push("/admin/reports");
      router.refresh();
    } catch {
      setError("Network error");
      setReleasing(false);
    }
  }

  if (status === "PASSED" || status === "FAILED") {
    return (
      <section className="bg-muted/30 border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wide">
          Results published
        </h2>
        <div className="text-sm text-foreground/80">
          Score: <strong>{currentScore}</strong> / 100 · Outcome: {status}
        </div>
        {currentFeedback && (
          <div className="mt-3 text-sm text-foreground/80 whitespace-pre-wrap">
            {currentFeedback}
          </div>
        )}
      </section>
    );
  }

  if (!canGrade) {
    return (
      <section className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-900">
        This report is not claimed to you. Return to the queue to claim it.
      </section>
    );
  }

  const isRegrading = alreadyGraded;

  return (
    <section className="bg-white border border-border rounded-xl p-5">
      <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">
        {isRegrading ? "Update your grade" : "Your grade"}
      </h2>

      <div className="mb-4 p-3 bg-blue/5 border border-blue/20 rounded-lg text-sm text-foreground/80">
        Two graders score every report. Your score and the other grader&apos;s score get averaged into the participant&apos;s final mark, so judge independently. Pass / fail is set later, when the admin publishes stage results.
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Score (0–100)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="w-32 p-2 border border-border rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Feedback to the participant
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            Be specific. What was strong? What was weak? Participants see this
            in their dashboard and in their results email.
          </p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full min-h-[200px] p-3 border border-border rounded-lg font-mono text-sm"
            placeholder="Your feedback…"
          />
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2 border-t border-border">
          <button
            onClick={submit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 font-medium rounded-lg bg-blue text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isRegrading ? "Update my grade" : "Submit my grade"}
          </button>
          {!alreadyGraded && (
            <button
              onClick={release}
              disabled={releasing}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted/50 disabled:opacity-50"
            >
              {releasing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Release back to queue
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
