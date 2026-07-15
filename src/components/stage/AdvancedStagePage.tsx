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

  const intern = await prisma.intern.findUnique({
    where: { id: result.access.internId },
    select: { track: true },
  });
  if (!intern) redirect("/dashboard");

  const track = intern.track as AdvancedTrack;
  const project = getAdvancedProject(stage, track);
  if (!project) redirect("/dashboard");

  const variant = advancedVariantFor(
    result.access.internId,
    result.access.internCode,
    stage
  );

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
      />
    </StageShell>
  );
}
