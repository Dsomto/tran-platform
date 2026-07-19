import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  FileText,
  GraduationCap,
  Layers3,
  LockKeyhole,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  ADVANCED_PROJECTS,
  ADVANCED_STAGE_META,
  ADVANCED_TRACK_OUTCOMES,
  advancedContinuity,
  advancedTrackLabel,
  requiredAdvancedDeliverables,
  type AdvancedTrack,
} from "@/lib/advanced-stage";
import { advancedProjectVisual, ADVANCED_TRACK_VISUALS } from "@/lib/advanced-visuals";
import { stageRank, type StageKey } from "@/lib/stage-login";
import { stageUrl } from "@/lib/stage-routes";
import { stageWindowHasStarted } from "@/lib/stage-window";
import styles from "./advanced-track.module.css";

type AdvancedStage = Extract<StageKey, "STAGE_5" | "STAGE_6" | "STAGE_7" | "STAGE_8" | "STAGE_9">;

const ADVANCED_STAGES: AdvancedStage[] = ["STAGE_5", "STAGE_6", "STAGE_7", "STAGE_8", "STAGE_9"];

function isArtifactGrantCurrent(expiresAt: Date | null): boolean {
  return !expiresAt || expiresAt.getTime() > Date.now();
}

export default async function AdvancedTrackPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const intern = await prisma.intern.findUnique({
    where: { userId: session.id },
    select: { id: true, track: true, currentStage: true, isActive: true },
  });
  if (!intern?.isActive || stageRank(intern.currentStage) < stageRank("STAGE_5")) {
    redirect("/dashboard");
  }
  if (!(intern.track in ADVANCED_PROJECTS)) redirect("/dashboard");

  const track = intern.track as AdvancedTrack;
  const trackVisual = ADVANCED_TRACK_VISUALS[track];
  const trackOutcome = ADVANCED_TRACK_OUTCOMES[track];
  const [windows, reports, artifactGrants] = await Promise.all([
    prisma.stageWindow.findMany({
      where: { stage: { in: ADVANCED_STAGES } },
      select: { stage: true, status: true, activeFrom: true },
    }),
    prisma.stageReport.findMany({
      where: { internId: intern.id, stage: { in: ADVANCED_STAGES } },
      select: { stage: true, status: true },
    }),
    prisma.advancedArtifactGrant.findMany({
      where: { internId: intern.id, stage: { in: ADVANCED_STAGES }, revokedAt: null },
      select: {
        stage: true,
        track: true,
        variant: true,
        marker: true,
        sha256: true,
        sizeBytes: true,
        expiresAt: true,
      },
    }),
  ]);

  const windowByStage = new Map(windows.map((window) => [window.stage, window]));
  const reportByStage = new Map(reports.map((report) => [report.stage, report]));
  const validArtifactGrants = artifactGrants.filter((grant) =>
    grant.track === track && isArtifactGrantCurrent(grant.expiresAt)
  );
  const artifactByStage = new Map(validArtifactGrants.map((grant) => [grant.stage, grant]));
  const pageStyle = { "--track-accent": trackVisual.accent } as CSSProperties;

  return (
    <div className={styles.page} style={pageStyle}>
      <div className={styles.inner}>
        <header className={styles.hero}>
          <Image className={styles.heroImage} src={trackVisual.image} alt="" fill priority sizes="(max-width: 1100px) 100vw, 1060px" />
          <div className={styles.heroContent}>
            <div className={styles.eyebrow}>{trackVisual.eyebrow}</div>
            <h1>{advancedTrackLabel(track)} advanced track</h1>
            <p>{trackVisual.summary}</p>
            <div className={styles.heroMeta}>
              <span><Layers3 aria-hidden="true" /> Stages 5-9 only</span>
              <span><ShieldCheck aria-hidden="true" /> Assigned track only</span>
              <span><LockKeyhole aria-hidden="true" /> Private case variants</span>
            </div>
          </div>
        </header>

        <section className={styles.learningOverview} aria-labelledby="track-learning-title">
          <div className={styles.learningHeading}>
            <div className={styles.eyebrow}>Your learning destination</div>
            <h2 id="track-learning-title">What this track will help you build</h2>
          </div>
          <div className={styles.learningGrid}>
            <article>
              <GraduationCap aria-hidden="true" />
              <div>
                <h3>Capabilities</h3>
                <ul>{trackOutcome.learning.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            </article>
            <article>
              <Wrench aria-hidden="true" />
              <div>
                <h3>Working toolkit</h3>
                <p>{trackOutcome.toolkit}</p>
              </div>
            </article>
            <article>
              <ShieldCheck aria-hidden="true" />
              <div>
                <h3>Portfolio outcome</h3>
                <p>{trackOutcome.destination}</p>
              </div>
            </article>
          </div>
          <div className={styles.resourceNote}>
            <BookOpenCheck aria-hidden="true" />
            <p><strong>Each open project begins with a five-step start guide.</strong> It also shows prerequisites, a short glossary, hardware and cost limits, the approved fallback, the exact 100-point rubric, pass gates, examples, and support rules beside the controlling case materials.</p>
          </div>
        </section>

        <div className={styles.heading}>
          <div>
            <div className={styles.eyebrow}>Your progression</div>
            <h2>Five projects. One increasing standard.</h2>
          </div>
          <p>A project becomes enterable only after you reach its stage and the stage window is open.</p>
        </div>

        <main className={styles.projects}>
          {ADVANCED_PROJECTS[track].map((project) => {
            const stage = project.stage as AdvancedStage;
            const meta = ADVANCED_STAGE_META[stage];
            const visual = advancedProjectVisual(track, project.number);
            const stageWindow = windowByStage.get(stage);
            const report = reportByStage.get(stage);
            const artifact = artifactByStage.get(stage);
            const deliverables = requiredAdvancedDeliverables(project);
            const reached = stageRank(stage) <= stageRank(intern.currentStage);
            const isCurrent = stage === intern.currentStage;
            const isOpen = reached && stageWindowHasStarted(stageWindow);
            const isPassed = report?.status === "PASSED";
            const statusText = isPassed
              ? "Completed"
              : isCurrent && isOpen
                ? "Current and open"
                : isOpen
                  ? "Available"
                  : reached
                    ? stageWindow?.status === "PAUSED" ? "Paused" : "Window closed"
                    : "Locked";
            const projectStyle = {
              "--project-accent": visual.accent,
              "--project-accent-strong": visual.accentStrong,
              "--project-soft": visual.accentSoft,
            } as CSSProperties;

            return (
              <article
                key={project.stage}
                className={`${styles.project} ${isCurrent ? styles.projectCurrent : ""}`}
                style={projectStyle}
              >
                <details
                  className={`${styles.projectDetails} ${!isOpen && !isPassed ? styles.projectLocked : ""}`}
                  open={isCurrent && (isOpen || isPassed) ? true : undefined}
                >
                  <summary
                    className={styles.projectSummary}
                    aria-disabled={!isOpen && !isPassed}
                    tabIndex={isOpen || isPassed ? undefined : -1}
                  >
                    <span className={styles.stageNumber}>
                      <span>Stage</span>
                      <strong>{project.number + 4}</strong>
                    </span>
                    <span className={styles.projectBody}>
                      <span className={styles.projectTop}>
                        <span>{meta.name} / Project {project.number}</span>
                        <span className={`${styles.status} ${isOpen || isPassed ? styles.statusOpen : ""}`}>
                          {isPassed ? <CheckCircle2 aria-hidden="true" /> : isOpen ? <Clock3 aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />}
                          {statusText}
                        </span>
                      </span>
                      <strong className={styles.projectTitle}>{project.title}</strong>
                      <span className={styles.projectMeta}>{meta.subtitle} · {project.duration} · Difficulty {project.difficulty}/5 · {project.defense}</span>
                    </span>
                    {isOpen || isPassed ? (
                      <span className={styles.projectToggle} aria-hidden="true">
                        <span className={styles.openLabel}>View mission brief</span>
                        <span className={styles.closeLabel}>Close mission brief</span>
                        <ChevronDown />
                      </span>
                    ) : (
                      <span className={styles.projectToggle} aria-hidden="true">
                        <span>Brief locked</span>
                        <LockKeyhole />
                      </span>
                    )}
                  </summary>

                  {(isOpen || isPassed) && <div className={styles.projectBrief}>
                    <div className={styles.briefLead}>
                      <div className={styles.eyebrow}>Mission brief</div>
                      <h4>{project.objective}</h4>
                      <p>This brief belongs to the {advancedTrackLabel(track)} track. The private evidence pack and assignment overlay unlock only when this stage is available to you.</p>
                    </div>

                    <div className={styles.briefGrid}>
                      <section>
                        <h5>Mission objectives</h5>
                        <ol>{project.mission.map((item) => <li key={item}>{item}</li>)}</ol>
                      </section>
                      <section>
                        <h5>Hard acceptance gates</h5>
                        <ul>{project.gates.map((item) => <li key={item}>{item}</li>)}</ul>
                      </section>
                      <section>
                        <h5>Portfolio continuity</h5>
                        <p>{advancedContinuity(track, project.number)}</p>
                      </section>
                    </div>

                    <section className={styles.briefDeliverables}>
                      <div>
                        <h5>Required case package</h5>
                        <p>{deliverables.length} artifacts, submitted as one traceable package.</p>
                      </div>
                      <div className={styles.deliverableList}>
                        {deliverables.map((file) => <code key={file}>{file}</code>)}
                      </div>
                    </section>

                    <div className={styles.projectAction}>
                      {isOpen ? (
                        <>
                          <Link href={stageUrl(project.slug)}>Enter project <ArrowRight aria-hidden="true" /></Link>
                          <Link className={styles.secondary} href={`/dashboard/reports/${project.stage}`}><FileText aria-hidden="true" /> Submission</Link>
                          {artifact && (
                            <Link className={styles.secondary} href={`/api/advanced-stage/artifact?stage=${stage}`}>
                              <Download aria-hidden="true" /> Evidence pack · {Math.ceil(artifact.sizeBytes / 1_048_576)} MB · {artifact.sha256.slice(0, 10)}…
                            </Link>
                          )}
                        </>
                      ) : (
                        <div className={styles.locked}><LockKeyhole aria-hidden="true" /> {statusText}</div>
                      )}
                    </div>
                  </div>}
                </details>
              </article>
            );
          })}
        </main>

        <section className={styles.integrity}>
          <ShieldCheck aria-hidden="true" />
          <div>
            <h2>Track boundary enforced</h2>
            <p>This workspace is generated from your assigned track. Stage URLs do not accept a track override; base artifacts are shared within a track while discrepancy facts and evidence markers remain tied to your identity.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
