"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";

interface Props {
  reportId: string;
  scores: number[];
  divergenceThreshold: number;
}

export function TiebreakForm({ reportId, scores, divergenceThreshold }: Props) {
  const router = useRouter();
  const [a, b] = scores;
  const avg = Math.round((a + b) / 2);
  const [score, setScore] = useState<string>(String(avg));
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const scoreNum = Number(score);
    if (!Number.isFinite(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      setError("Score must be between 0 and 100.");
      return;
    }
    if (feedback.trim().length < 20) {
      setError("Write a brief explanation of how you reached the final score.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/tiebreak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: scoreNum, feedback }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Tiebreak failed");
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

  return (
    <section className="mb-6 bg-amber-50 border border-amber-300 rounded-xl p-5">
      <div className="flex items-start gap-3 mb-3">
        <ShieldAlert className="h-5 w-5 text-amber-700 mt-0.5" />
        <div>
          <h2 className="text-sm font-semibold text-amber-900 uppercase tracking-wide">
            Tiebreak — divergent reviewers
          </h2>
          <p className="text-sm text-amber-900/80 mt-1">
            The two reviewers gave <strong>{a}</strong> and <strong>{b}</strong>, a gap of{" "}
            {Math.abs(a - b)} points (threshold: {divergenceThreshold}). Read both grades, then
            write the final score and the participant-facing feedback. Your decision overrides the
            average and closes the report.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-amber-900 mb-1">
            Final score (0–100)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="w-32 p-2 border border-amber-300 rounded-lg text-sm bg-white"
          />
          <span className="ml-3 text-xs text-amber-800">
            Average of the two would be {avg}.
          </span>
        </div>

        <div>
          <label className="block text-sm font-medium text-amber-900 mb-1">
            Final feedback for the participant
          </label>
          <p className="text-xs text-amber-800/80 mb-2">
            Synthesize both reviewers&apos; notes into one clear paragraph the intern reads on their dashboard.
          </p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full min-h-[200px] p-3 border border-amber-300 rounded-lg font-mono text-sm bg-white"
            placeholder="Final feedback…"
          />
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="pt-2 border-t border-amber-200">
          <button
            onClick={submit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Resolve tiebreak
          </button>
        </div>
      </div>
    </section>
  );
}
