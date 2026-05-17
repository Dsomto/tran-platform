import Link from "next/link";
import { FileText, ListChecks, FolderOpen, Send, DoorOpen } from "lucide-react";
import type { StageLandingTheme } from "@/lib/stage-landing-theme";

type StepKey = "briefing" | "board" | "capstone" | "submit" | "next";

interface Props {
  theme: StageLandingTheme;
  /** Which screen the intern is on right now. */
  current: "briefing" | "board";
  landingHref: string;
  boardHref: string;
  /** Anchor to the capstone block on the landing page. */
  capstoneHref: string;
  /** `/dashboard/reports/STAGE_X`. */
  submitHref: string;
  /** Chapter number of the room that follows, or null on the finale. */
  nextChapter: number | null;
}

const STEPS: { key: StepKey; label: string; sub: string; icon: React.ElementType }[] = [
  { key: "briefing", label: "Briefing", sub: "Read the case", icon: FileText },
  { key: "board", label: "Mission board", sub: "Work the desk tasks", icon: ListChecks },
  { key: "capstone", label: "Capstone folder", sub: "Build the report", icon: FolderOpen },
  { key: "submit", label: "Submit report", sub: "Send it for grading", icon: Send },
  { key: "next", label: "Next room", sub: "Your next chapter", icon: DoorOpen },
];

// The spine that ties the whole stage together: brief, mission-board tasks,
// capstone folder, report submission, and the door into the next chapter —
// drawn as one numbered path so the intern always knows where this screen
// sits in the larger job. Rendered on both the landing and the board.
export function StageJourneyMap({
  theme,
  current,
  landingHref,
  boardHref,
  capstoneHref,
  submitHref,
  nextChapter,
}: Props) {
  const order: StepKey[] = ["briefing", "board", "capstone", "submit", "next"];
  const currentIdx = order.indexOf(current);

  const hrefFor: Record<StepKey, string | null> = {
    briefing: landingHref,
    board: boardHref,
    capstone: capstoneHref,
    submit: submitHref,
    next: null,
  };

  return (
    <section aria-label="Stage journey" className={`${theme.panelClass} p-5 sm:p-6`}>
      <div className={`flex items-center gap-2 mb-4 text-[10.5px] font-mono uppercase tracking-[0.2em] ${theme.accentTextClass}`}>
        <DoorOpen className="w-3 h-3" />
        How this chapter fits together
      </div>

      <ol className="grid gap-2.5 sm:grid-cols-5">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          // The current step is where the intern already is — don't link it.
          const href = active ? null : hrefFor[step.key];

          const stateRing = active
            ? `${theme.ctaBgClass} text-white`
            : done
            ? `${theme.accentTextClass} border ${theme.dividerClass}`
            : `${theme.mutedTextClass} border ${theme.dividerClass}`;

          // The closing step depends on whether a room follows this one.
          let label = step.label;
          let sub = step.sub;
          if (step.key === "next") {
            if (nextChapter) {
              label = `Chapter ${nextChapter}`;
              sub = "Your next room";
            } else {
              label = "Track selection";
              sub = "Close the programme";
            }
          }

          const body = (
            <div
              className={`h-full rounded-xl border ${theme.dividerClass} p-3 transition-colors ${
                active ? theme.softBgClass : ""
              } ${href ? theme.softHoverClass : ""}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`grid place-items-center w-7 h-7 rounded-lg text-[11px] font-bold shrink-0 ${stateRing}`}
                >
                  {done ? "✓" : idx + 1}
                </span>
                <Icon className={`w-3.5 h-3.5 ${active ? theme.accentTextClass : theme.mutedTextClass}`} />
              </div>
              <div className={`text-[13px] font-semibold leading-tight ${theme.bodyTextClass}`}>
                {label}
              </div>
              <div className={`text-[11px] mt-0.5 ${theme.mutedTextClass}`}>{sub}</div>
            </div>
          );

          return (
            <li key={step.key} className="min-w-0">
              {href ? (
                <Link href={href} className="block h-full">
                  {body}
                </Link>
              ) : (
                body
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
