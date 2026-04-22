"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function GradeForm({
  submissionId,
  maxPoints,
  initialScore,
  initialFeedback,
}: {
  submissionId: string;
  maxPoints: number;
  initialScore: number | null;
  initialFeedback: string;
}) {
  const router = useRouter();
  const [score, setScore] = useState<string>(initialScore?.toString() ?? "");
  const [feedback, setFeedback] = useState<string>(initialFeedback);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const n = parseInt(score);
    if (!Number.isFinite(n) || n < 0 || n > maxPoints) {
      setError(`Score must be between 0 and ${maxPoints}`);
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: n, feedback: feedback.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Grading failed");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Grading failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-1">
          <label className="text-xs font-medium text-foreground mb-1 block">
            Score (out of {maxPoints})
          </label>
          <input
            type="number"
            min={0}
            max={maxPoints}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            required
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue/30"
          />
        </div>
        <div className="col-span-3">
          <label className="text-xs font-medium text-foreground mb-1 block">
            Feedback (optional)
          </label>
          <textarea
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue/30"
          />
        </div>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      {saved && !error && (
        <p className="text-xs text-accent">Grade saved — intern was emailed.</p>
      )}
      <div>
        <Button type="submit" size="sm" isLoading={saving}>
          {initialScore !== null ? "Update grade" : "Save grade"}
        </Button>
      </div>
    </form>
  );
}
