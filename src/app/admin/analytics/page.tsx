import { requireAnalyst } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  Users,
  UserCheck,
  Activity,
  UserX,
  Award,
  MessageSquare,
  TrendingUp,
  Briefcase,
  Star,
  ThumbsUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

const STAGES = [
  "STAGE_0", "STAGE_1", "STAGE_2", "STAGE_3", "STAGE_4",
  "STAGE_5", "STAGE_6", "STAGE_7", "STAGE_8", "STAGE_9",
] as const;

const TRACK_LABEL: Record<string, string> = {
  SOC_ANALYSIS: "SOC Analysis",
  ETHICAL_HACKING: "Ethical Hacking",
  GRC: "GRC",
};

const EMPLOYMENT_LABEL: Record<string, string> = {
  employed_related: "Employed (security role)",
  employed_unrelated: "Employed (other field)",
  freelancing: "Freelancing / consulting",
  internship: "Internship / apprenticeship",
  studying: "Studying",
  seeking: "Still job-seeking",
  other: "Other",
};

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ── Small presentational helpers (server components, pure render) ──
const TONE_CLASS: Record<string, string> = {
  blue: "text-blue",
  "emerald-600": "text-emerald-600",
  "rose-600": "text-rose-600",
  "amber-600": "text-amber-600",
  "violet-600": "text-violet-600",
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "blue",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl bg-surface border border-border p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-muted">
        <Icon className={`w-4 h-4 ${TONE_CLASS[tone] ?? "text-blue"}`} />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-3xl font-bold text-foreground tabular-nums">{value}</div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
    </div>
  );
}

function BarRow({
  label,
  value,
  total,
  suffix,
}: {
  label: string;
  value: number;
  total: number;
  suffix?: string;
}) {
  const width = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-40 shrink-0 truncate text-muted" title={label}>{label}</div>
      <div className="flex-1 h-6 rounded-md bg-surface-hover overflow-hidden">
        <div
          className="h-full bg-blue/80 rounded-md transition-all"
          style={{ width: `${width}%`, minWidth: value > 0 ? "2px" : 0 }}
        />
      </div>
      <div className="w-20 shrink-0 text-right tabular-nums font-medium text-foreground">
        {value.toLocaleString()}{suffix ?? ""}
      </div>
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-surface border border-border p-6 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {desc && <p className="text-sm text-muted mt-0.5">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

export default async function AnalyticsPage() {
  await requireAnalyst();

  const [
    appCount,
    appByStatus,
    appByTrack,
    appByCountry,
    appByGender,
    appByAge,
    internCount,
    activeCount,
    eliminatedCount,
    finalistCount,
    internByStage,
    reportGroup,
    reports,
    inviteCount,
    sentCount,
    respondedCount,
    responses,
  ] = await Promise.all([
    prisma.publicApplication.count(),
    prisma.publicApplication.groupBy({ by: ["status"], _count: true }),
    prisma.publicApplication.groupBy({ by: ["trackInterest"], _count: true }),
    prisma.publicApplication.groupBy({ by: ["country"], _count: true }),
    prisma.publicApplication.groupBy({ by: ["gender"], _count: true }),
    prisma.publicApplication.groupBy({ by: ["ageRange"], _count: true }),
    prisma.intern.count(),
    prisma.intern.count({ where: { isActive: true } }),
    prisma.intern.count({ where: { eliminatedAt: { not: null } } }),
    prisma.intern.count({ where: { finalist: true } }),
    prisma.intern.groupBy({ by: ["currentStage"], _count: true }),
    prisma.stageReport.groupBy({ by: ["stage", "status"], _count: true }),
    prisma.stageReport.findMany({ select: { stage: true, status: true, score: true, submittedAt: true } }),
    prisma.feedbackInvite.count(),
    prisma.feedbackInvite.count({ where: { sentAt: { not: null } } }),
    prisma.feedbackInvite.count({ where: { respondedAt: { not: null } } }),
    prisma.feedbackResponse.findMany(),
  ]);

  // ── Per-stage funnel from StageReport groupBy ──
  const stageStats = STAGES.map((stage) => {
    const rows = reportGroup.filter((r) => r.stage === stage);
    const byStatus = (s: string) =>
      rows.filter((r) => r.status === s).reduce((a, r) => a + (r._count as number), 0);
    const total = rows.reduce((a, r) => a + (r._count as number), 0);
    const passed = byStatus("PASSED") + byStatus("PENDING_PROMOTION");
    const failed = byStatus("FAILED") + byStatus("PENDING_ELIMINATION");
    const graded = byStatus("GRADED") + passed + failed;
    const scores = reports
      .filter((r) => r.stage === stage && typeof r.score === "number")
      .map((r) => r.score as number);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    return { stage, total, graded, passed, failed, avg, scores };
  }).filter((s) => s.total > 0);

  // ── Score histogram across all graded reports ──
  const allScores = reports.filter((r) => typeof r.score === "number").map((r) => r.score as number);
  const buckets = ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80-89", "90-100"];
  const bucketCounts = new Array(10).fill(0);
  for (const s of allScores) bucketCounts[Math.min(9, Math.floor(s / 10))]++;

  // ── Feedback aggregates ──
  const respN = responses.length;
  const countBy = (key: keyof (typeof responses)[number]) => {
    const m = new Map<string, number>();
    for (const r of responses) {
      const v = r[key];
      if (v === null || v === undefined || v === "") continue;
      m.set(String(v), (m.get(String(v)) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const avgOf = (key: "npsScore" | "confidenceBefore" | "confidenceAfter") => {
    const vals = responses.map((r) => r[key]).filter((v): v is number => typeof v === "number");
    return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
  };
  const employed = responses.filter((r) =>
    ["employed_related", "employed_unrelated", "freelancing", "internship"].includes(r.employmentStatus ?? "")
  ).length;
  const inSecurity = responses.filter((r) => r.employmentStatus === "employed_related").length;
  const helped = responses.filter((r) => r.programmeHelped === "yes" || r.programmeHelped === "partly").length;
  const promoters = responses.filter((r) => typeof r.npsScore === "number" && (r.npsScore as number) >= 9).length;
  const detractors = responses.filter((r) => typeof r.npsScore === "number" && (r.npsScore as number) <= 6).length;
  const npsScored = responses.filter((r) => typeof r.npsScore === "number").length;
  const nps = npsScored ? Math.round(((promoters - detractors) / npsScored) * 100) : null;
  const confBefore = avgOf("confidenceBefore");
  const confAfter = avgOf("confidenceAfter");
  const skillFreq = (() => {
    const m = new Map<string, number>();
    for (const r of responses) for (const s of r.skillsGained ?? []) m.set(s, (m.get(s) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  })();
  const testimonials = responses
    .filter((r) => r.consentToShare && r.testimonial && r.testimonial.trim().length > 0)
    .slice(0, 6);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Programme Analytics</h1>
        <p className="text-sm text-muted mt-1">
          Applicants, progression, outcomes, and alumni feedback across the cohort. Read-only.
        </p>
      </header>

      {/* Headline stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Users} label="Applicants" value={appCount.toLocaleString()} tone="blue" />
        <StatCard icon={UserCheck} label="Interns" value={internCount.toLocaleString()} sub={`${pct(internCount, appCount)}% of applicants`} tone="blue" />
        <StatCard icon={Activity} label="Active now" value={activeCount.toLocaleString()} tone="emerald-600" />
        <StatCard icon={UserX} label="Eliminated" value={eliminatedCount.toLocaleString()} tone="rose-600" />
        <StatCard icon={Award} label="Finalists" value={finalistCount.toLocaleString()} tone="amber-600" />
        <StatCard icon={MessageSquare} label="Feedback" value={respondedCount.toLocaleString()} sub={`${pct(respondedCount, inviteCount || sentCount || 1)}% response rate`} tone="violet-600" />
      </div>

      {/* Stage funnel */}
      <Section title="Stage progression" desc="Submissions, grading, and pass/fail by stage (from stage reports).">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-border">
                <th className="py-2 pr-4 font-medium">Stage</th>
                <th className="py-2 px-3 font-medium text-right">Submitted</th>
                <th className="py-2 px-3 font-medium text-right">Graded</th>
                <th className="py-2 px-3 font-medium text-right">Passed</th>
                <th className="py-2 px-3 font-medium text-right">Did not advance</th>
                <th className="py-2 px-3 font-medium text-right">Pass rate</th>
                <th className="py-2 pl-3 font-medium text-right">Avg score</th>
              </tr>
            </thead>
            <tbody>
              {stageStats.map((s) => (
                <tr key={s.stage} className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium text-foreground">{s.stage.replace("STAGE_", "Stage ")}</td>
                  <td className="py-2 px-3 text-right tabular-nums">{s.total.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right tabular-nums">{s.graded.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-emerald-700">{s.passed.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-rose-700">{s.failed.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right tabular-nums">{s.graded ? pct(s.passed, s.passed + s.failed) : 0}%</td>
                  <td className="py-2 pl-3 text-right tabular-nums font-medium">{s.avg ?? "—"}</td>
                </tr>
              ))}
              {stageStats.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-muted">No stage reports yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Score distribution */}
        <Section title="Score distribution" desc={`All graded reports (${allScores.length.toLocaleString()} scores).`}>
          <div className="space-y-2">
            {buckets.map((b, i) => (
              <BarRow key={b} label={b} value={bucketCounts[i]} total={Math.max(...bucketCounts, 1)} />
            ))}
          </div>
        </Section>

        {/* Interns by current stage */}
        <Section title="Interns by current stage" desc="Where the active cohort sits right now.">
          <div className="space-y-2">
            {STAGES.map((stage) => {
              const row = internByStage.find((r) => r.currentStage === stage);
              const c = row ? (row._count as number) : 0;
              if (c === 0) return null;
              return <BarRow key={stage} label={stage.replace("STAGE_", "Stage ")} value={c} total={internCount} />;
            })}
          </div>
        </Section>
      </div>

      {/* Demographics from applications */}
      <Section title="Applicant demographics" desc="Across all applications received.">
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Track interest</h3>
            <div className="space-y-2">
              {appByTrack.sort((a, b) => (b._count as number) - (a._count as number)).map((r) => (
                <BarRow key={r.trackInterest} label={TRACK_LABEL[r.trackInterest] ?? r.trackInterest} value={r._count as number} total={appCount} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Gender</h3>
            <div className="space-y-2">
              {appByGender.sort((a, b) => (b._count as number) - (a._count as number)).map((r) => (
                <BarRow key={String(r.gender)} label={r.gender || "Not specified"} value={r._count as number} total={appCount} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Top countries</h3>
            <div className="space-y-2">
              {appByCountry.sort((a, b) => (b._count as number) - (a._count as number)).slice(0, 8).map((r) => (
                <BarRow key={r.country} label={r.country} value={r._count as number} total={appCount} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Age range</h3>
            <div className="space-y-2">
              {appByAge.sort((a, b) => (b._count as number) - (a._count as number)).map((r) => (
                <BarRow key={r.ageRange} label={r.ageRange} value={r._count as number} total={appCount} />
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Feedback / outcomes */}
      <header className="pt-2">
        <h2 className="text-xl font-bold text-foreground">Alumni outcomes &amp; feedback</h2>
        <p className="text-sm text-muted mt-1">
          From {respN.toLocaleString()} survey {respN === 1 ? "response" : "responses"}
          {inviteCount > 0 ? ` of ${inviteCount.toLocaleString()} invited (${pct(respondedCount, inviteCount)}% response rate).` : "."}
        </p>
      </header>

      {respN === 0 ? (
        <div className="rounded-2xl bg-surface border border-border p-8 text-center text-muted">
          No feedback responses yet. Generate and send invites from{" "}
          <span className="font-medium text-foreground">Feedback Invites</span> to start collecting outcomes.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard icon={Briefcase} label="Employed" value={`${pct(employed, respN)}%`} sub={`${employed} of ${respN}`} tone="emerald-600" />
            <StatCard icon={Briefcase} label="In a security role" value={`${pct(inSecurity, respN)}%`} sub={`${inSecurity} of ${respN}`} tone="blue" />
            <StatCard icon={ThumbsUp} label="Programme helped" value={`${pct(helped, respN)}%`} sub="yes or partly" tone="emerald-600" />
            <StatCard icon={Star} label="NPS" value={nps ?? "—"} sub={`${npsScored} rated`} tone="amber-600" />
            <StatCard icon={TrendingUp} label="Confidence" value={confBefore != null && confAfter != null ? `${confBefore} → ${confAfter}` : "—"} sub="before → after (1-5)" tone="violet-600" />
            <StatCard icon={MessageSquare} label="Responses" value={respN.toLocaleString()} tone="blue" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Section title="Employment status" desc="Current status of respondents.">
              <div className="space-y-2">
                {countBy("employmentStatus").map(([k, v]) => (
                  <BarRow key={k} label={EMPLOYMENT_LABEL[k] ?? k} value={v} total={respN} />
                ))}
              </div>
            </Section>
            <Section title="Did the programme help you get there?">
              <div className="space-y-2">
                {countBy("programmeHelped").map(([k, v]) => (
                  <BarRow key={k} label={k[0].toUpperCase() + k.slice(1)} value={v} total={respN} />
                ))}
              </div>
            </Section>
            <Section title="Would recommend">
              <div className="space-y-2">
                {countBy("wouldRecommend").map(([k, v]) => (
                  <BarRow key={k} label={k[0].toUpperCase() + k.slice(1)} value={v} total={respN} />
                ))}
              </div>
            </Section>
            <Section title="Most-gained skills" desc="Top skills respondents say they gained.">
              <div className="space-y-2">
                {skillFreq.length === 0 ? (
                  <p className="text-sm text-muted">No skills captured yet.</p>
                ) : skillFreq.map(([k, v]) => <BarRow key={k} label={k} value={v} total={respN} />)}
              </div>
            </Section>
          </div>

          {testimonials.length > 0 && (
            <Section title="Testimonials" desc="Respondents who agreed to be quoted.">
              <div className="grid md:grid-cols-2 gap-4">
                {testimonials.map((t) => (
                  <blockquote key={t.id} className="rounded-xl bg-surface-hover border border-border p-4 text-sm">
                    <p className="text-foreground italic">“{t.testimonial}”</p>
                    <footer className="mt-2 text-xs text-muted">
                      {t.name || "Anonymous"}
                      {t.roleTitle ? `, ${t.roleTitle}` : ""}
                      {t.employer ? ` @ ${t.employer}` : ""}
                    </footer>
                  </blockquote>
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  );
}
