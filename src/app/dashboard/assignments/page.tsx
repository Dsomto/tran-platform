import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Topbar } from "@/components/dashboard/topbar";
import { stageUrl, type StageSlug } from "@/lib/stage-routes";
import {
  Lock,
  LockOpen,
  Clock,
  CheckCircle2,
  Circle,
  DoorOpen,
  FileText,
} from "lucide-react";

const STAGES = ["STAGE_0", "STAGE_1", "STAGE_2", "STAGE_3", "STAGE_4"] as const;
type StageKey = (typeof STAGES)[number];

const STAGE_NAMES: Record<StageKey, string> = {
  STAGE_0: "Induction at the Gate",
  STAGE_1: "Ciphers & Secrets",
  STAGE_2: "The Attack Surface",
  STAGE_3: "Inside the Walls",
  STAGE_4: "The Debrief",
};

const STAGE_ENUM_TO_SLUG: Record<StageKey, StageSlug> = {
  STAGE_0: "stage-0",
  STAGE_1: "stage-1",
  STAGE_2: "stage-2",
  STAGE_3: "stage-3",
  STAGE_4: "stage-4",
};

function stageRank(s: string): number {
  const m = s.match(/STAGE_(\d+)/);
  return m ? Number(m[1]) : -1;
}

export default async function AssignmentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const intern = await prisma.intern.findUnique({
    where: { userId: session.id },
  });
  if (!intern) redirect("/dashboard");

  const windows = await prisma.stageWindow.findMany({
    where: { stage: { in: STAGES as unknown as string[] } as never },
  });
  const windowByStage = new Map(windows.map((w) => [w.stage, w]));

  const reports = await prisma.stageReport.findMany({
    where: { internId: intern.id },
    select: { stage: true, status: true },
  });
  const reportByStage = new Map(reports.map((r) => [r.stage, r.status]));

  const internRank = stageRank(intern.currentStage);

  return (
    <>
      <Topbar
        title="Stages"
        subtitle={`You are currently at Stage ${intern.currentStage.replace("STAGE_", "")}`}
        firstName={session.firstName}
        lastName={session.lastName}
        avatarUrl={session.avatarUrl}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl space-y-3">
          {STAGES.map((stage) => {
            const w = windowByStage.get(stage as never);
            const isLocked = (w?.status ?? "CLOSED") !== "OPEN";
            const rank = stageRank(stage);
            const isAhead = rank > internRank;
            const isPast = rank < internRank;
            const isCurrent = rank === internRank;
            const reportStatus = reportByStage.get(stage);
            const stageNum = stage.replace("STAGE_", "");

            // Interns can enter a stage only if the admin has it OPEN and it's
            // at-or-behind their current stage. Locked OR ahead = greyed out.
            const accessible = !isLocked && !isAhead;

            const deadline = null;

            return (
              <StageCard
                key={stage}
                stage={stage}
                stageNum={stageNum}
                name={STAGE_NAMES[stage as StageKey]}
                roomHref={stageUrl(STAGE_ENUM_TO_SLUG[stage as StageKey])}
                reportHref={`/dashboard/reports/${stage}`}
                accessible={accessible}
                isLocked={isLocked}
                isCurrent={isCurrent}
                isPast={isPast}
                reportStatus={reportStatus}
                deadline={deadline}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}

function StageCard({
  stageNum,
  name,
  roomHref,
  reportHref,
  accessible,
  isLocked,
  isCurrent,
  isPast,
  reportStatus,
  deadline,
}: {
  stage: string;
  stageNum: string;
  name: string;
  roomHref: string;
  reportHref: string;
  accessible: boolean;
  isLocked: boolean;
  isCurrent: boolean;
  isPast: boolean;
  reportStatus: string | undefined;
  deadline: string | null;
}) {
  const statusLabel = (() => {
    if (reportStatus === "PASSED") return { label: "Passed", tone: "emerald" as const };
    if (reportStatus === "FAILED") return { label: "Did not pass", tone: "rose" as const };
    if (reportStatus === "GRADED") return { label: "Graded", tone: "blue" as const };
    if (reportStatus === "SUBMITTED" || reportStatus === "UNDER_REVIEW")
      return { label: "In review", tone: "amber" as const };
    if (reportStatus === "DRAFT") return { label: "Draft saved", tone: "slate" as const };
    return null;
  })();

  return (
    <div
      className={`relative p-5 bg-white border rounded-xl transition-all ${
        accessible
          ? "border-border hover:border-blue/40"
          : "border-border/60 bg-slate-50/60"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className={`min-w-0 flex-1 ${accessible ? "" : "opacity-60"}`}>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-foreground">
              Stage {stageNum} · {name}
            </h2>
            {isLocked ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                <Lock className="w-3 h-3" /> Locked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                <LockOpen className="w-3 h-3" /> Open
              </span>
            )}
            {isCurrent && accessible && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-blue/10 text-blue border border-blue/30">
                Current
              </span>
            )}
            {statusLabel && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
                  statusLabel.tone === "emerald"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : statusLabel.tone === "rose"
                      ? "bg-rose-50 text-rose-800 border-rose-200"
                      : statusLabel.tone === "blue"
                        ? "bg-blue/10 text-blue border-blue/30"
                        : statusLabel.tone === "amber"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {statusLabel.label}
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            {deadline ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Due {deadline}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Circle className="w-3 h-3" />
                Not scheduled yet
              </span>
            )}
            {isLocked && !isPast && (
              <span className="text-slate-600">
                Waiting for admin to open this stage.
              </span>
            )}
            {!isLocked && !accessible && !isPast && (
              <span className="text-slate-600">
                Finish the previous stage first.
              </span>
            )}
            {isPast && !reportStatus && (
              <span className="text-slate-600">You have moved past this stage.</span>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {reportStatus === "PASSED" && (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          )}
        </div>
      </div>

      {accessible && (
        <div className="mt-4 pt-4 border-t border-border/60 flex flex-wrap items-center gap-2">
          <Link
            href={roomHref}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full bg-blue text-white hover:bg-blue-dark transition-colors"
          >
            <DoorOpen className="w-4 h-4" />
            Enter Stage {stageNum}
          </Link>
          <Link
            href={reportHref}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full border border-border text-foreground hover:bg-surface-hover transition-colors"
          >
            <FileText className="w-4 h-4" />
            {reportStatus === "DRAFT"
              ? "Continue draft"
              : reportStatus === "SUBMITTED" || reportStatus === "UNDER_REVIEW"
                ? "View submission"
                : reportStatus === "GRADED" || reportStatus === "PASSED" || reportStatus === "FAILED"
                  ? "View feedback"
                  : "Submit report"}
          </Link>
        </div>
      )}
    </div>
  );
}
