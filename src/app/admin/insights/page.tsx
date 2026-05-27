import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TrendingUp, Users, UserCheck, UserX, Mail, Clock, FileText, Award, Target } from "lucide-react";
import { InsightsDownload, type ExportSection } from "./insights-download";

// Admin analytics dashboard. Server-rendered so all the queries hit Mongo
// directly and we don't ship counts to the client. Every figure here comes
// from a single COUNT or aggregation — none of this is real-time per-user
// data, so caching can be added later if these queries get expensive.
export default async function AdminInsightsPage() {
  await requireSuperAdmin();

  // Server Component: this runs once per request, so reading the request-time
  // clock here is intended. Read it once and derive every window from it.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const startToday = startOfDay(new Date(now));
  const startWeek = new Date(now - 7 * 86_400_000);
  const startMonth = new Date(now - 30 * 86_400_000);
  // 14-day window for the daily applications chart.
  const startChart = startOfDay(new Date(now - 13 * 86_400_000));

  const [
    totalApplications,
    appsLast7,
    appsLast30,
    appsToday,
    pendingApps,
    approvedApps,
    rejectedApps,
    queuedApprovedApps,
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
    countryBreakdown,
    ageBreakdown,
    genderBreakdown,
    trackBreakdown,
    employmentBreakdown,
    dedicationBreakdown,
    referralBreakdown,
    recentAppDates,
    stageStatusBreakdown,
    stageWindows,
  ] = await Promise.all([
    prisma.publicApplication.count(),
    prisma.publicApplication.count({ where: { createdAt: { gte: startWeek } } }),
    prisma.publicApplication.count({ where: { createdAt: { gte: startMonth } } }),
    prisma.publicApplication.count({ where: { createdAt: { gte: startToday } } }),
    prisma.publicApplication.count({ where: { status: "pending" } }),
    prisma.publicApplication.count({ where: { status: "approved" } }),
    prisma.publicApplication.count({ where: { status: "rejected" } }),
    prisma.publicApplication.count({ where: { status: "queued_approved" } }),
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
    prisma.publicApplication.groupBy({ by: ["country"], _count: { _all: true } }),
    prisma.publicApplication.groupBy({ by: ["ageRange"], _count: { _all: true } }),
    prisma.publicApplication.groupBy({ by: ["gender"], _count: { _all: true } }),
    prisma.publicApplication.groupBy({ by: ["trackInterest"], _count: { _all: true } }),
    prisma.publicApplication.groupBy({ by: ["currentStatus"], _count: { _all: true } }),
    prisma.publicApplication.groupBy({ by: ["dedication"], _count: { _all: true } }),
    prisma.publicApplication.groupBy({ by: ["referralSource"], _count: { _all: true } }),
    prisma.publicApplication.findMany({
      where: { createdAt: { gte: startChart } },
      select: { createdAt: true },
    }),
    prisma.stageReport.groupBy({ by: ["stage", "status"], _count: { _all: true } }),
    prisma.stageWindow.findMany({
      select: { stage: true, passingScore: true, cutoffAppliedAt: true },
    }),
  ]);

  // "Approved (decided)" is everyone given a yes — interns already onboarded
  // (status "approved") plus those still parked in the pending list awaiting
  // their welcome email (status "queued_approved"). The latter are NOT counted
  // as approved interns, only as a decided-but-uncommitted decision.
  const approvedDecided = approvedApps + queuedApprovedApps;
  const reviewed = approvedDecided + rejectedApps;
  const screeningRate =
    totalApplications > 0
      ? Math.round((approvedDecided / Math.max(1, reviewed)) * 100)
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

  // Demographic breakdowns — counts per group, most-common first.
  const toRows = (
    data: { _count: { _all: number } }[],
    key: (r: Record<string, unknown>) => string
  ) =>
    data
      .map((r) => ({ label: key(r as Record<string, unknown>), count: r._count._all }))
      .sort((a, b) => b.count - a.count);

  const countryRows = toRows(countryBreakdown, (r) => String(r.country));
  const ageRows = toRows(ageBreakdown, (r) => String(r.ageRange));
  const genderRows = toRows(genderBreakdown, (r) => (r.gender ? String(r.gender) : "Not specified"));
  const trackRows = toRows(trackBreakdown, (r) => trackLabel(String(r.trackInterest)));
  const employmentRows = toRows(employmentBreakdown, (r) => String(r.currentStatus));
  const dedicationRows = toRows(dedicationBreakdown, (r) => String(r.dedication));
  const referralRows = toRows(referralBreakdown, (r) =>
    r.referralSource ? String(r.referralSource) : "Not specified"
  );

  // Daily applications for the last 14 days.
  const todayStart = startOfDay(new Date(now)).getTime();
  const dailyApps = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(todayStart - (13 - i) * 86_400_000);
    return { label: `${d.getMonth() + 1}/${d.getDate()}`, count: 0 };
  });
  for (const a of recentAppDates) {
    const idx = Math.round((startOfDay(new Date(a.createdAt)).getTime() - startChart.getTime()) / 86_400_000);
    if (idx >= 0 && idx < 14) dailyApps[idx].count++;
  }

  // The funnel from raw applications down to finalists.
  const funnel = [
    { label: "Applications received", count: totalApplications },
    { label: "Reviewed", count: reviewed },
    { label: "Approved (decided)", count: approvedDecided },
    { label: "Interns onboarded", count: approvedApps },
    { label: "Active interns", count: activeInterns },
    { label: "Finalists", count: finalists },
  ];

  // Per-stage outcomes for the cutoff→pending→finalize flow: promoted (PASSED),
  // eliminated (FAILED), and what's still pending review. Cutoff shown only once
  // it's been applied. Stages with no report activity are dropped.
  const STAGE_RESULT_KEYS = [
    "STAGE_0", "STAGE_1", "STAGE_2", "STAGE_3", "STAGE_4",
    "STAGE_5", "STAGE_6", "STAGE_7", "STAGE_8", "STAGE_9",
  ];
  const stageResultRows = STAGE_RESULT_KEYS.map((st) => {
    const n = (status: string) =>
      stageStatusBreakdown.find((r) => r.stage === st && r.status === status)?._count._all ?? 0;
    const win = stageWindows.find((w) => w.stage === st);
    const promoted = n("PASSED");
    const eliminated = n("FAILED");
    const pendingPromotion = n("PENDING_PROMOTION");
    const pendingElimination = n("PENDING_ELIMINATION");
    const graded = n("GRADED");
    const inReview = n("SUBMITTED") + n("UNDER_REVIEW") + n("DRAFT") + n("LATE");
    return {
      stage: st,
      label: st.replace("STAGE_", "Stage "),
      cutoff: win?.cutoffAppliedAt ? win.passingScore : null,
      promoted,
      eliminated,
      pendingPromotion,
      pendingElimination,
      graded,
      total: promoted + eliminated + pendingPromotion + pendingElimination + graded + inReview,
    };
  }).filter((r) => r.total > 0);

  // Everything above, flattened for the CSV export.
  const exportSections: ExportSection[] = [
    {
      title: "Applications",
      rows: [
        ["Total received", totalApplications],
        ["Today", appsToday],
        ["Last 7 days", appsLast7],
        ["Last 30 days", appsLast30],
      ],
    },
    {
      title: "Application status",
      rows: [
        ["Pending review", pendingApps],
        ["Awaiting welcome email", queuedApprovedApps],
        ["Approved (interns onboarded)", approvedApps],
        ["Rejected", rejectedApps],
        ["Screening pass rate (%)", screeningRate],
        ["Approved last 7 days", recentlyApproved],
      ],
    },
    { title: "Conversion funnel", rows: funnel.map((f) => [f.label, f.count] as [string, number]) },
    {
      title: "Daily applications (last 14 days)",
      rows: dailyApps.map((d) => [d.label, d.count] as [string, number]),
    },
    { title: "Demographics — Country", rows: countryRows.map((r) => [r.label, r.count]) },
    { title: "Demographics — Age range", rows: ageRows.map((r) => [r.label, r.count]) },
    { title: "Demographics — Gender", rows: genderRows.map((r) => [r.label, r.count]) },
    { title: "Demographics — Track interest", rows: trackRows.map((r) => [r.label, r.count]) },
    { title: "Demographics — Current status", rows: employmentRows.map((r) => [r.label, r.count]) },
    { title: "Demographics — Weekly dedication", rows: dedicationRows.map((r) => [r.label, r.count]) },
    { title: "Demographics — Referral source", rows: referralRows.map((r) => [r.label, r.count]) },
    {
      title: "Interns",
      rows: [
        ["Total interns", totalInterns],
        ["Currently active", activeInterns],
        ["Finalists", finalists],
      ],
    },
    {
      title: "Stage reports",
      rows: [
        ["Total", reportsTotal],
        ["In review", reportsUnderReview],
        ["Graded", reportsGraded],
        ["Passed", reportsPassed],
        ["Failed", reportsFailed],
      ],
    },
    {
      title: "Stage outcomes (per stage)",
      rows: stageResultRows.flatMap((r) => [
        [`${r.label} — cutoff`, r.cutoff ?? 0] as [string, number],
        [`${r.label} — promoted`, r.promoted] as [string, number],
        [`${r.label} — eliminated`, r.eliminated] as [string, number],
        [`${r.label} — pending promotion`, r.pendingPromotion] as [string, number],
        [`${r.label} — pending elimination`, r.pendingElimination] as [string, number],
      ]),
    },
  ];

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-6 w-6 text-blue" />
            <h1 className="text-2xl font-bold text-foreground">Programme Insights</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Live counts pulled directly from the database. Refresh the page to update.
          </p>
        </div>
        <InsightsDownload sections={exportSections} />
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat icon={Clock} label="Pending review" value={pendingApps} color="text-amber-600" />
          <Stat icon={Mail} label="Awaiting welcome email" value={queuedApprovedApps} color="text-blue" />
          <Stat icon={UserCheck} label="Approved (interns)" value={approvedApps} color="text-emerald-600" />
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

      {/* Conversion funnel */}
      <Section title="Conversion funnel">
        <div className="bg-white border border-border rounded-xl p-4">
          {funnel.map((f) => {
            const pct = totalApplications > 0 ? (f.count / totalApplications) * 100 : 0;
            const ofTop =
              totalApplications > 0 ? Math.round((f.count / totalApplications) * 100) : 0;
            return (
              <div key={f.label} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground w-56 shrink-0">{f.label}</span>
                <div className="flex-1 h-3 bg-muted/40 rounded-full overflow-hidden">
                  <div className="h-full bg-blue" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                <span className="text-sm font-mono text-foreground w-20 text-right">
                  {f.count}{" "}
                  <span className="text-xs text-muted-foreground">({ofTop}%)</span>
                </span>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Applications over time */}
      <Section title="Applications — last 14 days">
        <div className="bg-white border border-border rounded-xl p-4">
          <DailyBars data={dailyApps} />
        </div>
      </Section>

      {/* Applicant demographics */}
      <Section title="Applicant demographics">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          <Breakdown title="Country" rows={countryRows} icon={Users} />
          <Breakdown title="Age range" rows={ageRows} icon={Clock} />
          <Breakdown title="Gender" rows={genderRows} icon={Users} />
          <Breakdown title="Track interest" rows={trackRows} icon={Target} />
          <Breakdown title="Current status" rows={employmentRows} icon={UserCheck} />
          <Breakdown title="Weekly dedication" rows={dedicationRows} icon={Clock} />
          <Breakdown title="Referral source" rows={referralRows} icon={TrendingUp} />
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

      {/* Stage outcomes — promotion / elimination per stage */}
      {stageResultRows.length > 0 && (
        <Section title="Stage outcomes (promotion / elimination)">
          <div className="bg-white border border-border rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
                  <th className="text-left font-medium px-4 py-2.5">Stage</th>
                  <th className="text-right font-medium px-3 py-2.5">Cutoff</th>
                  <th className="text-right font-medium px-3 py-2.5 text-emerald-700">Promoted</th>
                  <th className="text-right font-medium px-3 py-2.5 text-rose-700">Eliminated</th>
                  <th className="text-right font-medium px-3 py-2.5">Pending promo</th>
                  <th className="text-right font-medium px-3 py-2.5">Pending elim</th>
                  <th className="text-right font-medium px-4 py-2.5">Graded</th>
                </tr>
              </thead>
              <tbody>
                {stageResultRows.map((r) => (
                  <tr key={r.stage} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 text-foreground">{r.label}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-foreground">{r.cutoff ?? "—"}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-emerald-700">{r.promoted}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-rose-700">{r.eliminated}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-foreground">{r.pendingPromotion}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-foreground">{r.pendingElimination}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{r.graded}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

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

// trackInterest is stored either as a slug (soc, ethical_hacking, grc) or as a
// display string. Normalise to a readable label for the breakdown.
function trackLabel(track: string): string {
  const map: Record<string, string> = {
    soc: "SOC Analysis",
    ethical_hacking: "Ethical Hacking",
    grc: "GRC",
    "SOC Analysis": "SOC Analysis",
    "Ethical Hacking": "Ethical Hacking",
    GRC: "GRC",
  };
  return map[track] || track;
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

// A simple labelled bar list — used for the demographic breakdowns.
function Breakdown({
  title,
  rows,
  icon: Icon,
}: {
  title: string;
  rows: { label: string; count: number }[];
  icon?: React.ElementType;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  const total = rows.reduce((a, r) => a + r.count, 0);
  return (
    <div className="bg-white border border-border rounded-xl p-4">
      <h3 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data yet.</p>
      ) : (
        <div className="space-y-1.5">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-2 text-xs">
              <span className="w-24 truncate text-muted-foreground" title={r.label}>
                {r.label}
              </span>
              <div className="flex-1 h-2 bg-muted/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue"
                  style={{ width: `${(r.count / max) * 100}%` }}
                />
              </div>
              <span className="w-14 text-right font-mono text-foreground">
                {r.count}
                <span className="text-muted-foreground">
                  {" "}
                  {total > 0 ? `${Math.round((r.count / total) * 100)}%` : ""}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Vertical-bar chart for the 14-day applications trend.
function DailyBars({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex items-end gap-1.5 h-32">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          <span className="text-[10px] font-mono text-foreground">{d.count}</span>
          <div
            className="w-full bg-blue rounded-t"
            style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? 2 : 0 }}
          />
          <span className="text-[9px] text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
