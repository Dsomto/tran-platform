"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  Bug,
  Check,
  CircleCheck,
  ExternalLink,
  Info,
  KeyRound,
  LoaderCircle,
  Mail,
  Play,
  Radar,
  Scale,
  X,
} from "lucide-react";
import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import {
  SHOWCASE_TRACKS,
  TRACK_LABEL,
  type BALLOT_RULE,
  type BallotSelections,
  type PublicShowcaseEntry,
  type ShowcaseTrack,
} from "@/lib/showcase-public";

type Phase = "DRAFT" | "SCHEDULED" | "OPEN" | "PAUSED" | "CLOSED";
type VoterState = "anonymous" | "verified" | "voted";
type Tab = "ALL" | ShowcaseTrack;

const TRACK_ICON = { SOC_ANALYSIS: Radar, ETHICAL_HACKING: Bug, GRC: Scale } as const;
const TRACK_COLOR: Record<ShowcaseTrack, string> = {
  SOC_ANALYSIS: "var(--sc-soc)",
  ETHICAL_HACKING: "var(--sc-eh)",
  GRC: "var(--sc-grc)",
};
const TABS: { id: Tab; label: string }[] = [
  { id: "ALL", label: "All" },
  ...SHOWCASE_TRACKS.map((t) => ({ id: t as Tab, label: TRACK_LABEL[t] })),
];

const PHASE_NOTICE: Record<Exclude<Phase, "OPEN">, string> = {
  DRAFT: "Voting has not opened yet. You can watch every project now.",
  SCHEDULED: "Voting has not opened yet. You can watch every project now.",
  PAUSED: "Voting is paused. Please check back shortly.",
  CLOSED: "Voting has closed. Thank you to everyone who took part.",
};

async function postJson(url: string, body: unknown): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: "Network error. Check your connection and try again." } };
  }
}

function TrackTag({ track }: { track: ShowcaseTrack }) {
  const Icon = TRACK_ICON[track];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: TRACK_COLOR[track] }}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {TRACK_LABEL[track]}
    </span>
  );
}

export function ShowcaseExperience({
  entries,
  phase,
  closesAt,
  rule,
  seed,
  persistSeed,
  voterState: initialVoterState,
  adminPreview,
}: {
  entries: PublicShowcaseEntry[];
  phase: Phase;
  closesAt: string | null;
  rule: typeof BALLOT_RULE;
  seed: string;
  persistSeed: boolean;
  voterState: VoterState;
  adminPreview: boolean;
}) {
  const [tab, setTab] = useState<Tab>("ALL");
  const [selections, setSelections] = useState<BallotSelections>({});
  const [voterState, setVoterState] = useState<VoterState>(initialVoterState);
  const [playing, setPlaying] = useState<PublicShowcaseEntry | null>(null);
  const [ballotOpen, setBallotOpen] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const storageKey = `ubi-showcase-ballot:${seed}`;

  const votingOpen = phase === "OPEN" && voterState !== "voted";

  // Keep the viewer's order stable for the whole browser session.
  useEffect(() => {
    if (persistSeed) document.cookie = `ubi_showcase_seed=${seed}; path=/showcase; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  }, [persistSeed, seed]);

  // Draft choices survive a reload in this tab only. They are the viewer's
  // own picks and never leave the device until the ballot is submitted.
  useEffect(() => {
    let restored: BallotSelections = {};
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as BallotSelections;
        restored = Object.fromEntries(
          Object.entries(parsed).filter(([track, id]) => entries.some((e) => e.id === id && e.track === track)),
        );
      }
    } catch {
      restored = {};
    }
    const frame = window.requestAnimationFrame(() => setSelections(restored));
    return () => window.cancelAnimationFrame(frame);
  }, [entries, storageKey]);

  const choose = useCallback(
    (entry: PublicShowcaseEntry) => {
      setSelections((prev) => {
        const next = { ...prev };
        if (next[entry.track] === entry.id) delete next[entry.track];
        else next[entry.track] = entry.id;
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          /* private mode: choices just won't survive a reload */
        }
        return next;
      });
    },
    [storageKey],
  );

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let nextIndex: number | null = null;
    if (event.key in keys) nextIndex = (index + keys[event.key] + TABS.length) % TABS.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = TABS.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    setTab(TABS[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  }

  const visibleTracks = tab === "ALL" ? SHOWCASE_TRACKS : [tab];
  const chosenCount = SHOWCASE_TRACKS.filter((t) => selections[t]).length;
  const tracksWithEntries = SHOWCASE_TRACKS.filter((t) => entries.some((e) => e.track === t));
  const deadline = closesAt
    ? new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(closesAt))
    : null;

  return (
    <div className="showcase-page min-h-screen">
      <a href="#projects" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-[var(--sc-surface)] focus:px-4 focus:py-2 focus:text-[var(--sc-text)]">
        Skip to the projects
      </a>

      {adminPreview && (
        <p role="status" className="bg-[var(--sc-gold-line)] px-4 py-2 text-center text-sm font-semibold text-[#1A1200]">
          Admin preview. This showcase is not published, so the public cannot see this page.
        </p>
      )}

      <header className="border-b border-white/10 bg-[var(--sc-navy)] text-[var(--sc-navy-ink)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 text-sm font-semibold" aria-label="Ubuntu Bridge Initiative home">
            <LogoMark size={22} />
            <span>Ubuntu Bridge Initiative</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main>
        {/* Hero band: a real UBI community workshop, held under a navy scrim so
            the type stays AA-legible over any part of the photograph. */}
        <section className="relative isolate overflow-hidden bg-[var(--sc-navy)] text-white" aria-labelledby="showcase-title">
          <Image
            src="/images/programs/workshops.jpg"
            alt="A UBI community cybersecurity workshop: a facilitator presents to a seated audience"
            fill
            priority
            sizes="100vw"
            className="-z-10 object-cover object-[70%_40%]"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,19,31,0.94)_0%,rgba(7,19,31,0.86)_48%,rgba(7,19,31,0.55)_100%)]" aria-hidden="true" />
          <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24">
            <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-[#E9B949]">
              <span className="h-px w-8 bg-[#E9B949]" aria-hidden="true" />
              Ubuntu Bridge Initiative · Cohort One
            </p>
            <h1 id="showcase-title" className="mt-5 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Cohort One Finalist Showcase
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/85 sm:text-xl">
              Built under pressure. Explained in two minutes.
            </p>
            <p className="mt-6 text-sm font-semibold tracking-wide text-white/90">
              {entries.length} finalists <span aria-hidden="true" className="px-2 text-white/40">|</span> {tracksWithEntries.length} tracks{" "}
              <span aria-hidden="true" className="px-2 text-white/40">|</span> 1 final showcase
            </p>
            <a
              href="#projects"
              className="mt-9 inline-flex min-h-11 items-center gap-2 rounded-[6px] bg-[#2DD4BF] px-6 py-3 text-sm font-bold text-[#062925] transition-colors hover:bg-[#5EEAD4] focus-visible:outline-[#E9B949]"
            >
              Watch the projects
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className="border-b border-[var(--sc-border)] bg-[var(--sc-surface)]">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-8 md:grid-cols-[1.4fr_1fr] md:items-start">
            <p className="max-w-2xl text-base leading-relaxed text-[var(--sc-muted)]">
              These ten people came through every stage of the Cohort One programme. Each was then asked to build something
              of their own and explain it, in plain English, in about two minutes. Watch the videos, open the projects, and
              judge the work on its own terms.
            </p>
            <div role="status" className="flex gap-3 border-l-[3px] border-[var(--sc-gold-line)] pl-4 text-sm leading-relaxed text-[var(--sc-text)]">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--sc-gold)]" aria-hidden="true" />
              <p>
                {phase === "OPEN"
                  ? voterState === "voted"
                    ? "Your ballot has been recorded. Thank you."
                    : `Voting is open to the original Cohort One audience: choose one project in each track${deadline ? ` before ${deadline} (WAT)` : ""}.`
                  : PHASE_NOTICE[phase]}
              </p>
            </div>
          </div>
        </section>

        <section id="projects" aria-labelledby="projects-heading" className="mx-auto max-w-6xl scroll-mt-4 px-4 pb-32 pt-12 sm:px-8">
          <h2 id="projects-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
            The finalists
          </h2>

          <div role="tablist" aria-label="Filter by track" className="mt-6 flex w-full overflow-x-auto border-b border-[var(--sc-border)]">
            {TABS.map((t, i) => {
              const selected = tab === t.id;
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  role="tab"
                  id={`tab-${t.id}`}
                  aria-selected={selected}
                  aria-controls="track-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setTab(t.id)}
                  onKeyDown={(e) => onTabKey(e, i)}
                  className={`-mb-px min-h-11 shrink-0 whitespace-nowrap border-b-[3px] px-4 py-2.5 text-sm font-semibold transition-colors ${
                    selected
                      ? "border-[var(--sc-teal)] text-[var(--sc-text)]"
                      : "border-transparent text-[var(--sc-muted)] hover:text-[var(--sc-text)]"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div id="track-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-10 space-y-14">
            {entries.length === 0 && (
              <p className="border border-[var(--sc-border)] bg-[var(--sc-surface)] p-6 text-[var(--sc-muted)]">
                The finalist projects are being prepared. Please check back soon.
              </p>
            )}
            {visibleTracks.map((track) => {
              const trackEntries = entries.filter((e) => e.track === track);
              if (trackEntries.length === 0) return null;
              return (
                <section key={track} aria-labelledby={`heading-${track}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--sc-border)] pb-3">
                    <h3 id={`heading-${track}`} className="flex items-center gap-2 text-lg font-bold">
                      <span className="h-4 w-1" style={{ background: TRACK_COLOR[track] }} aria-hidden="true" />
                      {TRACK_LABEL[track]}
                    </h3>
                    <p className="text-sm text-[var(--sc-muted)]">
                      {trackEntries.length} finalists{phase === "OPEN" && rule.selectionsPerTrack === 1 ? " · choose one" : ""}
                    </p>
                  </div>
                  <ul className="mt-6 grid gap-6 md:grid-cols-2">
                    {trackEntries.map((entry) => (
                      <li key={entry.id}>
                        <ProjectCard
                          entry={entry}
                          chosen={selections[entry.track] === entry.id}
                          canChoose={votingOpen}
                          onPlay={() => setPlaying(entry)}
                          onChoose={() => choose(entry)}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </section>

        <section className="bg-[var(--sc-navy)] text-[var(--sc-navy-ink)]" aria-labelledby="closing-heading">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
            <h2 id="closing-heading" className="max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
              Public choice is one part of the final showcase.
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-white/80">
              Every finalist reached this point through the programme&rsquo;s own assessed stages. The Cohort One ballot lets
              the community that started this journey together recognise the work it found most compelling. Individual
              ballots stay private, and no live tallies are published.
            </p>
            <Link href="/" className="mt-8 inline-flex min-h-11 items-center gap-2 border-b-2 border-[#2DD4BF] pb-1 font-semibold text-white hover:text-[#5EEAD4]">
              Visit the Ubuntu Bridge Initiative
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      {phase === "OPEN" && voterState !== "voted" && entries.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--sc-border)] bg-[var(--sc-surface)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--sc-surface)]/90">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
            <p className="text-sm text-[var(--sc-text)]" aria-live="polite">
              <span className="font-semibold">Your ballot:</span> {chosenCount} of {SHOWCASE_TRACKS.length} tracks chosen
            </p>
            <button
              type="button"
              onClick={() => setBallotOpen(true)}
              disabled={chosenCount === 0}
              className="min-h-11 rounded-[6px] bg-[var(--sc-teal)] px-5 py-2.5 text-sm font-bold text-[var(--sc-teal-ink)] transition-colors hover:bg-[var(--sc-teal-strong)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Review my ballot
            </button>
          </div>
        </div>
      )}

      <VideoDialog entry={playing} onClose={() => setPlaying(null)} />
      <BallotDialog
        open={ballotOpen}
        onClose={() => setBallotOpen(false)}
        entries={entries}
        selections={selections}
        rule={rule}
        voterState={voterState}
        onVerified={() => setVoterState("verified")}
        onRecorded={() => {
          setVoterState("voted");
          try {
            sessionStorage.removeItem(storageKey);
          } catch {
            /* ignore */
          }
        }}
      />
    </div>
  );
}

function ProjectCard({
  entry,
  chosen,
  canChoose,
  onPlay,
  onChoose,
}: {
  entry: PublicShowcaseEntry;
  chosen: boolean;
  canChoose: boolean;
  onPlay: () => void;
  onChoose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const summaryId = useId();
  const long = entry.projectSummary.length > 320;

  return (
    <article
      id={entry.slug}
      aria-labelledby={`${summaryId}-title`}
      className={`flex h-full flex-col rounded-[8px] border bg-[var(--sc-surface)] transition-colors ${
        chosen ? "border-[var(--sc-teal)] ring-2 ring-[var(--sc-teal)]" : "border-[var(--sc-border)]"
      }`}
    >
      {entry.videoEmbedUrl ? (
        <button
          type="button"
          onClick={onPlay}
          className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-t-[7px] bg-[var(--sc-navy)] text-white"
          aria-label={`Play video: ${entry.projectTitle}, by ${entry.finalistName}`}
        >
          <span className="absolute left-4 top-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
            {TRACK_LABEL[entry.track]} · Finalist
          </span>
          <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/80 transition-transform group-hover:scale-105">
            <Play className="ml-1 h-7 w-7" aria-hidden="true" />
          </span>
          <span className="absolute bottom-4 left-4 right-4 truncate text-left text-sm font-semibold text-white/90">
            Watch the two-minute explainer
          </span>
          <span className="absolute inset-x-0 bottom-0 h-1" style={{ background: "var(--sc-gold-line)" }} aria-hidden="true" />
        </button>
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-t-[7px] bg-[var(--sc-navy)] px-6 text-center text-sm text-white/80">
          This video is being checked and will be available shortly.
        </div>
      )}

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <TrackTag track={entry.track} />
        <h4 id={`${summaryId}-title`} className="mt-3 text-xl font-bold leading-snug tracking-tight [overflow-wrap:anywhere]">
          {entry.projectTitle}
        </h4>
        <p className="mt-1.5 text-sm font-semibold text-[var(--sc-gold)]">{entry.finalistName}</p>
        <p
          id={summaryId}
          className={`mt-4 whitespace-pre-line text-[15px] leading-relaxed text-[var(--sc-muted)] [overflow-wrap:anywhere] ${expanded || !long ? "" : "line-clamp-5"}`}
        >
          {entry.projectSummary}
        </p>
        {long && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls={summaryId}
            className="mt-2 self-start text-sm font-semibold text-[var(--sc-teal)] underline-offset-4 hover:underline"
          >
            {expanded ? "Show less" : "Read the full summary"}
          </button>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
          {entry.projectUrl ? (
            <a
              href={entry.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-[6px] border border-[var(--sc-border)] px-4 py-2 text-sm font-semibold text-[var(--sc-text)] hover:border-[var(--sc-teal)]"
            >
              Open project
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          ) : (
            <span className="text-sm text-[var(--sc-muted)]">Project link under review</span>
          )}
          {canChoose && (
            <button
              type="button"
              onClick={onChoose}
              aria-pressed={chosen}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-[6px] px-4 py-2 text-sm font-bold transition-colors ${
                chosen
                  ? "bg-[var(--sc-teal)] text-[var(--sc-teal-ink)] hover:bg-[var(--sc-teal-strong)]"
                  : "border-2 border-[var(--sc-teal)] text-[var(--sc-teal)] hover:bg-[var(--sc-teal-soft)]"
              }`}
            >
              {chosen ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
              {chosen ? "Chosen" : "Choose this project"}
              <span className="sr-only"> in {TRACK_LABEL[entry.track]}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// One player for the whole page. The iframe exists only while the dialog is
// open, so ten Drive embeds are never mounted at once and closing stops play.
function VideoDialog({ entry, onClose }: { entry: PublicShowcaseEntry | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (entry && !dialog.open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
    } else if (!entry && dialog.open) {
      dialog.close();
    }
  }, [entry]);

  function handleClose() {
    onClose();
    returnFocus.current?.focus();
  }

  return (
    <dialog
      ref={ref}
      onClose={handleClose}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
      aria-labelledby="video-dialog-title"
      className="m-auto w-[min(100vw-2rem,64rem)] max-w-none rounded-[8px] border border-[var(--sc-border)] bg-[var(--sc-surface)] p-0 text-[var(--sc-text)]"
    >
      {entry && (
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <TrackTag track={entry.track} />
              <h2 id="video-dialog-title" className="mt-1.5 text-lg font-bold leading-snug [overflow-wrap:anywhere] sm:text-xl">
                {entry.projectTitle}
              </h2>
              <p className="text-sm text-[var(--sc-muted)]">{entry.finalistName}</p>
            </div>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[6px] border border-[var(--sc-border)] hover:bg-[var(--sc-teal-soft)]"
              aria-label="Close video"
              autoFocus
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-4 aspect-video w-full overflow-hidden rounded-[6px] bg-black">
            {entry.videoEmbedUrl && (
              <iframe
                key={entry.id}
                src={entry.videoEmbedUrl}
                title={`Video: ${entry.projectTitle}, by ${entry.finalistName}`}
                className="h-full w-full"
                allow="fullscreen"
                referrerPolicy="strict-origin-when-cross-origin"
                loading="lazy"
              />
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-[var(--sc-muted)]">Video not loading? Google Drive can block embeds on some networks.</p>
            {entry.videoOpenUrl && (
              <a
                href={entry.videoOpenUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-[var(--sc-teal)] underline-offset-4 hover:underline"
              >
                Open video in Google Drive
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}

type Step = "review" | "email" | "code" | "confirm" | "done" | "already";

function BallotDialog({
  open,
  onClose,
  entries,
  selections,
  rule,
  voterState,
  onVerified,
  onRecorded,
}: {
  open: boolean;
  onClose: () => void;
  entries: PublicShowcaseEntry[];
  selections: BallotSelections;
  rule: typeof BALLOT_RULE;
  voterState: VoterState;
  onVerified: () => void;
  onRecorded: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [step, setStep] = useState<Step>("review");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      const frame = window.requestAnimationFrame(() => {
        setStep(voterState === "voted" ? "already" : "review");
        setError(null);
        setNotice(null);
      });
      dialog.showModal();
      return () => window.cancelAnimationFrame(frame);
    }
    if (!open && dialog.open) dialog.close();
  }, [open, voterState]);

  const chosen = SHOWCASE_TRACKS.map((track) => ({
    track,
    entry: entries.find((e) => e.id === selections[track]) ?? null,
  }));
  const missing = chosen.filter((c) => !c.entry).map((c) => TRACK_LABEL[c.track]);
  const complete = rule.requireEveryTrack ? missing.length === 0 : chosen.some((c) => c.entry);

  async function requestCode() {
    setBusy(true);
    setError(null);
    const res = await postJson("/api/showcase/cohort-one/request-code", { email });
    setBusy(false);
    if (!res.ok) {
      setError(String(res.data.error ?? "Could not send a code. Try again."));
      return;
    }
    setNotice(String(res.data.message ?? ""));
    setStep("code");
  }

  async function verifyCode() {
    setBusy(true);
    setError(null);
    const res = await postJson("/api/showcase/cohort-one/verify-code", { email, code });
    setBusy(false);
    if (!res.ok) {
      setError(String(res.data.error ?? "That code did not work."));
      return;
    }
    if (res.data.alreadyVoted) {
      setStep("already");
      onRecorded();
      return;
    }
    onVerified();
    setStep("confirm");
  }

  async function submit() {
    setBusy(true);
    setError(null);
    const payload = Object.fromEntries(chosen.filter((c) => c.entry).map((c) => [c.track, c.entry!.id]));
    const res = await postJson("/api/showcase/cohort-one/ballot", { selections: payload });
    setBusy(false);
    if (res.ok) {
      setStep("done");
      onRecorded();
      return;
    }
    if (res.data.alreadyVoted) {
      setStep("already");
      onRecorded();
      return;
    }
    if (res.status === 401) {
      setStep("email");
      setError("Your confirmation expired. Confirm your email again to submit.");
      return;
    }
    setError(String(res.data.error ?? "Your ballot was not recorded. Please try again."));
  }

  function handleClose() {
    onClose();
    returnFocus.current?.focus();
  }

  const titles: Record<Step, string> = {
    review: "Review your ballot",
    email: "Confirm you are on the Cohort One roll",
    code: "Enter your code",
    confirm: "Submit your final ballot",
    done: "Your ballot has been recorded.",
    already: "Your ballot has already been recorded.",
  };

  const primary =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] bg-[var(--sc-teal)] px-5 py-2.5 text-sm font-bold text-[var(--sc-teal-ink)] hover:bg-[var(--sc-teal-strong)] disabled:cursor-not-allowed disabled:opacity-50";
  const secondary =
    "inline-flex min-h-11 items-center justify-center rounded-[6px] border border-[var(--sc-border)] px-5 py-2.5 text-sm font-semibold hover:border-[var(--sc-teal)]";
  const field =
    "mt-1.5 block min-h-11 w-full rounded-[6px] border border-[var(--sc-border)] bg-[var(--sc-bg)] px-3 py-2 text-base text-[var(--sc-text)] placeholder:text-[var(--sc-muted)]";

  const SelectionList = (
    <ul className="mt-4 divide-y divide-[var(--sc-border)] border-y border-[var(--sc-border)]">
      {chosen.map(({ track, entry }) => (
        <li key={track} className="flex items-start gap-3 py-3">
          {entry ? (
            <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--sc-teal)]" aria-hidden="true" />
          ) : (
            <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-dashed border-[var(--sc-muted)]" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <TrackTag track={track} />
            <p className="mt-0.5 font-semibold [overflow-wrap:anywhere]">
              {entry ? entry.projectTitle : <span className="font-normal text-[var(--sc-muted)]">Not chosen yet</span>}
            </p>
            {entry && <p className="text-sm text-[var(--sc-muted)]">{entry.finalistName}</p>}
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <dialog
      ref={ref}
      onClose={handleClose}
      aria-labelledby="ballot-dialog-title"
      className="m-auto w-[min(100vw-2rem,34rem)] max-w-none rounded-[8px] border border-[var(--sc-border)] bg-[var(--sc-surface)] p-0 text-[var(--sc-text)]"
    >
      <div className="p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <h2 id="ballot-dialog-title" className="text-xl font-bold leading-snug">
            {titles[step]}
          </h2>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[6px] border border-[var(--sc-border)] hover:bg-[var(--sc-teal-soft)]"
            aria-label="Close ballot"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-4 border-l-[3px] border-[var(--sc-eh)] bg-[var(--sc-bg)] px-3 py-2 text-sm">
            {error}
          </p>
        )}

        {step === "review" && (
          <>
            <p className="mt-2 text-sm leading-relaxed text-[var(--sc-muted)]">
              One project per track. Once submitted, a ballot cannot be changed.
            </p>
            {SelectionList}
            {!complete && (
              <p className="mt-3 text-sm text-[var(--sc-text)]">Choose a project in {missing.join(", ")} to continue.</p>
            )}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" className={secondary} onClick={() => ref.current?.close()}>
                Keep browsing
              </button>
              <button
                type="button"
                className={primary}
                disabled={!complete}
                onClick={() => setStep(voterState === "verified" ? "confirm" : "email")}
                autoFocus
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === "email" && (
          <form
            className="mt-2"
            onSubmit={(e) => {
              e.preventDefault();
              void requestCode();
            }}
          >
            <p className="text-sm leading-relaxed text-[var(--sc-muted)]">
              Voting is limited to the original Cohort One admitted audience. Enter the email address UBI used to send your
              programme credentials and we will email you a one-time code.
            </p>
            <label htmlFor="voter-email" className="mt-5 block text-sm font-semibold">
              Email address
            </label>
            <input
              id="voter-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
              autoFocus
            />
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" className={secondary} onClick={() => setStep("review")}>
                Back
              </button>
              <button type="submit" className={primary} disabled={busy || !email}>
                {busy ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Mail className="h-4 w-4" aria-hidden="true" />}
                Email me a code
              </button>
            </div>
          </form>
        )}

        {step === "code" && (
          <form
            className="mt-2"
            onSubmit={(e) => {
              e.preventDefault();
              void verifyCode();
            }}
          >
            {notice && (
              <p role="status" className="text-sm leading-relaxed text-[var(--sc-muted)]">
                {notice}
              </p>
            )}
            <label htmlFor="voter-code" className="mt-5 block text-sm font-semibold">
              Six-digit code
            </label>
            <input
              id="voter-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className={`${field} font-mono tracking-[0.4em]`}
              autoFocus
            />
            <div className="mt-6 flex flex-wrap justify-between gap-3">
              <button
                type="button"
                className={secondary}
                onClick={() => {
                  setCode("");
                  setStep("email");
                }}
              >
                Use a different email
              </button>
              <button type="submit" className={primary} disabled={busy || code.length !== 6}>
                {busy ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <KeyRound className="h-4 w-4" aria-hidden="true" />}
                Confirm code
              </button>
            </div>
          </form>
        )}

        {step === "confirm" && (
          <>
            <p className="mt-2 text-sm leading-relaxed text-[var(--sc-muted)]">
              Check your choices. Submitting is final: your ballot cannot be edited afterwards.
            </p>
            {SelectionList}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" className={secondary} onClick={() => ref.current?.close()}>
                Change my choices
              </button>
              <button type="button" className={primary} disabled={busy || !complete} onClick={() => void submit()} autoFocus>
                {busy ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
                Submit my ballot
              </button>
            </div>
          </>
        )}

        {(step === "done" || step === "already") && (
          <>
            <p role="status" className="mt-3 text-sm leading-relaxed text-[var(--sc-muted)]">
              {step === "done"
                ? "Thank you for taking part in the Cohort One Finalist Showcase."
                : "Each eligible person may submit one ballot. Thank you for taking part."}
            </p>
            <div className="mt-6 flex justify-end">
              <button type="button" className={primary} onClick={() => ref.current?.close()} autoFocus>
                Back to the showcase
              </button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
