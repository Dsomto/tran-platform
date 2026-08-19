import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { STAGE_BRIEFS } from "@/lib/stage-briefs";
import { EVIDENCE_PACK } from "@/lib/evidence-pack";
import { STAGE_STORIES } from "@/lib/stage-story";
import { isReportResultReleased, publicReportStatus } from "@/lib/report-visibility";
import { stageRank } from "@/lib/stage-login";
import { stageWindowHasStarted } from "@/lib/stage-window";
import { ReportEditor } from "./report-editor";
import {
  advancedTrackLabel,
  getAdvancedProject,
  isAdvancedStage,
  requiredAdvancedDeliverables,
  type AdvancedTrack,
} from "@/lib/advanced-stage";

// Always re-fetch — score field switched from `score` to `finalScore`.
export const dynamic = "force-dynamic";
export const revalidate = 0;

type FoundationStageKey = keyof typeof STAGE_BRIEFS;
type StageKey = FoundationStageKey | "STAGE_5" | "STAGE_6" | "STAGE_7" | "STAGE_8" | "STAGE_9";

function isStageKey(s: string): s is StageKey {
  return s in STAGE_BRIEFS || isAdvancedStage(s);
}

export default async function ReportEditorPage({
  params,
}: {
  params: Promise<{ stage: string }>;
}) {
  const session = await requireAuth();
  const { stage: stageSlug } = await params;
  const stage = stageSlug.toUpperCase();

  if (!isStageKey(stage)) notFound();

  const intern = await prisma.intern.findUnique({
    where: { userId: session.id },
  });
  if (!intern) redirect("/dashboard");
  if (!intern.isActive || stageRank(stage) > stageRank(intern.currentStage)) {
    redirect("/dashboard");
  }

  const [existing, window] = await Promise.all([
    prisma.stageReport.findUnique({
      where: { internId_stage: { internId: intern.id, stage: stage as never } },
    }),
    prisma.stageWindow.findUnique({ where: { stage: stage as never } }),
  ]);

  const advancedProject = isAdvancedStage(stage)
    ? getAdvancedProject(stage, intern.track)
    : null;
  const brief = !advancedProject
    ? STAGE_BRIEFS[stage as FoundationStageKey]
    : null;
  if (!brief && !advancedProject) notFound();
  // Time-aware gate: a stage is only truly open once its window status is OPEN
  // AND its scheduled start (activeFrom) has passed. Checking status alone let
  // interns open a not-yet-started advanced stage (OPEN with a future start) early.
  const isOpen = stageWindowHasStarted(window);
  const resultReleased = isReportResultReleased(existing?.status);

  // Server-side gate: if the admin hasn't opened this stage, the intern
  // can't see the report editor — even if they guess the URL.
  if (!isOpen) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl mx-auto mt-16 bg-surface border border-border rounded-xl p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-surface-hover grid place-items-center">
            <Lock className="w-5 h-5 text-muted" />
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-1">
            {(brief?.label ?? `Advanced Project ${advancedProject?.number}`)} is not open yet
          </h1>
          <p className="text-sm text-muted-foreground mb-5">
            The programme team has not opened {brief?.label ?? `Advanced Project ${advancedProject?.number}`} for this cohort.
            Return here when the programme team opens this project. Any announcement will appear on your dashboard.
          </p>
          <Link
            href="/dashboard/assignments"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-foreground text-background hover:opacity-90"
          >
            Back to stages
          </Link>
        </div>
      </div>
    );
  }

  // "STAGE_0" -> "stage-0" so we can pull the chapter's narrative.
  const storySlug = `stage-${stage.split("_")[1]}` as keyof typeof STAGE_STORIES;
  const story = !advancedProject ? STAGE_STORIES[storySlug] : null;

  const stageLabel = advancedProject
    ? `Advanced Project ${advancedProject.number}`
    : brief!.label;
  const stageSubtitle = advancedProject
    ? `${advancedTrackLabel(intern.track as AdvancedTrack)} · ${advancedProject.title}`
    : brief!.subtitle;
  const missionBrief = advancedProject
    ? [advancedProject.objective, ...advancedProject.mission]
    : brief!.missionBrief;
  const sectionHints = advancedProject
    ? [
        ...advancedProject.proof.map((item) => `Proof: ${item}`),
        ...advancedProject.gates.map((item) => `Gate: ${item}`),
      ]
    : brief!.sections;
  const folderContents = advancedProject
    ? requiredAdvancedDeliverables(advancedProject).map((deliverable, index) => ({
        id: `advanced-${advancedProject.number}-${index + 1}`,
        title: deliverable,
        deliverable,
      }))
    : brief!.practicalTasks.map((task) => ({
        id: task.id,
        title: task.title,
        deliverable: task.deliverable,
      }));
  const evidencePack = advancedProject
    ? advancedProject.resources.map((resource) => ({
        filename: resource.label,
        url: resource.href.startsWith("/api/advanced-stage/")
          ? resource.href
          : `/api/advanced-stage/resource?${new URLSearchParams({
              stage,
              path: resource.href,
            }).toString()}`,
        description: resource.description,
      }))
    : EVIDENCE_PACK[stage as FoundationStageKey];

  return (
    <ReportEditor
      stage={stage}
      stageLabel={stageLabel}
      stageSubtitle={stageSubtitle}
      missionBrief={missionBrief}
      sectionHints={sectionHints}
      chapter={advancedProject ? advancedProject.number : story!.chapter}
      reportTo={advancedProject ? "Advanced Assessment Panel" : story!.reportTo}
      folderContents={folderContents}
      evidencePack={evidencePack}
      initialReport={
        existing
          ? {
              id: existing.id,
              executiveSummary: existing.executiveSummary,
              reportUrl: existing.reportUrl,
              attachmentUrl: existing.attachmentUrl,
              status: publicReportStatus(existing.status),
              version: existing.version,
              // Use finalScore (the combined 0.8*report + 0.2*terminal score)
              // when present so the dashboard matches what the result email
              // and certificate display. Fall back to score for legacy rows
              // that finalised before finalScore was computed.
              score: resultReleased ? (existing.finalScore ?? existing.score) : null,
              feedback: resultReleased ? existing.feedback : null,
              submittedAt: existing.submittedAt ? existing.submittedAt.toISOString() : null,
            }
          : null
      }
      locked={
        resultReleased ||
        !isOpen ||
        Boolean(
          advancedProject &&
          existing?.submittedAt &&
          existing.version >= (advancedProject.number >= 4 ? 1 : 2)
        )
      }
    />
  );
}
