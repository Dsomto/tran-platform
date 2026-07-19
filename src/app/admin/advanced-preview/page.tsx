import type { CSSProperties } from "react";
import Link from "next/link";
import { AdvancedStageRoom } from "@/components/stage/AdvancedStageRoom";
import {
  ADVANCED_PROJECTS,
  advancedTrackLabel,
  type AdvancedTrack,
} from "@/lib/advanced-stage";
import { advancedProjectVisual } from "@/lib/advanced-visuals";

const TRACKS: AdvancedTrack[] = ["SOC_ANALYSIS", "ETHICAL_HACKING", "GRC"];

type SearchParams = Promise<{ track?: string; project?: string }>;

export default async function AdvancedPreviewPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const track = TRACKS.includes(query.track as AdvancedTrack)
    ? query.track as AdvancedTrack
    : "SOC_ANALYSIS";
  const parsedProject = Number.parseInt(query.project ?? "1", 10);
  const projectNumber = Number.isFinite(parsedProject)
    ? Math.max(1, Math.min(5, parsedProject))
    : 1;
  const project = ADVANCED_PROJECTS[track][projectNumber - 1];

  return (
    <div className="advanced-preview-shell bg-advanced-stage">
      <div className="advanced-preview-inner">
        <header className="advanced-preview-heading">
          <div>
            <div className="advanced-eyebrow">Staff-only visual QA</div>
            <h1>Advanced Stage design review</h1>
            <p>Select any project below to inspect the exact participant-facing layout. Private assignment overlays and submission actions are disabled in this preview.</p>
          </div>
        </header>

        <div className="advanced-preview-grid" aria-label="All advanced project designs">
          {TRACKS.map((trackOption) => {
            const visual = advancedProjectVisual(trackOption, 1);
            const trackStyle = {
              "--preview-accent": visual.accent,
              "--preview-accent-soft": visual.accentSoft,
            } as CSSProperties;

            return (
              <section key={trackOption} className="advanced-preview-track" style={trackStyle}>
                <h2>{advancedTrackLabel(trackOption)}</h2>
                <nav>
                  {ADVANCED_PROJECTS[trackOption].map((option) => {
                    const isActive = trackOption === track && option.number === projectNumber;
                    return (
                      <Link
                        key={option.stage}
                        className={isActive ? "is-active" : ""}
                        href={`/admin/advanced-preview?track=${trackOption}&project=${option.number}`}
                      >
                        <span>{option.number + 4}</span>
                        <strong>{option.title}</strong>
                      </Link>
                    );
                  })}
                </nav>
              </section>
            );
          })}
        </div>

        <div className="advanced-preview-stage">
          <AdvancedStageRoom
            key={`${track}-${projectNumber}`}
            project={project}
            track={track}
            trackLabel={advancedTrackLabel(track)}
            firstName="Reviewer"
            internCode="PREVIEW"
            variant={{ cohort: "ADV-C1", variant: "V3", marker: `UBI-A${projectNumber}-DESIGN-PREVIEW` }}
            preview
          />
        </div>
      </div>
    </div>
  );
}
