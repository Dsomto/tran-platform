import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import StageShell from "./StageShell";
import { AdvancedStageRoom } from "./AdvancedStageRoom";
import { STAGE_THEMES } from "./themes";
import { getStageAccess } from "@/lib/stage-access";
import { getAdvancedProject, advancedTrackLabel, type AdvancedTrack } from "@/lib/advanced-stage";
import { advancedVariantFor } from "@/lib/advanced-variant";
import { prisma } from "@/lib/db";
import type { StageKey, StageSlug } from "@/lib/stage-login";

export async function AdvancedStagePage({ stage, slug }: { stage: StageKey; slug: StageSlug }) {
  const result = await getStageAccess(slug);
  if (!result.ok) {
    if (result.reason === "no-session") redirect("/login");
    redirect("/dashboard");
  }

  const [intern, artifactGrant, stageWindow] = await Promise.all([
    prisma.intern.findUnique({
      where: { id: result.access.internId },
      select: { track: true },
    }),
    prisma.advancedArtifactGrant.findUnique({
      where: { internId_stage: { internId: result.access.internId, stage } },
      select: { track: true, variant: true, marker: true, revokedAt: true },
    }),
    prisma.stageWindow.findUnique({
      where: { stage },
      select: { activeFrom: true, submitUntil: true },
    }),
  ]);
  if (!intern) redirect("/dashboard");

  const track = intern.track as AdvancedTrack;
  const project = getAdvancedProject(stage, track);
  if (!project) redirect("/dashboard");

  const fallbackVariant = advancedVariantFor(result.access.internId, result.access.internCode, stage);
  const variant = artifactGrant &&
    artifactGrant.track === track &&
    !artifactGrant.revokedAt
      ? { cohort: "ADV-C1", variant: artifactGrant.variant, marker: artifactGrant.marker }
      : fallbackVariant;

  return (
    <StageShell
      theme={STAGE_THEMES[slug]}
      internCode={result.access.internCode}
      rightNav={(
        <Link href="/dashboard/advanced" className="advanced-shell-link">
          <LayoutGrid aria-hidden="true" />
          Track projects
        </Link>
      )}
    >
      <AdvancedStageRoom
        project={project}
        track={track}
        trackLabel={advancedTrackLabel(track)}
        firstName={result.access.firstName}
        internCode={result.access.internCode}
        variant={variant}
        activeFrom={stageWindow?.activeFrom?.toISOString() ?? null}
        submitUntil={stageWindow?.submitUntil?.toISOString() ?? null}
      />
    </StageShell>
  );
}
