import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FileText, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

const STAGE_META: Record<string, { label: string; subtitle: string }> = {
  STAGE_0: { label: "Stage 0", subtitle: "Foundations" },
  STAGE_1: { label: "Stage 1", subtitle: "Applied Cryptography" },
  STAGE_2: { label: "Stage 2", subtitle: "Web Application Security" },
  STAGE_3: { label: "Stage 3", subtitle: "Incident Response" },
  STAGE_4: { label: "Stage 4", subtitle: "Governance & Risk" },
  STAGE_5: { label: "Stage 5", subtitle: "Track Specialisation" },
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
          const now = new Date();
          const isOpen = w ? now >= w.activeFrom && now <= w.submitUntil : false;
          const isClosed = w ? now > w.submitUntil : false;

          return (
            <div
              key={stage}
              className="bg-white border border-border rounded-xl p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <h2 className="font-semibold text-foreground">
                    {meta.label}
                    <span className="text-muted-foreground font-normal"> — {meta.subtitle}</span>
                  </h2>
                  <div className="mt-2 flex items-center gap-2 text-sm flex-wrap">
                    <StatusPill status={r?.status ?? "NONE"} />
                    {r?.score != null && (
                      <span className="text-muted-foreground">
                        Score: <strong className="text-foreground">{r.score}</strong>
                        {w && <span> / {w.passingScore} pass</span>}
                      </span>
                    )}
                    {w && (
                      <span className="text-muted-foreground text-xs">
                        Deadline: {new Date(w.submitUntil).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {r?.feedback && (
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
                <div className="flex gap-2 shrink-0">
                  {isClosed && !r ? (
                    <span className="text-sm text-muted-foreground italic px-3 py-2">
                      Deadline passed
                    </span>
                  ) : (
                    <Link
                      href={`/dashboard/reports/${stage}`}
                      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-blue text-white hover:opacity-90"
                    >
                      {r ? (r.status === "PASSED" ? "View" : "Edit") : isOpen ? "Start report" : "View"}
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

function StatusPill({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    NONE: { label: "Not started", color: "bg-muted text-muted-foreground", icon: Clock },
    DRAFT: { label: "Draft", color: "bg-amber-50 text-amber-700 border border-amber-200", icon: Clock },
    SUBMITTED: { label: "Submitted — awaiting review", color: "bg-blue/10 text-blue border border-blue/30", icon: Clock },
    UNDER_REVIEW: { label: "Under review", color: "bg-blue/10 text-blue border border-blue/30", icon: Clock },
    GRADED: { label: "Graded — awaiting cohort publish", color: "bg-purple-50 text-purple-700 border border-purple-200", icon: Clock },
    PASSED: { label: "Passed", color: "bg-emerald-50 text-emerald-700 border border-emerald-200", icon: CheckCircle2 },
    FAILED: { label: "Not passed", color: "bg-rose-50 text-rose-700 border border-rose-200", icon: XCircle },
    LATE: { label: "Late", color: "bg-slate-100 text-slate-700 border border-slate-200", icon: AlertTriangle },
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
