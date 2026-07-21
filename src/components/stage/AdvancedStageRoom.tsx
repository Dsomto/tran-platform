import Link from "next/link";
import type { CSSProperties } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Coins,
  Download,
  FileCheck2,
  Gauge,
  LifeBuoy,
  Lightbulb,
  ListStart,
  ListChecks,
  LockKeyhole,
  PackageCheck,
  Route,
  Server,
  ShieldCheck,
  Swords,
  TerminalSquare,
  TestTube2,
  Wrench,
} from "lucide-react";
import {
  advancedContinuity,
  requiredAdvancedDeliverables,
  type AdvancedProject,
  type AdvancedResource,
  type AdvancedTrack,
} from "@/lib/advanced-stage";
import { advancedLearnerGuidance } from "@/lib/advanced-guidance";
import {
  advancedSelectionPolicy,
  type AdvancedRankingStage,
} from "@/lib/advanced-ranking";
import type { AdvancedVariant } from "@/lib/advanced-variant";
import { advancedProjectVisual } from "@/lib/advanced-visuals";
import { AdvancedProjectFaq } from "./AdvancedProjectFaq";
import { AdvancedProjectInstrument } from "./AdvancedProjectInstrument";
import { AdvancedStageFiveOnboarding } from "./AdvancedStageFiveOnboarding";
import { AdvancedProjectWorkflow } from "./AdvancedProjectWorkflow";
import { StageDeadlineCountdown } from "./StageDeadlineCountdown";

type Props = {
  project: AdvancedProject;
  track: AdvancedTrack;
  trackLabel: string;
  firstName: string;
  internCode: string;
  variant: AdvancedVariant;
  activeFrom?: string | null;
  submitUntil?: string | null;
  preview?: boolean;
};

function difficultyLabel(value: number) {
  return Array.from({ length: 5 }, (_, index) => (index < value ? "●" : "○")).join("");
}

function protectedResourceHref(stage: string, resourcePath: string) {
  const query = new URLSearchParams({ stage, path: resourcePath });
  return `/api/advanced-stage/resource?${query.toString()}`;
}

type ResourceBadge = "Read first" | "Required" | "Template" | "Reference";

function resourceBadge(resource: AdvancedResource): ResourceBadge {
  if (resource.label === "Project brief") return "Read first";
  if (resource.kind === "template") return "Template";
  if (resource.kind === "reference") return "Reference";
  return "Required";
}

function orderedResources(resources: AdvancedResource[]) {
  const rank: Record<ResourceBadge, number> = {
    "Read first": 0,
    Required: 1,
    Template: 2,
    Reference: 3,
  };
  return [...resources].sort((left, right) => (
    rank[resourceBadge(left)] - rank[resourceBadge(right)]
  ));
}

export function AdvancedStageRoom({
  project,
  track,
  trackLabel,
  firstName,
  internCode,
  variant,
  activeFrom = null,
  submitUntil = null,
  preview = false,
}: Props) {
  const visual = advancedProjectVisual(track, project.number);
  const deliverables = requiredAdvancedDeliverables(project);
  const guidance = advancedLearnerGuidance(track, project);
  const resources = orderedResources(project.resources);
  const rankingStage = `STAGE_${project.number + 4}` as AdvancedRankingStage;
  const selectionPolicy = advancedSelectionPolicy(rankingStage);
  const selectionBadge = selectionPolicy.fixedAdvancePerTrack !== null
    ? `Top ${selectionPolicy.fixedAdvancePerTrack}`
    : `Top ${Math.round((1 - selectionPolicy.eliminationRate!) * 100)}%`;
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

      <nav className="advanced-toc" aria-label="Jump to a section of this brief">
        <a href="#simple-terms-title">Simple terms</a>
        <a href={project.number === 1 ? "#stage-five-start" : "#start-here-title"}>Start here</a>
        <a href="#project-approach">{project.number === 1 ? "Weekly plan" : "Approach"}</a>
        <a href="#readiness-title">Foundations</a>
        <a href="#operating-brief-title">Brief</a>
        <a href="#assessment-title">How it&apos;s judged</a>
        <a href="#mission-title">Mission</a>
        <a href="#technical-title">Constraints</a>
        <a href="#proof-title">Proof</a>
        <a href="#decision-rules-title">Rules</a>
        <a href="#deliverables-title">Deliverables</a>
        <a href="#project-faq">FAQ</a>
        <a href="#advanced-submit">Submit</a>
      </nav>

      {!preview && submitUntil && (
        <StageDeadlineCountdown
          activeFrom={activeFrom}
          submitUntil={submitUntil}
          tone="dark"
        />
      )}

      <section className="advanced-simple" aria-labelledby="simple-terms-title">
        <div className="advanced-simple__icon"><Lightbulb aria-hidden="true" /></div>
        <div>
          <div className="advanced-eyebrow">In simple terms</div>
          <h2 id="simple-terms-title">What is this project actually asking you to do?</h2>
          <p>{guidance.simpleTerms}</p>
        </div>
      </section>

      {project.number === 1 ? (
        <AdvancedStageFiveOnboarding track={track} trackLabel={trackLabel} />
      ) : (
        <section className="advanced-start-here" aria-labelledby="start-here-title">
          <header>
            <div className="advanced-start-here__icon"><ListStart aria-hidden="true" /></div>
            <div>
              <div className="advanced-eyebrow">Before you touch the case</div>
              <h2 id="start-here-title">Start here</h2>
              <p>Complete these five actions in order. If one cannot be completed safely, stop and use the escalation guidance below.</p>
              <a className="advanced-faq-jump" href="#project-faq"><CircleHelp aria-hidden="true" /> Read this project&apos;s FAQ</a>
            </div>
          </header>
          <ol>
            {guidance.startHere.map((item, index) => (
              <li key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{item}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <AdvancedProjectWorkflow
        project={project}
        track={track}
        trackLabel={trackLabel}
        showFirstHour={project.number !== 1}
      />

      <section className="advanced-summary" aria-label="Project summary">
        <article>
          <span>What you build</span>
          <p>{guidance.summary.build}</p>
        </article>
        <article>
          <span>What you prove</span>
          <p>{guidance.summary.prove}</p>
        </article>
        <article>
          <span>What you submit</span>
          <p>{guidance.summary.submit}</p>
        </article>
      </section>

      <section className="advanced-readiness" aria-labelledby="readiness-title">
        <header>
          <div className="advanced-eyebrow">Readiness check</div>
          <h2 id="readiness-title">Know the foundations and operating limits</h2>
          <p>Prerequisites are not scored outputs. They are the minimum knowledge and environment needed to attempt the mission safely.</p>
        </header>
        <div className="advanced-readiness__grid">
          <article>
            <div className="advanced-section-title"><BookOpenCheck aria-hidden="true" /><h3>Prerequisites</h3></div>
            <ul>{guidance.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <article>
            <div className="advanced-section-title"><ListChecks aria-hidden="true" /><h3>Short glossary</h3></div>
            <dl>
              {guidance.glossary.map((entry) => (
                <div key={entry.term}><dt>{entry.term}</dt><dd>{entry.meaning}</dd></div>
              ))}
            </dl>
          </article>
        </div>
        <div className="advanced-operations">
          <article><Server aria-hidden="true" /><div><h3>Hardware and environment</h3><p>{guidance.environment.hardware}</p></div></article>
          <article><Coins aria-hidden="true" /><div><h3>Cost boundary</h3><p>{guidance.environment.cost}</p></div></article>
          <article><LifeBuoy aria-hidden="true" /><div><h3>Approved fallback</h3><p>{guidance.environment.fallback}</p></div></article>
        </div>
      </section>

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
            <strong>One shared base, one private overlay</strong>
            <p>Track base artifact, private discrepancy facts, evidence marker, and {project.resources.length} controlled references.</p>
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

      <section className="advanced-assessment" aria-labelledby="assessment-title">
        <header>
          <div>
            <div className="advanced-eyebrow">Scoring and percentile decision</div>
            <h2 id="assessment-title">Know exactly how the project is judged</h2>
          </div>
          <div className="advanced-pass-mark"><strong>{selectionBadge}</strong><span>within your track</span></div>
        </header>
        <div className="advanced-assessment__grid">
          <div className="advanced-rubric">
            <h3>Rubric · 100 points</h3>
            <ul>
              {guidance.rubric.map((criterion) => (
                <li key={criterion.label}>
                  <div><span>{criterion.label}</span><strong>{criterion.weight}%</strong></div>
                  <div className="advanced-rubric__bar" aria-hidden="true"><span style={{ width: `${criterion.weight}%` }} /></div>
                </li>
              ))}
            </ul>
          </div>
          <aside>
            <h3>Selection rule</h3>
            <p>
              {selectionPolicy.label}. Explicit automatic fail gates are applied before ranking.
              Your 100-point result is converted to a percentile only against interns in your own
              track; there is no fixed 70% advanced-stage pass mark.
              {selectionPolicy.basis === "CUMULATIVE_WEIGHTED_PERCENTILE"
                ? " The cumulative calculation weights Stages 5-9 at 1, 1, 1.5, 2, and 2.5 respectively."
                : " This stage uses the current project percentile."}
              {" "}Exact boundary ties are resolved by audited defense or blinded review.
            </p>
            <h3>Eligibility and proof requirements</h3>
            <ol>{guidance.passRequirements.map((item) => <li key={item}>{item}</li>)}</ol>
          </aside>
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

      <section className="advanced-decision-rules" aria-labelledby="decision-rules-title">
        <header>
          <div className="advanced-eyebrow">Decision rules and help</div>
          <h2 id="decision-rules-title">Revision, failure, and escalation</h2>
        </header>
        <div>
          <article>
            <h3><FileCheck2 aria-hidden="true" /> Revision rule</h3>
            <p>{guidance.revisionRule}</p>
          </article>
          <article>
            <h3><AlertTriangle aria-hidden="true" /> What stops a pass</h3>
            <ul>{guidance.automaticFailureRules.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <article>
            <h3><LifeBuoy aria-hidden="true" /> Support and escalation</h3>
            <ol>{guidance.supportRules.map((item) => <li key={item}>{item}</li>)}</ol>
          </article>
        </div>
      </section>

      <AdvancedProjectFaq project={project} track={track} trackLabel={trackLabel} />

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
              <span><span className="advanced-resource-badge">Required</span><strong>Your assignment overlay</strong><small>Private marker and controlling facts layered over the shared track base.</small></span>
              <ArrowRight aria-hidden="true" />
            </a>
          )}
          {!preview && project.stage === "STAGE_5" && track === "SOC_ANALYSIS" && (
            <a href="/api/advanced-stage/discrepancy?stage=STAGE_5" target="_blank" rel="noreferrer noopener">
              <span className="advanced-download-icon"><ListChecks aria-hidden="true" /></span>
              <span><span className="advanced-resource-badge">Required</span><strong>Your SOC discrepancy set</strong><small>96 assigned review candidates, including 80 evidence-backed false positives unique to your account.</small></span>
              <ArrowRight aria-hidden="true" />
            </a>
          )}
          {resources.map((resource) => {
            const resourceSummary = (
              <>
                <span className="advanced-download-icon"><Download aria-hidden="true" /></span>
                <span><span className="advanced-resource-badge">{resourceBadge(resource)}</span><strong>{resource.label}</strong><small>{resource.description}</small></span>
              </>
            );

            return preview ? (
              <div key={resource.href} className="advanced-download-preview">
                {resourceSummary}
                <span className="advanced-download-preview__status"><LockKeyhole aria-hidden="true" /> Protected</span>
              </div>
            ) : (
              <a
                key={resource.href}
                href={protectedResourceHref(project.stage, resource.href)}
                target="_blank"
                rel="noreferrer noopener"
              >
                {resourceSummary}
                <ArrowRight aria-hidden="true" />
              </a>
            );
          })}
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

      <section className="advanced-submit" id="advanced-submit">
        <div>
          <span className="advanced-eyebrow">One folder, one manifest, one decision</span>
          <h2>Submit the case package</h2>
          <p>Upload the deliverables to one view-only folder. The executive summary belongs in the UBI submission form; raw evidence stays in the linked package.</p>
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
