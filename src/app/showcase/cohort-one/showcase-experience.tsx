"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bug,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  ExternalLink,
  KeyRound,
  LoaderCircle,
  Mail,
  MousePointerClick,
  Play,
  Radar,
  Scale,
  Send,
  ShieldCheck,
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
// Fallback poster art when a video frame cannot load.
const TRACK_GRADIENT: Record<ShowcaseTrack, string> = {
  SOC_ANALYSIS: "linear-gradient(135deg,#0B1B2E 0%,#1D4ED8 100%)",
  ETHICAL_HACKING: "linear-gradient(135deg,#0B1B2E 0%,#BE123C 100%)",
  GRC: "linear-gradient(135deg,#0B1B2E 0%,#6D28D9 100%)",
};
const TRACK_BLURB: Record<ShowcaseTrack, string> = {
  SOC_ANALYSIS: "Detection, investigation and evidence you can defend.",
  ETHICAL_HACKING: "Finding the weaknesses before someone else does.",
  GRC: "Turning risk and compliance into decisions people can act on.",
};
const TABS: { id: Tab; label: string }[] = [
  { id: "ALL", label: "All finalists" },
  ...SHOWCASE_TRACKS.map((t) => ({ id: t as Tab, label: TRACK_LABEL[t] })),
];

const PHASE_NOTICE: Record<Exclude<Phase, "OPEN">, string> = {
  DRAFT: "Voting opens soon. You can watch every project now.",
  SCHEDULED: "Voting opens soon. You can watch every project now.",
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

function TrackTag({ track, onDark = false }: { track: ShowcaseTrack; onDark?: boolean }) {
  const Icon = TRACK_ICON[track];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] ${
        onDark ? "bg-white/15 text-white backdrop-blur-md" : "bg-[var(--sc-glass-strong)]"
      }`}
      style={onDark ? undefined : { color: TRACK_COLOR[track] }}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {TRACK_LABEL[track]}
    </span>
  );
}

// The video's own poster frame from Drive, with a track-coloured fallback.
function Poster({ entry }: { entry: PublicShowcaseEntry }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="absolute inset-0" style={{ background: TRACK_GRADIENT[entry.track] }} aria-hidden="true">
      {entry.thumbnailUrl && !failed && (
        // eslint-disable-next-line @next/next/no-img-element -- remote Drive frame, CSP-scoped to this route
        <img
          src={entry.thumbnailUrl}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      )}
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
  const railRef = useRef<HTMLUListElement>(null);
  const storageKey = `ubi-showcase-ballot:${seed}`;

  const votingOpen = phase === "OPEN" && voterState !== "voted";

  useEffect(() => {
    if (persistSeed) document.cookie = `ubi_showcase_seed=${seed}; path=/showcase; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  }, [persistSeed, seed]);

  // Draft choices survive a reload in this tab only and never leave the
  // device until the ballot is submitted.
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

  function scrollRail(direction: 1 | -1) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * Math.max(280, rail.clientWidth * 0.8), behavior: "smooth" });
  }

  const visibleTracks = tab === "ALL" ? SHOWCASE_TRACKS : [tab];
  const chosenCount = SHOWCASE_TRACKS.filter((t) => selections[t]).length;
  const tracksWithEntries = SHOWCASE_TRACKS.filter((t) => entries.some((e) => e.track === t));
  const deadline = closesAt
    ? new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(closesAt))
    : null;
  const statusLine =
    phase === "OPEN"
      ? voterState === "voted"
        ? "Your ballot has been recorded. Thank you."
        : `Voting is open to the original Cohort One audience${deadline ? ` until ${deadline} (WAT)` : ""}.`
      : PHASE_NOTICE[phase];

  return (
    <div className="showcase-page min-h-screen overflow-x-clip">
      <div className="sc-mesh" aria-hidden="true" />
      <a
        href="#finalists"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-[#0B1B2E]"
      >
        Skip to the finalists
      </a>

      {adminPreview && (
        <p role="status" className="bg-[var(--sc-gold-line)] px-4 py-2 text-center text-sm font-semibold text-[#1A1200]">
          Admin preview. This showcase is not published, so the public cannot see this page.
        </p>
      )}

      {/* Floating glass navigation */}
      <header className="sticky top-3 z-40 px-3 sm:px-6">
        <nav className="sc-glass mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full py-2 pl-4 pr-2" aria-label="Showcase">
          <Link href="/" className="flex min-w-0 items-center gap-2 text-sm font-semibold" aria-label="Ubuntu Bridge Initiative home">
            <LogoMark size={22} />
            <span className="truncate">
              <span className="hidden sm:inline">Ubuntu Bridge Initiative</span>
              <span className="sm:hidden">UBI</span>
            </span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <a href="#finalists" className="hidden rounded-full px-3 py-2 text-sm font-medium text-[var(--sc-muted)] hover:text-[var(--sc-text)] md:inline-flex">
              Finalists
            </a>
            <a href="#how-to-vote" className="hidden rounded-full px-3 py-2 text-sm font-medium text-[var(--sc-muted)] hover:text-[var(--sc-text)] md:inline-flex">
              How to vote
            </a>
            <ThemeToggle />
            {votingOpen && (
              <a
                href="#finalists"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[var(--sc-teal)] px-4 text-sm font-bold text-[var(--sc-teal-ink)] shadow-lg shadow-teal-700/20 hover:bg-[var(--sc-teal-strong)]"
              >
                Vote now
              </a>
            )}
          </div>
        </nav>
      </header>

      <main>
        {/* ── Hero: headline beside a collage of real UBI programme photos ── */}
        <section aria-labelledby="showcase-title" className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-20">
          <div>
            <p className="inline-flex max-w-full items-center gap-2 rounded-lg bg-[var(--sc-navy)] px-3 py-1.5 font-mono text-xs text-white/90 shadow-lg shadow-slate-900/15 dark:bg-white/10">
              <span className="text-[#5EEAD4]" aria-hidden="true">ubi@cohort-one:~$</span>
              <span className="truncate">./finalists --showcase</span>
              <span className="inline-block h-3.5 w-1.5 animate-pulse bg-[#5EEAD4]" aria-hidden="true" />
              <span className="sr-only">Ubuntu Bridge Initiative · Cohort One</span>
            </p>
            <h1 id="showcase-title" className="mt-6 text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
              Cohort One <span className="sc-mark">Finalist Showcase</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-[var(--sc-muted)] sm:text-xl">
              Built under pressure. Explained in two minutes. Ten people, three tracks, one final showcase.
            </p>

            <dl className="mt-8 grid max-w-md grid-cols-3 gap-3">
              {[
                [String(entries.length), "finalists"],
                [String(tracksWithEntries.length), "tracks"],
                ["1", "final showcase"],
              ].map(([value, label]) => (
                <div key={label} className="sc-glass rounded-2xl px-4 py-3">
                  <dt className="sr-only">{label}</dt>
                  <dd>
                    <span className="block text-3xl font-extrabold tracking-tight">{value}</span>
                    <span className="text-xs font-medium text-[var(--sc-muted)]">{label}</span>
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#finalists"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--sc-navy)] px-6 text-sm font-bold text-white shadow-xl shadow-slate-900/20 transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-[#0B1B2E]"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                Watch the projects
              </a>
              {votingOpen ? (
                <a
                  href="#how-to-vote"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--sc-teal)] px-6 text-sm font-bold text-[var(--sc-teal-ink)] shadow-xl shadow-teal-700/25 transition-transform hover:-translate-y-0.5"
                >
                  Cast your vote
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : (
                <a href="#how-to-vote" className="sc-glass inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-sm font-bold">
                  How voting works
                </a>
              )}
            </div>
            <p role="status" className="mt-5 text-sm text-[var(--sc-muted)]">
              {statusLine}
            </p>
          </div>

          {/* Collage */}
          <div className="relative order-first mx-auto aspect-[5/4] w-full max-w-[560px] lg:order-none">
            <figure className="absolute left-0 top-0 h-[78%] w-[78%] overflow-hidden rounded-[28px] shadow-2xl shadow-slate-900/25 ring-1 ring-white/60">
              <Image
                src="/images/programs/workshops.jpg"
                alt="A UBI community cybersecurity workshop: a facilitator presents to a seated audience"
                fill
                priority
                sizes="(min-width: 1024px) 440px, 78vw"
                className="object-cover object-[70%_40%]"
              />
            </figure>
            <figure className="absolute bottom-0 right-0 h-[52%] w-[52%] overflow-hidden rounded-[24px] shadow-2xl shadow-slate-900/30 ring-4 ring-[var(--sc-bg)]">
              <Image
                src="/images/programs/mentorship.jpg"
                alt="A UBI cybersecurity mentorship session"
                fill
                sizes="(min-width: 1024px) 290px, 52vw"
                className="object-cover"
              />
            </figure>
            <div className="sc-glass-strong absolute bottom-[8%] left-[4%] flex items-center gap-3 rounded-2xl px-4 py-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--sc-navy)] text-[#5EEAD4] dark:bg-white/10">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-bold">Nine stages survived</span>
                <span className="block text-xs text-[var(--sc-muted)]">One project each to show for it</span>
              </span>
            </div>
            <div className="sc-glass-strong absolute right-[2%] top-[6%] rounded-2xl px-4 py-3 text-right">
              <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--sc-muted)]">Tracks</span>
              <span className="mt-1 flex gap-1.5">
                {SHOWCASE_TRACKS.map((t) => {
                  const Icon = TRACK_ICON[t];
                  return (
                    <span key={t} title={TRACK_LABEL[t]} className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--sc-glass-strong)]" style={{ color: TRACK_COLOR[t] }}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">{TRACK_LABEL[t]}</span>
                    </span>
                  );
                })}
              </span>
            </div>
          </div>
        </section>

        {/* ── All ten at a glance: one swipeable rail ── */}
        {entries.length > 0 && (
          <section aria-labelledby="glance-heading" className="pb-16">
            <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-4 sm:px-6">
              <div>
                <h2 id="glance-heading" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                  All ten finalists, one scroll
                </h2>
                <p className="mt-1 text-sm text-[var(--sc-muted)]">Swipe or scroll sideways. Tap any project to watch it.</p>
              </div>
              <div className="hidden gap-2 sm:flex">
                <button type="button" onClick={() => scrollRail(-1)} className="sc-glass flex h-11 w-11 items-center justify-center rounded-full" aria-label="Scroll finalists left">
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => scrollRail(1)} className="sc-glass flex h-11 w-11 items-center justify-center rounded-full" aria-label="Scroll finalists right">
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
            <ul
              ref={railRef}
              className="sc-rail mt-6 flex gap-4 overflow-x-auto pb-4"
              aria-label="All finalists"
            >
              {entries.map((entry) => (
                <li key={entry.id} className="w-[78vw] max-w-[300px] shrink-0">
                  <button
                    type="button"
                    onClick={() => (entry.videoEmbedUrl ? setPlaying(entry) : document.getElementById(entry.slug)?.scrollIntoView({ behavior: "smooth" }))}
                    className="group sc-glass block w-full overflow-hidden rounded-3xl text-left"
                    aria-label={`Watch ${entry.projectTitle}, by ${entry.finalistName}`}
                  >
                    <span className="relative block aspect-video overflow-hidden">
                      <Poster entry={entry} />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" aria-hidden="true" />
                      <span className="absolute left-3 top-3">
                        <TrackTag track={entry.track} onDark />
                      </span>
                      <span className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-white ring-1 ring-white/50 backdrop-blur-md transition-transform group-hover:scale-110">
                        <Play className="ml-0.5 h-4 w-4" aria-hidden="true" />
                      </span>
                    </span>
                    <span className="block p-4">
                      <span className="line-clamp-2 block min-h-[2.75rem] font-bold leading-snug">{entry.projectTitle}</span>
                      <span className="mt-1 block text-sm text-[var(--sc-muted)]">{entry.finalistName}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── How to vote ── */}
        <section id="how-to-vote" aria-labelledby="how-heading" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-16 sm:px-6">
          <div className="sc-glass rounded-[32px] p-6 sm:p-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="how-heading" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                How voting works
              </h2>
              <p className="text-sm font-medium text-[var(--sc-muted)]">{statusLine}</p>
            </div>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                { icon: MousePointerClick, title: "Choose one per track", body: "Watch the videos, then press “Choose this project” on one finalist in SOC Analysis, Ethical Hacking and GRC." },
                { icon: Mail, title: "Confirm your email", body: "Enter the email UBI used for your Cohort One credentials. We send a six-digit code that works once." },
                { icon: Send, title: "Submit your ballot", body: "Check your three choices and submit. One ballot per person, and it cannot be changed afterwards." },
              ].map((step, i) => (
                <li key={step.title} className="sc-glass-strong relative overflow-hidden rounded-3xl p-6">
                  <span className="absolute -right-2 -top-6 text-[7rem] font-black leading-none text-[var(--sc-teal)] opacity-[0.08]" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--sc-navy)] text-[#5EEAD4] dark:bg-white/10 shadow-lg shadow-teal-700/20">
                    <step.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold">
                    <span className="sr-only">Step {i + 1}: </span>
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--sc-muted)]">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Finalists by track ── */}
        <section id="finalists" aria-labelledby="finalists-heading" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-36 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="finalists-heading" className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Meet the finalists
              </h2>
              <p className="mt-2 max-w-xl text-[var(--sc-muted)]">
                Each finalist built something of their own and explained it in plain English. Judge the work on its own terms.
              </p>
            </div>
          </div>

          <div role="tablist" aria-label="Filter by track" className="sc-glass mt-8 inline-flex max-w-full gap-1 overflow-x-auto rounded-full p-1.5">
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
                  className={`min-h-10 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors ${
                    selected
                      ? "bg-[var(--sc-navy)] text-white shadow-md dark:bg-white dark:text-[#0B1B2E]"
                      : "text-[var(--sc-muted)] hover:text-[var(--sc-text)]"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div id="track-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-10 space-y-16">
            {entries.length === 0 && (
              <p className="sc-glass rounded-3xl p-6 text-[var(--sc-muted)]">The finalist projects are being prepared. Please check back soon.</p>
            )}
            {visibleTracks.map((track) => {
              const trackEntries = entries.filter((e) => e.track === track);
              if (trackEntries.length === 0) return null;
              const Icon = TRACK_ICON[track];
              return (
                <section key={track} aria-labelledby={`heading-${track}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="sc-glass-strong flex h-12 w-12 items-center justify-center rounded-2xl" style={{ color: TRACK_COLOR[track] }}>
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 id={`heading-${track}`} className="text-xl font-extrabold tracking-tight">
                          {TRACK_LABEL[track]}
                        </h3>
                        <p className="text-sm text-[var(--sc-muted)]">{TRACK_BLURB[track]}</p>
                      </div>
                    </div>
                    <p className="sc-glass rounded-full px-3 py-1 text-xs font-semibold text-[var(--sc-muted)]">
                      {trackEntries.length} finalists{votingOpen && rule.selectionsPerTrack === 1 ? " · choose one" : ""}
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

        {/* ── Closing ── */}
        <section aria-labelledby="closing-heading" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="relative isolate overflow-hidden rounded-[32px] bg-[#0B1B2E] px-6 py-14 text-white sm:px-12">
            <Image src="/images/programs/tech-spotlight.jpg" alt="" fill sizes="(min-width: 1152px) 1152px, 100vw" className="-z-10 object-cover opacity-30" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0B1B2E] via-[#0B1B2E]/85 to-[#0B1B2E]/40" aria-hidden="true" />
            <h2 id="closing-heading" className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
              Public choice is one part of the final showcase.
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-white/80">
              Every finalist reached this point through the programme&rsquo;s own assessed stages. The Cohort One ballot lets the community that
              started this journey together recognise the work it found most compelling. Individual ballots stay private, and no live tallies are
              published.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-white/15 px-6 font-semibold text-white ring-1 ring-white/30 backdrop-blur-md hover:bg-white/25"
            >
              Visit the Ubuntu Bridge Initiative
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      {/* Floating ballot dock */}
      {votingOpen && entries.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-3">
          <div className="sc-glass-strong flex w-full max-w-2xl items-center justify-between gap-3 rounded-full py-2 pl-4 pr-2 sm:pl-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="hidden text-sm font-bold sm:inline">Your ballot</span>
              <ul className="flex gap-1.5" aria-label="Tracks chosen">
                {SHOWCASE_TRACKS.map((t) => {
                  const Icon = TRACK_ICON[t];
                  const done = Boolean(selections[t]);
                  return (
                    <li
                      key={t}
                      className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${done ? "text-white" : "bg-[var(--sc-teal-soft)] text-[var(--sc-muted)]"}`}
                      style={done ? { background: TRACK_COLOR[t] } : undefined}
                    >
                      {done ? <Check className="h-4 w-4" aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
                      <span className="sr-only">
                        {TRACK_LABEL[t]}: {done ? "chosen" : "not chosen"}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <span className="text-sm text-[var(--sc-muted)]" aria-live="polite">
                {chosenCount} of {SHOWCASE_TRACKS.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setBallotOpen(true)}
              disabled={chosenCount === 0}
              className="min-h-11 rounded-full bg-[var(--sc-teal)] px-5 text-sm font-bold text-[var(--sc-teal-ink)] shadow-lg shadow-teal-700/25 transition-colors hover:bg-[var(--sc-teal-strong)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Review &amp; vote
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
  const long = entry.projectSummary.length > 300;

  return (
    <article
      id={entry.slug}
      aria-labelledby={`${summaryId}-title`}
      className={`sc-glass flex h-full scroll-mt-28 flex-col overflow-hidden rounded-[28px] transition-shadow ${
        chosen ? "ring-[3px] ring-[var(--sc-teal)]" : ""
      }`}
    >
      {entry.videoEmbedUrl ? (
        <button
          type="button"
          onClick={onPlay}
          className="group relative block aspect-video w-full overflow-hidden"
          aria-label={`Play video: ${entry.projectTitle}, by ${entry.finalistName}`}
        >
          <Poster entry={entry} />
          <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" aria-hidden="true" />
          <span className="absolute left-4 top-4">
            <TrackTag track={entry.track} onDark />
          </span>
          {chosen && (
            <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-[var(--sc-teal)] px-2.5 py-1 text-xs font-bold text-[var(--sc-teal-ink)]">
              <Check className="h-3.5 w-3.5" aria-hidden="true" /> Your pick
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/25 text-white ring-1 ring-white/60 backdrop-blur-md transition-transform group-hover:scale-110">
              <Play className="ml-1 h-7 w-7" />
            </span>
          </span>
          <span className="absolute bottom-3 left-4 text-xs font-semibold text-white/90">Watch the two-minute explainer</span>
        </button>
      ) : (
        <div className="relative flex aspect-video w-full items-center justify-center px-6 text-center text-sm text-white/85" style={{ background: TRACK_GRADIENT[entry.track] }}>
          This video is being checked and will be available shortly.
        </div>
      )}

      <div className="flex flex-1 flex-col p-6">
        <h4 id={`${summaryId}-title`} className="text-xl font-extrabold leading-snug tracking-tight [overflow-wrap:anywhere]">
          {entry.projectTitle}
        </h4>
        <p className="mt-1.5 text-sm font-semibold text-[var(--sc-gold)]">{entry.finalistName}</p>
        <p
          id={summaryId}
          className={`mt-4 whitespace-pre-line text-[15px] leading-relaxed text-[var(--sc-muted)] [overflow-wrap:anywhere] ${expanded || !long ? "" : "line-clamp-4"}`}
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
          {canChoose && (
            <button
              type="button"
              onClick={onChoose}
              aria-pressed={chosen}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-5 text-sm font-bold transition-all ${
                chosen
                  ? "bg-[var(--sc-teal)] text-[var(--sc-teal-ink)] shadow-lg shadow-teal-700/25 hover:bg-[var(--sc-teal-strong)]"
                  : "bg-[var(--sc-navy)] text-white hover:-translate-y-0.5 dark:bg-white dark:text-[#0B1B2E]"
              }`}
            >
              {chosen ? <CircleCheck className="h-4 w-4" aria-hidden="true" /> : null}
              {chosen ? "Chosen" : "Choose this project"}
              <span className="sr-only"> in {TRACK_LABEL[entry.track]}</span>
            </button>
          )}
          {entry.projectUrl ? (
            <a
              href={entry.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="sc-glass-strong inline-flex min-h-11 items-center gap-1.5 rounded-full px-5 text-sm font-semibold hover:text-[var(--sc-teal)]"
            >
              Open project
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          ) : (
            <span className="text-sm text-[var(--sc-muted)]">Project link under review</span>
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
      className="sc-glass-strong m-auto w-[min(100vw-1.5rem,64rem)] max-w-none rounded-[28px] p-0 text-[var(--sc-text)]"
    >
      {entry && (
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: TRACK_COLOR[entry.track] }}>
                {TRACK_LABEL[entry.track]}
              </span>
              <h2 id="video-dialog-title" className="mt-1 text-lg font-extrabold leading-snug [overflow-wrap:anywhere] sm:text-xl">
                {entry.projectTitle}
              </h2>
              <p className="text-sm text-[var(--sc-muted)]">{entry.finalistName}</p>
            </div>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="sc-glass flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              aria-label="Close video"
              autoFocus
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-4 aspect-video w-full overflow-hidden rounded-2xl bg-black">
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
  const stepIndex = { review: 0, email: 1, code: 1, confirm: 2, done: 3, already: 3 }[step];

  const primary =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--sc-teal)] px-5 text-sm font-bold text-[var(--sc-teal-ink)] shadow-lg shadow-teal-700/25 hover:bg-[var(--sc-teal-strong)] disabled:cursor-not-allowed disabled:opacity-50";
  const secondary = "sc-glass inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold";
  const field =
    "mt-1.5 block min-h-12 w-full rounded-2xl border border-[var(--sc-line)] bg-[var(--sc-glass-strong)] px-4 py-2 text-base text-[var(--sc-text)] placeholder:text-[var(--sc-muted)]";

  const SelectionList = (
    <ul className="mt-5 space-y-2">
      {chosen.map(({ track, entry }) => (
        <li key={track} className="sc-glass flex items-start gap-3 rounded-2xl p-3">
          <span className="relative h-12 w-20 shrink-0 overflow-hidden rounded-xl" style={{ background: TRACK_GRADIENT[track] }}>
            {entry && <Poster entry={entry} />}
          </span>
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: TRACK_COLOR[track] }}>
              {TRACK_LABEL[track]}
            </span>
            <p className="font-semibold leading-snug [overflow-wrap:anywhere]">
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
      className="sc-glass-strong m-auto w-[min(100vw-1.5rem,34rem)] max-w-none rounded-[28px] p-0 text-[var(--sc-text)]"
    >
      <div className="p-5 sm:p-7">
        <div className="flex gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= Math.min(stepIndex, 2) ? "bg-[var(--sc-teal)]" : "bg-[var(--sc-teal-soft)]"}`} />
          ))}
        </div>
        <div className="mt-5 flex items-start justify-between gap-4">
          <h2 id="ballot-dialog-title" className="text-xl font-extrabold leading-snug tracking-tight">
            {titles[step]}
          </h2>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="sc-glass flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            aria-label="Close ballot"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-2xl border border-rose-300/60 bg-rose-500/10 px-4 py-3 text-sm">
            {error}
          </p>
        )}

        {step === "review" && (
          <>
            <p className="mt-2 text-sm leading-relaxed text-[var(--sc-muted)]">One project per track. Once submitted, a ballot cannot be changed.</p>
            {SelectionList}
            {!complete && <p className="mt-3 text-sm">Choose a project in {missing.join(", ")} to continue.</p>}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" className={secondary} onClick={() => ref.current?.close()}>
                Keep browsing
              </button>
              <button type="button" className={primary} disabled={!complete} onClick={() => setStep(voterState === "verified" ? "confirm" : "email")} autoFocus>
                Continue
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
              Voting is limited to the original Cohort One admitted audience. Enter the email address UBI used to send your programme credentials and we
              will email you a one-time code.
            </p>
            <label htmlFor="voter-email" className="mt-5 block text-sm font-semibold">
              Email address
            </label>
            <input id="voter-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} autoFocus />
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
              className={`${field} text-center font-mono text-2xl tracking-[0.5em]`}
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
            <p className="mt-2 text-sm leading-relaxed text-[var(--sc-muted)]">Check your choices. Submitting is final: your ballot cannot be edited afterwards.</p>
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
          <div className="mt-4 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--sc-navy)] text-[#5EEAD4] dark:bg-white/10 shadow-xl shadow-teal-700/25">
              <Check className="h-8 w-8" aria-hidden="true" />
            </span>
            <p role="status" className="mt-4 text-sm leading-relaxed text-[var(--sc-muted)]">
              {step === "done" ? "Thank you for taking part in the Cohort One Finalist Showcase." : "Each eligible person may submit one ballot. Thank you for taking part."}
            </p>
            <div className="mt-6 flex justify-center">
              <button type="button" className={primary} onClick={() => ref.current?.close()} autoFocus>
                Back to the showcase
              </button>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
