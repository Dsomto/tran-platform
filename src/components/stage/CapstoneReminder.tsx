import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

interface Props {
  /** Where the brief lives — usually `stageUrl(slug)`. */
  landingHref: string;
  /** Theme classes. Reuses the same shape as BoardRecap. */
  theme: {
    panelClass: string;
    headingClass: string;
    accentTextClass: string;
    bodyTextClass: string;
    mutedTextClass: string;
    ctaBgClass: string;
    ctaHoverClass: string;
    dividerClass: string;
  };
}

// Sits on every mission-board page. Amaka speaking — keeps the capstone
// from being forgotten while the intern is heads-down on flags and MCQs.
export function CapstoneReminder({ landingHref, theme }: Props) {
  return (
    <aside className={`${theme.panelClass} p-6 sm:p-7 relative`}>
      <div className="flex items-start gap-4">
        <div
          className={`shrink-0 w-11 h-11 rounded-full ${theme.ctaBgClass} grid place-items-center text-white font-bold text-sm`}
          aria-hidden="true"
        >
          AE
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={`${theme.bodyTextClass} text-sm font-semibold`}>
              Amaka Eze
            </span>
            <span className={`${theme.mutedTextClass} text-[11px]`}>
              · note pinned to your desk
            </span>
          </div>
          <p
            className={`${theme.bodyTextClass} text-[15px] leading-relaxed mb-4`}
            style={{ fontFamily: "Georgia, serif" }}
          >
            <Sparkles className={`inline w-3.5 h-3.5 mr-1 -translate-y-0.5 ${theme.accentTextClass}`} aria-hidden="true" />
            Don&apos;t lose sight of the capstone while you&apos;re clearing
            tasks down here. The tasks below test what you&apos;ve absorbed —
            the capstone is the bulk of what we&apos;ll grade you on.
          </p>
          <Link
            href={`${landingHref}#capstone`}
            className={`${theme.ctaBgClass} ${theme.ctaHoverClass} inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-[0.15em] text-white transition-opacity`}
          >
            View your capstone project
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
