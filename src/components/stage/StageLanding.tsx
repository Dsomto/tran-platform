import Link from "next/link";
import {
  ArrowRight,
  Target,
  Users,
  Wrench,
  BookOpen,
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
  ShieldCheck,
  ListChecks,
  MapPin,
  Mail,
  History,
} from "lucide-react";
import type { StageBrief, CastMember, BulletinKind } from "@/lib/stage-briefs";
import type { StageLandingTheme } from "@/lib/stage-landing-theme";
import {
  type StageStory,
  personalise,
  CHAPTER_TITLES,
  TOTAL_CHAPTERS,
} from "@/lib/stage-story";
import { PrintBriefButton } from "./PrintBriefButton";
import { StageJourneyMap } from "./StageJourneyMap";
import { CommsFeed } from "./CommsFeed";

interface Props {
  brief: StageBrief;
  story: StageStory;
  theme: StageLandingTheme;
  boardHref: string;
  /** `/dashboard/reports/STAGE_X` — where the capstone is submitted. */
  submitHref: string;
  /** Company / chapter name shown in the hero strip. */
  companyName: string;
  /** Given name of the signed-in intern, for the briefing. */
  firstName: string;
  /** The intern's code, e.g. UBI-2026-0001. */
  internCode: string;
}

function alignmentClasses(alignment: CastMember["alignment"]) {
  switch (alignment) {
    case "ally":
      return { ring: "ring-emerald-400/40", bg: "bg-emerald-500/15", text: "text-emerald-300", badge: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30", label: "Ally" };
    case "peer":
      return { ring: "ring-blue-400/40", bg: "bg-blue-500/15", text: "text-blue-300", badge: "bg-blue-500/15 text-blue-200 border-blue-500/30", label: "Peer" };
    case "adversary":
      return { ring: "ring-rose-400/40", bg: "bg-rose-500/15", text: "text-rose-300", badge: "bg-rose-500/15 text-rose-200 border-rose-500/30", label: "Adversary" };
    case "external":
      return { ring: "ring-amber-400/40", bg: "bg-amber-500/15", text: "text-amber-300", badge: "bg-amber-500/15 text-amber-200 border-amber-500/30", label: "Stakeholder" };
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
  story,
  theme,
  boardHref,
  submitHref,
  companyName,
  firstName,
  internCode,
}: Props) {
  const capstoneHref = "#capstone";
  const nextChapter = story.chapter < TOTAL_CHAPTERS ? story.chapter + 1 : null;
  const note = story.deskNote;

  return (
    <div className="space-y-14 pb-20">
      {/* ── Chapter progress rail ─────────────────────────── */}
      <ChapterRail theme={theme} chapter={story.chapter} />

      {/* ── Previously (chapters 2+) ──────────────────────── */}
      {story.previously && (
        <section className={`${theme.panelClass} p-5 sm:p-6`}>
          <div className={`flex items-center gap-2 mb-2 text-[10.5px] font-mono uppercase tracking-[0.2em] ${theme.accentTextClass}`}>
            <History className="w-3 h-3" />
            Previously at {companyName}
          </div>
          <p className={`${theme.bodyTextClass} text-[15px] leading-relaxed`}>
            {story.previously}
          </p>
        </section>
      )}

      {/* ── Channel-style messages from the cast (Stage 1+) ──── */}
      {brief.commsThread && brief.commsThread.length > 0 && (
        <CommsFeed theme={theme} thread={brief.commsThread} firstName={firstName} />
      )}

      {/* ── Hero — the internal briefing packet ───────────── */}
      <section className={`${theme.panelClass} relative overflow-hidden p-7 sm:p-10 lg:p-12`}>
        <div className="flex flex-wrap items-center gap-2.5 mb-5">
          <span className="relative flex w-2.5 h-2.5" aria-hidden="true">
            <span className={`${theme.ctaBgClass} absolute inset-0 rounded-full opacity-70 animate-ping`} />
            <span className={`${theme.ctaBgClass} relative inline-flex w-2.5 h-2.5 rounded-full`} />
          </span>
          <span className={`text-[10.5px] font-mono uppercase tracking-[0.25em] ${theme.accentTextClass}`}>
            Internal briefing
          </span>
          <span className={`mx-1 h-3 w-px ${theme.dividerClass.replace("border-", "bg-")}`} aria-hidden="true" />
          <span className={theme.pillClass}>
            {brief.label} · Chapter {story.chapter} of {TOTAL_CHAPTERS}
          </span>
        </div>

        <p className={`text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] mb-2 ${theme.accentTextClass}`}>
          {companyName}
        </p>
        <h1 className={`${theme.headingClass} text-3xl sm:text-5xl mb-3 tracking-tight`}>
          Hi {firstName || "there"}.
        </h1>
        <h2 className={`${theme.bodyTextClass} text-xl sm:text-2xl font-semibold mb-5`}>
          {brief.subtitle}
        </h2>

        {/* desk meta strip */}
        <div className={`flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] mb-7 ${theme.mutedTextClass}`}>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> {story.office}
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" /> {internCode}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ListChecks className="w-3.5 h-3.5" /> Status: chapter open
          </span>
        </div>

        {/* the note on the desk */}
        <div className={`rounded-2xl border ${theme.dividerClass} ${theme.softBgClass} p-5 sm:p-6 mb-7`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-11 h-11 rounded-full grid place-items-center font-bold text-sm shrink-0 ${theme.ctaBgClass} text-white`} aria-hidden="true">
              {initialsOf(note.from)}
            </div>
            <div className="min-w-0">
              <div className={`${theme.bodyTextClass} text-sm font-semibold flex items-center gap-1.5`}>
                <Mail className={`w-3.5 h-3.5 ${theme.accentTextClass}`} />
                {note.from}
              </div>
              <div className={`${theme.mutedTextClass} text-[11.5px]`}>
                {note.role} · note left on your desk
              </div>
            </div>
          </div>
          <div className="space-y-3" style={{ fontFamily: "Georgia, serif" }}>
            {note.lines.map((line, i) => (
              <p key={i} className={`${theme.bodyTextClass} text-[15px] leading-relaxed`}>
                {personalise(line, firstName)}
              </p>
            ))}
          </div>
        </div>

        <p className={`${theme.mutedTextClass} text-[12.5px] mb-3`}>
          Two tracks. Do them in any order — open the desk tasks, work on the
          capstone, or jump between. Both count toward this chapter.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={boardHref}
            className={`${theme.ctaBgClass} ${theme.ctaHoverClass} inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold uppercase tracking-[0.15em] text-white shadow-lg transition-opacity`}
          >
            <ListChecks className="w-4 h-4" />
            Open the desk tasks
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href={submitHref}
            className={`${theme.ctaBgClass} ${theme.ctaHoverClass} inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold uppercase tracking-[0.15em] text-white shadow-lg transition-opacity`}
          >
            <FolderOpen className="w-4 h-4" />
            Open the capstone
            <ArrowRight className="w-4 h-4" />
          </Link>
          <PrintBriefButton
            className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold border ${theme.dividerClass} ${theme.bodyTextClass} hover:bg-white/5 transition-colors`}
          />
        </div>
      </section>

      {/* ── Journey map — how the chapter fits together ───── */}
      <StageJourneyMap
        theme={theme}
        current="briefing"
        landingHref="#top"
        boardHref={boardHref}
        capstoneHref={capstoneHref}
        submitHref={submitHref}
        nextChapter={nextChapter}
      />

      {/* ── The case ──────────────────────────────────────── */}
      <section>
        <SectionHeading icon={Target} accent={theme.accentTextClass} headingClass={theme.headingClass} eyebrow="The case">
          What you walked into
        </SectionHeading>
        <div className={`${theme.panelClass} p-7 sm:p-10 space-y-4`}>
          {brief.missionBrief.map((p, i) => (
            <p key={i} className={`${theme.bodyTextClass} text-[15.5px] leading-relaxed`}>
              {p}
            </p>
          ))}
          <div className={`mt-5 pt-5 border-t ${theme.dividerClass} flex flex-wrap items-center gap-3`}>
            <p className={`${theme.mutedTextClass} text-[13px] leading-relaxed flex-1 min-w-[240px]`}>
              <ListChecks className={`inline w-3.5 h-3.5 mr-1.5 -translate-y-0.5 ${theme.accentTextClass}`} />
              {story.tasksTeach}
            </p>
            <Link
              href={boardHref}
              className={`${theme.ctaBgClass} ${theme.ctaHoverClass} inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-[0.14em] text-white transition-opacity`}
            >
              Start the desk work
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Meet your coworkers ───────────────────────────── */}
      <section>
        <SectionHeading icon={Users} accent={theme.accentTextClass} headingClass={theme.headingClass} eyebrow="The bench">
          Who you are working with
        </SectionHeading>
        <p className={`${theme.mutedTextClass} text-sm mb-6 max-w-2xl`}>
          These are the people whose work you will see — and whose questions
          you will have to answer. Get a feel for who is who before you walk
          into the mission board.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {brief.cast.map((person) => {
            const a = alignmentClasses(person.alignment);
            return (
              <article key={person.name} className={`${theme.panelClass} p-6 sm:p-7`}>
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-16 h-16 rounded-full grid place-items-center font-bold text-base shrink-0 ring-2 ${a.ring} ${a.bg} ${a.text}`} aria-hidden="true">
                    {initialsOf(person.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className={`${theme.bodyTextClass} text-lg font-semibold leading-tight`}>
                      {person.name}
                    </h3>
                    <p className={`${theme.mutedTextClass} text-sm`}>{person.role}</p>
                    <span className={`inline-flex items-center gap-1 mt-2 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${a.badge}`}>
                      {a.label}
                    </span>
                  </div>
                </div>
                {person.tag && (
                  <p className={`${theme.mutedTextClass} text-xs italic mb-3`}>{person.tag}</p>
                )}
                {person.greeting && (
                  <blockquote
                    className={`${theme.bodyTextClass} pl-4 border-l-2 ${theme.dividerClass} italic mb-3 leading-relaxed`}
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    <Quote className={`inline-block w-3 h-3 mr-1 -translate-y-1 ${theme.accentTextClass}`} aria-hidden="true" />
                    {person.greeting}
                  </blockquote>
                )}
                <p className={`${theme.bodyTextClass} text-[14px] leading-relaxed`}>{person.bio}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Company intranet — the bulletin board ─────────── */}
      <section>
        <SectionHeading icon={Megaphone} accent={theme.accentTextClass} headingClass={theme.headingClass} eyebrow="The intranet">
          What is going on this week
        </SectionHeading>
        <p className={`${theme.mutedTextClass} text-sm mb-5 max-w-2xl`}>
          Straight off the Sankofa intranet feed. Some of it is news, some of
          it is gossip, some of it is the kind of detail you only learn by
          sitting next to someone for a month. None of it is decoration —
          read it like a colleague would.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {brief.bulletin.map((item, i) => {
            const v = bulletinVisuals(item.kind);
            const Icon = v.icon;
            return (
              <article key={i} className={`${theme.panelClass} p-4 sm:p-5 flex gap-3`}>
                <div className={`shrink-0 w-9 h-9 rounded-lg grid place-items-center ${v.bg} ${v.text}`} aria-hidden="true">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[9.5px] font-mono uppercase tracking-[0.18em] font-bold ${v.text}`}>
                      {v.label}
                    </span>
                    {item.meta && (
                      <span className={`text-[10px] ${theme.mutedTextClass} truncate`}>· {item.meta}</span>
                    )}
                  </div>
                  <p className={`${theme.bodyTextClass} text-[13.5px] leading-relaxed`}>{item.text}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Rules of engagement — termsAndPolicies ────────── */}
      <section>
        <SectionHeading icon={ShieldCheck} accent={theme.accentTextClass} headingClass={theme.headingClass} eyebrow="Access terms">
          Rules of engagement
        </SectionHeading>
        <div className={`${theme.panelClass} p-6 sm:p-8`}>
          <p className={`${theme.mutedTextClass} text-[13px] mb-4`}>
            By working this chapter you agree to the following. They are not
            fine print — at Sankofa they are how the team stays out of trouble.
          </p>
          <ul className="space-y-2.5">
            {brief.termsAndPolicies.map((term, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className={`shrink-0 mt-0.5 grid place-items-center w-5 h-5 rounded text-[10px] font-bold font-mono ${theme.ctaBgClass} text-white`}>
                  {i + 1}
                </span>
                <span className={`${theme.bodyTextClass} text-[14px] leading-relaxed`}>{term}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── THE CAPSTONE ──────────────────────────────────── */}
      <section
        id="capstone"
        className={`${theme.panelClass} p-8 sm:p-12 relative overflow-hidden scroll-mt-24`}
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 0%, rgba(255,255,255,0.04), transparent 40%), radial-gradient(circle at 90% 100%, rgba(255,255,255,0.04), transparent 40%)",
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
          The report that actually leaves the building.
        </h2>
        <p className={`${theme.bodyTextClass} text-base sm:text-lg leading-relaxed max-w-3xl mb-3`}>
          The mission-board tasks test what you have absorbed. This capstone is
          the bulk of what we grade. Build it off-platform in Google Docs or
          Microsoft Word, drop everything into one shared folder, then submit
          the link on your report page.
        </p>
        <p className={`${theme.mutedTextClass} text-[13px] mb-7`}>
          <Mail className={`inline w-3.5 h-3.5 mr-1.5 -translate-y-0.5 ${theme.accentTextClass}`} />
          This package is delivered to <strong className={theme.bodyTextClass}>{story.reportTo}</strong>.
        </p>

        <div className="flex flex-wrap gap-3 mb-8">
          {brief.resourcesDriveUrl.startsWith("/") ? (
            <Link
              href={brief.resourcesDriveUrl}
              className={`${theme.ctaBgClass} ${theme.ctaHoverClass} inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold uppercase tracking-[0.15em] text-white shadow-lg transition-opacity`}
            >
              <FolderOpen className="w-4 h-4" />
              Open your evidence pack
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
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
          )}
          <PrintBriefButton
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold border ${theme.dividerClass} ${theme.bodyTextClass} hover:bg-white/5 transition-colors`}
          />
        </div>

        <div className="space-y-3">
          <p className={`${theme.mutedTextClass} text-[11px] uppercase tracking-[0.18em] font-semibold mb-2`}>
            What goes in the folder
          </p>
          {brief.practicalTasks.map((task, idx) => (
            <article key={task.id} className={`${theme.softBgClass} border ${theme.dividerClass} rounded-xl p-5 flex gap-4`}>
              <span className={`shrink-0 w-9 h-9 rounded-full ${theme.ctaBgClass} text-white text-sm font-bold grid place-items-center`}>
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className={`${theme.bodyTextClass} text-base font-semibold leading-snug mb-1`}>
                  {task.title}
                </h3>
                <p className={`${theme.bodyTextClass} text-[13.5px] leading-relaxed mb-2 opacity-85`}>
                  {task.description}
                </p>
                <span className={`inline-block text-[11px] font-mono px-2.5 py-1 rounded ${theme.ctaBgClass} text-white font-semibold`}>
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

        {brief.resources.length > 0 && (
          <div className={`mt-7 pt-6 border-t ${theme.dividerClass}`}>
            <p className={`${theme.mutedTextClass} text-[11px] uppercase tracking-[0.18em] font-semibold mb-3`}>
              Tools and readings you will lean on
            </p>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
              {brief.resources.map((r) => {
                const Icon = r.kind === "tool" ? Wrench : BookOpen;
                return (
                  <li key={r.href} className="flex items-start gap-2.5">
                    <Icon className={`w-3.5 h-3.5 shrink-0 mt-1 ${theme.accentTextClass}`} />
                    <a href={r.href} target="_blank" rel="noopener noreferrer" className={`${theme.bodyTextClass} text-sm leading-snug hover:underline`}>
                      {r.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className={`mt-7 pt-6 border-t ${theme.dividerClass}`}>
          <p className={`${theme.mutedTextClass} text-[11px] uppercase tracking-[0.18em] font-semibold mb-3 flex items-center gap-2`}>
            <CheckCircle2 className="w-3 h-3" />
            What we look for when we grade
          </p>
          <ul className="space-y-2">
            {brief.sections.map((s) => (
              <li key={s} className="flex gap-2.5 items-start">
                <span className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${theme.ctaBgClass}`} />
                <span className={`${theme.bodyTextClass} text-[14px] leading-relaxed`}>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Cliffhanger — the pull into the next chapter ──── */}
      <section className={`${theme.panelClass} p-7 sm:p-9 text-center`}>
        <div className={`flex items-center justify-center gap-2 mb-3 text-[10.5px] font-mono uppercase tracking-[0.2em] ${theme.accentTextClass}`}>
          <ArrowRight className="w-3 h-3" />
          {nextChapter ? `Coming next · Chapter ${nextChapter}` : "The finale"}
        </div>
        <p
          className={`${theme.bodyTextClass} text-lg sm:text-2xl leading-snug font-medium max-w-3xl mx-auto`}
          style={{ fontFamily: "Georgia, serif" }}
        >
          {story.cliffhanger}
        </p>
        <p className={`${theme.mutedTextClass} text-xs mt-4`}>
          {nextChapter
            ? "Finish and pass every task in this chapter to unlock the next room."
            : "Finish and pass every task in this chapter to complete the programme handoff and choose your specialist track."}
        </p>
        <div className="flex justify-center mt-6">
          <Link
            href={boardHref}
            className={`${theme.ctaBgClass} ${theme.ctaHoverClass} inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-bold uppercase tracking-[0.15em] text-white shadow-lg transition-opacity`}
          >
            Enter the mission board
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function ChapterRail({ theme, chapter }: { theme: StageLandingTheme; chapter: number }) {
  return (
    <nav aria-label="Programme progress" className={`${theme.panelClass} px-4 py-3.5 sm:px-6`}>
      <ol className="flex items-center gap-1 sm:gap-2">
        {CHAPTER_TITLES.map((title, i) => {
          const n = i + 1;
          const done = n < chapter;
          const active = n === chapter;
          return (
            <li key={title} className="flex items-center gap-1 sm:gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`grid place-items-center w-6 h-6 rounded-full text-[10px] font-bold shrink-0 ${
                    active
                      ? `${theme.ctaBgClass} text-white`
                      : done
                      ? `${theme.accentTextClass} border ${theme.dividerClass}`
                      : `${theme.mutedTextClass} border ${theme.dividerClass}`
                  }`}
                >
                  {done ? "✓" : n}
                </span>
                <span
                  className={`text-[11.5px] truncate ${
                    active
                      ? `font-semibold ${theme.bodyTextClass}`
                      : `${theme.mutedTextClass} ${active ? "" : "hidden sm:inline"}`
                  }`}
                >
                  {title}
                </span>
              </div>
              {n < CHAPTER_TITLES.length && (
                <span className={`hidden sm:block h-px w-3 lg:w-8 ${theme.dividerClass.replace("border-", "bg-")}`} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
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

function bulletinVisuals(kind: BulletinKind): {
  icon: React.ElementType;
  label: string;
  bg: string;
  text: string;
} {
  switch (kind) {
    case "news":
      return { icon: Newspaper, label: "Company news", bg: "bg-blue-500/15", text: "text-blue-300" };
    case "meeting":
      return { icon: Calendar, label: "Meeting notes", bg: "bg-violet-500/15", text: "text-violet-300" };
    case "gossip":
      return { icon: Coffee, label: "SOC bench overheard", bg: "bg-amber-500/15", text: "text-amber-300" };
    case "notice":
      return { icon: Pin, label: "Pinned notice", bg: "bg-emerald-500/15", text: "text-emerald-300" };
    case "alert":
      return { icon: AlertTriangle, label: "Heads up", bg: "bg-rose-500/15", text: "text-rose-300" };
    case "joke":
      return { icon: MessageCircle, label: "Inside joke", bg: "bg-cyan-500/15", text: "text-cyan-300" };
  }
}
