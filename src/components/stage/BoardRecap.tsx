import Link from "next/link";
import { ArrowLeft, FileText, Target } from "lucide-react";
import type { StageBrief } from "@/lib/stage-briefs";

export interface BoardRecapTheme {
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
  /** Where the "Re-read the full brief" link goes — usually `stageUrl(slug)`. */
  landingHref: string;
  /** Where the "Submit your folder" link goes — `/dashboard/reports/STAGE_X`. */
  submitHref: string;
  theme: BoardRecapTheme;
}

// Sits at the top of every mission-board page. Reminds the intern: "you've
// been briefed — here's the work that follows from it" and gives one click
// back to the brief and one to the submission page.
export function BoardRecap({ brief, landingHref, submitHref, theme }: Props) {
  const opener = brief.missionBrief[0] ?? "";

  return (
    <section className={`${theme.panelClass} p-6 sm:p-8 relative overflow-hidden`}>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`flex items-center gap-1.5 text-[10.5px] font-mono uppercase tracking-[0.2em] ${theme.accentTextClass}`}>
          <Target className="w-3 h-3" />
          From your brief
        </span>
        <span className={theme.pillClass}>{brief.label} · Mission board</span>
      </div>

      <h1 className={`${theme.headingClass} text-2xl sm:text-3xl mb-3`}>
        You&apos;ve been briefed. Now the work.
      </h1>

      <p className={`${theme.bodyTextClass} text-[14.5px] leading-relaxed mb-5 max-w-3xl`}>
        {opener}
      </p>

      <div className="flex flex-wrap gap-2">
        <Link
          href={landingHref}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border ${theme.dividerClass} ${theme.bodyTextClass} hover:bg-white/5 transition-colors`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Re-read the full brief
        </Link>
        <Link
          href={submitHref}
          className={`${theme.ctaBgClass} ${theme.ctaHoverClass} inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white transition-opacity`}
        >
          <FileText className="w-3.5 h-3.5" />
          Submit your folder
        </Link>
      </div>
    </section>
  );
}
