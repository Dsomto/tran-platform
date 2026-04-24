import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { STAGE_BRIEFS } from "@/lib/stage-briefs";
import { ReportEditor } from "./report-editor";

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
  const now = new Date();
  const isOpen = window ? now >= window.activeFrom && now <= window.submitUntil : true;
  const isPassed = existing?.status === "PASSED";

  // Server-side gate: if the admin hasn't opened this stage, the intern
  // can't see the report editor — even if they guess the URL.
  const isLocked = window ? window.isLocked : true;
  if (isLocked) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl mx-auto mt-16 bg-white border border-border rounded-xl p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-100 grid place-items-center">
            <Lock className="w-5 h-5 text-slate-600" />
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

  return (
    <ReportEditor
      stage={stage}
      stageLabel={brief.label}
      stageSubtitle={brief.subtitle}
      storyline={brief.missionBrief[0] ?? ""}
      sectionHints={brief.sections}
      initialReport={
        existing
          ? {
              id: existing.id,
              executiveSummary: existing.executiveSummary,
              reportUrl: existing.reportUrl,
              attachmentUrl: existing.attachmentUrl,
              status: existing.status,
              version: existing.version,
              score: existing.score,
              feedback: existing.feedback,
              submittedAt: existing.submittedAt ? existing.submittedAt.toISOString() : null,
            }
          : null
      }
      windowInfo={
        window
          ? {
              activeFrom: window.activeFrom.toISOString(),
              submitUntil: window.submitUntil.toISOString(),
              passingScore: window.passingScore,
              isOpen,
            }
          : null
      }
      locked={isPassed || !isOpen}
    />
  );
}
