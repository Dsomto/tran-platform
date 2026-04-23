"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  LockOpen,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  Award,
  Users,
  Send,
  TrendingUp,
  Clock,
} from "lucide-react";

interface SubmissionRow {
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

interface AssignmentShape {
  id: string;
  order: number | null;
  title: string;
  description: string;
  stage: string;
  track: string | null;
  kind: string;
  widget: string;
  dueDate: string | null;
  maxPoints: number;
  passingScore: number | null;
  isClosed: boolean;
  closedAt: string | null;
  publishedAt: string | null;
}

interface Props {
  assignment: AssignmentShape;
  eligible: number;
  submissions: SubmissionRow[];
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  // datetime-local wants "YYYY-MM-DDTHH:mm"
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AssignmentAdminPanel({ assignment: initial, eligible, submissions }: Props) {
  const router = useRouter();
  const [a, setA] = useState(initial);
  const [dueInput, setDueInput] = useState(toLocalInput(initial.dueDate));
  const [passInput, setPassInput] = useState(
    initial.passingScore != null ? String(initial.passingScore) : ""
  );
  const [saving, setSaving] = useState<null | "due" | "close" | "publish">(null);
  const [err, setErr] = useState<string | null>(null);

  async function patch(payload: Record<string, unknown>, kind: "due" | "close" | "publish") {
    setSaving(kind);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/assignments/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error || "Failed");
      } else {
        setA((prev) => ({
          ...prev,
          dueDate: j.assignment.dueDate ?? prev.dueDate,
          isClosed: j.assignment.isClosed,
          passingScore: j.assignment.passingScore,
          closedAt: j.assignment.closedAt,
          publishedAt: j.assignment.publishedAt,
        }));
        router.refresh();
      }
    } catch {
      setErr("Network error");
    } finally {
      setSaving(null);
    }
  }

  async function saveDue() {
    const iso = dueInput ? new Date(dueInput).toISOString() : null;
    await patch({ dueDate: iso }, "due");
  }

  async function toggleClose() {
    if (a.isClosed) {
      await patch({ isClosed: false }, "close");
      return;
    }
    if (!confirm("Close this assignment? Interns can't submit new answers after this.")) return;
    await patch({ isClosed: true }, "close");
  }

  async function publishThreshold() {
    const n = Number(passInput);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      setErr("Passing score must be between 0 and 100");
      return;
    }
    if (!a.isClosed) {
      if (!confirm("Publishing will fix a passing score for this assignment even though it's still open. Continue?")) return;
    }
    await patch({ passingScore: Math.round(n) }, "publish");
  }

  const counts = useMemo(() => {
    const c = {
      total: submissions.length,
      pending: 0,
      submitted: 0,
      graded: 0,
      late: 0,
      passing: 0,
      failing: 0,
    };
    for (const s of submissions) {
      if (s.status === "PENDING") c.pending++;
      else if (s.status === "SUBMITTED") c.submitted++;
      else if (s.status === "GRADED") c.graded++;
      else if (s.status === "LATE") c.late++;
      if (a.passingScore != null && typeof s.score === "number") {
        if (s.score >= a.passingScore) c.passing++;
        else c.failing++;
      }
    }
    return c;
  }, [submissions, a.passingScore]);

  return (
    <>
      <header className="mb-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <span>{a.stage.replace("STAGE_", "Stage ")}</span>
          {a.order != null && <span>· #{a.order}</span>}
          <span>· {a.kind}</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">{a.title}</h1>
        <p className="text-sm text-muted-foreground mt-2 line-clamp-3 whitespace-pre-wrap">
          {a.description}
        </p>
      </header>

      {/* ── Analytics row ── */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <Stat icon={Users} label="Eligible" value={eligible} />
        <Stat icon={TrendingUp} label="Started" value={counts.total} />
        <Stat
          icon={Clock}
          label="Submitted"
          value={counts.submitted + counts.late}
          sub={counts.late > 0 ? `${counts.late} late` : undefined}
        />
        <Stat icon={CheckCircle2} label="Graded" value={counts.graded} />
        {a.passingScore != null ? (
          <Stat
            icon={Award}
            label="Passing"
            value={counts.passing}
            sub={`${counts.failing} below threshold`}
            color="text-emerald-700"
          />
        ) : (
          <Stat icon={Award} label="Pass/Fail" value="—" sub="Not yet published" />
        )}
      </section>

      {err && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
          {err}
        </div>
      )}

      {/* ── Control panels ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Deadline */}
        <div className="bg-white border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue" /> Deadline
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            Submissions after this time are marked <code>LATE</code> but still accepted until closed.
          </p>
          <input
            type="datetime-local"
            value={dueInput}
            onChange={(e) => setDueInput(e.target.value)}
            className="w-full p-2 border border-border rounded-lg text-sm mb-3"
          />
          <button
            onClick={saveDue}
            disabled={saving === "due"}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-foreground text-background hover:opacity-90 disabled:opacity-50"
          >
            {saving === "due" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save deadline
          </button>
        </div>

        {/* Close */}
        <div className="bg-white border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            {a.isClosed ? <Lock className="w-4 h-4 text-rose-700" /> : <LockOpen className="w-4 h-4 text-emerald-700" />}
            Submissions
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            {a.isClosed
              ? `Closed ${a.closedAt ? new Date(a.closedAt).toLocaleString() : ""}. New submissions blocked.`
              : "Open — interns can still submit or resubmit."}
          </p>
          <button
            onClick={toggleClose}
            disabled={saving === "close"}
            className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg disabled:opacity-50 ${
              a.isClosed
                ? "bg-white text-foreground border border-border hover:bg-muted/50"
                : "bg-rose-600 text-white hover:opacity-90"
            }`}
          >
            {saving === "close" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {a.isClosed ? "Reopen submissions" : "Close submissions"}
          </button>
        </div>

        {/* Passing score */}
        <div className="bg-white border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Award className="w-4 h-4 text-blue" /> Passing score
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            {a.publishedAt
              ? `Published ${new Date(a.publishedAt).toLocaleString()}. Threshold: ${a.passingScore}/100.`
              : "Set after you've reviewed the score distribution. Changes pass/fail status for everyone."}
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              max={100}
              value={passInput}
              onChange={(e) => setPassInput(e.target.value)}
              className="w-20 p-2 border border-border rounded-lg text-sm"
            />
            <button
              onClick={publishThreshold}
              disabled={saving === "publish"}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-blue text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving === "publish" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {a.publishedAt ? "Update" : "Publish"}
            </button>
          </div>
        </div>
      </section>

      {/* ── Submissions table ── */}
      <section className="bg-white border border-border rounded-xl overflow-hidden">
        <h2 className="text-sm font-semibold text-foreground p-5 pb-3 uppercase tracking-wide">
          Submissions ({submissions.length})
        </h2>
        {submissions.length === 0 ? (
          <div className="px-5 pb-5 text-sm text-muted-foreground">
            No interns have opened or submitted this assignment yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {submissions.map((s) => {
              const passed =
                a.passingScore != null &&
                typeof s.score === "number" &&
                s.score >= a.passingScore;
              const failed =
                a.passingScore != null &&
                typeof s.score === "number" &&
                s.score < a.passingScore;
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
                    {s.submittedAt
                      ? new Date(s.submittedAt).toLocaleString()
                      : "not submitted"}
                  </div>
                  <div className="shrink-0">
                    <span
                      className={`text-xs px-2 py-0.5 rounded border ${
                        s.status === "GRADED"
                          ? "bg-blue/10 text-blue border-blue/30"
                          : s.status === "LATE"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : s.status === "SUBMITTED"
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
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white border border-border rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wide">
        <Icon className={`h-3.5 w-3.5 ${color ?? "text-blue"}`} />
        {label}
      </div>
      <div className="text-xl font-bold text-foreground mt-1 tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
