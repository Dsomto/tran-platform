import Link from "next/link";
import type { CSSProperties } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Download,
  FileCheck2,
  Gauge,
  ListChecks,
  LockKeyhole,
  PackageCheck,
  Route,
  ShieldCheck,
  Swords,
  TerminalSquare,
  TestTube2,
  Wrench,
} from "lucide-react";
import {
  advancedContinuity,
  type AdvancedProject,
  type AdvancedTrack,
} from "@/lib/advanced-stage";
import type { AdvancedVariant } from "@/lib/advanced-variant";
import { advancedProjectVisual } from "@/lib/advanced-visuals";
import { AdvancedProjectInstrument } from "./AdvancedProjectInstrument";

type Props = {
  project: AdvancedProject;
  track: AdvancedTrack;
  trackLabel: string;
  firstName: string;
  internCode: string;
  variant: AdvancedVariant;
  preview?: boolean;
};

function difficultyLabel(value: number) {
  return Array.from({ length: 5 }, (_, index) => (index < value ? "●" : "○")).join("");
}

function protectedResourceHref(stage: string, resourcePath: string) {
  const query = new URLSearchParams({ stage, path: resourcePath });
  return `/api/advanced-stage/resource?${query.toString()}`;
}

export function AdvancedStageRoom({
  project,
  track,
  trackLabel,
  firstName,
  internCode,
  variant,
  preview = false,
}: Props) {
  const visual = advancedProjectVisual(track, project.number);
  const deliverables = project.deliverables.includes("assessment-manifest.json")
    ? project.deliverables
    : [...project.deliverables, "assessment-manifest.json"];
  const roomStyle = {
    "--advanced-accent": visual.accent,
    "--advanced-accent-strong": visual.accentStrong,
    "--advanced-accent-soft": visual.accentSoft,
    "--advanced-hero-image": `url(${visual.image})`,
    "--advanced-hero-position": visual.imagePosition,
  } as CSSProperties;

  return (
    <div className={`advanced-room advanced-room--${visual.key} space-y-8 pb-16`} style={roomStyle}>
      <nav aria-label="Advanced project progress" className="advanced-progress">
        {[1, 2, 3, 4, 5].map((number) => (
          <div
            key={number}
            className={number === project.number ? "is-current" : number < project.number ? "is-done" : ""}
          >
            <span>{number < project.number ? <CheckCircle2 aria-hidden="true" /> : number}</span>
            <small>{number === 5 ? "Capstone" : `Project ${number}`}</small>
          </div>
        ))}
      </nav>

      <header className="advanced-hero">
        <div className="advanced-hero__content">
          <div className="advanced-eyebrow">{trackLabel} / Advanced project {project.number} of 5</div>
          <div className="advanced-title-row">
            <div>
              <p className="advanced-welcome">{preview ? "Design preview" : `${firstName}, your assigned case is live.`}</p>
              <h1>{project.title}</h1>
            </div>
            <div className="advanced-seal" aria-label={`Difficulty ${project.difficulty} out of 5`}>
              <Gauge aria-hidden="true" />
              <strong>{difficultyLabel(project.difficulty)}</strong>
            </div>
          </div>
          <p className="advanced-objective">{project.objective}</p>

          <dl className="advanced-facts">
            <div><dt><Clock3 aria-hidden="true" /> Window</dt><dd>{project.duration}</dd></div>
            <div><dt><FileCheck2 aria-hidden="true" /> Revision</dt><dd>{project.revision}</dd></div>
            <div><dt><ShieldCheck aria-hidden="true" /> Defense</dt><dd>{project.defense}</dd></div>
            <div><dt><LockKeyhole aria-hidden="true" /> Assignment</dt><dd>{preview ? "Preview variant" : `${variant.variant} / ${internCode}`}</dd></div>
          </dl>
        </div>
      </header>

      <AdvancedProjectInstrument visual={visual} />

      <section className="advanced-marker" aria-labelledby="marker-title">
        <div>
          <h2 id="marker-title">Your evidence marker</h2>
          <p>It must appear in the setup proof, raw artifact manifest, and defense recording.</p>
        </div>
        <code>{variant.marker}</code>
      </section>

      <section className="advanced-operating-brief" aria-labelledby="operating-brief-title">
        <header>
          <div className="advanced-eyebrow">Controlling assessment brief</div>
          <h2 id="operating-brief-title">Receive. Build. Prove. Hand off.</h2>
          <p>
            This page is the assignment contract for this project. The private overlay and issued
            archive supply your exact variant; the requirements below define what staff will accept.
          </p>
        </header>
        <div className="advanced-brief-ledger">
          <article>
            <span><LockKeyhole aria-hidden="true" /> 01 · Receive</span>
            <strong>One identity-bound case</strong>
            <p>Private overlay, evidence marker, assigned archive, and {project.resources.length} controlled references.</p>
          </article>
          <article>
            <span><PackageCheck aria-hidden="true" /> 02 · Build</span>
            <strong>{deliverables.length} scored outputs</strong>
            <p>The implementation and evidence package must rebuild from the submitted repository and manifest.</p>
          </article>
          <article>
            <span><ListChecks aria-hidden="true" /> 03 · Prove</span>
            <strong>{project.verificationTests.length} acceptance tests</strong>
            <p>Published checks, private holdouts, clean-state reproduction, and {project.defense.toLowerCase()}.</p>
          </article>
          <article>
            <span><Route aria-hidden="true" /> 04 · Hand off</span>
            <strong>Portfolio continuity</strong>
            <p>{advancedContinuity(track, project.number)}</p>
          </article>
        </div>
      </section>

      <div className="advanced-columns">
        <section aria-labelledby="setup-title">
          <div className="advanced-section-title"><TerminalSquare aria-hidden="true" /><h2 id="setup-title">01 · Environment gate</h2></div>
          <ol>{project.setup.map((item) => <li key={item}>{item}</li>)}</ol>
        </section>

        <section aria-labelledby="mission-title">
          <div className="advanced-section-title"><Swords aria-hidden="true" /><h2 id="mission-title">02 · Mission execution</h2></div>
          <ol>{project.mission.map((item) => <li key={item}>{item}</li>)}</ol>
        </section>
      </div>

      <section className="advanced-technical" aria-labelledby="technical-title">
        <div>
          <div className="advanced-section-title"><Wrench aria-hidden="true" /><h2 id="technical-title">03 · Engineering constraints</h2></div>
          <ul>{project.technicalChallenges.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div>
          <div className="advanced-section-title"><TestTube2 aria-hidden="true" /><h2>04 · Acceptance tests</h2></div>
          <ol>{project.verificationTests.map((item) => <li key={item}>{item}</li>)}</ol>
        </div>
      </section>

      <section className="advanced-band" aria-labelledby="proof-title">
        <div>
          <div className="advanced-section-title"><ShieldCheck aria-hidden="true" /><h2 id="proof-title">05 · Required proof</h2></div>
          <ul>{project.proof.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div>
          <div className="advanced-section-title"><AlertTriangle aria-hidden="true" /><h2>Automatic hold / fail gates</h2></div>
          <ul>{project.gates.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </section>

      <section aria-labelledby="deliverables-title">
        <div className="advanced-section-heading">
          <div>
            <div className="advanced-eyebrow">Submission root</div>
            <h2 id="deliverables-title">Required deliverables</h2>
          </div>
          <span>{deliverables.length} required</span>
        </div>
        <div className="advanced-file-grid">
          {deliverables.map((file) => (
            <div key={file}><FileCheck2 aria-hidden="true" /><code>{file}</code></div>
          ))}
        </div>
      </section>

      <section aria-labelledby="downloads-title">
        <div className="advanced-section-heading">
          <div>
            <div className="advanced-eyebrow">Case desk</div>
            <h2 id="downloads-title">Briefs and artifacts</h2>
          </div>
        </div>
        <div className="advanced-downloads">
          {!preview && (
            <a href={`/api/advanced-stage/assignment?stage=${project.stage}`} target="_blank" rel="noreferrer noopener">
              <span className="advanced-download-icon"><LockKeyhole aria-hidden="true" /></span>
              <span><strong>Your assignment overlay</strong><small>Private marker, variant pool, and facts that supersede the base pack.</small></span>
              <ArrowRight aria-hidden="true" />
            </a>
          )}
          {project.resources.map((resource) => (
            <a
              key={resource.href}
              href={protectedResourceHref(project.stage, resource.href)}
              target="_blank"
              rel="noreferrer noopener"
            >
              <span className="advanced-download-icon"><Download aria-hidden="true" /></span>
              <span><strong>{resource.label}</strong><small>{resource.description}</small></span>
              <ArrowRight aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>

      <section className="advanced-pressure" aria-labelledby="pressure-title">
        <div>
          <div className="advanced-eyebrow">Deterministic extension pool</div>
          <h2 id="pressure-title">Additional technical test</h2>
          <p>One may be issued from the seeded pool. It uses the published interface and is scored inside the technical criterion; it cannot repair a failed mandatory test.</p>
        </div>
        <ul>{project.pressureSlots.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="advanced-submit">
        <div>
          <span className="advanced-eyebrow">One folder, one manifest, one decision</span>
          <h2>Submit the case package</h2>
          <p>Upload the deliverables to one view-only folder. The executive summary belongs in netforge; raw evidence stays in the linked package.</p>
        </div>
        {preview ? (
          <span className="advanced-submit__preview">Submission disabled in preview</span>
        ) : (
          <Link href={`/dashboard/reports/${project.stage}`}>
            Open submission <ArrowRight aria-hidden="true" />
          </Link>
        )}
      </section>
    </div>
  );
}
