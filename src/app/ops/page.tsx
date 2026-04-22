import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  Activity,
  Clock,
  Mail,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

// How many hours a report has been waiting before it counts as "stale."
const STALE_AFTER_HOURS = 48;

export const dynamic = "force-dynamic";

export default async function OpsDashboardPage() {
  const now = new Date();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);
  const staleBoundary = new Date(now.getTime() - STALE_AFTER_HOURS * 3_600_000);

  const [
    reportCounts,
    staleReports,
    oldestSubmitted,
    emailPending,
    emailSentToday,
    emailFailed,
    stageCounts,
    gradersBacklog,
    totalInterns,
    activeInterns,
    slackJoinedInterns,
    recentApplicants,
  ] = await Promise.all([
    prisma.stageReport.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.stageReport.count({
      where: {
        status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
        submittedAt: { lt: staleBoundary },
      },
    }),
    prisma.stageReport.findFirst({
      where: { status: "SUBMITTED", graderId: null },
      orderBy: { submittedAt: "asc" },
      select: { submittedAt: true },
    }),
    prisma.emailQueueItem.count({ where: { status: "PENDING" } }),
    prisma.emailQueueItem.count({
      where: { status: "SENT", sentAt: { gte: startOfToday } },
    }),
    prisma.emailQueueItem.count({ where: { status: "FAILED" } }),
    prisma.intern.groupBy({
      by: ["currentStage"],
      _count: { _all: true },
      where: { isActive: true },
    }),
    prisma.stageReport.groupBy({
      by: ["graderId"],
      where: { status: "UNDER_REVIEW", graderId: { not: null } },
      _count: { _all: true },
    }),
    prisma.intern.count(),
    prisma.intern.count({ where: { isActive: true } }),
    prisma.intern.count({ where: { slackJoined: true } }),
    prisma.publicApplication.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
  ]);

  const graderIds = gradersBacklog.map((g) => g.graderId!).filter(Boolean);
  const graderUsers = graderIds.length
    ? await prisma.user.findMany({
        where: { id: { in: graderIds } },
        select: { id: true, firstName: true, lastName: true, email: true },
      })
    : [];

  const reportsByStatus = new Map(
    reportCounts.map((r) => [r.status, r._count._all])
  );

  const stageCountsMap = new Map(
    stageCounts.map((s) => [s.currentStage, s._count._all])
  );

  const oldestAgeH = oldestSubmitted?.submittedAt
    ? Math.round((now.getTime() - oldestSubmitted.submittedAt.getTime()) / 3_600_000)
    : null;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full">
      <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Activity className="h-6 w-6 text-blue" />
            <h1 className="text-2xl font-bold text-foreground">Operations</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Live health of the programme. Refresh this page to pull fresh numbers.
          </p>
        </div>
        <nav className="flex gap-2 text-sm">
          <Link
            href="/admin"
            className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50"
          >
            Admin home
          </Link>
          <Link
            href="/admin/reports"
            className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50"
          >
            Grading queue
          </Link>
          <Link
            href="/admin/stage-results"
            className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50"
          >
            Publish results
          </Link>
        </nav>
      </header>

      {/* ── Alerts ── */}
      {(staleReports > 0 || emailFailed > 0) && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
          <div className="flex items-center gap-2 font-semibold text-amber-900">
            <AlertTriangle className="h-4 w-4" />
            Attention
          </div>
          {staleReports > 0 && (
            <p className="text-sm text-amber-900">
              <strong>{staleReports}</strong> reports have been waiting more than{" "}
              {STALE_AFTER_HOURS} hours. Ping a grader.
            </p>
          )}
          {emailFailed > 0 && (
            <p className="text-sm text-amber-900">
              <strong>{emailFailed}</strong> emails failed to send after retries.
              Investigate SMTP credentials.
            </p>
          )}
        </div>
      )}

      {/* ── Headline stats ── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat
          icon={FileText}
          label="Awaiting grading"
          value={
            (reportsByStatus.get("SUBMITTED") ?? 0) +
            (reportsByStatus.get("UNDER_REVIEW") ?? 0)
          }
          sub={
            oldestAgeH != null ? `Oldest: ${oldestAgeH}h old` : "Queue empty"
          }
          color="text-blue"
        />
        <Stat
          icon={CheckCircle2}
          label="Graded (awaiting publish)"
          value={reportsByStatus.get("GRADED") ?? 0}
          sub="Set threshold to publish"
          color="text-emerald-700"
        />
        <Stat
          icon={Mail}
          label="Emails pending"
          value={emailPending}
          sub={`${emailSentToday} sent today`}
          color="text-purple-700"
        />
        <Stat
          icon={Users}
          label="Active interns"
          value={activeInterns}
          sub={`${totalInterns} total`}
          color="text-foreground"
        />
      </section>

      {/* ── Stage funnel ── */}
      <section className="mb-8 bg-white border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue" />
          Stage funnel (active interns)
        </h2>
        <StageFunnel stageCountsMap={stageCountsMap} total={activeInterns} />
      </section>

      {/* ── Grader workload ── */}
      {gradersBacklog.length > 0 && (
        <section className="mb-8 bg-white border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">
            Claimed reports per grader
          </h2>
          <div className="space-y-2">
            {gradersBacklog.map((g) => {
              const u = graderUsers.find((x) => x.id === g.graderId);
              const name = u ? `${u.firstName} ${u.lastName}` : "(unknown)";
              return (
                <div
                  key={g.graderId}
                  className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded"
                >
                  <span>
                    <strong>{name}</strong>
                    <span className="text-muted-foreground"> · {u?.email}</span>
                  </span>
                  <span className="font-mono text-xs px-2 py-1 bg-white border border-border rounded">
                    {g._count._all} claimed
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Secondary stats ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat
          icon={Clock}
          label="New applications (7d)"
          value={recentApplicants}
          sub="Public applications"
          color="text-blue"
        />
        <Stat
          icon={Users}
          label="Slack-joined interns"
          value={slackJoinedInterns}
          sub={`of ${activeInterns} active`}
          color="text-[#4A154B]"
        />
        <Stat
          icon={Mail}
          label="Emails failed (total)"
          value={emailFailed}
          sub="After 3 retries"
          color="text-rose-700"
        />
      </section>
    </div>
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
  value: number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
        <Icon className={`h-4 w-4 ${color}`} />
        {label}
      </div>
      <div className="text-3xl font-bold text-foreground mt-1 tabular-nums">
        {value}
      </div>
      {sub && (
        <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
      )}
    </div>
  );
}

function StageFunnel({
  stageCountsMap,
  total,
}: {
  stageCountsMap: Map<string, number>;
  total: number;
}) {
  const stages = [
    "STAGE_0",
    "STAGE_1",
    "STAGE_2",
    "STAGE_3",
    "STAGE_4",
    "STAGE_5",
  ];
  const max = Math.max(1, ...Array.from(stageCountsMap.values()));

  return (
    <div className="space-y-2">
      {stages.map((stage) => {
        const count = stageCountsMap.get(stage) ?? 0;
        const pct = total === 0 ? 0 : (count / max) * 100;
        return (
          <div key={stage} className="flex items-center gap-3 text-sm">
            <span className="w-20 text-muted-foreground tabular-nums">
              {stage.replace("STAGE_", "Stage ")}
            </span>
            <div className="flex-1 bg-muted/40 rounded h-6 overflow-hidden">
              <div
                className="bg-blue h-full rounded"
                style={{ width: `${Math.max(pct, count > 0 ? 2 : 0)}%` }}
              />
            </div>
            <span className="w-14 text-right font-medium tabular-nums">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
