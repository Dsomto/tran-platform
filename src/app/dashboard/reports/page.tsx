import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FileText, Clock, CheckCircle2, XCircle, AlertTriangle, Award, FileSignature } from "lucide-react";
import { LinkedInIcon } from "@/components/icons/linkedin";
import { certificateShareSig, letterShareSig, passLetterShareSig } from "@/lib/certificate-link";
import { isReportResultReleased } from "@/lib/report-visibility";

// Always re-fetch — the score field switched from `score` to `finalScore`
// and any cached render of this route would still show the old value.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const STAGE_META: Record<string, { label: string; subtitle: string }> = {
  STAGE_0: { label: "Stage 0", subtitle: "Foundations" },
  STAGE_1: { label: "Stage 1", subtitle: "Applied Cryptography" },
  STAGE_2: { label: "Stage 2", subtitle: "Web Application Security" },
  STAGE_3: { label: "Stage 3", subtitle: "Incident Response" },
  STAGE_4: { label: "Stage 4", subtitle: "Governance & Risk" },
  STAGE_5: { label: "Advanced 1", subtitle: "Signal" },
  STAGE_6: { label: "Advanced 2", subtitle: "Exposure" },
  STAGE_7: { label: "Advanced 3", subtitle: "Architecture" },
  STAGE_8: { label: "Advanced 4", subtitle: "Adversity" },
  STAGE_9: { label: "Advanced 5", subtitle: "The Final Case" },
};

export default async function ReportsPage() {
  const session = await requireAuth();
  const intern = await prisma.intern.findUnique({
    where: { userId: session.id },
    include: { user: true },
  });

  if (!intern) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Intern profile not found.</p>
      </div>
    );
  }

  const [reports, windows] = await Promise.all([
    prisma.stageReport.findMany({
      where: { internId: intern.id },
      orderBy: { stage: "asc" },
    }),
    prisma.stageWindow.findMany({ orderBy: { stage: "asc" } }),
  ]);

  const windowByStage = new Map(windows.map((w) => [w.stage, w]));
  const reportByStage = new Map(reports.map((r) => [r.stage, r]));

  const stages = Object.keys(STAGE_META);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-6 w-6 text-blue" />
          <h1 className="text-2xl font-bold text-foreground">Stage Reports</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          At the close of each stage you submit a formal report — executive summary
          and a long-form analysis addressed to the organisation in the scenario.
          Graders review and return feedback. You may revise and resubmit until the
          stage deadline.
        </p>
      </header>

      <div className="grid gap-4">
        {stages.map((stage) => {
          const r = reportByStage.get(stage as never);
          const w = windowByStage.get(stage as never);
          const meta = STAGE_META[stage];
          const isOpen = w?.status === "OPEN";
          const isClosed = (w?.status ?? "CLOSED") === "CLOSED";
          const resultReleased = isReportResultReleased(r?.status);

          return (
            <div
              key={stage}
              className="bg-surface border border-border rounded-xl p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <h2 className="font-semibold text-foreground">
                    {meta.label}
                    <span className="text-muted-foreground font-normal"> — {meta.subtitle}</span>
                  </h2>
                  <div className="mt-2 flex items-center gap-2 text-sm flex-wrap">
                    <StatusPill status={r?.status ?? "NONE"} divergent={r?.divergent ?? false} />
                    {resultReleased && !r?.divergent && (r?.finalScore ?? r?.score) != null && (
                      <span className="text-muted-foreground">
                        Score: <strong className="text-foreground">{r?.finalScore ?? r?.score}</strong>
                        {w && <span> / {w.passingScore} pass</span>}
                      </span>
                    )}
                  </div>
                  {r?.divergent && (
                    <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30 rounded px-2 py-1.5 max-w-xl">
                      Your two reviewers disagreed on this report. The programme team is reviewing — you&apos;ll get a final score once they&apos;re done.
                    </p>
                  )}
                  {resultReleased && r?.feedback && !r?.divergent && (
                    <details className="mt-3 text-sm">
                      <summary className="cursor-pointer text-blue font-medium">
                        Grader feedback
                      </summary>
                      <div className="mt-2 p-3 bg-muted/40 rounded border border-border whitespace-pre-wrap text-foreground/80">
                        {r.feedback}
                      </div>
                    </details>
                  )}
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap">
                  {r?.status === "PASSED" && (
                    <>
                      <a
                        href={`/api/certificate/${r.id}?sig=${certificateShareSig(r.id, intern.id)}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 justify-center px-3 py-2 text-sm font-medium rounded-lg border border-blue/30 bg-blue/5 text-blue hover:bg-blue/10"
                      >
                        <Award className="h-4 w-4" />
                        Certificate
                      </a>
                      <a
                        href={`/api/pass-letter/${r.id}?sig=${passLetterShareSig(r.id, intern.id)}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 justify-center px-3 py-2 text-sm font-medium rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25"
                      >
                        <FileSignature className="h-4 w-4" />
                        Achievement letter
                      </a>
                      <a
                        href={`/verify/${r.id}?sig=${certificateShareSig(r.id, intern.id)}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 justify-center px-3 py-2 text-sm font-medium rounded-lg border border-[#0A66C2]/30 bg-[#0A66C2]/5 text-[#0A66C2] hover:bg-[#0A66C2]/10 dark:text-[#70b5f9]"
                      >
                        <LinkedInIcon className="h-4 w-4" />
                        Add to LinkedIn
                      </a>
                    </>
                  )}
                  {r?.status === "FAILED" && (
                    <a
                      href={`/api/letter/${r.id}?sig=${letterShareSig(r.id, intern.id)}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 justify-center px-3 py-2 text-sm font-medium rounded-lg border border-border bg-surface text-foreground hover:bg-surface-hover"
                    >
                      <FileSignature className="h-4 w-4" />
                      End-of-programme letter
                    </a>
                  )}
                  {isClosed && !r ? (
                    <span className="text-sm text-muted-foreground italic px-3 py-2">
                      Deadline passed
                    </span>
                  ) : (
                    <Link
                      href={`/dashboard/reports/${stage}`}
                      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-blue text-white hover:opacity-90"
                    >
                      {r
                        ? resultReleased
                          ? "View"
                          : r.status === "DRAFT" && isOpen
                            ? "Edit"
                            : "View"
                        : isOpen
                          ? "Start report"
                          : "View"}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusPill({ status, divergent }: { status: string; divergent: boolean }) {
  // Divergent reports stay in UNDER_REVIEW until a super admin tiebreaks. The
  // intern needs a distinct label so they don't read it as silent inactivity.
  if (divergent) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30">
        <AlertTriangle className="h-3.5 w-3.5" />
        Awaiting admin review
      </span>
    );
  }
  const config: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    NONE: { label: "Not started", color: "bg-muted text-muted-foreground", icon: Clock },
    DRAFT: { label: "Draft", color: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30", icon: Clock },
    SUBMITTED: { label: "Submitted — awaiting review", color: "bg-blue/10 text-blue border border-blue/30", icon: Clock },
    UNDER_REVIEW: { label: "Under review", color: "bg-blue/10 text-blue border border-blue/30", icon: Clock },
    GRADED: { label: "Result pending release", color: "bg-surface-hover text-foreground border border-border", icon: CheckCircle2 },
    PENDING_PROMOTION: { label: "Result pending release", color: "bg-surface-hover text-foreground border border-border", icon: Clock },
    PENDING_ELIMINATION: { label: "Result pending release", color: "bg-surface-hover text-foreground border border-border", icon: Clock },
    PASSED: { label: "Passed", color: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30", icon: CheckCircle2 },
    FAILED: { label: "Not passed", color: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30", icon: XCircle },
    LATE: { label: "Late", color: "bg-surface-hover text-muted border border-border", icon: AlertTriangle },
  };
  const c = config[status] ?? config.NONE;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${c.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {c.label}
    </span>
  );
}
