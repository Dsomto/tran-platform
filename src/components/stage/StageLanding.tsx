import Link from "next/link";
import {
  ArrowRight,
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
  Sparkles,
} from "lucide-react";
import type { StageBrief, CastMember, BulletinKind } from "@/lib/stage-briefs";
import { PrintBriefButton } from "./PrintBriefButton";

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
              <PrintBriefButton
                className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold border ${theme.dividerClass} ${theme.bodyTextClass} hover:bg-white/5 transition-colors`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── About this stage ─────────────────────────────── */}
      <section>
        <SectionHeading icon={Target} accent={theme.accentTextClass} headingClass={theme.headingClass} eyebrow="About this chapter">
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
        <SectionHeading icon={Users} accent={theme.accentTextClass} headingClass={theme.headingClass} eyebrow="The cast">
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
        <SectionHeading icon={Megaphone} accent={theme.accentTextClass} headingClass={theme.headingClass} eyebrow="Around the office">
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

      {/* ── THE CAPSTONE — emotional peak before the cooldown pull-quotes ── */}
      <section
        id="capstone"
        className={`${theme.panelClass} p-8 sm:p-12 relative overflow-hidden`}
        style={{
          backgroundImage: "radial-gradient(circle at 10% 0%, rgba(255,255,255,0.04), transparent 40%), radial-gradient(circle at 90% 100%, rgba(255,255,255,0.04), transparent 40%)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-9 h-9 rounded-lg ${theme.ctaBgClass} grid place-items-center text-white shrink-0`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <span className={`text-[10.5px] font-mono uppercase tracking-[0.2em] ${theme.accentTextClass}`}>
            Your capstone for {brief.label}
          </span>
        </div>

        <h2 className={`${theme.headingClass} text-3xl sm:text-4xl mb-3 tracking-tight`}>
          The work that actually matters.
        </h2>
        <p className={`${theme.bodyTextClass} text-base sm:text-lg leading-relaxed max-w-3xl mb-7`}>
          The mission-board tasks test what you&apos;ve absorbed. The capstone
          below is the bulk of what we&apos;ll grade. Build it off-platform in
          Google Docs / Microsoft Word, drop everything into one shared
          folder, then paste the link on your submission page.
        </p>

        {/* Drive folder + print — primary actions, side by side */}
        <div className="flex flex-wrap gap-3 mb-8">
          <a
            href={brief.resourcesDriveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${theme.ctaBgClass} ${theme.ctaHoverClass} inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold uppercase tracking-[0.15em] text-white shadow-lg transition-opacity`}
          >
            <FolderOpen className="w-4 h-4" />
            Open your data folder
            <ArrowRight className="w-4 h-4" />
          </a>
          <PrintBriefButton
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold border ${theme.dividerClass} ${theme.bodyTextClass} hover:bg-white/5 transition-colors`}
          />
        </div>

        {/* Numbered deliverables — bigger, more prominent */}
        <div className="space-y-3">
          <p className={`${theme.mutedTextClass} text-[11px] uppercase tracking-[0.18em] font-semibold mb-2`}>
            What goes in the folder
          </p>
          {brief.practicalTasks.map((task, idx) => (
            <article
              key={task.id}
              className={`bg-white/5 border ${theme.dividerClass} rounded-xl p-5 flex gap-4`}
            >
              <span
                className={`shrink-0 w-9 h-9 rounded-full ${theme.ctaBgClass} text-white text-sm font-bold grid place-items-center`}
              >
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className={`${theme.bodyTextClass} text-base font-semibold leading-snug mb-1`}>
                  {task.title}
                </h3>
                <p className={`${theme.bodyTextClass} text-[13.5px] leading-relaxed mb-2 opacity-85`}>
                  {task.description}
                </p>
                <span
                  className={`inline-block text-[11px] font-mono px-2.5 py-1 rounded ${theme.ctaBgClass} text-white font-semibold`}
                >
                  {task.deliverable}
                </span>
                {task.alternate && (
                  <p className={`${theme.mutedTextClass} text-[12px] italic mt-2`}>
                    Alternate path: {task.alternate}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>

        {/* Tools / readings, neat list under the deliverables */}
        {brief.resources.length > 0 && (
          <div className={`mt-7 pt-6 border-t ${theme.dividerClass}`}>
            <p className={`${theme.mutedTextClass} text-[11px] uppercase tracking-[0.18em] font-semibold mb-3`}>
              Tools and readings you&apos;ll lean on
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

        {/* Grading bar */}
        <div className={`mt-7 pt-6 border-t ${theme.dividerClass}`}>
          <p className={`${theme.mutedTextClass} text-[11px] uppercase tracking-[0.18em] font-semibold mb-3 flex items-center gap-2`}>
            <CheckCircle2 className="w-3 h-3" />
            What we look for when we grade
          </p>
          <ul className="space-y-2">
            {brief.sections.map((s) => (
              <li key={s} className="flex gap-2.5 items-start">
                <span
                  className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${theme.ctaBgClass}`}
                />
                <span className={`${theme.bodyTextClass} text-[14px] leading-relaxed`}>
                  {s}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Cooldown — two pull-quotes from different voices in the office ── */}
      {brief.cast[0]?.greeting && (
        <PullQuote
          theme={theme}
          quote={brief.cast[0].greeting}
          author={brief.cast[0].name}
          role={brief.cast[0].role}
        />
      )}
      {brief.cast[1]?.greeting && (
        <PullQuote
          theme={theme}
          quote={brief.cast[1].greeting}
          author={brief.cast[1].name}
          role={brief.cast[1].role}
        />
      )}

      {/* End strip — one quiet CTA back to the board, no repeated copy. The
          hero, the capstone, and the bulletin already gave the user three
          earlier entry points; this is just a soft landing at the bottom of
          the scroll. */}
      <div className="flex justify-center pt-2">
        <Link
          href={boardHref}
          className={`${theme.ctaBgClass} ${theme.ctaHoverClass} inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-bold uppercase tracking-[0.15em] text-white shadow-lg transition-opacity`}
        >
          Enter the mission board
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  eyebrow,
  children,
  accent,
  headingClass,
}: {
  icon: React.ElementType;
  eyebrow: string;
  children: React.ReactNode;
  accent: string;
  headingClass: string;
}) {
  return (
    <div className="mb-5">
      <div className={`flex items-center gap-2 mb-1.5 text-[10.5px] font-mono uppercase tracking-[0.2em] ${accent}`}>
        <Icon className="w-3 h-3" />
        {eyebrow}
      </div>
      <h2 className={`${headingClass} text-2xl sm:text-3xl tracking-tight`}>{children}</h2>
    </div>
  );
}

function PullQuote({
  theme,
  quote,
  author,
  role,
}: {
  theme: StageLandingTheme;
  quote: string;
  author: string;
  role: string;
}) {
  return (
    <section className="py-6 sm:py-10 max-w-3xl mx-auto text-center">
      <Quote className={`w-6 h-6 mx-auto mb-3 ${theme.accentTextClass} opacity-60`} />
      <blockquote
        className={`${theme.bodyTextClass} text-2xl sm:text-3xl leading-snug font-medium`}
        style={{ fontFamily: "Georgia, serif" }}
      >
        &ldquo;{quote}&rdquo;
      </blockquote>
      <p className={`${theme.mutedTextClass} text-xs uppercase tracking-[0.2em] mt-4 font-mono`}>
        {author} · {role}
      </p>
    </section>
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
