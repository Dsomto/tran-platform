import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { STAGE_BRIEFS } from "@/lib/stage-briefs";
import { EVIDENCE_PACK } from "@/lib/evidence-pack";
import { STAGE_STORIES } from "@/lib/stage-story";
import type { StageSlug } from "@/lib/stage-routes";
import { isReportResultReleased, publicReportStatus } from "@/lib/report-visibility";
import { ReportEditor } from "./report-editor";

// Always re-fetch — score field switched from `score` to `finalScore`.
export const dynamic = "force-dynamic";
export const revalidate = 0;

type StageKey = keyof typeof STAGE_BRIEFS;

function isStageKey(s: string): s is StageKey {
  return s in STAGE_BRIEFS;
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

  const [existing, window] = await Promise.all([
    prisma.stageReport.findUnique({
      where: { internId_stage: { internId: intern.id, stage: stage as never } },
    }),
    prisma.stageWindow.findUnique({ where: { stage: stage as never } }),
  ]);

  const brief = STAGE_BRIEFS[stage];
  const stageStatus = window?.status ?? "CLOSED";
  const isOpen = stageStatus === "OPEN";
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
            {brief.label} is not open yet
          </h1>
          <p className="text-sm text-muted-foreground mb-5">
            The programme team has not opened {brief.label} for this cohort.
            You will get an email and a pinned announcement as soon as it opens.
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
  const storySlug = `stage-${stage.split("_")[1]}` as StageSlug;
  const story = STAGE_STORIES[storySlug];

  return (
    <ReportEditor
      stage={stage}
      stageLabel={brief.label}
      stageSubtitle={brief.subtitle}
      missionBrief={brief.missionBrief}
      sectionHints={brief.sections}
      chapter={story.chapter}
      reportTo={story.reportTo}
      folderContents={brief.practicalTasks.map((t) => ({
        id: t.id,
        title: t.title,
        deliverable: t.deliverable,
      }))}
      evidencePack={EVIDENCE_PACK[stage]}
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
      locked={resultReleased || !isOpen}
    />
  );
}
