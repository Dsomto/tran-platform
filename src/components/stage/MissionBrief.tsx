import { Download, FileText, Target, BookOpen, Wrench, FolderOpen } from "lucide-react";
import type { StageBrief } from "@/lib/stage-briefs";

// Per-stage class slots so each stage room keeps its own visual identity
// (SCIF amber vs boardroom cyan vs minimal white, etc.) while sharing the
// same mission-brief layout.
export interface MissionBriefTheme {
  panelClass: string;       // outer card — e.g. "stage-3-panel"
  headingClass: string;     // stage-specific heading treatment
  pillClass: string;        // small metadata chip
  accentTextClass: string;  // section titles
  bodyTextClass: string;    // paragraph body
  mutedTextClass: string;   // captions
  downloadBtnClass: string; // prominent CTA
  dividerClass?: string;    // optional horizontal rule treatment
}

interface Props {
  stageSlug: string;
  brief: StageBrief;
  theme: MissionBriefTheme;
  /** Absolute path to the PDF endpoint — the caller builds this. */
  pdfHref: string;
}

export function MissionBrief({ brief, theme, pdfHref }: Props) {
  return (
    <section className={`${theme.panelClass} p-7 sm:p-9 relative overflow-hidden`}>
      {/* Live "MISSION ACTIVE" indicator */}
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="relative flex w-2.5 h-2.5" aria-hidden="true">
            <span className={`${theme.downloadBtnClass} absolute inset-0 rounded-full opacity-70 animate-ping`} />
            <span className={`${theme.downloadBtnClass} relative inline-flex w-2.5 h-2.5 rounded-full`} />
          </span>
          <span className={`text-[10.5px] font-mono uppercase tracking-[0.25em] ${theme.accentTextClass}`}>
            Mission active
          </span>
        </div>
        <span className={theme.pillClass}>CAPSTONE</span>
      </div>

      <h2 className={`${theme.headingClass} text-2xl sm:text-3xl mb-4`}>Your mission brief</h2>

      {/* Scenario */}
      <div className="space-y-3 mb-6">
        {brief.missionBrief.map((p, i) => (
          <p key={i} className={`${theme.bodyTextClass} text-[15px] leading-relaxed`}>
            {p}
          </p>
        ))}
      </div>

      <div className={`mb-6 h-px ${theme.dividerClass ?? "bg-white/10"}`} />

      {/* Grading criteria */}
      <div className="mb-6">
        <div className={`flex items-center gap-2 mb-3 text-[10.5px] font-mono uppercase tracking-[0.2em] ${theme.accentTextClass}`}>
          <Target className="w-3 h-3" />
          What you will be graded on
        </div>
        <ul className="space-y-2">
          {brief.sections.map((s) => (
            <li key={s} className="flex gap-2.5 items-start">
              <span className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${theme.downloadBtnClass}`} />
              <span className={`${theme.bodyTextClass} text-sm leading-relaxed`}>{s}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Report section structure hint */}
      <div className="mb-6">
        <div className={`flex items-center gap-2 mb-3 text-[10.5px] font-mono uppercase tracking-[0.2em] ${theme.accentTextClass}`}>
          <FileText className="w-3 h-3" />
          How to structure your report
        </div>
        <p className={`${theme.bodyTextClass} text-sm leading-relaxed mb-2`}>
          Build your report as a Google Doc (or Word / Pages) and organise it using
          the headings above — each one a section. The executive summary goes first,
          referencing the evidence you gathered from the practical activities.
        </p>
        <p className={`${theme.mutedTextClass} text-xs leading-relaxed`}>
          Keep it tight — grader attention budget is real. Aim for clarity over length.
        </p>
      </div>

      {/* Practical activities preview (just titles + deliverables, full detail in PDF) */}
      <div className="mb-6">
        <div className={`flex items-center gap-2 mb-3 text-[10.5px] font-mono uppercase tracking-[0.2em] ${theme.accentTextClass}`}>
          <Wrench className="w-3 h-3" />
          Practical activities ({brief.practicalTasks.length})
        </div>
        <ol className="space-y-2">
          {brief.practicalTasks.map((t, i) => (
            <li key={t.id} className="flex gap-3 items-baseline">
              <span className={`shrink-0 font-mono text-[11px] ${theme.mutedTextClass}`}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className={`${theme.bodyTextClass} text-sm leading-relaxed`}>
                <span className="font-semibold">{t.title}</span>
                <span className={theme.mutedTextClass}> — {t.deliverable}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Resources — Drive folder CTA + tools/readings list */}
      <div className="mb-7">
        <div className={`flex items-center gap-2 mb-3 text-[10.5px] font-mono uppercase tracking-[0.2em] ${theme.accentTextClass}`}>
          <BookOpen className="w-3 h-3" />
          Resources
        </div>
        <a
          href={brief.resourcesDriveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-between gap-3 px-4 py-3 mb-3 rounded-lg ${theme.downloadBtnClass} text-white hover:opacity-90 transition-opacity`}
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
              {brief.resources.map((r) => (
                <li key={r.href} className="flex items-baseline gap-2">
                  <span className={`font-mono text-[10px] uppercase tracking-wider ${theme.mutedTextClass}`}>
                    {r.kind}
                  </span>
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 hover:underline"
                  >
                    {r.label}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Prominent CTA: download the full polished PDF */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <a
          href={pdfHref}
          download
          className={`${theme.downloadBtnClass} inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold uppercase tracking-[0.15em] hover:opacity-90 transition-opacity shadow-lg`}
          style={{ color: "white" }}
        >
          <Download className="w-4 h-4" />
          Download capstone brief
        </a>
        <p className={`${theme.mutedTextClass} text-xs leading-relaxed`}>
          A polished PDF with the full scenario, every practical activity, and all
          resources — for reading offline and working from.
        </p>
      </div>
    </section>
  );
}
