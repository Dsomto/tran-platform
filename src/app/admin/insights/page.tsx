import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TrendingUp, Users, UserCheck, UserX, Mail, Clock, FileText, Award } from "lucide-react";

// Admin analytics dashboard. Server-rendered so all the queries hit Mongo
// directly and we don't ship counts to the client. Every figure here comes
// from a single COUNT or aggregation — none of this is real-time per-user
// data, so caching can be added later if these queries get expensive.
export default async function AdminInsightsPage() {
  await requireSuperAdmin();

  const startToday = startOfDay(new Date());
  const startWeek = new Date(Date.now() - 7 * 86_400_000);
  const startMonth = new Date(Date.now() - 30 * 86_400_000);

  const [
    totalApplications,
    appsLast7,
    appsLast30,
    appsToday,
    pendingApps,
    approvedApps,
    rejectedApps,
    totalInterns,
    activeInterns,
    finalists,
    stageBreakdown,
    reportsTotal,
    reportsGraded,
    reportsPassed,
    reportsFailed,
    reportsUnderReview,
    reportsDivergent,
    emailQueueCounts,
    recentlyApproved,
  ] = await Promise.all([
    prisma.publicApplication.count(),
    prisma.publicApplication.count({ where: { createdAt: { gte: startWeek } } }),
    prisma.publicApplication.count({ where: { createdAt: { gte: startMonth } } }),
    prisma.publicApplication.count({ where: { createdAt: { gte: startToday } } }),
    prisma.publicApplication.count({ where: { status: "pending" } }),
    prisma.publicApplication.count({ where: { status: "approved" } }),
    prisma.publicApplication.count({ where: { status: "rejected" } }),
    prisma.intern.count(),
    prisma.intern.count({ where: { isActive: true } }),
    prisma.intern.count({ where: { finalist: true } }),
    prisma.intern.groupBy({
      by: ["currentStage"],
      _count: { _all: true },
      where: { isActive: true },
    }),
    prisma.stageReport.count(),
    prisma.stageReport.count({ where: { status: "GRADED" } }),
    prisma.stageReport.count({ where: { status: "PASSED" } }),
    prisma.stageReport.count({ where: { status: "FAILED" } }),
    prisma.stageReport.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
    prisma.stageReport.count({ where: { divergent: true } }),
    prisma.emailQueueItem.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.publicApplication.count({
      where: { status: "approved", createdAt: { gte: startWeek } },
    }),
  ]);

  const screeningRate =
    totalApplications > 0
      ? Math.round((approvedApps / Math.max(1, approvedApps + rejectedApps)) * 100)
      : 0;
  const dropOffStage0 =
    activeInterns > 0
      ? Math.round(
          ((stageBreakdown.find((s) => s.currentStage === "STAGE_0")?._count._all ?? 0) /
            activeInterns) *
            100
        )
      : 0;

  const emailCountMap: Record<string, number> = {};
  for (const c of emailQueueCounts) {
    emailCountMap[c.status] = c._count._all;
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="h-6 w-6 text-blue" />
          <h1 className="text-2xl font-bold text-foreground">Programme Insights</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Live counts pulled directly from the database. Refresh the page to update.
        </p>
      </header>

      {/* Top row: applications */}
      <Section title="Applications">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat icon={Mail} label="Total received" value={totalApplications} />
          <Stat icon={Clock} label="Today" value={appsToday} />
          <Stat icon={Clock} label="Last 7 days" value={appsLast7} />
          <Stat icon={Clock} label="Last 30 days" value={appsLast30} />
        </div>
      </Section>

      {/* Status breakdown */}
      <Section title="Application status">
        <div className="grid grid-cols-3 gap-4">
          <Stat icon={Clock} label="Pending review" value={pendingApps} color="text-amber-600" />
          <Stat icon={UserCheck} label="Approved" value={approvedApps} color="text-emerald-600" />
          <Stat icon={UserX} label="Rejected" value={rejectedApps} color="text-rose-600" />
        </div>
        <div className="mt-3 p-3 bg-muted/30 border border-border rounded-lg text-sm text-muted-foreground">
          Screening pass rate:{" "}
          <strong className="text-foreground">{screeningRate}%</strong>
          <span className="opacity-60"> (of reviewed)</span>
          {" · "}
          Approved last 7 days:{" "}
          <strong className="text-foreground">{recentlyApproved}</strong>
        </div>
      </Section>

      {/* Interns */}
      <Section title="Interns">
        <div className="grid grid-cols-3 gap-4">
          <Stat icon={Users} label="Total interns" value={totalInterns} />
          <Stat icon={Users} label="Currently active" value={activeInterns} color="text-emerald-600" />
          <Stat icon={Award} label="Finalists" value={finalists} color="text-amber-600" />
        </div>
      </Section>

      {/* Stage distribution */}
      <Section title="Where active interns are">
        <div className="bg-white border border-border rounded-xl p-4">
          {Array.from({ length: 11 }, (_, i) => {
            const stageKey = i === 10 ? "STAGE_9" : `STAGE_${i}`;
            const row = stageBreakdown.find((s) => s.currentStage === stageKey);
            const count = row?._count._all ?? 0;
            const pct = activeInterns > 0 ? (count / activeInterns) * 100 : 0;
            return (
              <div key={stageKey} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground w-20">
                  {i === 10 ? "Finalist" : `Stage ${i}`}
                </span>
                <div className="flex-1 h-2 bg-muted/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <span className="text-sm font-mono text-foreground w-12 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
        {dropOffStage0 > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            <strong className="text-foreground">{dropOffStage0}%</strong> of active interns are still on Stage 0.
          </p>
        )}
      </Section>

      {/* Reports */}
      <Section title="Stage reports">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Stat icon={FileText} label="Total" value={reportsTotal} />
          <Stat icon={Clock} label="In review" value={reportsUnderReview} color="text-amber-600" />
          <Stat icon={FileText} label="Graded" value={reportsGraded} />
          <Stat icon={UserCheck} label="Passed" value={reportsPassed} color="text-emerald-600" />
          <Stat icon={UserX} label="Failed" value={reportsFailed} color="text-rose-600" />
        </div>
        {reportsDivergent > 0 && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
            <strong>{reportsDivergent}</strong> report{reportsDivergent === 1 ? "" : "s"} need a super-admin tiebreak (graders disagreed by &gt;15 pts). Resolve on /admin/reports.
          </div>
        )}
      </Section>

      {/* Email queue */}
      <Section title="Email delivery">
        <div className="grid grid-cols-3 gap-4">
          <Stat
            icon={UserCheck}
            label="Sent"
            value={emailCountMap.SENT ?? 0}
            color="text-emerald-600"
          />
          <Stat
            icon={Clock}
            label="Pending"
            value={emailCountMap.PENDING ?? 0}
            color="text-amber-600"
          />
          <Stat
            icon={UserX}
            label="Failed"
            value={emailCountMap.FAILED ?? 0}
            color="text-rose-600"
          />
        </div>
        {(emailCountMap.FAILED ?? 0) > 0 && (
          <p className="mt-3 text-sm text-rose-700">
            Failed emails are listed at <a href="/admin/emails" className="underline">/admin/emails</a> with a Retry button.
          </p>
        )}
      </Section>
    </div>
  );
}

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  color = "text-blue",
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color?: string;
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
