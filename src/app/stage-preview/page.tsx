import type { CSSProperties, ComponentType } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  BookOpenCheck,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Crosshair,
  FileCheck2,
  FlaskConical,
  FolderKey,
  GraduationCap,
  LifeBuoy,
  Radar,
  Scale,
  ShieldCheck,
  Sparkles,
  TestTube2,
} from "lucide-react";
import { LogoMark } from "@/components/logo";
import {
  ADVANCED_PROJECTS,
  ADVANCED_TRACK_OUTCOMES,
  advancedTrackLabel,
  type AdvancedTrack,
} from "@/lib/advanced-stage";
import { ADVANCED_TRACK_VISUALS } from "@/lib/advanced-visuals";
import { stageUrl } from "@/lib/stage-routes";
import styles from "./stage-preview.module.css";

export const dynamic = "force-dynamic";

type TrackPreview = {
  key: AdvancedTrack;
  slug: "soc" | "ethical-hacking" | "grc";
  shortLabel: string;
  description: string;
  icon: ComponentType<{ "aria-hidden"?: boolean }>;
};

const TRACKS: TrackPreview[] = [
  {
    key: "SOC_ANALYSIS",
    slug: "soc",
    shortLabel: "SOC",
    description: "Detection, infrastructure, and incident-response engineering.",
    icon: Radar,
  },
  {
    key: "ETHICAL_HACKING",
    slug: "ethical-hacking",
    shortLabel: "VAPT",
    description: "Authorized offensive work with strict scope and repeatable proof.",
    icon: Crosshair,
  },
  {
    key: "GRC",
    slug: "grc",
    shortLabel: "GRC",
    description: "Executable governance, assurance, risk, and breach decisions.",
    icon: Scale,
  },
];

const LEARNING_MODEL = [
  {
    number: "01",
    title: "Learn through a real operating problem",
    copy: "Every stage begins with a case, constraints, an assigned environment, and a result that has to work—not a list of videos to finish.",
  },
  {
    number: "02",
    title: "Build the system, not just the report",
    copy: "You write the parser, policy, lab, test harness, detection, or decision engine behind the conclusion you submit.",
  },
  {
    number: "03",
    title: "Prove every material claim",
    copy: "Raw artifacts, exact locators, manifests, public fixtures, clean builds, and holdout checks make the work independently reproducible.",
  },
  {
    number: "04",
    title: "Carry the capability forward",
    copy: "Each project reuses and extends earlier interfaces, evidence models, and tests so the final case demonstrates progression—not five disconnected tasks.",
  },
];

const RESOURCE_LIBRARY = [
  {
    icon: BookOpenCheck,
    title: "Mission brief",
    copy: "The controlling scenario, objective, scope, constraints, acceptance standard, and exact submission contract.",
  },
  {
    icon: FolderKey,
    title: "Assigned case pack",
    copy: "An identity-bound overlay, evidence marker, archive, and variant facts issued only to the learner assigned to that track.",
  },
  {
    icon: Boxes,
    title: "Starter kits and schemas",
    copy: "Pinned interfaces, safe scaffolds, data contracts, and templates that remove ambiguity without supplying the solution.",
  },
  {
    icon: TestTube2,
    title: "Fixtures and acceptance tests",
    copy: "Published positive, negative, malformed-input, safety, and regression cases so learners can check their work before submission.",
  },
  {
    icon: FileCheck2,
    title: "Evidence and manifest templates",
    copy: "Structured records for claims, raw-artifact locators, clean-build commands, versions, hashes, runtimes, and test results.",
  },
  {
    icon: LifeBuoy,
    title: "Defense-readiness guide",
    copy: "A practical checklist for rebuilding from a clean state, navigating evidence quickly, explaining trade-offs, and handling a challenge task.",
  },
];

export default function Page() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <div className={styles.page}>
      <a href="#main-content" className={styles.skipLink}>Skip to programme content</a>
      <header className={styles.siteHeader}>
        <Link href="/" className={styles.brand}>
          <LogoMark size={28} />
          <span>UBI</span>
        </Link>
        <nav className={styles.siteNav} aria-label="Programme sections">
          <a href="#how-it-works">How it works</a>
          <a href="#tracks">Tracks</a>
          <a href="#resources">Resources</a>
        </nav>
        <div className={styles.headerActions}>
          <span className={styles.environment}>Advanced programme preview</span>
        </div>
      </header>

      <main id="main-content">
        <section className={styles.hero}>
          <div className={styles.heroLead}>
            <p className={styles.eyebrow}>The Root Access Network · Advanced stages 5–9</p>
            <h1>Build the work.<br /><span className={styles.heroAccent}>Prove you can own it.</span></h1>
            <p className={styles.heroIntro}>
              Move beyond guided exercises into five connected, production-shaped projects in your
              assigned cybersecurity track. You will build working systems, test them under adverse
              conditions, and defend the evidence behind every decision.
            </p>
            <div className={styles.heroActions}>
              <a href="#tracks">Explore the tracks <ChevronRight aria-hidden="true" /></a>
              <a href="#resources">See learner resources</a>
            </div>
          </div>
          <div className={styles.heroCopy}>
            <span className={styles.heroPanelLabel}>The learning contract</span>
            <div className={styles.heroPromise}>
              <div><GraduationCap aria-hidden="true" /><span><strong>Develop</strong>Professional depth through deliberate practice</span></div>
              <div><FlaskConical aria-hidden="true" /><span><strong>Demonstrate</strong>Working outputs against published checks</span></div>
              <div><ShieldCheck aria-hidden="true" /><span><strong>Defend</strong>Decisions from raw evidence under challenge</span></div>
            </div>
            <p className={styles.accessNote}><FolderKey aria-hidden="true" /> In production, learners see only the track and case material assigned to their account.</p>
          </div>
        </section>

        <section className={styles.programmeStats} aria-label="Programme overview">
          <div><strong>03</strong><span>specialist tracks</span></div>
          <div><strong>05</strong><span>linked projects per track</span></div>
          <div><strong>15</strong><span>dedicated mission pages</span></div>
          <div><strong>01</strong><span>defensible portfolio</span></div>
        </section>

        <section id="how-it-works" className={styles.learningSection}>
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>How learning happens</p>
            <h2>A programme built around capability, not content consumption.</h2>
            <p>Read enough to orient yourself. Spend the real effort building, testing, explaining, and improving work that another practitioner can reproduce.</p>
          </div>
          <div className={styles.learningGrid}>
            {LEARNING_MODEL.map((item) => (
              <article key={item.number}>
                <span>{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.progressionSection} aria-labelledby="progression-title">
          <div className={styles.sectionIntroCompact}>
            <p className={styles.eyebrow}>The progression</p>
            <h2 id="progression-title">Five stages. A rising standard of independence.</h2>
          </div>
          <div className={styles.sequence} aria-label="Advanced stage sequence">
            {[
              ["Signal", "Find what ordinary analysis misses", "One revision"],
              ["Exposure", "Operate the system and own its consequences", "One revision"],
              ["Architecture", "Build and defend the whole design", "One revision"],
              ["Adversity", "Perform under challenge", "No revision"],
              ["Final case", "Stand behind the complete result", "No revision"],
            ].map(([name, description, revision], index) => (
              <div key={name}>
                <span>{String(index + 5).padStart(2, "0")}</span>
                <strong>{name}</strong>
                <p>{description}</p>
                <small>{revision}</small>
              </div>
            ))}
          </div>
        </section>

        <section id="tracks" className={styles.trackSection}>
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>Your assigned specialist path</p>
            <h2>Specialist tracks with a clear professional destination.</h2>
            <p>Every track develops technical depth, evidence discipline, communication, and professional judgment through five connected missions.</p>
          </div>
        <div className={styles.trackList}>
          {TRACKS.map((track) => {
            const visual = ADVANCED_TRACK_VISUALS[track.key];
            const outcome = ADVANCED_TRACK_OUTCOMES[track.key];
            const Icon = track.icon;
            const trackStyle = { "--track-accent": visual.accent } as CSSProperties;

            return (
              <section key={track.key} className={styles.track} style={trackStyle}>
                <header className={styles.trackHeader}>
                  <div>
                    <div className={styles.trackIdentity}>
                      <span className={styles.trackIcon}><Icon aria-hidden={true} /></span>
                      <div>
                        <p>{track.shortLabel} track</p>
                        <h3>{advancedTrackLabel(track.key)}</h3>
                      </div>
                    </div>
                    <p className={styles.trackDescription}>{track.description}</p>
                  </div>
                  <div className={styles.trackLearning}>
                    <span>What you will learn</span>
                    <ul>
                      {outcome.learning.map((item) => <li key={item}><CheckCircle2 aria-hidden="true" />{item}</li>)}
                    </ul>
                  </div>
                  <div className={styles.trackOutcome}>
                    <span>Professional outcome</span>
                    <p>{outcome.destination}</p>
                    <small>{outcome.toolkit}</small>
                  </div>
                </header>

                <div className={styles.projectGridLabel}>
                  <span>Learning path</span>
                  <small>Open a project to read its complete mission, proof, deliverables, gates, and resources.</small>
                </div>
                <div className={styles.projectGrid}>
                  {ADVANCED_PROJECTS[track.key].map((project) => (
                    <article key={project.stage} className={styles.projectCard}>
                      <div className={styles.projectNumber}>
                        <span>Stage {project.number + 4}</span>
                        <span>{project.duration}</span>
                      </div>
                      <h3>{project.title}</h3>
                      <span className={styles.cardLabel}>What you will build</span>
                      <p>{project.objective}</p>
                      <dl>
                        <div><dt>Difficulty</dt><dd>{project.difficulty}/5</dd></div>
                        <div><dt>Revision</dt><dd>{project.revision}</dd></div>
                        <div><dt>Defense</dt><dd>{project.defense}</dd></div>
                      </dl>
                      <div className={styles.cardActions}>
                        <Link href={`/stage-preview/${track.slug}/${project.number + 4}`}>
                          View project brief <ArrowUpRight aria-hidden="true" />
                        </Link>
                        <Link className={styles.liveLink} href={stageUrl(project.slug)}>
                          Open secured stage
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
        </section>

        <section id="resources" className={styles.resourceSection}>
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>Resources that help without doing the work for you</p>
            <h2>Clear starting points. Testable expectations. No hidden guessing game.</h2>
            <p>Each project page brings the learning support and assessment materials into one case desk. Private packs remain identity-bound; shared templates teach a reusable way of working.</p>
          </div>
          <div className={styles.resourceGrid}>
            {RESOURCE_LIBRARY.map((resource) => {
              const ResourceIcon = resource.icon;
              return (
                <article key={resource.title}>
                  <ResourceIcon aria-hidden="true" />
                  <div><h3>{resource.title}</h3><p>{resource.copy}</p></div>
                </article>
              );
            })}
          </div>
          <div className={styles.supportStrip}>
            <div>
              <Sparkles aria-hidden="true" />
              <span><strong>The goal is independence—not isolation.</strong> Resources explain the environment, interfaces, evidence standard, and checks. The learner still owns the implementation and conclusions.</span>
            </div>
            <a href="#tracks">Explore the track paths <ArrowUpRight aria-hidden="true" /></a>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <span>UBI · The Root Access Network</span>
        <p>This design preview is development-only. Participant access remains controlled by stage status, current stage, and registered track.</p>
      </footer>
    </div>
  );
}
