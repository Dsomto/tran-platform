import Link from "next/link";
import { ArrowLeft, FileText, FolderOpen, ListChecks, Coffee } from "lucide-react";
import type { StageBrief } from "@/lib/stage-briefs";
import type { StageStory } from "@/lib/stage-story";
import type { StageLandingTheme } from "@/lib/stage-landing-theme";

interface Props {
  brief: StageBrief;
  story: StageStory;
  /** Given name of the signed-in intern. */
  firstName: string;
  /** Where "Re-read the brief" goes — usually `stageUrl(slug)`. */
  landingHref: string;
  /** Where the capstone brief lives — `stageUrl(slug)#capstone`. */
  capstoneHref: string;
  /** Where "Submit your report" goes — `/dashboard/reports/STAGE_X`. */
  submitHref: string;
  /** How many board tasks the intern has attempted, out of the total. */
  doneCount: number;
  totalCount: number;
  theme: StageLandingTheme;
}

// The top of every mission-board page: the intern's "desk queue". It recaps
// why the task list exists, shows how far through the chapter they are, and
// gives one click each back to the brief, on to the capstone, and to the
// report submission — so the board never feels detached from the story.
export function BoardRecap({
  brief,
  story,
  firstName,
  landingHref,
  capstoneHref,
  submitHref,
  doneCount,
  totalCount,
  theme,
}: Props) {
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <section className={`${theme.panelClass} p-6 sm:p-8 relative overflow-hidden`}>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`flex items-center gap-1.5 text-[10.5px] font-mono uppercase tracking-[0.2em] ${theme.accentTextClass}`}>
          <Coffee className="w-3 h-3" />
          Your desk queue
        </span>
        <span className={theme.pillClass}>{brief.label} · Chapter {story.chapter}</span>
      </div>

      <h1 className={`${theme.headingClass} text-2xl sm:text-3xl mb-3`}>
        Morning, {firstName || "there"}. Here is your bench.
      </h1>

      <p className={`${theme.bodyTextClass} text-[14.5px] leading-relaxed mb-2 max-w-3xl`}>
        {story.tasksTeach}
      </p>
      <p className={`${theme.mutedTextClass} text-[13px] leading-relaxed mb-5 max-w-3xl`}>
        Work the tasks below top to bottom — each one is a beat of the day at{" "}
        {story.office.split("·")[0].trim()}. When the bench is clear, the
        capstone is the report that reaches {story.reportTo}.
      </p>

      {/* progress meter */}
      <div className="mb-5 max-w-md">
        <div className={`flex items-center justify-between text-[11px] font-mono mb-1.5 ${theme.mutedTextClass}`}>
          <span className="inline-flex items-center gap-1.5">
            <ListChecks className="w-3.5 h-3.5" /> Board progress
          </span>
          <span>{doneCount} / {totalCount} tasks done · {pct}%</span>
        </div>
        <div className={`h-2 rounded-full overflow-hidden border ${theme.dividerClass} ${theme.softBgClass}`}>
          <div
            className={`h-full rounded-full ${theme.ctaBgClass} transition-all`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={landingHref}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border ${theme.dividerClass} ${theme.bodyTextClass} hover:bg-white/5 transition-colors`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Re-read the brief
        </Link>
        <Link
          href={capstoneHref}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border ${theme.dividerClass} ${theme.bodyTextClass} hover:bg-white/5 transition-colors`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Capstone brief
        </Link>
        <Link
          href={submitHref}
          className={`${theme.ctaBgClass} ${theme.ctaHoverClass} inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white transition-opacity`}
        >
          <FileText className="w-3.5 h-3.5" />
          Submit your report
        </Link>
      </div>
    </section>
  );
}
