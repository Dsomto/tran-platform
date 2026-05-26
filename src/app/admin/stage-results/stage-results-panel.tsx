"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Loader2, Send, CheckCircle2, RotateCcw, ArrowLeftRight } from "lucide-react";

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

interface BucketRow {
  reportId: string;
  internId: string;
  fullName: string;
  email: string;
  score: number;
}

interface Buckets {
  threshold: number;
  willPass: BucketRow[];
  willFail: BucketRow[];
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
  // Named buckets pulled when the admin clicks Preview — drives the per-row
  // review + swap UI. `overrides` is the client-side decision to force a
  // specific intern's outcome regardless of their score; sent on Publish.
  const [buckets, setBuckets] = useState<Buckets | null>(null);
  const [overrides, setOverrides] = useState<Record<string, "pass" | "fail">>({});
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  // Default: "unlock only" — reset reverts reports to GRADED so the stage can
  // be re-published, but interns already advanced stay where they are.
  const [moveInternsBack, setMoveInternsBack] = useState(false);

  async function loadSummary(s: string) {
    setLoading(true);
    setPreview(null);
    setBuckets(null);
    setOverrides({});
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
    // Resetting overrides whenever the admin re-runs the preview keeps the
    // swap-state honest: a new threshold restarts the review.
    setOverrides({});
    try {
      const res = await fetch(`/api/admin/stage-results?stage=${stage}&threshold=${t}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      const b: Buckets | undefined = data.buckets;
      if (!b) {
        setError("No graded reports for this stage.");
        return;
      }
      setBuckets(b);
      setPreview({ willPass: b.willPass.length, willFail: b.willFail.length });
    } catch {
      setError("Network error");
    }
  }

  // Effective outcome for a row = threshold bucket XOR override.
  function swap(internId: string, current: "pass" | "fail") {
    setOverrides((prev) => {
      const next = { ...prev };
      const target: "pass" | "fail" = current === "pass" ? "fail" : "pass";
      // If swapping back to the threshold-derived bucket, drop the override
      // rather than setting one — keeps the request body minimal and lets
      // the threshold remain the source of truth where possible.
      const baseline = buckets?.willPass.some((r) => r.internId === internId) ? "pass" : "fail";
      if (target === baseline) delete next[internId];
      else next[internId] = target;
      return next;
    });
  }

  // Final lists shown in the UI = threshold buckets with overrides applied.
  const effective = useMemo(() => {
    if (!buckets) return null;
    const willPass: BucketRow[] = [];
    const willFail: BucketRow[] = [];
    for (const r of [...buckets.willPass, ...buckets.willFail]) {
      const baseline: "pass" | "fail" = buckets.willPass.some((x) => x.internId === r.internId)
        ? "pass"
        : "fail";
      const outcome = overrides[r.internId] ?? baseline;
      if (outcome === "pass") willPass.push(r);
      else willFail.push(r);
    }
    willPass.sort((a, b) => b.score - a.score);
    willFail.sort((a, b) => b.score - a.score);
    return { willPass, willFail };
  }, [buckets, overrides]);

  async function publish() {
    setError(null);
    const t = Number(threshold);
    if (!Number.isFinite(t) || t < 0 || t > 100) {
      setError("Threshold must be 0–100");
      return;
    }
    const overrideCount = Object.keys(overrides).length;
    const confirmMsg =
      `Publish Stage ${stage.replace("STAGE_", "")} results with passing threshold ${t}` +
      (overrideCount > 0 ? ` and ${overrideCount} manual override${overrideCount === 1 ? "" : "s"}` : "") +
      `?\n\nEmails will be queued for every graded participant. This cannot be easily undone.`;
    if (!confirm(confirmMsg)) return;
    setPublishing(true);
    try {
      const res = await fetch("/api/admin/stage-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, passingScore: t, overrides }),
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

  async function resetResults() {
    const msg =
      `Reset Stage ${stage.replace("STAGE_", "")} published results?\n\n` +
      "All PASSED/FAILED reports go back to GRADED, and result emails for this stage still waiting to send are deleted.\n\n" +
      (moveInternsBack
        ? "Promoted interns WILL be moved back to this stage."
        : "Promoted interns will stay where they are.") +
      "\n\nYou can then publish this stage again.";
    if (!confirm(msg)) return;
    setResetting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/stage-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", stage, moveInternsBack }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Reset failed");
      } else {
        setResult(
          `Reset done. ${data.reportsReverted} report${data.reportsReverted === 1 ? "" : "s"} back to GRADED, ` +
            `${data.internsMovedBack} intern${data.internsMovedBack === 1 ? "" : "s"} moved back, ` +
            `${data.emailsCancelled} unsent email${data.emailsCancelled === 1 ? "" : "s"} removed. You can publish again.`
        );
        await loadSummary(stage);
      }
    } catch {
      setError("Network error");
    } finally {
      setResetting(false);
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
            {preview && effective && (
              <div className="mt-4 p-3 bg-blue/5 border border-blue/20 rounded-lg text-sm">
                With threshold <strong>{threshold}</strong>:{" "}
                <strong className="text-emerald-700">{effective.willPass.length}</strong> will pass,{" "}
                <strong className="text-rose-700">{effective.willFail.length}</strong> will not.
                {Object.keys(overrides).length > 0 && (
                  <>
                    {" "}
                    <span className="text-muted-foreground">
                      ({Object.keys(overrides).length} manual override
                      {Object.keys(overrides).length === 1 ? "" : "s"})
                    </span>
                  </>
                )}
              </div>
            )}
          </section>

          {effective && (
            <section className="mt-6 grid md:grid-cols-2 gap-4">
              {/* Will-PASS column */}
              <BucketColumn
                title="Will pass"
                tone="emerald"
                rows={effective.willPass}
                actionLabel="Move to Fail"
                overrides={overrides}
                onSwap={(internId) => swap(internId, "pass")}
              />
              {/* Will-FAIL column */}
              <BucketColumn
                title="Will not pass"
                tone="rose"
                rows={effective.willFail}
                actionLabel="Move to Pass"
                overrides={overrides}
                onSwap={(internId) => swap(internId, "fail")}
              />
            </section>
          )}

          {(summary.byStatus.PASSED ?? 0) + (summary.byStatus.FAILED ?? 0) > 0 && (
            <section className="mt-6 bg-white border border-rose-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-rose-800 mb-2 uppercase tracking-wide">
                Reset published results
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                This stage has published results. Resetting reverts every PASSED / FAILED
                report back to GRADED so you can publish again, and deletes result emails for
                this stage that haven&apos;t sent yet. Already-sent emails are not affected.
              </p>
              <label className="flex items-start gap-2 mb-4 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={moveInternsBack}
                  onChange={(e) => setMoveInternsBack(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  Also move promoted interns back to this stage.{" "}
                  <span className="text-muted-foreground">
                    Leave unchecked to keep interns where they are — only their reports reset.
                  </span>
                </span>
              </label>
              <button
                onClick={resetResults}
                disabled={resetting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-rose-300 text-rose-800 hover:bg-rose-50 disabled:opacity-50"
              >
                {resetting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                Reset published results
              </button>
            </section>
          )}
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

function BucketColumn({
  title,
  tone,
  rows,
  actionLabel,
  overrides,
  onSwap,
}: {
  title: string;
  tone: "emerald" | "rose";
  rows: BucketRow[];
  actionLabel: string;
  overrides: Record<string, "pass" | "fail">;
  onSwap: (internId: string) => void;
}) {
  const headerClass =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : "bg-rose-50 text-rose-800 border-rose-200";
  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div className={`px-4 py-3 border-b text-xs font-semibold uppercase tracking-wide ${headerClass}`}>
        {title} ({rows.length})
      </div>
      {rows.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">No one in this bucket.</p>
      ) : (
        <ul className="divide-y divide-border max-h-96 overflow-y-auto">
          {rows.map((r) => {
            const isOverride = overrides[r.internId] != null;
            return (
              <li key={r.internId} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">{r.fullName}</p>
                  <p className="text-[11px] font-mono text-muted-foreground truncate">{r.email}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-foreground">{r.score}</span>
                {isOverride && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-md border border-blue/30 bg-blue/5 text-blue uppercase tracking-wide"
                    title="Moved here manually, against the threshold"
                  >
                    Override
                  </span>
                )}
                <button
                  onClick={() => onSwap(r.internId)}
                  title={actionLabel}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-border hover:bg-muted/40"
                >
                  <ArrowLeftRight className="h-3 w-3" />
                  Swap
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
