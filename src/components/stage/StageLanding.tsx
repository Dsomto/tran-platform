import Link from "next/link";
import {
  ArrowRight,
  Download,
  Building2,
  Target,
  Users,
  Wrench,
  BookOpen,
  ClipboardList,
  CheckCircle2,
  FolderOpen,
  Quote,
  Newspaper,
  Calendar,
  Coffee,
  Pin,
  AlertTriangle,
  MessageCircle,
  Megaphone,
} from "lucide-react";
import type { StageBrief, CastMember, BulletinKind } from "@/lib/stage-briefs";

export interface StageLandingTheme {
  slug: string;
  panelClass: string;
  headingClass: string;
  pillClass: string;
  accentTextClass: string;
  bodyTextClass: string;
  mutedTextClass: string;
  ctaBgClass: string;
  ctaHoverClass: string;
  dividerClass: string;
}

interface Props {
  brief: StageBrief;
  theme: StageLandingTheme;
  boardHref: string;
  pdfHref: string;
  /** Company / chapter name shown in the hero strip. */
  companyName: string;
  /** Lead paragraph on the hero. */
  welcomeLine: string;
}

function alignmentClasses(alignment: CastMember["alignment"]) {
  switch (alignment) {
    case "ally":
      return {
        ring: "ring-emerald-400/40",
        bg: "bg-emerald-500/15",
        text: "text-emerald-300",
        badge: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
        label: "Ally",
      };
    case "peer":
      return {
        ring: "ring-blue-400/40",
        bg: "bg-blue-500/15",
        text: "text-blue-300",
        badge: "bg-blue-500/15 text-blue-200 border-blue-500/30",
        label: "Peer",
      };
    case "adversary":
      return {
        ring: "ring-rose-400/40",
        bg: "bg-rose-500/15",
        text: "text-rose-300",
        badge: "bg-rose-500/15 text-rose-200 border-rose-500/30",
        label: "Adversary",
      };
    case "external":
      return {
        ring: "ring-amber-400/40",
        bg: "bg-amber-500/15",
        text: "text-amber-300",
        badge: "bg-amber-500/15 text-amber-200 border-amber-500/30",
        label: "Stakeholder",
      };
  }
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z]/g, "")[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function StageLanding({
  brief,
  theme,
  boardHref,
  pdfHref,
  companyName,
  welcomeLine,
}: Props) {
  return (
    <div className="space-y-16 pb-20">
      {/* ── Hero ───────────────────────────────────────────── */}
      <section
        className={`${theme.panelClass} relative overflow-hidden p-8 sm:p-14 lg:p-20`}
      >
        <div className="flex items-center gap-2.5 mb-6">
          <span className="relative flex w-2.5 h-2.5" aria-hidden="true">
            <span className={`${theme.ctaBgClass} absolute inset-0 rounded-full opacity-70 animate-ping`} />
            <span className={`${theme.ctaBgClass} relative inline-flex w-2.5 h-2.5 rounded-full`} />
          </span>
          <span className={`text-[10.5px] font-mono uppercase tracking-[0.25em] ${theme.accentTextClass}`}>
            Mission active
          </span>
          <span className={`mx-2 h-3 w-px ${theme.dividerClass.replace("border-", "bg-")}`} aria-hidden="true" />
          <span className={theme.pillClass}>{brief.label}</span>
        </div>

        <div className="grid lg:grid-cols-[auto_1fr] gap-6 lg:gap-10 items-start">
          <div
            className={`hidden lg:grid w-24 h-24 rounded-2xl ${theme.ctaBgClass} place-items-center text-white shadow-2xl shrink-0`}
          >
            <Building2 className="w-12 h-12" />
          </div>
          <div className="min-w-0">
            <p className={`text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] mb-3 ${theme.accentTextClass}`}>
              Welcome to {companyName}
            </p>
            <h1 className={`${theme.headingClass} text-4xl sm:text-5xl lg:text-6xl mb-5 tracking-tight`}>
              {brief.subtitle}
            </h1>
            <p className={`${theme.bodyTextClass} text-lg sm:text-xl leading-relaxed max-w-3xl`}>
              {welcomeLine}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
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
                className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold border ${theme.dividerClass} ${theme.bodyTextClass} hover:bg-white/5 transition-colors`}
              >
                <Download className="w-4 h-4" />
                Download capstone brief
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── About this stage ─────────────────────────────── */}
      <section>
        <SectionHeading icon={Target} accent={theme.accentTextClass} eyebrow="About this chapter">
          What you walked into
        </SectionHeading>
        <div className={`${theme.panelClass} p-7 sm:p-10 space-y-4`}>
          {brief.missionBrief.map((p, i) => (
            <p key={i} className={`${theme.bodyTextClass} text-[15.5px] leading-relaxed`}>
              {p}
            </p>
          ))}
        </div>
      </section>

      {/* ── Meet your coworkers ──────────────────────────── */}
      <section>
        <SectionHeading icon={Users} accent={theme.accentTextClass} eyebrow="The cast">
          Meet your coworkers
        </SectionHeading>
        <p className={`${theme.mutedTextClass} text-sm mb-6 max-w-2xl`}>
          These are the people whose work you&apos;ll see — and whose questions you&apos;ll
          have to answer. Get a feel for who&apos;s who before you walk into the
          mission board.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {brief.cast.map((person) => {
            const a = alignmentClasses(person.alignment);
            return (
              <article
                key={person.name}
                className={`${theme.panelClass} p-6 sm:p-7 transition-shadow`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`w-16 h-16 rounded-full grid place-items-center font-bold text-base shrink-0 ring-2 ${a.ring} ${a.bg} ${a.text}`}
                    aria-hidden="true"
                  >
                    {initialsOf(person.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className={`${theme.bodyTextClass} text-lg font-semibold leading-tight`}>
                      {person.name}
                    </h3>
                    <p className={`${theme.mutedTextClass} text-sm`}>{person.role}</p>
                    <span
                      className={`inline-flex items-center gap-1 mt-2 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${a.badge}`}
                    >
                      {a.label}
                    </span>
                  </div>
                </div>
                {person.tag && (
                  <p className={`${theme.mutedTextClass} text-xs italic mb-3`}>
                    {person.tag}
                  </p>
                )}
                {person.greeting && (
                  <blockquote
                    className={`${theme.bodyTextClass} pl-4 border-l-2 ${theme.dividerClass} italic mb-3 leading-relaxed`}
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    <Quote
                      className={`inline-block w-3 h-3 mr-1 -translate-y-1 ${theme.accentTextClass}`}
                      aria-hidden="true"
                    />
                    {person.greeting}
                  </blockquote>
                )}
                <p className={`${theme.bodyTextClass} text-[14px] leading-relaxed`}>
                  {person.bio}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Company life — the bulletin board ────────────── */}
      <section>
        <SectionHeading icon={Megaphone} accent={theme.accentTextClass} eyebrow="Around the office">
          What&apos;s going on this week
        </SectionHeading>
        <p className={`${theme.mutedTextClass} text-sm mb-5 max-w-2xl`}>
          Things you&apos;d hear if you were on the bench. Some of it is news,
          some of it is gossip, some of it is the kind of detail you only
          learn by sitting next to someone for a month.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {brief.bulletin.map((item, i) => {
            const v = bulletinVisuals(item.kind);
            const Icon = v.icon;
            return (
              <article
                key={i}
                className={`${theme.panelClass} p-4 sm:p-5 flex gap-3`}
              >
                <div
                  className={`shrink-0 w-9 h-9 rounded-lg grid place-items-center ${v.bg} ${v.text}`}
                  aria-hidden="true"
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[9.5px] font-mono uppercase tracking-[0.18em] font-bold ${v.text}`}>
                      {v.label}
                    </span>
                    {item.meta && (
                      <span className={`text-[10px] ${theme.mutedTextClass} truncate`}>
                        · {item.meta}
                      </span>
                    )}
                  </div>
                  <p className={`${theme.bodyTextClass} text-[13.5px] leading-relaxed`}>
                    {item.text}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── What you'll deliver ──────────────────────────── */}
      <section>
        <SectionHeading icon={ClipboardList} accent={theme.accentTextClass} eyebrow="The capstone">
          What you&apos;ll deliver
        </SectionHeading>
        <p className={`${theme.mutedTextClass} text-sm mb-6 max-w-2xl`}>
          Your work happens off-platform — in Google Docs / Microsoft Word.
          Put every deliverable into one shared folder, paste the link on the
          submission page when you&apos;re ready.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {brief.practicalTasks.map((task, idx) => (
            <article
              key={task.id}
              className={`${theme.panelClass} p-5 flex gap-3`}
            >
              <span
                className={`shrink-0 w-7 h-7 rounded-full ${theme.ctaBgClass} text-white text-xs font-bold grid place-items-center mt-0.5`}
              >
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className={`${theme.bodyTextClass} text-sm font-semibold leading-snug mb-1`}>
                  {task.title}
                </h3>
                <p className={`${theme.mutedTextClass} text-xs leading-relaxed`}>
                  {task.deliverable}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Your toolbox ─────────────────────────────────── */}
      <section>
        <SectionHeading icon={Wrench} accent={theme.accentTextClass} eyebrow="Your toolbox">
          What you&apos;ll have to work with
        </SectionHeading>

        <a
          href={brief.resourcesDriveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-between gap-3 px-5 py-4 mb-3 rounded-xl ${theme.ctaBgClass} text-white hover:opacity-90 transition-opacity`}
        >
          <span className="flex items-center gap-3 min-w-0">
            <FolderOpen className="w-5 h-5 shrink-0" />
            <span className="min-w-0">
              <span className="block font-semibold text-sm">
                Open the stage&apos;s Drive folder
              </span>
              <span className="block text-[11px] opacity-80">
                Logs, ciphertexts, captures — everything the cast hands you
              </span>
            </span>
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-80 shrink-0">
            Open ↗
          </span>
        </a>

        {brief.resources.length > 0 && (
          <div className={`${theme.panelClass} p-5`}>
            <p className={`${theme.mutedTextClass} text-[11px] mb-3 uppercase tracking-wider font-semibold`}>
              Tools and readings
            </p>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
              {brief.resources.map((r) => {
                const Icon = r.kind === "tool" ? Wrench : BookOpen;
                return (
                  <li key={r.href} className="flex items-start gap-2.5">
                    <Icon className={`w-3.5 h-3.5 shrink-0 mt-1 ${theme.accentTextClass}`} />
                    <a
                      href={r.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${theme.bodyTextClass} text-sm leading-snug hover:underline`}
                    >
                      {r.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* ── What you'll be graded on ─────────────────────── */}
      <section>
        <SectionHeading icon={CheckCircle2} accent={theme.accentTextClass} eyebrow="The bar">
          What you&apos;ll be graded on
        </SectionHeading>
        <div className={`${theme.panelClass} p-7 sm:p-10`}>
          <ul className="space-y-3">
            {brief.sections.map((s) => (
              <li key={s} className="flex gap-3 items-start">
                <span
                  className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${theme.ctaBgClass}`}
                />
                <span className={`${theme.bodyTextClass} text-[15px] leading-relaxed`}>
                  {s}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section
        className={`${theme.panelClass} p-10 sm:p-14 text-center relative overflow-hidden`}
      >
        <div className="flex justify-center mb-5">
          <div className={`w-14 h-14 rounded-full ${theme.ctaBgClass} grid place-items-center text-white animate-pulse`}>
            <ArrowRight className="w-6 h-6" />
          </div>
        </div>
        <p className={`text-[10.5px] font-mono uppercase tracking-[0.3em] mb-3 ${theme.accentTextClass}`}>
          Briefing complete
        </p>
        <h2 className={`${theme.headingClass} text-3xl sm:text-4xl mb-4`}>
          Ready when you are.
        </h2>
        <p className={`${theme.bodyTextClass} text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-8`}>
          The mission board is where {brief.label}&rsquo;s tasks live. Every
          task is graded on its own — finish them in any order.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={boardHref}
            className={`${theme.ctaBgClass} ${theme.ctaHoverClass} inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-bold uppercase tracking-[0.15em] text-white shadow-xl transition-opacity`}
          >
            Enter the mission board
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href={pdfHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold border ${theme.dividerClass} ${theme.bodyTextClass} hover:bg-white/5 transition-colors`}
          >
            <Download className="w-4 h-4" />
            Download capstone brief
          </a>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  eyebrow,
  children,
  accent,
}: {
  icon: React.ElementType;
  eyebrow: string;
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="mb-5">
      <div className={`flex items-center gap-2 mb-1.5 text-[10.5px] font-mono uppercase tracking-[0.2em] ${accent}`}>
        <Icon className="w-3 h-3" />
        {eyebrow}
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{children}</h2>
    </div>
  );
}

function bulletinVisuals(kind: BulletinKind): {
  icon: React.ElementType;
  label: string;
  bg: string;
  text: string;
} {
  switch (kind) {
    case "news":
      return { icon: Newspaper, label: "News", bg: "bg-blue-500/15", text: "text-blue-300" };
    case "meeting":
      return { icon: Calendar, label: "Meeting", bg: "bg-violet-500/15", text: "text-violet-300" };
    case "gossip":
      return { icon: Coffee, label: "Around the bench", bg: "bg-amber-500/15", text: "text-amber-300" };
    case "notice":
      return { icon: Pin, label: "Notice", bg: "bg-emerald-500/15", text: "text-emerald-300" };
    case "alert":
      return { icon: AlertTriangle, label: "Heads up", bg: "bg-rose-500/15", text: "text-rose-300" };
    case "joke":
      return { icon: MessageCircle, label: "Inside joke", bg: "bg-cyan-500/15", text: "text-cyan-300" };
  }
}
