"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Gavel,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  RotateCcw,
} from "lucide-react";

interface QueueItem {
  id: string;
  stage: string;
  status: string;
  version: number;
  submittedAt: string | null;
  claimedAt: string | null;
  internName: string;
  internEmail: string;
  gradeCount: number;
}

interface TiebreakItem {
  id: string;
  stage: string;
  version: number;
  submittedAt: string | null;
  internName: string;
  internEmail: string;
  scores: number[]; // the two grader scores, redacted of identity
}

interface Props {
  queue: QueueItem[];
  mine: QueueItem[];
  tiebreak: TiebreakItem[];
  pendingCount: number;
  passedToday: number;
  failedToday: number;
  isSuper: boolean;
}

export function GraderQueue({
  queue,
  mine,
  tiebreak,
  pendingCount,
  passedToday,
  failedToday,
  isSuper,
}: Props) {
  const router = useRouter();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [skippingId, setSkippingId] = useState<string | null>(null);
  const [releasingStale, setReleasingStale] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function claim(id: string) {
    setClaimingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reports/${id}/claim`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Claim failed");
        setClaimingId(null);
        return;
      }
      router.push(`/admin/reports/${id}`);
    } catch {
      setError("Network error");
      setClaimingId(null);
    }
  }

  async function claimNext() {
    if (!queue.length) return;
    await claim(queue[0].id);
  }

  async function skip(id: string) {
    if (!confirm("Skip this report for conflict of interest? Another grader will pick it up.")) {
      return;
    }
    setSkippingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reports/${id}/skip`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Skip failed");
        setSkippingId(null);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
      setSkippingId(null);
    }
  }

  async function releaseStale() {
    if (!confirm("Release all claims older than 72 hours back to the queue?")) return;
    setReleasingStale(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/admin/reports/release-stale", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Release failed");
        setReleasingStale(false);
        return;
      }
      setInfo(
        data.released === 0
          ? "No stale claims found."
          : `Released ${data.released} stale claim${data.released === 1 ? "" : "s"} on ${data.reportsTouched} report${data.reportsTouched === 1 ? "" : "s"}.`
      );
      setReleasingStale(false);
      router.refresh();
    } catch {
      setError("Network error");
      setReleasingStale(false);
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full">
      <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Gavel className="h-6 w-6 text-blue" />
            <h1 className="text-2xl font-bold text-foreground">Grading Queue</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Every report is graded independently by two graders. Final score is the average — unless you and the other grader disagree by more than 15 points, in which case a super admin steps in. You will not see the other grader&apos;s feedback until you submit yours.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSuper && (
            <button
              onClick={releaseStale}
              disabled={releasingStale}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted/50 disabled:opacity-50"
              title="Release any claim older than 72 hours back to the queue"
            >
              {releasingStale ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              Release stale
            </button>
          )}
          <button
            onClick={claimNext}
            disabled={!queue.length || !!claimingId}
            className="inline-flex items-center gap-2 px-4 py-2 font-medium rounded-lg bg-blue text-white hover:opacity-90 disabled:opacity-50"
          >
            {claimingId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gavel className="h-4 w-4" />}
            Claim next
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Clock} label="Awaiting review" value={pendingCount} color="text-blue" />
        <StatCard icon={CheckCircle2} label="You passed today" value={passedToday} color="text-emerald-700" />
        <StatCard icon={XCircle} label="You failed today" value={failedToday} color="text-rose-700" />
      </div>

      {error && (
        <div className="mb-5 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
          {error}
        </div>
      )}
      {info && (
        <div className="mb-5 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
          {info}
        </div>
      )}

      {isSuper && tiebreak.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-700" />
            Needs tiebreak ({tiebreak.length})
          </h2>
          <div className="bg-amber-50 border border-amber-200 rounded-xl divide-y divide-amber-100">
            {tiebreak.map((r) => {
              const stageNum = r.stage.replace("STAGE_", "");
              const [a, b] = r.scores;
              return (
                <div key={r.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="text-sm">
                      <span className="font-semibold text-foreground">Stage {stageNum}</span>
                      <span className="text-muted-foreground"> · {r.internName}</span>
                    </div>
                    <div className="text-xs text-amber-900/80 mt-1">
                      Reviewer scores: <strong>{a}</strong> vs <strong>{b}</strong>
                      <span className="ml-2 text-amber-800">(differ by {Math.abs((a ?? 0) - (b ?? 0))} pts)</span>
                    </div>
                  </div>
                  <Link
                    href={`/admin/reports/${r.id}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-amber-600 text-white hover:bg-amber-700"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Resolve
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {mine.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Your in-progress claims ({mine.length})
          </h2>
          <div className="bg-white border border-border rounded-xl divide-y divide-border">
            {mine.map((r) => (
              <Row
                key={r.id}
                report={r}
                action={
                  <Link
                    href={`/admin/reports/${r.id}`}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-blue text-white hover:opacity-90"
                  >
                    Continue
                  </Link>
                }
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Unclaimed ({queue.length}
          {pendingCount > queue.length ? ` of ${pendingCount}` : ""})
        </h2>
        {queue.length === 0 ? (
          <div className="p-8 bg-white border border-border rounded-xl text-center text-muted-foreground">
            No reports awaiting review.
          </div>
        ) : (
          <div className="bg-white border border-border rounded-xl divide-y divide-border">
            {queue.map((r) => (
              <Row
                key={r.id}
                report={r}
                action={
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => skip(r.id)}
                      disabled={skippingId === r.id}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-50"
                      title="Skip — I have a conflict of interest with this intern"
                    >
                      {skippingId === r.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Skip"
                      )}
                    </button>
                    <button
                      onClick={() => claim(r.id)}
                      disabled={claimingId === r.id}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border border-border hover:bg-muted/50 disabled:opacity-50"
                    >
                      {claimingId === r.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Claim"
                      )}
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Row({ report, action }: { report: QueueItem; action: React.ReactNode }) {
  const stageNum = report.stage.replace("STAGE_", "");
  const when = report.submittedAt ? new Date(report.submittedAt) : null;
  const slotLabel =
    report.gradeCount === 0
      ? "Needs grader 1 of 2"
      : report.gradeCount === 1
      ? "Needs grader 2 of 2"
      : "Two graders assigned";
  return (
    <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="font-semibold text-foreground">Stage {stageNum}</span>
          <span className="text-muted-foreground">· {report.internName}</span>
          {report.version > 1 && (
            <span className="text-xs px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded">
              v{report.version} (resubmit)
            </span>
          )}
          <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded">
            {slotLabel}
          </span>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {report.internEmail}
          {when && (
            <>
              {" · Submitted "}
              {when.toLocaleString()}
            </>
          )}
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
        <Icon className={`h-4 w-4 ${color}`} />
        {label}
      </div>
      <div className="text-2xl font-bold text-foreground mt-1">{value}</div>
    </div>
  );
}
