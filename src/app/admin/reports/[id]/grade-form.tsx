"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface Props {
  reportId: string;
  canGrade: boolean;
  currentScore: number | null;
  currentFeedback: string | null;
  currentAiFlagged: boolean;
  currentAiFlagReason: string | null;
  status: string;
  alreadyGraded: boolean; // this grader has already submitted their grade
}

export function GradeForm({
  reportId,
  canGrade,
  currentScore,
  currentFeedback,
  currentAiFlagged,
  currentAiFlagReason,
  status,
  alreadyGraded,
}: Props) {
  const router = useRouter();
  const [score, setScore] = useState<string>(currentScore != null ? String(currentScore) : "");
  const [feedback, setFeedback] = useState(currentFeedback ?? "");
  const [aiFlagged, setAiFlagged] = useState<boolean>(currentAiFlagged);
  const [aiFlagReason, setAiFlagReason] = useState<string>(currentAiFlagReason ?? "");
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
    if (aiFlagged && aiFlagReason.trim().length < 15) {
      setError(
        "If you're flagging this for AI use, write at least one specific reason (~15+ chars). Name the paragraph or the fabricated citation that triggered the flag."
      );
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: scoreNum,
          feedback,
          aiFlagged,
          aiFlagReason: aiFlagged ? aiFlagReason.trim() : null,
        }),
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
    if (!confirm("Release this report back to the queue? Another grader can then claim your slot.")) {
      return;
    }
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
        {alreadyGraded
          ? "You have already submitted your grade for this report. The other reviewer's score and the final average will appear once they finish."
          : "You can't grade this report right now. If you haven't claimed it, return to the queue. If it's flagged divergent, a super admin will resolve it."}
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
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({feedback.length} chars · minimum 20)
            </span>
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

        <div className="border border-amber-300 bg-amber-50 rounded-lg p-3">
          <label className="flex items-start gap-2.5 text-sm font-medium text-amber-900 cursor-pointer">
            <input
              type="checkbox"
              checked={aiFlagged}
              onChange={(e) => setAiFlagged(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-amber-400 text-amber-700"
            />
            <span>
              Flag this submission for suspected AI generation
              <span className="block text-xs font-normal text-amber-800 mt-0.5">
                The -20 penalty is NOT applied automatically. When both graders flag, a super-admin reviews and decides.
              </span>
            </span>
          </label>
          {aiFlagged && (
            <div className="mt-3 pl-7">
              <label className="block text-xs font-semibold text-amber-900 mb-1 uppercase tracking-wide">
                Reason for flag
                <span className="ml-2 font-normal text-amber-700">({aiFlagReason.length} chars · minimum 15)</span>
              </label>
              <p className="text-xs text-amber-800 mb-2">
                Name the specific paragraph, fabricated citation, or pattern that triggered the flag. This goes to the super-admin reviewer, not to the intern.
              </p>
              <textarea
                value={aiFlagReason}
                onChange={(e) => setAiFlagReason(e.target.value)}
                className="w-full min-h-[80px] p-2 border border-amber-300 rounded-md text-sm bg-white"
                placeholder="e.g. D3 page 2 cites NIST SP 800-53 AC-12.1 which doesn't exist in rev 5; same paragraph structure repeats three times."
              />
            </div>
          )}
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
