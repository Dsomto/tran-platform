"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
  Lock,
  LockOpen,
  Pause,
  Users,
  FileText,
  Megaphone,
  TrendingUp,
} from "lucide-react";

type Status = "OPEN" | "PAUSED" | "CLOSED";

interface AccessRow {
  internId: string;
  name: string;
  email: string;
  firstAccessedAt: string;
  lastAccessedAt: string;
  visitCount: number;
}

interface ReportRow {
  id: string;
  internId: string;
  internName: string;
  internEmail: string;
  status: string;
  score: number | null;
  feedback: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
}

interface Props {
  stage: string;
  stageName: string;
  initialStatus: Status;
  initialPassingScore: number | null;
  accessRows: AccessRow[];
  submissions: ReportRow[];
}

export function StageAdminPanel({
  stage,
  stageName,
  initialStatus,
  initialPassingScore,
  accessRows,
  submissions,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus);
  const stageNum = stage.replace("STAGE_", "");

  const counts = useMemo(() => {
    const c = { submitted: 0, underReview: 0, graded: 0, passed: 0, failed: 0 };
    for (const s of submissions) {
      if (s.status === "SUBMITTED") c.submitted++;
      else if (s.status === "UNDER_REVIEW") c.underReview++;
      else if (s.status === "GRADED") c.graded++;
      else if (s.status === "PASSED") c.passed++;
      else if (s.status === "FAILED") c.failed++;
    }
    return c;
  }, [submissions]);

  const published = counts.passed + counts.failed > 0;

  return (
    <>
      <header className="mb-6">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h1 className="text-2xl font-bold text-foreground">
            Stage {stageNum} · {stageName}
          </h1>
          <StatusPill status={status} />
          {published && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-blue/10 text-blue border border-blue/30">
              <CheckCircle2 className="w-3 h-3" /> Results published
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Open the stage when you&apos;re ready, pause it if you need to halt
          access temporarily, or close it. No deadlines — interns can submit
          while the stage is open.
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat icon={Users} label="Entered" value={accessRows.length} />
        <Stat icon={FileText} label="Submitted" value={counts.submitted + counts.underReview} />
        <Stat icon={CheckCircle2} label="Graded" value={counts.graded} />
        <Stat
          icon={TrendingUp}
          label="Published"
          value={published ? `${counts.passed}/${counts.passed + counts.failed}` : "—"}
          sub={published ? `${counts.passed} passed` : "Not published"}
        />
      </section>

      {/* ── Access controls ── */}
      <StatusControls
        stage={stage}
        stageNum={stageNum}
        status={status}
        onStatusChange={(s) => {
          setStatus(s);
          router.refresh();
        }}
      />

      {/* ── Publish results — only useful once grading has happened ── */}
      <section className="bg-white border border-border rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-blue" />
          <h2 className="text-sm font-semibold text-foreground">Publish results</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Look at the grade distribution, pick where the passing line goes,
          publish. Passers move to the next stage; everyone graded gets an
          email. This is a one-way action.
        </p>
        {counts.graded === 0 && !published ? (
          <p className="text-xs text-muted-foreground italic">
            No graded reports yet. The grading bench picks these up at{" "}
            <a href="/admin/reports" className="text-blue hover:underline">
              /admin/reports
            </a>{" "}
            — once at least one is graded, you can publish.
          </p>
        ) : (
          <PublishResults
            stage={stage}
            stageNum={stageNum}
            submissions={submissions}
            initialPassingScore={initialPassingScore}
            published={published}
          />
        )}
      </section>

      {/* ── Who's entered this stage ── */}
      <section className="bg-white border border-border rounded-xl overflow-hidden mb-6">
        <h2 className="text-sm font-semibold text-foreground p-5 pb-3 uppercase tracking-wide flex items-center gap-2">
          <Users className="w-4 h-4 text-blue" />
          Who&apos;s entered ({accessRows.length})
        </h2>
        {accessRows.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-muted-foreground">
            Nobody has clicked into this stage yet.
          </p>
        ) : (
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {accessRows.map((r) => (
              <div key={r.internId} className="p-4 flex items-center gap-4 flex-wrap text-sm">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground truncate">{r.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{r.email}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  First: {new Date(r.firstAccessedAt).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  Last: {new Date(r.lastAccessedAt).toLocaleString()}
                </div>
                <div className="text-xs font-semibold text-foreground tabular-nums w-12 text-right">
                  {r.visitCount}×
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Submissions ── */}
      <section className="bg-white border border-border rounded-xl overflow-hidden">
        <h2 className="text-sm font-semibold text-foreground p-5 pb-3 uppercase tracking-wide flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue" />
          Reports ({submissions.length})
        </h2>
        {submissions.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-muted-foreground">
            No reports submitted for this stage yet.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {submissions.map((s) => {
              const passed = s.status === "PASSED";
              const failed = s.status === "FAILED";
              return (
                <div key={s.id} className="p-4 flex items-center gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">
                      {s.internName || s.internEmail}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {s.internEmail}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {s.submittedAt ? new Date(s.submittedAt).toLocaleString() : "draft"}
                  </div>
                  <div className="shrink-0">
                    <span
                      className={`text-xs px-2 py-0.5 rounded border ${
                        passed
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : failed
                            ? "bg-rose-50 text-rose-800 border-rose-200"
                            : s.status === "GRADED"
                              ? "bg-blue/10 text-blue border-blue/30"
                              : "bg-muted/50 text-foreground/70 border-border"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <div className="shrink-0 text-sm tabular-nums w-16 text-right">
                    {s.score != null ? `${s.score}/100` : "—"}
                  </div>
                  <div className="shrink-0 w-24 text-right">
                    {passed && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" /> Passed
                      </span>
                    )}
                    {failed && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700">
                        <XCircle className="w-3 h-3" /> Below
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

// ── Status controls (Open / Pause / Close) ────────────────

function StatusControls({
  stage,
  stageNum,
  status,
  onStatusChange,
}: {
  stage: string;
  stageNum: string;
  status: Status;
  onStatusChange: (s: Status) => void;
}) {
  const [busy, setBusy] = useState<Status | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [title, setTitle] = useState(`Stage ${stageNum} is open`);
  const [message, setMessage] = useState(
    `Stage ${stageNum} is now open. Log into your dashboard to begin.`
  );

  async function setStatus(next: Status, withAnnounce: boolean = false) {
    setBusy(next);
    setErr(null);
    try {
      const res = await fetch("/api/admin/stage-windows/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage,
          status: next,
          ...(withAnnounce ? { announce: { title, message } } : {}),
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error || "Failed to change status");
        return;
      }
      onStatusChange(next);
      setAnnounceOpen(false);
    } catch {
      setErr("Network error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="bg-white border border-border rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-foreground">Stage status</h2>
        <StatusPill status={status} />
      </div>

      {err && (
        <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
          {err}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Open */}
        {status === "OPEN" ? (
          <ActionButton
            label="Open"
            description="Interns can enter and submit."
            icon={LockOpen}
            tone="ok"
            disabled
            current
          />
        ) : announceOpen ? (
          <div className="md:col-span-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
            <p className="text-xs font-semibold text-emerald-900">
              Announce to the cohort
            </p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
              className="w-full p-2 border border-emerald-300 rounded-lg text-sm bg-white"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="What should participants know?"
              className="w-full p-2 border border-emerald-300 rounded-lg text-sm bg-white resize-y"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setStatus("OPEN", true)}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:opacity-90 disabled:opacity-50"
              >
                {busy === "OPEN" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Megaphone className="h-3.5 w-3.5" />}
                Open &amp; announce
              </button>
              <button
                onClick={() => setStatus("OPEN", false)}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-emerald-300 text-emerald-900 hover:bg-emerald-100"
              >
                Open silently
              </button>
              <button
                onClick={() => setAnnounceOpen(false)}
                disabled={busy !== null}
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <ActionButton
            label="Open"
            description="Make this stage live for interns."
            icon={LockOpen}
            tone="ok"
            onClick={() => setAnnounceOpen(true)}
            disabled={busy !== null}
          />
        )}

        {/* Pause */}
        {!announceOpen && (
          <>
            <ActionButton
              label="Pause"
              description="Hide entry temporarily. Existing submissions stay."
              icon={Pause}
              tone="warn"
              current={status === "PAUSED"}
              disabled={status === "PAUSED" || busy !== null}
              onClick={() => setStatus("PAUSED")}
              loading={busy === "PAUSED"}
            />

            {/* Close */}
            <ActionButton
              label="Close"
              description="Lock the stage. Interns won't see it as accessible."
              icon={Lock}
              tone="stop"
              current={status === "CLOSED"}
              disabled={status === "CLOSED" || busy !== null}
              onClick={() => {
                if (!confirm(`Close Stage ${stageNum}? Interns will lose entry until you open it again.`)) return;
                setStatus("CLOSED");
              }}
              loading={busy === "CLOSED"}
            />
          </>
        )}
      </div>
    </section>
  );
}

function ActionButton({
  label,
  description,
  icon: Icon,
  tone,
  onClick,
  disabled,
  current,
  loading,
}: {
  label: string;
  description: string;
  icon: React.ElementType;
  tone: "ok" | "warn" | "stop";
  onClick?: () => void;
  disabled?: boolean;
  current?: boolean;
  loading?: boolean;
}) {
  const toneClasses = {
    ok: "border-emerald-300 hover:bg-emerald-50 text-emerald-900",
    warn: "border-amber-300 hover:bg-amber-50 text-amber-900",
    stop: "border-slate-300 hover:bg-slate-50 text-slate-900",
  }[tone];
  const iconClass = {
    ok: "text-emerald-700",
    warn: "text-amber-700",
    stop: "text-slate-700",
  }[tone];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-left p-4 rounded-lg border-2 transition-colors ${
        current ? "bg-foreground/5 border-foreground/30" : `bg-white ${toneClasses}`
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <div className="flex items-center gap-2 mb-1">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className={`h-4 w-4 ${iconClass}`} />}
        <span className="font-semibold text-sm">{label}</span>
        {current && (
          <span className="ml-auto text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            current
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </button>
  );
}

function StatusPill({ status }: { status: Status }) {
  if (status === "OPEN") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
        <LockOpen className="w-3 h-3" /> Open
      </span>
    );
  }
  if (status === "PAUSED") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
        <Pause className="w-3 h-3" /> Paused
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
      <Lock className="w-3 h-3" /> Closed
    </span>
  );
}

// ── Publish results — histogram + slider + publish ──────

function PublishResults({
  stage,
  stageNum,
  submissions,
  initialPassingScore,
  published,
}: {
  stage: string;
  stageNum: string;
  submissions: ReportRow[];
  initialPassingScore: number | null;
  published: boolean;
}) {
  const router = useRouter();
  const [threshold, setThreshold] = useState<number>(initialPassingScore ?? 70);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  // Only graded reports (not drafts / submitted-but-ungraded) count.
  const graded = submissions.filter((s) => s.score != null);

  // Histogram in 10-point buckets: [0-9], [10-19], … [90-100].
  const buckets = useMemo(() => {
    const arr = Array.from({ length: 10 }, (_, i) => ({
      from: i * 10,
      to: i === 9 ? 100 : i * 10 + 9,
      count: 0,
    }));
    for (const s of graded) {
      const score = Math.max(0, Math.min(100, s.score ?? 0));
      const idx = score === 100 ? 9 : Math.floor(score / 10);
      arr[idx].count += 1;
    }
    return arr;
  }, [graded]);

  const maxBucket = Math.max(1, ...buckets.map((b) => b.count));
  const passing = graded.filter((s) => (s.score ?? 0) >= threshold).length;
  const failing = graded.length - passing;

  async function publish() {
    if (!confirm(`Publish Stage ${stageNum} results with passing score ${threshold}?\n\n${passing} pass · ${failing} below threshold. This is one-way.`)) return;
    setBusy(true);
    setErr(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/stage-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, passingScore: threshold }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error || "Publish failed");
      } else {
        setResult(`Published. ${j.passed} passed · ${j.failed} did not. Emails queued.`);
        router.refresh();
      }
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {/* Histogram */}
      <div className="mb-4">
        <div className="flex items-end gap-1 h-28">
          {buckets.map((b) => {
            const pct = (b.count / maxBucket) * 100;
            const passes = b.from >= threshold || (b.from + 9 >= threshold && b.from + 9 - threshold > 5);
            const isMixed = b.from < threshold && b.to >= threshold;
            return (
              <div key={b.from} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] tabular-nums text-muted-foreground h-3">
                  {b.count > 0 ? b.count : ""}
                </span>
                <div
                  className={`w-full rounded-t transition-colors ${
                    isMixed
                      ? "bg-amber-400"
                      : passes
                        ? "bg-emerald-500"
                        : "bg-rose-400"
                  }`}
                  style={{ height: `${pct}%`, minHeight: b.count > 0 ? 2 : 0 }}
                  title={`${b.from}-${b.to}: ${b.count} graded`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex gap-1 mt-1">
          {buckets.map((b) => (
            <div key={b.from} className="flex-1 text-center text-[9.5px] font-mono text-muted-foreground">
              {b.from}
            </div>
          ))}
        </div>
      </div>

      {/* Slider + counts */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center mb-4">
        <div>
          <label className="text-xs text-muted-foreground block mb-1.5">
            Passing score: <strong className="text-foreground">{threshold}</strong>{" "}
            <span className="text-muted-foreground">/ 100</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            disabled={published || busy}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
            {passing} pass
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-rose-50 text-rose-800 border border-rose-200">
            {failing} below
          </span>
        </div>
      </div>

      {err && (
        <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
          {err}
        </div>
      )}
      {result && (
        <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-900">
          {result}
        </div>
      )}

      <button
        onClick={publish}
        disabled={busy || published || graded.length === 0}
        className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-lg bg-blue text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        {published ? "Already published" : `Publish at ${threshold}/100`}
      </button>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="bg-white border border-border rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wide">
        <Icon className="h-3.5 w-3.5 text-blue" />
        {label}
      </div>
      <div className="text-xl font-bold text-foreground mt-1 tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
