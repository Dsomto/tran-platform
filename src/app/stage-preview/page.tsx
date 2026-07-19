import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BookOpenCheck,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Crosshair,
  FileCheck2,
  FlaskConical,
  FolderKey,
  Gauge,
  GraduationCap,
  Layers3,
  LifeBuoy,
  LockKeyhole,
  Radar,
  Scale,
  ShieldCheck,
  Sparkles,
  Terminal,
  TestTube2,
} from "lucide-react";
import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import {
  ADVANCED_PROJECTS,
  ADVANCED_STAGE_META,
  ADVANCED_TRACK_OUTCOMES,
  advancedTrackLabel,
  type AdvancedTrack,
} from "@/lib/advanced-stage";
import { ADVANCED_TRACK_VISUALS } from "@/lib/advanced-visuals";

export const metadata = {
  title: "Advanced Programme — Stages 5–9",
  description:
    "The advanced programme of The Root Access Network. Five connected, production-shaped projects in your assigned cybersecurity track — SOC, Ethical Hacking / VAPT, or GRC.",
};

type TrackPreview = {
  key: AdvancedTrack;
  slug: "soc" | "ethical-hacking" | "grc";
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  feed: string[];
};

const TRACKS: TrackPreview[] = [
  {
    key: "SOC_ANALYSIS",
    slug: "soc",
    shortLabel: "SOC",
    description:
      "Detection, infrastructure, and incident-response engineering — from raw telemetry to a reconstructed breach.",
    icon: Radar,
    feed: ["schema.v3 accepted", "campaign graph ready", "sealed replay deterministic"],
  },
  {
    key: "ETHICAL_HACKING",
    slug: "ethical-hacking",
    shortLabel: "VAPT",
    description:
      "Authorized offensive work with strict scope, repeatable proof, and remediation you can retest.",
    icon: Crosshair,
    feed: ["scope guard active", "chain executed from clean state", "cleanup proof emitted"],
  },
  {
    key: "GRC",
    slug: "grc",
    shortLabel: "GRC",
    description:
      "Executable governance — every policy, audit verdict, risk decision, and legal clock survives a machine test.",
    icon: Scale,
    feed: ["exception expiry enforced", "malformed state fails closed", "control report generated"],
  },
];

const LEARNING_MODEL = [
  {
    number: "01",
    title: "Learn through a real operating problem",
    copy: "Every stage opens with a case, constraints, an assigned environment, and a result that has to work — not a list of videos to finish.",
    icon: GraduationCap,
  },
  {
    number: "02",
    title: "Build the system, not just the report",
    copy: "You write the parser, policy, lab, test harness, detection, or decision engine behind the conclusion you submit.",
    icon: FlaskConical,
  },
  {
    number: "03",
    title: "Prove every material claim",
    copy: "Raw artifacts, exact locators, manifests, public fixtures, clean builds, and holdout checks make the work independently reproducible.",
    icon: FileCheck2,
  },
  {
    number: "04",
    title: "Carry the capability forward",
    copy: "Each project reuses and extends earlier interfaces, evidence models, and tests so the final case shows progression — not five disconnected tasks.",
    icon: ShieldCheck,
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
    copy: "An identity-bound overlay, evidence marker, archive, and variant facts issued only to the learner on that track.",
  },
  {
    icon: Boxes,
    title: "Starter kits and schemas",
    copy: "Pinned interfaces, safe scaffolds, data contracts, and templates that remove ambiguity without supplying the solution.",
  },
  {
    icon: TestTube2,
    title: "Fixtures and acceptance tests",
    copy: "Published positive, negative, malformed-input, safety, and regression cases so you can check work before submission.",
  },
  {
    icon: FileCheck2,
    title: "Evidence and manifest templates",
    copy: "Structured records for claims, raw-artifact locators, clean-build commands, versions, hashes, runtimes, and test results.",
  },
  {
    icon: LifeBuoy,
    title: "Defense-readiness guide",
    copy: "A practical checklist for rebuilding from a clean state, navigating evidence quickly, and handling a challenge task.",
  },
];

const STAGE_ORDER = ["STAGE_5", "STAGE_6", "STAGE_7", "STAGE_8", "STAGE_9"] as const;

export default function AdvancedProgrammeLanding() {
  return (
    <div className="landing-page bg-background text-foreground">
      <a
        href="#tracks"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-blue focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to programme content
      </a>

      {/* ── Header ───────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border/60 bg-surface/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <LogoMark size={26} />
            <span className="font-bold tracking-tight text-foreground">UBI</span>
            <span className="hidden sm:inline-flex items-center text-[10px] font-semibold uppercase tracking-[0.14em] text-blue border border-blue/30 rounded-full px-2.5 py-1">
              Advanced
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted" aria-label="Programme sections">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#progression" className="hover:text-foreground transition-colors">Progression</a>
            <a href="#tracks" className="hover:text-foreground transition-colors">Tracks</a>
            <a href="#resources" className="hover:text-foreground transition-colors">Resources</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-blue px-4 sm:px-5 py-2.5 rounded-full hover:bg-blue-dark transition-all hover:shadow-lg hover:shadow-blue/20"
            >
              Sign in
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="relative min-h-[100svh] flex items-center bg-background bg-scan overflow-hidden pt-16">
          <div className="crosshair top-[20%] right-[14%] hidden lg:block" aria-hidden="true" />
          <div className="crosshair bottom-[24%] right-[30%] hidden lg:block" aria-hidden="true" />
          <div className="orb orb-blue w-[420px] h-[420px] top-[8%] right-[16%] hidden lg:block" aria-hidden="true" />
          <div className="orb orb-cyan w-[220px] h-[220px] bottom-[12%] left-[4%] hidden lg:block" style={{ animationDelay: "-5s" }} aria-hidden="true" />
          <div className="absolute top-[16%] right-[9%] w-16 h-16 border border-blue/10 rounded-2xl rotate-12 float-slow hidden lg:block" aria-hidden="true" />
          <div className="ring-dashed w-[130px] h-[130px] top-[58%] left-[9%] ring-spin hidden lg:block" aria-hidden="true" />
          <div className="hex-grid" aria-hidden="true" />

          {/* Constellation */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            <svg className="absolute top-0 right-0 w-[52%] h-full opacity-70 hidden lg:block" viewBox="0 0 700 900" fill="none">
              <line x1="180" y1="120" x2="380" y2="220" stroke="rgba(37,99,235,0.12)" strokeWidth="1" />
              <line x1="380" y1="220" x2="550" y2="150" stroke="rgba(37,99,235,0.08)" strokeWidth="1" />
              <line x1="380" y1="220" x2="320" y2="400" stroke="rgba(37,99,235,0.12)" strokeWidth="1" />
              <line x1="320" y1="400" x2="500" y2="350" stroke="rgba(37,99,235,0.08)" strokeWidth="1" />
              <line x1="500" y1="350" x2="580" y2="500" stroke="rgba(37,99,235,0.1)" strokeWidth="1" />
              <line x1="320" y1="400" x2="180" y2="520" stroke="rgba(37,99,235,0.08)" strokeWidth="1" />
              <line x1="180" y1="520" x2="280" y2="650" stroke="rgba(37,99,235,0.1)" strokeWidth="1" />
              <path d="M180,120 L380,220 L500,350 L580,500 L460,580" stroke="rgba(37,99,235,0.18)" strokeWidth="1.5" strokeDasharray="5 5">
                <animate attributeName="stroke-dashoffset" values="0;-20" dur="4s" repeatCount="indefinite" />
              </path>
              <circle cx="380" cy="220" r="4" fill="#2563EB" opacity="0.3">
                <animate attributeName="opacity" values="0.3;0.5;0.3" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="380" cy="220" r="14" stroke="#2563EB" strokeWidth="1" fill="none" opacity="0.08">
                <animate attributeName="r" values="14;20;14" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="320" cy="400" r="3.5" fill="#2563EB" opacity="0.25">
                <animate attributeName="opacity" values="0.25;0.45;0.25" dur="2.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="580" cy="500" r="4" fill="#2563EB" opacity="0.3">
                <animate attributeName="opacity" values="0.3;0.5;0.3" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="180" cy="120" r="3" fill="#2563EB" opacity="0.22" />
              <circle cx="550" cy="150" r="2.5" fill="#2563EB" opacity="0.2" />
              <circle cx="500" cy="350" r="2.5" fill="#2563EB" opacity="0.2" />
              <circle cx="280" cy="650" r="3" fill="#2563EB" opacity="0.2" />
            </svg>
          </div>

          <div className="relative z-[1] max-w-6xl mx-auto px-5 sm:px-8 py-20 w-full">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
              <div>
                <span className="inline-flex items-center gap-2 text-xs font-medium text-blue tracking-[0.14em] uppercase mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue animate-pulse" aria-hidden="true" />
                  The Root Access Network · Advanced Stages 5–9
                </span>

                <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.06] text-foreground">
                  Build the work.
                  <br />
                  <span className="text-blue">Prove you can own it.</span>
                </h1>

                <p className="mt-6 text-base sm:text-lg text-muted leading-relaxed max-w-xl">
                  Beyond the guided stages sit five connected, production-shaped projects in
                  your assigned track. You build working systems, test them under adverse
                  conditions, and defend the evidence behind every decision you make.
                </p>

                <div className="mt-10 flex flex-wrap gap-3">
                  <a
                    href="#tracks"
                    className="group inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue px-7 py-3.5 rounded-full hover:bg-blue-dark transition-all hover:shadow-lg hover:shadow-blue/20"
                  >
                    Explore the tracks
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                  </a>
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center text-sm font-medium text-foreground border border-border px-7 py-3.5 rounded-full hover:bg-surface-hover transition-colors"
                  >
                    How it works
                  </a>
                </div>

                <dl className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3" aria-label="Programme overview">
                  {[
                    ["03", "Specialist tracks"],
                    ["05", "Linked projects each"],
                    ["15", "Mission pages"],
                    ["01", "Defensible portfolio"],
                  ].map(([value, label]) => (
                    <div key={label} className="glass-card rounded-xl px-4 py-3">
                      <dt className="sr-only">{label}</dt>
                      <dd className="text-2xl font-bold text-foreground tracking-tight leading-none">{value}</dd>
                      <dd className="mt-1.5 text-[10px] text-muted font-medium uppercase tracking-wider">{label}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Ops console visual */}
              <div className="hidden lg:block">
                <div className="glass-card-elevated rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60 bg-surface/60">
                    <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <Terminal className="w-3.5 h-3.5 text-blue" aria-hidden="true" />
                      case-desk · live
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose/70" />
                      <span className="w-2 h-2 rounded-full bg-amber/70" />
                      <span className="w-2 h-2 rounded-full bg-emerald/70" />
                    </span>
                  </div>
                  <div className="p-5 space-y-3.5">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        ["5.8M", "events", "text-cyan"],
                        ["3/3", "chain runs", "text-amber"],
                        ["0Δ", "drift", "text-emerald"],
                      ].map(([metric, label, tone]) => (
                        <div key={label} className="rounded-lg border border-border/60 bg-surface/50 px-3 py-2.5">
                          <div className={`text-lg font-bold tracking-tight ${tone}`}>{metric}</div>
                          <div className="text-[10px] text-muted uppercase tracking-wider">{label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/40 p-4 font-mono text-[11px] leading-relaxed space-y-1.5">
                      {[
                        ["ok", "acquisition hashes verified"],
                        ["ok", "source clocks corrected"],
                        ["run", "campaign graph → reconstructing"],
                        ["ok", "benign suite remains quiet"],
                        ["seal", "evidence manifest sealed"],
                      ].map(([tag, line], i) => (
                        <div key={line} className="flex items-center gap-2.5">
                          <span
                            className={`shrink-0 w-9 text-center text-[9px] font-semibold uppercase rounded px-1 py-0.5 ${
                              tag === "run"
                                ? "bg-amber/15 text-amber"
                                : tag === "seal"
                                  ? "bg-violet/15 text-violet"
                                  : "bg-emerald/15 text-emerald"
                            }`}
                          >
                            {tag}
                          </span>
                          <span className="text-muted">{line}</span>
                          {i === 2 && <span className="w-1.5 h-3 bg-blue/70 animate-pulse ml-0.5" aria-hidden="true" />}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="flex items-center gap-1.5 text-[11px] text-muted">
                        <FolderKey className="w-3.5 h-3.5" aria-hidden="true" />
                        identity-bound case pack
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald">
                        <Activity className="w-3.5 h-3.5" aria-hidden="true" />
                        reproducible
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted text-center max-w-sm mx-auto">
                  Learners see only the track and case material assigned to their account.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Toolkit marquee ────────────────────────────────── */}
        <div className="py-5 border-y border-border/60 bg-surface/80 overflow-hidden" aria-hidden="true">
          <div className="marquee-track">
            <div className="marquee-content">
              {[
                ["Python", "bg-blue/40"], ["DuckDB", "bg-cyan/40"], ["T-Pot", "bg-amber/40"],
                ["containerlab", "bg-emerald/40"], ["Zeek / Suricata", "bg-cyan/40"], ["Wazuh", "bg-blue/30"],
                ["Volatility 3", "bg-violet/30"], ["pytest", "bg-emerald/40"], ["AWS IAM", "bg-amber/40"],
                ["Active Directory", "bg-rose/30"], ["BloodHound", "bg-rose/30"], ["OPA / Rego", "bg-blue/40"],
                ["Audit sampling", "bg-emerald/40"], ["Risk models", "bg-violet/30"],
                ["Python", "bg-blue/40"], ["DuckDB", "bg-cyan/40"], ["T-Pot", "bg-amber/40"],
                ["containerlab", "bg-emerald/40"], ["Zeek / Suricata", "bg-cyan/40"], ["Wazuh", "bg-blue/30"],
                ["Volatility 3", "bg-violet/30"], ["pytest", "bg-emerald/40"], ["AWS IAM", "bg-amber/40"],
                ["Active Directory", "bg-rose/30"], ["BloodHound", "bg-rose/30"], ["OPA / Rego", "bg-blue/40"],
                ["Audit sampling", "bg-emerald/40"], ["Risk models", "bg-violet/30"],
              ].map(([text, color], i) => (
                <span key={i} className="inline-flex items-center mx-8">
                  <span className={`w-1.5 h-1.5 rounded-full ${color} mr-5`} />
                  <span className="text-[11px] font-medium text-muted uppercase tracking-[0.15em]">{text}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── How learning happens ───────────────────────────── */}
        <section id="how-it-works" className="relative py-24 sm:py-32 bg-background overflow-hidden">
          <div className="orb orb-emerald w-[300px] h-[300px] top-[10%] left-[6%] hidden lg:block" aria-hidden="true" />
          <div className="relative z-[1] max-w-6xl mx-auto px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold text-blue uppercase tracking-[0.14em] mb-4">How learning happens</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
                Built around capability, not content consumption.
              </h2>
              <p className="mt-5 text-base text-muted leading-relaxed">
                Read enough to orient yourself. Spend the real effort building, testing,
                explaining, and improving work that another practitioner can reproduce.
              </p>
            </div>
            <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {LEARNING_MODEL.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.number} className="glass-card rounded-2xl p-6 flex flex-col">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue/10 text-blue">
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </span>
                      <span className="font-mono text-sm font-semibold text-muted/70">{item.number}</span>
                    </div>
                    <h3 className="mt-5 text-base font-semibold text-foreground leading-snug">{item.title}</h3>
                    <p className="mt-2.5 text-sm text-muted leading-relaxed">{item.copy}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Progression ────────────────────────────────────── */}
        <section id="progression" className="relative py-24 sm:py-32 bg-surface/40 bg-scan overflow-hidden border-y border-border/60">
          <div className="relative z-[1] max-w-6xl mx-auto px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold text-blue uppercase tracking-[0.14em] mb-4">The progression</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
                Five stages. A rising standard of independence.
              </h2>
              <p className="mt-5 text-base text-muted leading-relaxed">
                Each stage raises data volume, infrastructure responsibility, adversary pressure,
                and evidential burden. The last two carry no revision — you defend the work as it stands.
              </p>
            </div>

            <ol className="mt-14 grid gap-5 md:grid-cols-3 lg:grid-cols-5">
              {STAGE_ORDER.map((stageKey, index) => {
                const meta = ADVANCED_STAGE_META[stageKey];
                const noRevision = index >= 3;
                return (
                  <li
                    key={stageKey}
                    className="glass-card rounded-2xl p-6 relative flex flex-col"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-blue tracking-widest">
                        STAGE {index + 5}
                      </span>
                      <span
                        className={`text-[9px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 ${
                          noRevision ? "bg-rose/10 text-rose" : "bg-emerald/10 text-emerald"
                        }`}
                      >
                        {noRevision ? "No revision" : "1 revision"}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-foreground">{meta.name}</h3>
                    <p className="mt-2 text-sm text-muted leading-relaxed flex-1">{meta.subtitle}</p>
                    <div className="mt-5 flex items-center gap-1" aria-label={`Difficulty ${index >= 2 ? 5 : 4} of 5`}>
                      {Array.from({ length: 5 }).map((_, d) => (
                        <span
                          key={d}
                          className={`h-1.5 flex-1 rounded-full ${
                            d < (index >= 2 ? 5 : 4) ? "bg-blue/70" : "bg-border"
                          }`}
                        />
                      ))}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* ── Tracks ─────────────────────────────────────────── */}
        <section id="tracks" className="relative py-24 sm:py-32 bg-background overflow-hidden">
          <div className="orb orb-violet w-[360px] h-[360px] top-[6%] right-[4%] hidden lg:block" aria-hidden="true" />
          <div className="relative z-[1] max-w-6xl mx-auto px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold text-blue uppercase tracking-[0.14em] mb-4">Your assigned specialist path</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
                Three tracks. One clear professional destination each.
              </h2>
              <p className="mt-5 text-base text-muted leading-relaxed">
                Every track develops technical depth, evidence discipline, communication, and
                professional judgment through five connected missions. You are placed on one.
              </p>
            </div>

            <div className="mt-16 space-y-16">
              {TRACKS.map((track, ti) => {
                const visual = ADVANCED_TRACK_VISUALS[track.key];
                const outcome = ADVANCED_TRACK_OUTCOMES[track.key];
                const projects = ADVANCED_PROJECTS[track.key];
                const Icon = track.icon;
                const trackStyle = { "--accent": visual.accent } as CSSProperties;
                const imageFirst = ti % 2 === 1;

                return (
                  <article
                    key={track.key}
                    style={trackStyle}
                    className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center"
                  >
                    {/* Visual panel */}
                    <div className={`relative ${imageFirst ? "lg:order-2" : ""}`}>
                      <div className="relative rounded-3xl overflow-hidden glass-card-elevated aspect-[4/3]">
                        <Image
                          src={visual.image}
                          alt={`${advancedTrackLabel(track.key)} track`}
                          fill
                          className="object-cover"
                          style={{ objectPosition: "center 40%" }}
                          sizes="(min-width: 1024px) 520px, 100vw"
                        />
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              "linear-gradient(155deg, color-mix(in srgb, var(--accent) 42%, transparent) 0%, color-mix(in srgb, var(--accent) 14%, transparent) 42%, rgba(0,0,0,0.15) 62%, rgba(0,0,0,0.72) 100%)",
                          }}
                        />
                        <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-black/45 backdrop-blur px-3 py-1.5 text-white">
                          <Icon className="w-4 h-4" aria-hidden="true" />
                          <span className="text-xs font-semibold uppercase tracking-wider">{track.shortLabel} track</span>
                        </div>
                        {/* Live feed chip */}
                        <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-black/50 backdrop-blur px-4 py-3">
                          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-white/70 mb-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
                            evidence stream
                          </div>
                          <div className="font-mono text-[11px] text-white/85 space-y-0.5">
                            {track.feed.map((line) => (
                              <div key={line} className="truncate">→ {line}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div
                        className="absolute -z-10 -inset-3 rounded-[2rem] blur-2xl opacity-40"
                        style={{ background: "var(--accent)" }}
                        aria-hidden="true"
                      />
                    </div>

                    {/* Content */}
                    <div className={imageFirst ? "lg:order-1" : ""}>
                      <div className="flex items-center gap-2.5">
                        <span
                          className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-white"
                          style={{ background: "var(--accent)" }}
                        >
                          <Icon className="w-5 h-5" aria-hidden="true" />
                        </span>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--accent)" }}>
                          {visual.eyebrow}
                        </p>
                      </div>
                      <h3 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        {advancedTrackLabel(track.key)}
                      </h3>
                      <p className="mt-3 text-base text-muted leading-relaxed">{track.description}</p>

                      <div className="mt-6 grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
                        {outcome.learning.map((item) => (
                          <div key={item} className="flex items-start gap-2.5 text-sm text-foreground/90">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--accent)" }} aria-hidden="true" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 rounded-xl border border-border/70 bg-surface/50 p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Working toolkit</p>
                        <p className="text-sm font-medium text-foreground/90">{outcome.toolkit}</p>
                      </div>

                      {/* Mission list */}
                      <div className="mt-6">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-3">The five missions</p>
                        <ol className="space-y-2">
                          {projects.map((project, pi) => (
                            <li key={project.stage} className="flex items-baseline gap-3 text-sm">
                              <span className="font-mono text-xs font-semibold shrink-0 w-14" style={{ color: "var(--accent)" }}>
                                S{pi + 5}
                              </span>
                              <span className="text-foreground/90">{project.title}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className="mt-7 rounded-xl bg-surface-hover/60 border border-border/60 px-4 py-3 flex items-start gap-3">
                        <Gauge className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--accent)" }} aria-hidden="true" />
                        <p className="text-sm text-muted leading-relaxed">
                          <span className="font-semibold text-foreground">Destination —</span> {outcome.destination}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Resources ──────────────────────────────────────── */}
        <section id="resources" className="relative py-24 sm:py-32 bg-surface/40 bg-scan overflow-hidden border-y border-border/60">
          <div className="relative z-[1] max-w-6xl mx-auto px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold text-blue uppercase tracking-[0.14em] mb-4">Support that never does the work for you</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
                Clear starting points. Testable expectations. No hidden guessing game.
              </h2>
              <p className="mt-5 text-base text-muted leading-relaxed">
                Each project page brings the learning support and assessment materials into one
                case desk. Private packs stay identity-bound; shared templates teach a reusable way of working.
              </p>
            </div>
            <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {RESOURCE_LIBRARY.map((resource) => {
                const ResourceIcon = resource.icon;
                return (
                  <article key={resource.title} className="glass-card rounded-2xl p-6 flex gap-4">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue/10 text-blue shrink-0">
                      <ResourceIcon className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">{resource.title}</h3>
                      <p className="mt-1.5 text-sm text-muted leading-relaxed">{resource.copy}</p>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-10 glass-card-elevated rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
              <div className="flex items-start gap-4">
                <Sparkles className="w-6 h-6 text-blue shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm sm:text-base text-muted leading-relaxed max-w-2xl">
                  <span className="font-semibold text-foreground">The goal is independence — not isolation.</span>{" "}
                  Resources explain the environment, interfaces, evidence standard, and checks. You still own the
                  implementation and the conclusions.
                </p>
              </div>
              <a href="#tracks" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue shrink-0 whitespace-nowrap hover:gap-2.5 transition-all">
                Explore the tracks <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        {/* ── Integrity strip ────────────────────────────────── */}
        <section className="py-16 bg-background">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="grid sm:grid-cols-3 gap-5">
              {[
                { icon: ShieldCheck, title: "Track boundary enforced", copy: "Your workspace is generated from your assigned track. Stage URLs do not accept a track override." },
                { icon: LockKeyhole, title: "Identity-bound case facts", copy: "Private assignment facts, evidence markers, and case variants remain tied to your intern identity." },
                { icon: Layers3, title: "One connected portfolio", copy: "Five projects that reuse and extend each other — not five disconnected tasks — ending in a defensible case." },
              ].map(({ icon: Icon, title, copy }) => (
                <div key={title} className="flex items-start gap-3.5">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue/10 text-blue shrink-0">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                    <p className="mt-1 text-sm text-muted leading-relaxed">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ──────────────────────────────────────── */}
        <section className="relative py-24 sm:py-32 bg-background bg-scan overflow-hidden">
          <div className="orb orb-blue w-[400px] h-[400px] top-[10%] left-1/2 -translate-x-1/2 hidden lg:block" aria-hidden="true" />
          <div className="hex-grid" aria-hidden="true" />
          <div className="relative z-[1] max-w-3xl mx-auto px-5 sm:px-8 text-center">
            <span className="inline-flex items-center gap-2 text-xs font-medium text-blue tracking-[0.14em] uppercase mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue animate-pulse" aria-hidden="true" />
              Advanced Stages 5–9 · Now open
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.08]">
              Your assigned track is waiting.
            </h2>
            <p className="mt-6 text-base sm:text-lg text-muted leading-relaxed max-w-xl mx-auto">
              Sign in to open your case desk, read the mission brief, and start building the work
              you will defend on the way to a portfolio employers can actually verify.
            </p>
            <div className="mt-10 flex flex-wrap gap-3 justify-center">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue px-8 py-4 rounded-full hover:bg-blue-dark transition-all hover:shadow-lg hover:shadow-blue/25"
              >
                Sign in to your track
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </Link>
              <a
                href="#tracks"
                className="inline-flex items-center text-sm font-medium text-foreground border border-border px-8 py-4 rounded-full hover:bg-surface-hover transition-colors"
              >
                Review the tracks
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-border/60 bg-surface/60">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <LogoMark size={22} />
            <span className="text-sm font-semibold text-foreground">UBI · The Root Access Network</span>
          </div>
          <p className="text-xs text-muted text-center sm:text-right max-w-md">
            Participant access is controlled by stage status, current stage, and registered track.
            You only ever see the track and case material assigned to your account.
          </p>
        </div>
      </footer>
    </div>
  );
}
