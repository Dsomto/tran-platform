"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Award,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
  Lock,
  LockOpen,
  Users,
  TrendingUp,
  Clock,
} from "lucide-react";

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

interface WindowData {
  activeFrom: string;
  submitUntil: string;
  passingScore: number;
}

interface Props {
  stage: string;
  initialWindow: WindowData | null;
  eligible: number;
  submissions: ReportRow[];
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultActiveFrom(): string {
  return toLocalInput(new Date().toISOString());
}

export function StageAdminPanel({ stage, initialWindow, eligible, submissions }: Props) {
  const router = useRouter();
  const [win, setWin] = useState<WindowData | null>(initialWindow);
  const [fromInput, setFromInput] = useState(
    initialWindow ? toLocalInput(initialWindow.activeFrom) : defaultActiveFrom()
  );
  const [untilInput, setUntilInput] = useState(
    initialWindow ? toLocalInput(initialWindow.submitUntil) : ""
  );
  const [passInput, setPassInput] = useState(
    initialWindow ? String(initialWindow.passingScore) : "60"
  );

  const [savingWindow, setSavingWindow] = useState(false);
  const [closing, setClosing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const stageNum = stage.replace("STAGE_", "");
  const now = Date.now();
  const isClosed = win ? new Date(win.submitUntil).getTime() < now : false;

  async function saveWindow(overrides?: Partial<WindowData>) {
    setSavingWindow(true);
    setErr(null);
    setResult(null);
    try {
      const payload: Record<string, unknown> = {
        stage,
        activeFrom: overrides?.activeFrom ?? new Date(fromInput).toISOString(),
        submitUntil: overrides?.submitUntil ?? new Date(untilInput).toISOString(),
        passingScore:
          overrides?.passingScore ??
          (Number.isFinite(Number(passInput)) ? Number(passInput) : 60),
      };
      const res = await fetch("/api/admin/stage-windows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error || "Failed to save stage window");
        return false;
      }
      setWin({
        activeFrom: new Date(j.window.activeFrom).toISOString(),
        submitUntil: new Date(j.window.submitUntil).toISOString(),
        passingScore: j.window.passingScore,
      });
      router.refresh();
      return true;
    } catch {
      setErr("Network error");
      return false;
    } finally {
      setSavingWindow(false);
    }
  }

  async function saveDeadline() {
    if (!fromInput || !untilInput) {
      setErr("Both start and deadline dates are required");
      return;
    }
    await saveWindow();
  }

  async function closeNow() {
    if (!confirm(`Close Stage ${stageNum}? No more submissions after this moment.`)) return;
    setClosing(true);
    setErr(null);
    const fromISO = win ? win.activeFrom : new Date(fromInput || new Date().toISOString()).toISOString();
    const closeAtISO = new Date().toISOString();
    const passing = win ? win.passingScore : Number(passInput) || 60;
    await saveWindow({
      activeFrom: fromISO,
      submitUntil: closeAtISO,
      passingScore: passing,
    });
    setClosing(false);
  }

  async function publishResults() {
    const n = Number(passInput);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      setErr("Passing score must be between 0 and 100");
      return;
    }
    if (
      !confirm(
        `Publish Stage ${stageNum} results with passing score ${Math.round(n)}?\n\nEmails will be queued to every graded participant. This promotes passers to the next stage.`
      )
    ) {
      return;
    }
    setPublishing(true);
    setErr(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/stage-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, passingScore: Math.round(n) }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error || "Publish failed");
      } else {
        setResult(
          `Published. ${j.passed} participants passed · ${j.failed} did not. Emails queued.`
        );
        router.refresh();
      }
    } catch {
      setErr("Network error");
    } finally {
      setPublishing(false);
    }
  }

  const counts = useMemo(() => {
    const c = {
      total: submissions.length,
      draft: 0,
      submitted: 0,
      underReview: 0,
      graded: 0,
      passed: 0,
      failed: 0,
      late: 0,
    };
    for (const s of submissions) {
      if (s.status === "DRAFT") c.draft++;
      else if (s.status === "SUBMITTED") c.submitted++;
      else if (s.status === "UNDER_REVIEW") c.underReview++;
      else if (s.status === "GRADED") c.graded++;
      else if (s.status === "PASSED") c.passed++;
      else if (s.status === "FAILED") c.failed++;
      else if (s.status === "LATE") c.late++;
    }
    return c;
  }, [submissions]);

  return (
    <>
      <header className="mb-6">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h1 className="text-2xl font-bold text-foreground">Stage {stageNum}</h1>
          {isClosed ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              <Lock className="w-3 h-3" /> Closed
            </span>
          ) : win ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              <LockOpen className="w-3 h-3" /> Open
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              Not yet configured
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Set one deadline for the whole stage, set the passing grade, close submissions, publish results.
        </p>
      </header>

      {/* Analytics */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat icon={Users} label="Interns at stage" value={eligible} />
        <Stat icon={TrendingUp} label="Reports in" value={counts.submitted + counts.underReview + counts.late} />
        <Stat icon={CheckCircle2} label="Graded" value={counts.graded} />
        <Stat
          icon={Award}
          label="Published"
          value={counts.passed + counts.failed > 0 ? `${counts.passed}/${counts.passed + counts.failed}` : "—"}
          sub={counts.passed + counts.failed > 0 ? `${counts.passed} passed` : "Not yet published"}
        />
      </section>

      {err && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
          {err}
        </div>
      )}
      {result && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-900">
          {result}
        </div>
      )}

      {/* Controls */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue" /> Deadline
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            One window for the whole stage. Submissions after the deadline are locked out.
          </p>
          <label className="block text-xs text-muted-foreground mb-1">Opens at</label>
          <input
            type="datetime-local"
            value={fromInput}
            onChange={(e) => setFromInput(e.target.value)}
            className="w-full p-2 border border-border rounded-lg text-sm mb-2"
          />
          <label className="block text-xs text-muted-foreground mb-1">Closes at</label>
          <input
            type="datetime-local"
            value={untilInput}
            onChange={(e) => setUntilInput(e.target.value)}
            className="w-full p-2 border border-border rounded-lg text-sm mb-3"
          />
          <button
            onClick={saveDeadline}
            disabled={savingWindow}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-foreground text-background hover:opacity-90 disabled:opacity-50"
          >
            {savingWindow ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save window
          </button>
        </div>

        <div className="bg-white border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            {isClosed ? <Lock className="w-4 h-4 text-rose-700" /> : <LockOpen className="w-4 h-4 text-emerald-700" />}
            Submissions
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            {isClosed
              ? "Closed. No new submissions accepted."
              : win
                ? "Open. Closes automatically at the deadline, or close early below."
                : "Save a deadline first."}
          </p>
          <button
            onClick={closeNow}
            disabled={closing || !win || isClosed}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-rose-600 text-white hover:opacity-90 disabled:opacity-50"
          >
            {closing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Close now
          </button>
        </div>

        <div className="bg-white border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Award className="w-4 h-4 text-blue" /> Passing grade
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            After grading, set the threshold and publish. Passers get promoted + emailed.
          </p>
          <div className="flex gap-2 mb-2">
            <input
              type="number"
              min={0}
              max={100}
              value={passInput}
              onChange={(e) => setPassInput(e.target.value)}
              className="w-20 p-2 border border-border rounded-lg text-sm"
            />
            <span className="self-center text-xs text-muted-foreground">/ 100</span>
          </div>
          <button
            onClick={publishResults}
            disabled={publishing || counts.graded === 0}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-blue text-white hover:opacity-90 disabled:opacity-50"
          >
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Publish results
          </button>
          {counts.graded === 0 && (
            <p className="text-[11px] text-muted-foreground mt-2">
              No graded reports yet. Graders need to score before you can publish.
            </p>
          )}
        </div>
      </section>

      {/* Submissions */}
      <section className="bg-white border border-border rounded-xl overflow-hidden">
        <h2 className="text-sm font-semibold text-foreground p-5 pb-3 uppercase tracking-wide">
          Reports ({submissions.length})
        </h2>
        {submissions.length === 0 ? (
          <div className="px-5 pb-5 text-sm text-muted-foreground">
            No reports submitted for this stage yet.
          </div>
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
                    <div className="text-xs text-muted-foreground truncate">{s.internEmail}</div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {s.submittedAt ? new Date(s.submittedAt).toLocaleString() : "not submitted"}
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
                              : s.status === "LATE"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : s.status === "SUBMITTED" || s.status === "UNDER_REVIEW"
                                  ? "bg-muted/50 text-foreground/70 border-border"
                                  : "bg-muted/30 text-muted-foreground border-border"
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
