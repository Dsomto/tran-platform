import Link from "next/link";
import {
  ArrowRight,
  Download,
  FileText,
  FolderOpen,
  ShieldCheck,
  Target,
  Users,
  Wrench,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import type { StageBrief, CastMember } from "@/lib/stage-briefs";

export interface StageLandingTheme {
  /** "stage-0" .. "stage-4" — used for class prefixes. */
  slug: string;
  panelClass: string;
  headingClass: string;
  pillClass: string;
  accentTextClass: string;
  bodyTextClass: string;
  mutedTextClass: string;
  /** Solid CTA button background — must be a Tailwind class like `bg-emerald-600`. */
  ctaBgClass: string;
  ctaHoverClass: string;
  /** A faint border / divider colour. */
  dividerClass: string;
  /** Background overlay class registered in the stage's theme.css (e.g. "stage-3-field"). */
  fieldOverlayClass?: string;
}

interface Props {
  brief: StageBrief;
  theme: StageLandingTheme;
  /** Where the "Enter mission board" CTA goes. */
  boardHref: string;
  /** Where the "Download capstone brief" button goes. */
  pdfHref: string;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter((p) => p.replace(/[^A-Za-z]/g, "").length > 0)
    .slice(0, 2)
    .map((w) => w.replace(/[^A-Za-z]/g, "")[0]?.toUpperCase() ?? "")
    .join("");
}

function alignmentClasses(alignment: CastMember["alignment"]): {
  ring: string;
  bg: string;
  text: string;
  badge: string;
} {
  switch (alignment) {
    case "ally":
      return {
        ring: "ring-emerald-400/40",
        bg: "bg-emerald-500/15",
        text: "text-emerald-300",
        badge: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
      };
    case "peer":
      return {
        ring: "ring-blue-400/40",
        bg: "bg-blue-500/15",
        text: "text-blue-300",
        badge: "bg-blue-500/15 text-blue-200 border-blue-500/30",
      };
    case "adversary":
      return {
        ring: "ring-rose-400/40",
        bg: "bg-rose-500/15",
        text: "text-rose-300",
        badge: "bg-rose-500/15 text-rose-200 border-rose-500/30",
      };
    case "external":
      return {
        ring: "ring-amber-400/40",
        bg: "bg-amber-500/15",
        text: "text-amber-300",
        badge: "bg-amber-500/15 text-amber-200 border-amber-500/30",
      };
  }
}

export function StageLanding({ brief, theme, boardHref, pdfHref }: Props) {
  const opener = brief.missionBrief[0] ?? "";
  const rest = brief.missionBrief.slice(1);

  return (
    <div className="space-y-12 pb-20">
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className={`${theme.panelClass} relative p-8 sm:p-12 overflow-hidden`}>
        {theme.fieldOverlayClass && (
          <div className={theme.fieldOverlayClass} aria-hidden="true" />
        )}

        {/* Mission active indicator */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap relative z-[1]">
          <div className="flex items-center gap-2.5">
            <span className="relative flex w-2.5 h-2.5" aria-hidden="true">
              <span className={`${theme.ctaBgClass} absolute inset-0 rounded-full opacity-70 animate-ping`} />
              <span className={`${theme.ctaBgClass} relative inline-flex w-2.5 h-2.5 rounded-full`} />
            </span>
            <span className={`text-[10.5px] font-mono uppercase tracking-[0.25em] ${theme.accentTextClass}`}>
              Mission active
            </span>
          </div>
          <span className={theme.pillClass}>{brief.label}</span>
        </div>

        <h1 className={`${theme.headingClass} relative z-[1] text-4xl sm:text-5xl lg:text-6xl mb-4 tracking-tight`}>
          {brief.subtitle}
        </h1>

        <p className={`${theme.bodyTextClass} relative z-[1] text-lg leading-relaxed max-w-3xl mb-8`}>
          {opener}
        </p>

        <div className="relative z-[1] flex flex-wrap gap-3">
          <Link
            href={boardHref}
            className={`${theme.ctaBgClass} ${theme.ctaHoverClass} inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold uppercase tracking-[0.15em] text-white shadow-lg transition-opacity`}
          >
            Enter the mission board
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href={pdfHref}
            download
            className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold border ${theme.dividerClass} ${theme.bodyTextClass} hover:${theme.ctaBgClass.replace("bg-", "bg-").replace("/15", "/8")} transition-colors`}
          >
            <Download className="w-4 h-4" />
            Download capstone brief
          </a>
        </div>
      </section>

      {/* ── Mission brief paragraphs ─────────────────────── */}
      <section className={`${theme.panelClass} p-7 sm:p-9`}>
        <div className={`flex items-center gap-2 mb-4 text-[10.5px] font-mono uppercase tracking-[0.2em] ${theme.accentTextClass}`}>
          <Target className="w-3 h-3" />
          The brief, in full
        </div>
        <div className="space-y-3">
          {rest.length > 0 ? (
            rest.map((p, i) => (
              <p key={i} className={`${theme.bodyTextClass} text-[15px] leading-relaxed`}>
                {p}
              </p>
            ))
          ) : (
            <p className={`${theme.bodyTextClass} text-[15px] leading-relaxed`}>
              {opener}
            </p>
          )}
        </div>
      </section>

      {/* ── Meet your team ───────────────────────────────── */}
      <section>
        <div className="mb-5">
          <div className={`flex items-center gap-2 mb-1 text-[10.5px] font-mono uppercase tracking-[0.2em] ${theme.accentTextClass}`}>
            <Users className="w-3 h-3" />
            Meet your team
          </div>
          <h2 className={`${theme.headingClass} text-xl`}>The cast for this mission</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {brief.cast.map((person) => {
            const a = alignmentClasses(person.alignment);
            return (
              <article
                key={person.name}
                className={`${theme.panelClass} p-5 transition`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`w-12 h-12 rounded-full grid place-items-center font-bold text-sm shrink-0 ring-2 ${a.ring} ${a.bg} ${a.text}`}
                    aria-hidden="true"
                  >
                    {initialsOf(person.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${theme.bodyTextClass} truncate`}>
                      {person.name}
                    </p>
                    <p className={`text-xs ${theme.mutedTextClass}`}>
                      {person.role}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${a.badge}`}
                    >
                      {person.alignment}
                    </span>
                  </div>
                </div>
                {person.tag && (
                  <p className={`text-xs italic mb-2 ${theme.mutedTextClass}`}>
                    {person.tag}
                  </p>
                )}
                <p className={`text-[13px] leading-relaxed ${theme.bodyTextClass}`}>
                  {person.bio}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Terms & policies ─────────────────────────────── */}
      <section className={`${theme.panelClass} p-7 sm:p-9`}>
        <div className={`flex items-center gap-2 mb-4 text-[10.5px] font-mono uppercase tracking-[0.2em] ${theme.accentTextClass}`}>
          <ShieldCheck className="w-3 h-3" />
          Terms &amp; policies
        </div>
        <p className={`${theme.mutedTextClass} text-xs mb-4`}>
          Read once. These apply for the duration of this stage.
        </p>
        <ol className="space-y-2.5">
          {brief.termsAndPolicies.map((rule, i) => (
            <li key={i} className="flex gap-3">
              <span className={`shrink-0 font-mono text-[11px] ${theme.accentTextClass}`}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className={`text-sm leading-relaxed ${theme.bodyTextClass}`}>
                {rule}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Resources quick-list ─────────────────────────── */}
      <section className={`${theme.panelClass} p-7 sm:p-9`}>
        <div className={`flex items-center gap-2 mb-4 text-[10.5px] font-mono uppercase tracking-[0.2em] ${theme.accentTextClass}`}>
          <BookOpen className="w-3 h-3" />
          Resources
        </div>
        <a
          href={brief.resourcesDriveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-between gap-3 px-4 py-3 mb-3 rounded-lg ${theme.ctaBgClass} text-white hover:opacity-90 transition-opacity`}
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <FolderOpen className="w-4 h-4 shrink-0" />
            <span className="font-semibold text-sm truncate">
              Open the stage&apos;s Drive folder for the data files
            </span>
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-80 shrink-0">
            Open ↗
          </span>
        </a>
        {brief.resources.length > 0 && (
          <>
            <p className={`${theme.mutedTextClass} text-[11px] mb-2`}>
              Tools and readings you&apos;ll also need:
            </p>
            <ul className={`${theme.bodyTextClass} text-sm leading-relaxed grid sm:grid-cols-2 gap-x-6 gap-y-1.5`}>
              {brief.resources.map((r) => {
                const Icon = r.kind === "tool" ? Wrench : BookOpen;
                return (
                  <li key={r.href} className="flex items-baseline gap-2">
                    <Icon className={`w-3 h-3 shrink-0 ${theme.mutedTextClass} self-center`} />
                    <a
                      href={r.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 hover:underline"
                    >
                      {r.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      {/* ── What you'll be graded on ─────────────────────── */}
      <section className={`${theme.panelClass} p-7 sm:p-9`}>
        <div className={`flex items-center gap-2 mb-4 text-[10.5px] font-mono uppercase tracking-[0.2em] ${theme.accentTextClass}`}>
          <FileText className="w-3 h-3" />
          What you will be graded on
        </div>
        <ul className="space-y-2">
          {brief.sections.map((s) => (
            <li key={s} className="flex gap-2.5 items-start">
              <span className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${theme.ctaBgClass}`} />
              <span className={`${theme.bodyTextClass} text-sm leading-relaxed`}>{s}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Bottom CTA — repeated for emphasis ───────────── */}
      <section className={`${theme.panelClass} p-7 sm:p-9 relative overflow-hidden`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className={`flex items-center gap-2 mb-1 text-[10.5px] font-mono uppercase tracking-[0.2em] ${theme.accentTextClass}`}>
              <AlertCircle className="w-3 h-3" />
              Ready when you are
            </div>
            <p className={`${theme.bodyTextClass} text-base font-medium`}>
              Tasks are graded individually. Your folder link plus the executive summary is the rest.
            </p>
          </div>
          <Link
            href={boardHref}
            className={`${theme.ctaBgClass} ${theme.ctaHoverClass} inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold uppercase tracking-[0.15em] text-white shadow-lg transition-opacity shrink-0`}
          >
            Enter the mission board
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
