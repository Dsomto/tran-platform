"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowLeftRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  RotateCcw,
  Save,
  Search,
} from "lucide-react";

interface PendingRow {
  reportId: string;
  internId: string;
  fullName: string;
  email: string;
  reportScore: number;
  terminalScore: number | null;
  finalScore: number;
  feedback: string | null;
}

interface Pending {
  cutoff: number | null;
  promotion: PendingRow[];
  elimination: PendingRow[];
}

type Bucket = "promotion" | "elimination";
type SortKey = "name" | "report" | "final" | "terminal";

const STAGES = [
  { key: "STAGE_0", label: "Stage 0 — Foundations" },
  { key: "STAGE_1", label: "Stage 1 — Applied Cryptography" },
  { key: "STAGE_2", label: "Stage 2 — Web Application Security" },
  { key: "STAGE_3", label: "Stage 3 — Incident Response" },
  { key: "STAGE_4", label: "Stage 4 — Governance & Risk" },
];

export function CutoffReviewPanel({ stage }: { stage: string }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyRowId, setBusyRowId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draftScore, setDraftScore] = useState<Record<string, string>>({});
  const [draftFeedback, setDraftFeedback] = useState<Record<string, string>>({});
  const [bucketFilter, setBucketFilter] = useState<"all" | Bucket>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("final");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [toast, setToast] = useState<string | null>(null);

  const stageLabel =
    STAGES.find((s) => s.key === stage)?.label ?? stage;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/stage-results?stage=${stage}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load");
        setPending(null);
      } else {
        setPending(data.pending ?? null);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [stage]);

  useEffect(() => {
    load();
  }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  const allRows = useMemo(() => {
    if (!pending) return [] as Array<PendingRow & { bucket: Bucket }>;
    const promo = pending.promotion.map((r) => ({ ...r, bucket: "promotion" as Bucket }));
    const elim = pending.elimination.map((r) => ({ ...r, bucket: "elimination" as Bucket }));
    return [...promo, ...elim];
  }, [pending]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = allRows;
    if (bucketFilter !== "all") rows = rows.filter((r) => r.bucket === bucketFilter);
    if (q) {
      rows = rows.filter(
        (r) => r.fullName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
      );
    }
    rows = [...rows].sort((a, b) => {
      let av: number | string = 0;
      let bv: number | string = 0;
      if (sortKey === "name") {
        av = a.fullName.toLowerCase();
        bv = b.fullName.toLowerCase();
      } else if (sortKey === "report") {
        av = a.reportScore;
        bv = b.reportScore;
      } else if (sortKey === "terminal") {
        av = a.terminalScore ?? -1;
        bv = b.terminalScore ?? -1;
      } else {
        av = a.finalScore;
        bv = b.finalScore;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [allRows, search, bucketFilter, sortKey, sortDir]);

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

  async function swap(row: PendingRow & { bucket: Bucket }) {
    setBusyRowId(row.reportId);
    setError(null);
    try {
      const to = row.bucket === "promotion" ? "eliminate" : "promote";
      const data = await post({ action: "swap", stage, reportId: row.reportId, to });
      if (data) {
        showToast(`${row.fullName}: moved to ${to === "promote" ? "pass" : "fail"}`);
        await load();
      }
    } finally {
      setBusyRowId(null);
    }
  }

  async function saveRow(row: PendingRow & { bucket: Bucket }) {
    const rawScore = draftScore[row.reportId];
    const rawFb = draftFeedback[row.reportId];
    const score = Number(rawScore);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      setError(`${row.fullName}: score must be 0–100`);
      return;
    }
    setBusyRowId(row.reportId);
    setError(null);
    try {
      const data = await post({
        action: "update-score",
        reportId: row.reportId,
        score,
        ...(rawFb !== undefined && rawFb !== row.feedback ? { feedback: rawFb } : {}),
      });
      if (data) {
        const flipped = data.flipped === true;
        showToast(
          `${row.fullName}: saved (final ${data.finalScore})${flipped ? ` — moved to ${data.status === "PENDING_PROMOTION" ? "pass" : "fail"}` : ""}`
        );
        // Clear drafts for this row and refresh
        setDraftScore((d) => {
          const n = { ...d };
          delete n[row.reportId];
          return n;
        });
        setDraftFeedback((d) => {
          const n = { ...d };
          delete n[row.reportId];
          return n;
        });
        await load();
      }
    } finally {
      setBusyRowId(null);
    }
  }

  function resetRow(row: PendingRow) {
    setDraftScore((d) => {
      const n = { ...d };
      delete n[row.reportId];
      return n;
    });
    setDraftFeedback((d) => {
      const n = { ...d };
      delete n[row.reportId];
      return n;
    });
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full">
      <header className="mb-6">
        <Link
          href="/admin/stage-results"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Stage Results
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground">Result Review — {stageLabel}</h1>
          <select
            value={stage}
            onChange={(e) => {
              window.location.href = `/admin/stage-results/review?stage=${e.target.value}`;
            }}
            className="p-2.5 border border-border rounded-lg bg-white text-sm"
            aria-label="Stage"
          >
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <p className="text-muted-foreground text-sm mt-1 max-w-3xl">
          Edit any intern&apos;s score and feedback in place. Saving a score recomputes the final score
          against the current cutoff and moves them between pass and fail automatically.
          Use Swap to override the bucket without changing the score.
        </p>
      </header>

      {toast && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-900 flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
          {error}
        </div>
      )}

      {loading && !pending && (
        <div className="p-8 text-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
        </div>
      )}

      {!loading && !pending && (
        <div className="p-8 bg-white border border-border rounded-xl text-center">
          <p className="text-foreground font-medium mb-2">No pending review for this stage.</p>
          <p className="text-sm text-muted-foreground">
            Apply a cutoff on Stage Results to populate the pass / fail buckets.
          </p>
        </div>
      )}

      {pending && (
        <>
          <section className="mb-5 grid grid-cols-3 gap-3">
            <Stat
              label="Cutoff"
              value={pending.cutoff != null ? pending.cutoff : "—"}
              tone="blue"
            />
            <Stat
              label="Pending pass"
              value={pending.promotion.length}
              tone="emerald"
            />
            <Stat
              label="Pending fail"
              value={pending.elimination.length}
              tone="rose"
            />
          </section>

          <section className="mb-4 bg-white border border-border rounded-xl p-4 flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 p-2 border border-border rounded-lg text-sm"
              />
            </div>
            <select
              value={bucketFilter}
              onChange={(e) => setBucketFilter(e.target.value as "all" | Bucket)}
              className="p-2 border border-border rounded-lg text-sm bg-white"
            >
              <option value="all">All buckets</option>
              <option value="promotion">Pass only</option>
              <option value="elimination">Fail only</option>
            </select>
            <div className="text-xs text-muted-foreground">
              Showing {filtered.length} of {allRows.length}
            </div>
          </section>

          <section className="bg-white border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="w-8"></th>
                  <th
                    className="px-4 py-2.5 text-left cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("name")}
                  >
                    Name {sortKey === "name" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    className="px-3 py-2.5 text-right cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("report")}
                  >
                    Report {sortKey === "report" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    className="px-3 py-2.5 text-right cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("terminal")}
                  >
                    Terminal {sortKey === "terminal" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    className="px-3 py-2.5 text-right cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("final")}
                  >
                    Final {sortKey === "final" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="px-3 py-2.5 text-center">Bucket</th>
                  <th className="px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const open = openId === row.reportId;
                  const scoreDraftRaw = draftScore[row.reportId];
                  const scoreVal = scoreDraftRaw ?? String(row.reportScore);
                  const fbDraftRaw = draftFeedback[row.reportId];
                  const fbVal = fbDraftRaw ?? (row.feedback ?? "");
                  const dirty =
                    (scoreDraftRaw !== undefined && Number(scoreDraftRaw) !== row.reportScore) ||
                    (fbDraftRaw !== undefined && fbDraftRaw !== (row.feedback ?? ""));
                  const busy = busyRowId === row.reportId;
                  return (
                    <RowFragment
                      key={row.reportId}
                      open={open}
                      onToggle={() => setOpenId(open ? null : row.reportId)}
                      row={row}
                      scoreVal={scoreVal}
                      fbVal={fbVal}
                      dirty={dirty}
                      busy={busy}
                      onScoreChange={(v) =>
                        setDraftScore((d) => ({ ...d, [row.reportId]: v }))
                      }
                      onFeedbackChange={(v) =>
                        setDraftFeedback((d) => ({ ...d, [row.reportId]: v }))
                      }
                      onSave={() => saveRow(row)}
                      onReset={() => resetRow(row)}
                      onSwap={() => swap(row)}
                    />
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No rows match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <p className="text-xs text-muted-foreground mt-4">
            Final score = 0.8 × report + 0.2 × terminal %. Changing the report score recomputes
            the final score and moves the row across the cutoff automatically. Saving feedback also
            updates what the intern sees in the published result email when you finalize on the
            Stage Results page.
          </p>
        </>
      )}
    </div>
  );
}

function RowFragment({
  open,
  onToggle,
  row,
  scoreVal,
  fbVal,
  dirty,
  busy,
  onScoreChange,
  onFeedbackChange,
  onSave,
  onReset,
  onSwap,
}: {
  open: boolean;
  onToggle: () => void;
  row: PendingRow & { bucket: Bucket };
  scoreVal: string;
  fbVal: string;
  dirty: boolean;
  busy: boolean;
  onScoreChange: (v: string) => void;
  onFeedbackChange: (v: string) => void;
  onSave: () => void;
  onReset: () => void;
  onSwap: () => void;
}) {
  const bucketColor =
    row.bucket === "promotion"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : "bg-rose-50 text-rose-800 border-rose-200";
  return (
    <>
      <tr className="border-t border-border hover:bg-muted/20">
        <td className="px-2 py-2.5 text-center">
          <button
            onClick={onToggle}
            className="p-1 text-muted-foreground hover:text-foreground"
            title={open ? "Hide feedback" : "Show feedback"}
          >
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </td>
        <td className="px-4 py-2.5">
          <div className="text-sm text-foreground">{row.fullName}</div>
          <div className="text-[11px] font-mono text-muted-foreground">{row.email}</div>
        </td>
        <td className="px-3 py-2.5 text-right">
          <input
            type="number"
            min={0}
            max={100}
            value={scoreVal}
            onChange={(e) => onScoreChange(e.target.value)}
            className={`w-16 p-1.5 text-right border rounded-md text-sm tabular-nums ${dirty ? "border-amber-400 bg-amber-50" : "border-border"}`}
          />
        </td>
        <td className="px-3 py-2.5 text-right text-sm tabular-nums text-muted-foreground">
          {row.terminalScore ?? "—"}
        </td>
        <td className="px-3 py-2.5 text-right text-sm tabular-nums font-semibold text-foreground">
          {row.finalScore}
        </td>
        <td className="px-3 py-2.5 text-center">
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${bucketColor}`}
          >
            {row.bucket === "promotion" ? "Pass" : "Fail"}
          </span>
        </td>
        <td className="px-3 py-2.5 text-right whitespace-nowrap">
          {dirty && (
            <>
              <button
                onClick={onSave}
                disabled={busy}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md bg-blue text-white hover:opacity-90 disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Save
              </button>
              <button
                onClick={onReset}
                disabled={busy}
                title="Discard changes"
                className="inline-flex items-center gap-1 ml-1 px-2 py-1.5 text-xs rounded-md border border-border hover:bg-muted/40 disabled:opacity-50"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </>
          )}
          {!dirty && (
            <button
              onClick={onSwap}
              disabled={busy}
              title={row.bucket === "promotion" ? "Move to fail" : "Move to pass"}
              className="inline-flex items-center gap-1 px-2 py-1.5 text-xs rounded-md border border-border hover:bg-muted/40 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ArrowLeftRight className="h-3 w-3" />
              )}
              Swap
            </button>
          )}
        </td>
      </tr>
      {open && (
        <tr className="border-t border-border bg-muted/10">
          <td></td>
          <td colSpan={6} className="px-4 py-3">
            <label className="block text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
              Grader feedback (intern will see this in their email)
            </label>
            <textarea
              value={fbVal}
              onChange={(e) => onFeedbackChange(e.target.value)}
              rows={Math.min(20, Math.max(4, fbVal.split("\n").length + 1))}
              className="w-full p-3 text-sm border border-border rounded-lg font-mono leading-relaxed"
              placeholder="No feedback recorded yet."
            />
          </td>
        </tr>
      )}
    </>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "blue" | "emerald" | "rose";
}) {
  const colorClass =
    tone === "blue"
      ? "border-blue/20 bg-blue/5 text-blue"
      : tone === "emerald"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-rose-200 bg-rose-50 text-rose-700";
  return (
    <div className={`bg-white border rounded-xl p-4 ${colorClass}`}>
      <div className="text-xs uppercase tracking-wide opacity-80">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
