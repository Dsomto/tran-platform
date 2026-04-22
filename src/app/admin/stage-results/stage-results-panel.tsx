"use client";

import { useEffect, useState } from "react";
import { BarChart3, Loader2, Send, CheckCircle2 } from "lucide-react";

interface Summary {
  total: number;
  byStatus: Record<string, number>;
  graded: number;
  min: number | null;
  max: number | null;
  median: number | null;
  mean: number | null;
  histogram: { bucket: string; count: number }[];
}

const STAGES = [
  { key: "STAGE_0", label: "Stage 0 — Foundations" },
  { key: "STAGE_1", label: "Stage 1 — Applied Cryptography" },
  { key: "STAGE_2", label: "Stage 2 — Web Application Security" },
  { key: "STAGE_3", label: "Stage 3 — Incident Response" },
  { key: "STAGE_4", label: "Stage 4 — Governance & Risk" },
];

export function StageResultsPanel() {
  const [stage, setStage] = useState("STAGE_0");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [threshold, setThreshold] = useState("60");
  const [preview, setPreview] = useState<{ willPass: number; willFail: number } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadSummary(s: string) {
    setLoading(true);
    setPreview(null);
    setResult(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/stage-results?stage=${s}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load");
        setSummary(null);
      } else {
        setSummary(data.summary);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSummary(stage);
  }, [stage]);

  async function previewThreshold() {
    setError(null);
    const t = Number(threshold);
    if (!Number.isFinite(t) || t < 0 || t > 100) {
      setError("Threshold must be 0–100");
      return;
    }
    try {
      const res = await fetch("/api/admin/stage-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, passingScore: t, dryRun: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      setPreview({ willPass: data.willPass, willFail: data.willFail });
    } catch {
      setError("Network error");
    }
  }

  async function publish() {
    setError(null);
    const t = Number(threshold);
    if (!Number.isFinite(t) || t < 0 || t > 100) {
      setError("Threshold must be 0–100");
      return;
    }
    const confirmMsg = `Publish Stage ${stage.replace("STAGE_", "")} results with passing threshold ${t}?\n\nEmails will be queued for every graded participant. This cannot be easily undone.`;
    if (!confirm(confirmMsg)) return;
    setPublishing(true);
    try {
      const res = await fetch("/api/admin/stage-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, passingScore: t }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Publish failed");
      } else {
        setResult(
          `Published. ${data.passed} participants passed, ${data.failed} did not. Emails queued.`
        );
        await loadSummary(stage);
      }
    } catch {
      setError("Network error");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 className="h-6 w-6 text-blue" />
          <h1 className="text-2xl font-bold text-foreground">Publish Stage Results</h1>
        </div>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Choose a stage, review the grade distribution, then set the passing
          threshold and publish. Publishing promotes passers to the next stage
          and queues result emails to everyone.
        </p>
      </header>

      <section className="mb-6 bg-white border border-border rounded-xl p-5">
        <label className="block text-sm font-medium text-foreground mb-2">Stage</label>
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          className="w-full max-w-md p-3 border border-border rounded-lg bg-white text-sm"
        >
          {STAGES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </section>

      {loading && (
        <div className="p-8 text-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
        </div>
      )}

      {error && (
        <div className="mb-5 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
          {error}
        </div>
      )}

      {result && (
        <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-900 flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{result}</span>
        </div>
      )}

      {summary && (
        <>
          <section className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Total reports" value={summary.total} />
            <Stat label="Graded" value={summary.graded} />
            <Stat
              label="Median score"
              value={summary.median != null ? summary.median : "—"}
            />
            <Stat
              label="Mean score"
              value={summary.mean != null ? summary.mean : "—"}
            />
          </section>

          <section className="mb-6 bg-white border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
              Score distribution
            </h2>
            <Histogram data={summary.histogram} total={summary.graded} />
            <div className="mt-3 text-xs text-muted-foreground">
              Range: {summary.min ?? "—"} to {summary.max ?? "—"}
            </div>
          </section>

          <section className="mb-6 bg-white border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
              Status breakdown
            </h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.byStatus).map(([k, v]) => (
                <span
                  key={k}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-muted/50 border border-border text-foreground"
                >
                  {k}: {v}
                </span>
              ))}
            </div>
          </section>

          <section className="bg-white border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
              Set passing threshold and publish
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Look at the distribution above and choose a threshold. Preview it
              first to see how many will pass vs. fail.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Passing score
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="w-28 p-2 border border-border rounded-lg text-sm"
                />
              </div>
              <button
                onClick={previewThreshold}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted/50"
              >
                Preview
              </button>
              <button
                onClick={publish}
                disabled={publishing || summary.graded === 0}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue text-white hover:opacity-90 disabled:opacity-50"
              >
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Publish results
              </button>
            </div>
            {preview && (
              <div className="mt-4 p-3 bg-blue/5 border border-blue/20 rounded-lg text-sm">
                With threshold <strong>{threshold}</strong>:{" "}
                <strong className="text-emerald-700">{preview.willPass}</strong> will pass,{" "}
                <strong className="text-rose-700">{preview.willFail}</strong> will not.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-border rounded-xl p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-foreground mt-1">{value}</div>
    </div>
  );
}

function Histogram({ data, total }: { data: { bucket: string; count: number }[]; total: number }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="space-y-1.5">
      {data.map((d) => {
        const pct = total === 0 ? 0 : (d.count / max) * 100;
        return (
          <div key={d.bucket} className="flex items-center gap-3 text-xs">
            <span className="w-14 text-muted-foreground tabular-nums">{d.bucket}</span>
            <div className="flex-1 bg-muted/40 rounded h-5 overflow-hidden">
              <div
                className="bg-blue h-full rounded"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 text-right font-medium tabular-nums text-foreground">
              {d.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
