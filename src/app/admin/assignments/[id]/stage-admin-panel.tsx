"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
  Lock,
  LockOpen,
  Users,
  TrendingUp,
  Megaphone,
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
  passingScore: number;
  isLocked: boolean;
}

interface Props {
  stage: string;
  initialWindow: WindowData | null;
  eligible: number;
  submissions: ReportRow[];
}

export function StageAdminPanel({ stage, initialWindow, eligible, submissions }: Props) {
  const router = useRouter();
  const [win, setWin] = useState<WindowData | null>(initialWindow);

  const [opening, setOpening] = useState(false);
  const [locking, setLocking] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Inline announce-on-open form, same UX as the list page.
  const [announceOpen, setAnnounceOpen] = useState(false);
  const stageNum = stage.replace("STAGE_", "");
  const [announceTitle, setAnnounceTitle] = useState(`Stage ${stageNum} is open`);
  const [announceMessage, setAnnounceMessage] = useState(
    `Stage ${stageNum} is now open. Log into your dashboard to begin.`
  );

  // Publish flow — only place the passing score exists.
  const [publishMode, setPublishMode] = useState(false);
  const [passInput, setPassInput] = useState("70");

  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const isLocked = win?.isLocked ?? true;

  async function openStage() {
    setOpening(true);
    setErr(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/stage-windows/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, title: announceTitle, message: announceMessage }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error || "Failed to open stage");
        return;
      }
      setWin({
        passingScore: j.window?.passingScore ?? win?.passingScore ?? 70,
        isLocked: false,
      });
      setAnnounceOpen(false);
      setResult(`Opened. ${j.notifying ?? 0} participants will be emailed.`);
      router.refresh();
    } catch {
      setErr("Network error");
    } finally {
      setOpening(false);
    }
  }

  async function lockStage() {
    if (!confirm(`Lock Stage ${stageNum}? Interns will lose access until you open it again.`)) return;
    setLocking(true);
    setErr(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/stage-windows/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error || "Failed to lock stage");
        return;
      }
      setWin({
        passingScore: win?.passingScore ?? 70,
        isLocked: true,
      });
      setResult("Locked. Interns no longer see this stage.");
      router.refresh();
    } catch {
      setErr("Network error");
    } finally {
      setLocking(false);
    }
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
        return;
      }
      setResult(
        `Published. ${j.passed} passed · ${j.failed} did not. Emails queued.`
      );
      setPublishMode(false);
      router.refresh();
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

  const published = counts.passed + counts.failed > 0;

  return (
    <>
      <header className="mb-6">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h1 className="text-2xl font-bold text-foreground">Stage {stageNum}</h1>
          {isLocked ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              <Lock className="w-3 h-3" /> Locked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              <LockOpen className="w-3 h-3" /> Open to interns
            </span>
          )}
          {published && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-blue/10 text-blue border border-blue/30">
              <CheckCircle2 className="w-3 h-3" /> Results published
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Open the stage so interns can see it, close it when you want access revoked, and publish results when grading is complete.
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
          value={published ? `${counts.passed}/${counts.passed + counts.failed}` : "—"}
          sub={published ? `${counts.passed} passed` : "Not yet published"}
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

      {/* Two controls — open/close, and publish */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Open / Lock */}
        <div className="bg-white border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            {isLocked ? (
              <Lock className="w-4 h-4 text-slate-700" />
            ) : (
              <LockOpen className="w-4 h-4 text-emerald-700" />
            )}
            Access
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            {isLocked
              ? "Locked. Interns cannot see this stage on their dashboard. Opening sends a pinned announcement + cohort email."
              : "Open. Interns at this stage can submit reports. Locking hides it again (silent — no email)."}
          </p>

          {isLocked ? (
            announceOpen ? (
              <div className="space-y-2">
                <input
                  value={announceTitle}
                  onChange={(e) => setAnnounceTitle(e.target.value)}
                  placeholder="Announcement title"
                  className="w-full p-2 border border-border rounded-lg text-sm bg-white"
                />
                <textarea
                  value={announceMessage}
                  onChange={(e) => setAnnounceMessage(e.target.value)}
                  rows={3}
                  placeholder="What should participants know?"
                  className="w-full p-2 border border-border rounded-lg text-sm bg-white resize-y"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={openStage}
                    disabled={opening}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {opening ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Megaphone className="h-3.5 w-3.5" />
                    )}
                    Open &amp; announce
                  </button>
                  <button
                    onClick={() => setAnnounceOpen(false)}
                    disabled={opening}
                    className="px-3 py-2 text-xs font-medium rounded-lg border border-border hover:bg-surface-hover"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAnnounceOpen(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:opacity-90"
              >
                <Megaphone className="h-4 w-4" /> Open &amp; announce
              </button>
            )
          ) : (
            <button
              onClick={lockStage}
              disabled={locking}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg bg-slate-700 text-white hover:opacity-90 disabled:opacity-50"
            >
              {locking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Close stage
            </button>
          )}
        </div>

        {/* Publish results — the ONLY place passing score is set */}
        <div className="bg-white border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Award className="w-4 h-4 text-blue" /> Publish results
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Once grading is done, set the passing score and promote passers to the next stage. Emails queue to every graded participant.
          </p>

          {counts.graded === 0 ? (
            <button
              disabled
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-blue/10 text-blue/70 cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              Nothing graded yet
            </button>
          ) : publishMode ? (
            <div className="space-y-2">
              <label className="block text-xs text-muted-foreground">Passing score</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={passInput}
                  onChange={(e) => setPassInput(e.target.value)}
                  className="w-20 p-2 border border-border rounded-lg text-sm"
                  autoFocus
                />
                <span className="self-center text-xs text-muted-foreground">/ 100</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={publishResults}
                  disabled={publishing}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg bg-blue text-white hover:opacity-90 disabled:opacity-50"
                >
                  {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Confirm &amp; publish
                </button>
                <button
                  onClick={() => setPublishMode(false)}
                  disabled={publishing}
                  className="px-3 py-2 text-xs font-medium rounded-lg border border-border hover:bg-surface-hover"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setPublishMode(true)}
              disabled={published}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg bg-blue text-white hover:opacity-90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {published ? "Already published" : "Publish results"}
            </button>
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
