import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Topbar } from "@/components/dashboard/topbar";
import { ChevronRight, Users, FileText, CheckCircle2, Lock, LockOpen, Pause } from "lucide-react";

const STAGES = ["STAGE_0", "STAGE_1", "STAGE_2", "STAGE_3", "STAGE_4"] as const;

const STAGE_NAMES: Record<(typeof STAGES)[number], string> = {
  STAGE_0: "Induction at the Gate",
  STAGE_1: "Ciphers & Secrets",
  STAGE_2: "The Attack Surface",
  STAGE_3: "Inside the Walls",
  STAGE_4: "The Debrief",
};

export const dynamic = "force-dynamic";

export default async function AdminAssignmentsPage() {
  const session = await requireSuperAdmin();

  const [windows, accessCounts, reportCounts] = await Promise.all([
    prisma.stageWindow.findMany({
      where: { stage: { in: STAGES as unknown as string[] } as never },
    }),
    prisma.stageAccess.groupBy({
      by: ["stage"],
      _count: { _all: true },
    }),
    prisma.stageReport.groupBy({
      by: ["stage", "status"],
      _count: { _all: true },
    }),
  ]);

  const winByStage = new Map(windows.map((w) => [w.stage, w]));
  const accessByStage = new Map(accessCounts.map((r) => [String(r.stage), r._count._all]));
  const reportByStage = new Map<string, Record<string, number>>();
  for (const r of reportCounts) {
    const s = String(r.stage);
    const t = reportByStage.get(s) ?? {};
    t[r.status] = r._count._all;
    reportByStage.set(s, t);
  }

  return (
    <>
      <Topbar
        title="Stage management"
        subtitle="Open, pause, or close each stage. Publish results when grading is done."
        firstName={session.firstName}
        lastName={session.lastName}
        avatarUrl={session.avatarUrl}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-3 max-w-4xl">
          {STAGES.map((stage) => {
            const w = winByStage.get(stage as never);
            const status = (w?.status ?? "CLOSED") as "OPEN" | "PAUSED" | "CLOSED";
            const tally = reportByStage.get(stage) ?? {};
            const submitted = (tally.SUBMITTED ?? 0) + (tally.UNDER_REVIEW ?? 0);
            const graded = tally.GRADED ?? 0;
            const passed = tally.PASSED ?? 0;
            const failed = tally.FAILED ?? 0;
            const published = passed + failed > 0;

            return (
              <Link
                key={stage}
                href={`/admin/assignments/${stage}`}
                className="block group"
              >
                <div className="p-5 bg-white border border-border rounded-xl hover:border-blue/40 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-semibold text-foreground">
                          Stage {stage.replace("STAGE_", "")} · {STAGE_NAMES[stage]}
                        </h2>
                        <StatusPill status={status} />
                        {published && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-blue/10 text-blue border border-blue/30">
                            <CheckCircle2 className="w-3 h-3" /> Results published
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        <Metric icon={Users} label="Entered" value={accessByStage.get(stage) ?? 0} />
                        <Metric icon={FileText} label="Submitted" value={submitted} />
                        <Metric icon={CheckCircle2} label="Graded" value={graded} />
                      </div>

                      {published && (
                        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            <strong className="text-emerald-700">{passed}</strong> passed
                          </span>
                          <span>
                            <strong className="text-rose-700">{failed}</strong> below threshold
                          </span>
                        </div>
                      )}
                    </div>

                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

function StatusPill({ status }: { status: "OPEN" | "PAUSED" | "CLOSED" }) {
  if (status === "OPEN") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
        <LockOpen className="w-3 h-3" /> Open
      </span>
    );
  }
  if (status === "PAUSED") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
        <Pause className="w-3 h-3" /> Paused
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
      <Lock className="w-3 h-3" /> Closed
    </span>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="min-w-0">
      <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground uppercase tracking-wide">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="text-sm font-medium text-foreground tabular-nums">{value}</div>
    </div>
  );
}
