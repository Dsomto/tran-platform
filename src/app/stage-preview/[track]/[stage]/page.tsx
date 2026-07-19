import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { AdvancedStageRoom } from "@/components/stage/AdvancedStageRoom";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import {
  ADVANCED_PROJECTS,
  advancedTrackLabel,
  type AdvancedTrack,
} from "@/lib/advanced-stage";
import { stageUrl } from "@/lib/stage-routes";
import styles from "../../stage-preview.module.css";

export const dynamic = "force-dynamic";

const TRACK_BY_SLUG: Record<string, AdvancedTrack> = {
  soc: "SOC_ANALYSIS",
  "ethical-hacking": "ETHICAL_HACKING",
  grc: "GRC",
};

const SLUG_BY_TRACK: Record<AdvancedTrack, string> = {
  SOC_ANALYSIS: "soc",
  ETHICAL_HACKING: "ethical-hacking",
  GRC: "grc",
};

export default async function StagePreviewDetail({
  params,
}: {
  params: Promise<{ track: string; stage: string }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();

  const route = await params;
  const track = TRACK_BY_SLUG[route.track];
  if (!track || !/^[5-9]$/.test(route.stage)) notFound();
  const stageNumber = Number(route.stage);

  const project = ADVANCED_PROJECTS[track][stageNumber - 5];
  if (!project) notFound();

  const previous = stageNumber > 5 ? stageNumber - 1 : null;
  const next = stageNumber < 9 ? stageNumber + 1 : null;
  const trackSlug = SLUG_BY_TRACK[track];

  return (
    <div className={`${styles.detailPage} bg-advanced-stage`}>
      <a href="#project-brief" className={styles.skipLink}>Skip to project brief</a>
      <header className={styles.detailToolbar}>
        <Link href="/stage-preview" className={styles.backLink}>
          <ArrowLeft aria-hidden="true" /> All project pages
        </Link>

        <div className={styles.detailIdentity}>
          <span>{advancedTrackLabel(track)}</span>
          <strong>Stage {stageNumber} · {project.title}</strong>
        </div>

        <div className={styles.detailActions}>
          <ThemeToggle />
          <Link href={stageUrl(project.slug)} className={styles.securedLink}>
            Open secured stage <ExternalLink aria-hidden="true" />
          </Link>
        </div>
      </header>

      <nav className={styles.pageNav} aria-label="Project pages">
        {previous ? (
          <Link href={`/stage-preview/${trackSlug}/${previous}`}>
            <ArrowLeft aria-hidden="true" /> Stage {previous}
          </Link>
        ) : <span />}
        <span>Page {project.number} of 5</span>
        {next ? (
          <Link href={`/stage-preview/${trackSlug}/${next}`}>
            Stage {next} <ArrowRight aria-hidden="true" />
          </Link>
        ) : <span />}
      </nav>

      <main id="project-brief" className={styles.detailCanvas}>
        <AdvancedStageRoom
          project={project}
          track={track}
          trackLabel={advancedTrackLabel(track)}
          firstName="Reviewer"
          internCode="DESIGN-PREVIEW"
          variant={{
            cohort: "ADV-C1",
            variant: "V3",
            marker: `UBI-A${stageNumber}-DESIGN-REVIEW`,
          }}
          preview
        />
      </main>
    </div>
  );
}
