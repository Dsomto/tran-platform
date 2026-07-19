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
import { EggHoverNote } from "@/components/dashboard/easter-eggs/widgets";
import { stageWindowAcceptsSubmissions } from "@/lib/stage-window";

const STAGES = [
  "STAGE_0",
  "STAGE_1",
  "STAGE_2",
  "STAGE_3",
  "STAGE_4",
  "STAGE_5",
  "STAGE_6",
  "STAGE_7",
  "STAGE_8",
  "STAGE_9",
] as const;
type StageKey = (typeof STAGES)[number];

const STAGE_NAMES: Record<StageKey, string> = {
  STAGE_0: "Induction at the Gate",
  STAGE_1: "Ciphers & Secrets",
  STAGE_2: "The Attack Surface",
  STAGE_3: "Inside the Walls",
  STAGE_4: "The Debrief",
  STAGE_5: "Advanced · Signal",
  STAGE_6: "Advanced · Exposure",
  STAGE_7: "Advanced · Architecture",
  STAGE_8: "Advanced · Adversity",
  STAGE_9: "Advanced · The Final Case",
};

const STAGE_ENUM_TO_SLUG: Record<StageKey, StageSlug> = {
  STAGE_0: "stage-0",
  STAGE_1: "stage-1",
  STAGE_2: "stage-2",
  STAGE_3: "stage-3",
  STAGE_4: "stage-4",
  STAGE_5: "stage-5",
  STAGE_6: "stage-6",
  STAGE_7: "stage-7",
  STAGE_8: "stage-8",
  STAGE_9: "stage-9",
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
  const now = new Date();

  const formatWat = (value: Date) =>
    `${new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Africa/Lagos",
    }).format(value)} WAT`;

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
            const isLocked = !stageWindowAcceptsSubmissions(w, now.getTime());
            const rank = stageRank(stage);
            const isAhead = rank > internRank;
            const isPast = rank < internRank;
            const isCurrent = rank === internRank;
            const reportStatus = reportByStage.get(stage);
            const stageNum = stage.replace("STAGE_", "");

            // Interns can enter a stage only if the admin has it OPEN and it's
            // at-or-behind their current stage. Locked OR ahead = greyed out.
            const accessible = !isLocked && !isAhead;

            const deadline = w?.submitUntil ? formatWat(w.submitUntil) : null;
            const availabilityNote =
              w?.status === "OPEN" && w.activeFrom && now < w.activeFrom
                ? `Opens ${formatWat(w.activeFrom)}.`
                : w?.status === "OPEN" && w.submitUntil && now > w.submitUntil
                  ? `Closed ${formatWat(w.submitUntil)}.`
                  : null;

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
                availabilityNote={availabilityNote}
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
  availabilityNote,
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
  availabilityNote: string | null;
}) {
  const statusLabel = (() => {
    if (reportStatus === "PASSED") return { label: "Passed", tone: "emerald" as const };
    if (reportStatus === "FAILED") return { label: "Did not pass", tone: "rose" as const };
    if (
      reportStatus === "GRADED" ||
      reportStatus === "PENDING_PROMOTION" ||
      reportStatus === "PENDING_ELIMINATION"
    )
      return { label: "Result pending release", tone: "blue" as const };
    if (reportStatus === "SUBMITTED" || reportStatus === "UNDER_REVIEW")
      return { label: "In review", tone: "amber" as const };
    if (reportStatus === "DRAFT") return { label: "Draft saved", tone: "slate" as const };
    return null;
  })();

  return (
    <div
      className={`relative p-5 bg-surface border rounded-xl transition-all ${
        accessible
          ? "border-border hover:border-blue/40"
          : "border-border/60 bg-surface-hover/60"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className={`min-w-0 flex-1 ${accessible ? "" : "opacity-60"}`}>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-foreground">
              Stage {stageNum} · {name}
            </h2>
            {isLocked ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-surface-hover text-muted border border-border">
                <Lock className="w-3 h-3" /> Locked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
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
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30"
                    : statusLabel.tone === "rose"
                      ? "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30"
                      : statusLabel.tone === "blue"
                        ? "bg-blue/10 text-blue dark:text-blue-300 border-blue/30"
                        : statusLabel.tone === "amber"
                          ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30"
                          : "bg-surface-hover text-muted border-border"
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
              <EggHoverNote note="Awaiting clearance.">
                <span className="text-muted">
                  {availabilityNote ?? "Waiting for admin to open this stage."}
                </span>
              </EggHoverNote>
            )}
            {!isLocked && !accessible && !isPast && (
              <span className="text-muted">
                Finish the previous stage first.
              </span>
            )}
            {isPast && !reportStatus && (
              <span className="text-muted">You have moved past this stage.</span>
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
                : reportStatus === "PASSED" || reportStatus === "FAILED"
                  ? "View result"
                  : "Submit report"}
          </Link>
        </div>
      )}
    </div>
  );
}
