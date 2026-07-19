"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Loader2,
  Send,
  CheckCircle2,
  RotateCcw,
  ArrowLeftRight,
  Download,
  Scale,
} from "lucide-react";

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

interface PendingRow {
  reportId: string;
  internId: string;
  fullName: string;
  email: string;
  reportScore: number;
  terminalScore: number | null;
  finalScore: number;
}

interface Pending {
  cutoff: number | null;
  promotion: PendingRow[];
  elimination: PendingRow[];
}

const STAGES = [
  { key: "STAGE_0", label: "Stage 0 — Foundations" },
  { key: "STAGE_1", label: "Stage 1 — Applied Cryptography" },
  { key: "STAGE_2", label: "Stage 2 — Web Application Security" },
  { key: "STAGE_3", label: "Stage 3 — Incident Response" },
  { key: "STAGE_4", label: "Stage 4 — Governance & Risk" },
  { key: "STAGE_5", label: "Advanced 1 — Signal" },
  { key: "STAGE_6", label: "Advanced 2 — Exposure" },
  { key: "STAGE_7", label: "Advanced 3 — Architecture" },
  { key: "STAGE_8", label: "Advanced 4 — Adversity" },
  { key: "STAGE_9", label: "Advanced 5 — The Final Case" },
];

export function StageResultsPanel() {
  const [stage, setStage] = useState("STAGE_0");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [loading, setLoading] = useState(false);
  const [cutoff, setCutoff] = useState("60");
  const [preview, setPreview] = useState<{ willPass: number; willFail: number } | null>(null);
  const [busy, setBusy] = useState<null | "preview" | "apply" | "finalize" | "swap" | "reset" | "nosubs">(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [moveInternsBack, setMoveInternsBack] = useState(false);

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
        setPending(null);
      } else {
        setSummary(data.summary);
        setPending(data.pending ?? null);
        if (data.pending?.cutoff != null) setCutoff(String(data.pending.cutoff));
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

  function validCutoff(): number | null {
    const t = Number(cutoff);
    if (!Number.isFinite(t) || t < 0 || t > 100) {
      setError("Cutoff must be 0–100");
      return null;
    }
    return t;
  }

  async function previewCutoff() {
    setError(null);
    const t = validCutoff();
    if (t == null) return;
    setBusy("preview");
    try {
      const res = await fetch(`/api/admin/stage-results?stage=${stage}&threshold=${t}`);
      const data = await res.json();
      if (!res.ok || !data.buckets) {
        setError(data.error || "No graded reports for this stage.");
        return;
      }
      setPreview({
        willPass: data.buckets.willPass.length,
        willFail: data.buckets.willFail.length,
      });
    } catch {
      setError("Network error");
    } finally {
      setBusy(null);
    }
  }

  async function post(body: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    const res = await fetch("/api/admin/stage-results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError((data as { error?: string }).error || "Request failed");
      return null;
    }
    return data;
  }

  async function applyCutoff() {
    setError(null);
    setResult(null);
    const t = validCutoff();
    if (t == null) return;
    const isReapply = pending != null;
    if (
      isReapply &&
      !confirm(
        `Add newly graded reports with cutoff ${t} for Stage ${stage.replace("STAGE_", "")}?\n\n` +
          "Saved score edits, feedback edits, and pass/fail swaps in Result Review will stay as they are."
      )
    ) {
      return;
    }
    setBusy("apply");
    try {
      const data = await post({ action: "apply-cutoff", stage, passingScore: t });
      if (data) {
        setResult(
          `Cutoff ${data.threshold} applied. ${data.pendingPromotion} pending pass, ${data.pendingElimination} pending fail. Added ${data.newlySorted ?? 0} newly graded report(s); preserved ${data.preservedPending ?? 0} reviewed row(s). Opening review tab…`
        );
        setPreview(null);
        await loadSummary(stage);
        // Open the per-intern review tab in a new browser tab so the admin can
        // adjust scores and feedback row-by-row without leaving this dashboard.
        if (typeof window !== "undefined") {
          window.open(
            `/admin/stage-results/review?stage=${stage}`,
            "_blank",
            "noopener,noreferrer"
          );
        }
      }
    } finally {
      setBusy(null);
    }
  }

  async function swap(row: PendingRow, to: "promote" | "eliminate") {
    setError(null);
    setBusy("swap");
    try {
      const data = await post({ action: "swap", stage, reportId: row.reportId, to });
      if (data) await loadSummary(stage);
    } finally {
      setBusy(null);
    }
  }

  async function finalize() {
    if (!pending) return;
    const msg =
      `Finalize Stage ${stage.replace("STAGE_", "")}?\n\n` +
      `${pending.promotion.length} will be PROMOTED (advanced + congratulations email + certificate).\n` +
      `${pending.elimination.length} will be ELIMINATED (removed from the programme + result email).\n\n` +
      "This is the commit step. Re-running only processes anyone still pending.";
    if (!confirm(msg)) return;
    setError(null);
    setResult(null);
    setBusy("finalize");
    try {
      const data = await post({ action: "finalize", stage });
      if (data) {
        setResult(
          `Finalized. ${data.promoted} promoted, ${data.eliminated} eliminated. Emails queued.`
        );
        await loadSummary(stage);
      }
    } finally {
      setBusy(null);
    }
  }

  async function finalizeNonSubmitters() {
    const msg =
      `Process non-submitters for Stage ${stage.replace("STAGE_", "")}?\n\n` +
      "Every active intern still on this stage who never submitted a capstone will:\n" +
      "  • Get the soft 'did not submit' email\n" +
      "  • Be deactivated (isActive=false)\n\n" +
      "Re-running is idempotent — anyone already emailed is skipped.";
    if (!confirm(msg)) return;
    setError(null);
    setResult(null);
    setBusy("nosubs");
    try {
      const data = await post({ action: "finalize-non-submitters", stage });
      if (data) {
        setResult(
          `Non-submitters processed. ${data.deactivated} deactivated, ${data.emailed} emailed (${data.skippedAlreadyQueued} already queued).`
        );
        await loadSummary(stage);
      }
    } finally {
      setBusy(null);
    }
  }

  async function resetResults() {
    const msg =
      `Reset Stage ${stage.replace("STAGE_", "")} published results?\n\n` +
      "All PASSED/FAILED reports go back to GRADED, and result emails for this stage still waiting to send are deleted.\n\n" +
      (moveInternsBack
        ? "Promoted interns WILL be moved back to this stage."
        : "Promoted interns will stay where they are.") +
      "\n\nYou can then apply a cutoff again.";
    if (!confirm(msg)) return;
    setError(null);
    setResult(null);
    setBusy("reset");
    try {
      const data = await post({ action: "reset", stage, moveInternsBack });
      if (data) {
        setResult(
          `Reset done. ${data.reportsReverted} report(s) back to GRADED, ${data.internsMovedBack} intern(s) moved back, ${data.emailsCancelled} unsent email(s) removed.`
        );
        await loadSummary(stage);
      }
    } finally {
      setBusy(null);
    }
  }

  function exportCsv() {
    if (!pending) return;
    const esc = (v: string | number | null) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ["Decision", "Name", "Email", "Report", "Terminal", "Final"];
    const lines = [header.join(",")];
    const push = (rows: PendingRow[], decision: string) => {
      for (const r of rows) {
        lines.push(
          [esc(decision), esc(r.fullName), esc(r.email), esc(r.reportScore), esc(r.terminalScore), esc(r.finalScore)].join(",")
        );
      }
    };
    push(pending.promotion, "Pass");
    push(pending.elimination, "Fail");
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stage-${stage.replace("STAGE_", "")}-pending-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const finalized = !!summary && (summary.byStatus.PASSED ?? 0) + (summary.byStatus.FAILED ?? 0) > 0;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 className="h-6 w-6 text-blue" />
          <h1 className="text-2xl font-bold text-foreground">Stage Results</h1>
        </div>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Grade reports, then set a cutoff to sort everyone into pending pass / pending fail on
          their final score (80% report + 20% terminal). Review, swap individuals if needed, then
          finalize to release results.
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
            <Stat label="Median score" value={summary.median != null ? summary.median : "—"} />
            <Stat label="Mean score" value={summary.mean != null ? summary.mean : "—"} />
          </section>

          <section className="mb-6 bg-white border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
              Score distribution (report grade)
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

          {/* Cutoff form: shown when nothing is pending yet and there are graded reports. */}
          {!pending && !finalized && (
            <section className="bg-white border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                Set the cutoff
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Choose a cutoff on the final score. Preview the split, then apply it to sort everyone
                into the two pending buckets. Nothing is committed until you finalize.
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Cutoff (final score)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={cutoff}
                    onChange={(e) => {
                      setCutoff(e.target.value);
                      setPreview(null);
                    }}
                    className="w-28 p-2 border border-border rounded-lg text-sm"
                  />
                </div>
                <button
                  onClick={previewCutoff}
                  disabled={busy != null || summary.graded === 0}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted/50 disabled:opacity-50"
                >
                  Preview
                </button>
                <button
                  onClick={applyCutoff}
                  disabled={busy != null || summary.graded === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue text-white hover:opacity-90 disabled:opacity-50"
                >
                  {busy === "apply" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" />}
                  Apply cutoff & sort
                </button>
              </div>
              {preview && (
                <div className="mt-4 p-3 bg-blue/5 border border-blue/20 rounded-lg text-sm">
                  With cutoff <strong>{cutoff}</strong> (on the report grade):{" "}
                  <strong className="text-emerald-700">{preview.willPass}</strong> would pass,{" "}
                  <strong className="text-rose-700">{preview.willFail}</strong> would not. The final
                  sort also blends in the terminal score.
                </div>
              )}
            </section>
          )}

          {/* Pending review: two persisted buckets + swap + finalize + CSV. */}
          {pending && (
            <>
              <section className="bg-white border border-border rounded-xl p-5">
                <div className="flex flex-wrap items-end gap-3 justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground mb-1 uppercase tracking-wide">
                      Pending review · cutoff {pending.cutoff ?? "—"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Sorted on final score. Swap individuals if needed, or re-apply a different
                      cutoff. Finalize when ready.
                    </p>
                  </div>
                  <div className="flex items-end gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={cutoff}
                      onChange={(e) => setCutoff(e.target.value)}
                      className="w-24 p-2 border border-border rounded-lg text-sm"
                      title="Cutoff"
                    />
                    <button
                      onClick={applyCutoff}
                      disabled={busy != null}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted/50 disabled:opacity-50"
                    >
                      {busy === "apply" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" />}
                      Add new graded
                    </button>
                    <button
                      onClick={exportCsv}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted/50"
                    >
                      <Download className="h-4 w-4" />
                      CSV
                    </button>
                    <a
                      href={`/admin/stage-results/review?stage=${stage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted/50"
                    >
                      <ArrowLeftRight className="h-4 w-4" />
                      Review & adjust
                    </a>
                    <button
                      onClick={finalize}
                      disabled={busy != null}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {busy === "finalize" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Finalize
                    </button>
                  </div>
                </div>
              </section>

              <section className="mt-4 grid md:grid-cols-2 gap-4">
                <PendingColumn
                  title="Pending pass"
                  tone="emerald"
                  rows={pending.promotion}
                  actionLabel="Move to fail"
                  disabled={busy != null}
                  onSwap={(row) => swap(row, "eliminate")}
                />
                <PendingColumn
                  title="Pending fail"
                  tone="rose"
                  rows={pending.elimination}
                  actionLabel="Move to pass"
                  disabled={busy != null}
                  onSwap={(row) => swap(row, "promote")}
                />
              </section>
            </>
          )}

          <section className="mt-6 bg-white border border-amber-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-amber-900 mb-2 uppercase tracking-wide">
              Process non-submitters
            </h2>
            <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
              Every active intern still on Stage {stage.replace("STAGE_", "")} who never submitted
              a capstone gets the soft &ldquo;did not submit&rdquo; email and their account is
              deactivated. Safe to run after Finalize — it only touches interns who don&apos;t
              have a report row at all. Re-running skips anyone already emailed.
            </p>
            <button
              onClick={finalizeNonSubmitters}
              disabled={busy != null}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100 disabled:opacity-50"
            >
              {busy === "nosubs" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Process non-submitters
            </button>
          </section>

          {finalized && (
            <section className="mt-6 bg-white border border-rose-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-rose-800 mb-2 uppercase tracking-wide">
                Reset published results
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                This stage has finalized results. Resetting reverts every PASSED / FAILED report back
                to GRADED so you can apply a cutoff again, and deletes result emails for this stage
                that haven&apos;t sent yet. Already-sent emails are not affected.
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
                disabled={busy != null}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-rose-300 text-rose-800 hover:bg-rose-50 disabled:opacity-50"
              >
                {busy === "reset" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
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
              <div className="bg-blue h-full rounded" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-8 text-right font-medium tabular-nums text-foreground">{d.count}</span>
          </div>
        );
      })}
    </div>
  );
}

function PendingColumn({
  title,
  tone,
  rows,
  actionLabel,
  disabled,
  onSwap,
}: {
  title: string;
  tone: "emerald" | "rose";
  rows: PendingRow[];
  actionLabel: string;
  disabled: boolean;
  onSwap: (row: PendingRow) => void;
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
        <ul className="divide-y divide-border max-h-[28rem] overflow-y-auto">
          {rows.map((r) => (
            <li key={r.reportId} className="flex items-center gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground truncate">{r.fullName}</p>
                <p className="text-[11px] font-mono text-muted-foreground truncate">{r.email}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  report {r.reportScore} · terminal {r.terminalScore ?? "—"}
                </p>
              </div>
              <span
                className="text-sm font-semibold tabular-nums text-foreground"
                title="Final score (0.8·report + 0.2·terminal)"
              >
                {r.finalScore}
              </span>
              <button
                onClick={() => onSwap(r)}
                disabled={disabled}
                title={actionLabel}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-border hover:bg-muted/40 disabled:opacity-50"
              >
                <ArrowLeftRight className="h-3 w-3" />
                Swap
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
