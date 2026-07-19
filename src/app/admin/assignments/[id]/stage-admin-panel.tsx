"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CalendarClock,
  XCircle,
  Loader2,
  Lock,
  LockOpen,
  Pause,
  Users,
  FileText,
  Megaphone,
  TrendingUp,
} from "lucide-react";

type Status = "OPEN" | "PAUSED" | "CLOSED";
type DisplayStatus = Status | "SCHEDULED";

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
  divergent: boolean;
}

interface Props {
  stage: string;
  stageName: string;
  initialStatus: Status;
  initialScheduled: boolean;
  initialActiveFrom: string | null;
  initialSubmitUntil: string | null;
  accessRows: AccessRow[];
  submissions: ReportRow[];
}

export function StageAdminPanel({
  stage,
  stageName,
  initialStatus,
  initialScheduled,
  initialActiveFrom,
  initialSubmitUntil,
  accessRows,
  submissions,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [scheduled, setScheduled] = useState(initialScheduled);
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
          <StatusPill status={scheduled ? "SCHEDULED" : status} />
          {published && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-blue/10 text-blue border border-blue/30">
              <CheckCircle2 className="w-3 h-3" /> Results published
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Set the release window, open the stage when it is ready, pause access
          temporarily, or close it. Every transition and timing change is audited.
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
        scheduled={scheduled}
        initialActiveFrom={initialActiveFrom}
        initialSubmitUntil={initialSubmitUntil}
        onStatusChange={(s, nextScheduled) => {
          setStatus(s);
          setScheduled(nextScheduled);
          router.refresh();
        }}
      />

      {/* ── Publish results — moved to /admin/stage-results ── */}
      <section className="bg-white border border-border rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-blue" />
          <h2 className="text-sm font-semibold text-foreground">Publish results</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Publishing has moved to the dedicated{" "}
          <Link href={`/admin/stage-results?stage=${stage}`} className="text-blue font-medium hover:underline">
            Stage Results
          </Link>{" "}
          page — apply a cutoff, review the two pending buckets, swap individuals if needed, then finalize. The old one-click publish skipped the audited swap step and is no longer available.
        </p>
        {counts.graded === 0 && !published ? (
          <p className="text-xs text-muted-foreground italic">
            No graded reports yet. The grading bench picks these up at{" "}
            <Link href="/admin/reports" className="text-blue hover:underline">/admin/reports</Link>.
          </p>
        ) : (
          <Link
            href={`/admin/stage-results?stage=${stage}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-blue text-white hover:opacity-90"
          >
            Open Stage {stageNum} results page →
          </Link>
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
  scheduled,
  initialActiveFrom,
  initialSubmitUntil,
  onStatusChange,
}: {
  stage: string;
  stageNum: string;
  status: Status;
  scheduled: boolean;
  initialActiveFrom: string | null;
  initialSubmitUntil: string | null;
  onStatusChange: (s: Status, scheduled: boolean) => void;
}) {
  const [busy, setBusy] = useState<Status | "SCHEDULE" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [activeFrom, setActiveFrom] = useState(toWatDateTime(initialActiveFrom));
  const [submitUntil, setSubmitUntil] = useState(toWatDateTime(initialSubmitUntil));
  const [title, setTitle] = useState(`Stage ${stageNum} is open`);
  const [message, setMessage] = useState(
    `Stage ${stageNum} is now open. Log into your dashboard to begin.`
  );

  async function setStageState(
    next: Status,
    withAnnounce: boolean = false,
    scheduleOnly: boolean = false
  ) {
    setBusy(scheduleOnly ? "SCHEDULE" : next);
    setErr(null);
    try {
      const res = await fetch("/api/admin/stage-windows/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage,
          status: next,
          activeFrom: watDateTimeToIso(activeFrom),
          submitUntil: watDateTimeToIso(submitUntil),
          ...(withAnnounce ? { announce: { title, message } } : {}),
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error || "Failed to change status");
        return;
      }
      const nextScheduled = next === "OPEN" && Boolean(
        j.window?.activeFrom && new Date(j.window.activeFrom).getTime() > Date.now()
      );
      onStatusChange(next, nextScheduled);
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
        <StatusPill status={scheduled ? "SCHEDULED" : status} />
      </div>

      <div className="mb-5 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
            <CalendarClock className="h-3.5 w-3.5 text-blue" /> Start time (WAT)
          </span>
          <input
            type="datetime-local"
            value={activeFrom}
            onChange={(event) => setActiveFrom(event.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border bg-white text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-foreground">Submission deadline (WAT)</span>
          <input
            type="datetime-local"
            value={submitUntil}
            onChange={(event) => setSubmitUntil(event.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border bg-white text-sm"
          />
        </label>
        <button
          type="button"
          onClick={() => setStageState(status, false, true)}
          disabled={busy !== null}
          className="h-10 inline-flex items-center justify-center gap-1.5 px-4 rounded-lg border border-blue/40 text-blue text-sm font-semibold hover:bg-blue/5 disabled:opacity-50"
        >
          {busy === "SCHEDULE" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarClock className="h-3.5 w-3.5" />}
          Save timing
        </button>
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
            label={scheduled ? "Scheduled" : "Open"}
            description={scheduled ? "Access unlocks automatically at the saved start time." : "Interns can enter and submit."}
            icon={scheduled ? CalendarClock : LockOpen}
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
                onClick={() => setStageState("OPEN", true)}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:opacity-90 disabled:opacity-50"
              >
                {busy === "OPEN" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Megaphone className="h-3.5 w-3.5" />}
                Open &amp; announce
              </button>
              <button
                onClick={() => setStageState("OPEN", false)}
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
              onClick={() => setStageState("PAUSED")}
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
                setStageState("CLOSED");
              }}
              loading={busy === "CLOSED"}
            />
          </>
        )}
      </div>
    </section>
  );
}

function toWatDateTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() + 60 * 60_000).toISOString().slice(0, 16);
}

function watDateTimeToIso(wat: string): string | null {
  if (!wat) return null;
  const date = new Date(`${wat}:00+01:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
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

function StatusPill({ status }: { status: DisplayStatus }) {
  if (status === "SCHEDULED") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200">
        <CalendarClock className="w-3 h-3" /> Scheduled
      </span>
    );
  }
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

// PublishResults removed — the direct-publish path on /api/admin/stage-results
// was a backdoor that bypassed the cutoff/pending/swap/finalize audit flow and
// used a different scoring formula (report.score only, not the 80/20 combined
// finalScore). All publishing now goes through /admin/stage-results.

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
