import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, CircleDot } from "lucide-react";
import { stageUrl } from "@/lib/stage-routes";
import type { StageSlug } from "@/lib/stage-routes";
import type { StageLandingTheme } from "@/lib/stage-landing-theme";

export interface BoardTask {
  id: string;
  order: number;
  title: string;
  description: string;
  maxPoints: number;
  widget: string;
}

interface Props {
  slug: StageSlug;
  theme: StageLandingTheme;
  tasks: BoardTask[];
  /** assignmentId -> raw submission status. */
  statusByTask: Map<string, string | undefined>;
}

function toneFor(status: string | undefined): {
  label: string;
  icon: React.ElementType;
  light: string;
  dark: string;
} {
  const s = (status ?? "").toUpperCase();
  if (s === "GRADED")
    return { label: "graded", icon: CheckCircle2, light: "bg-emerald-100 text-emerald-700 border-emerald-300", dark: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" };
  if (s === "LATE")
    return { label: "late", icon: Clock, light: "bg-rose-100 text-rose-700 border-rose-300", dark: "bg-rose-500/15 text-rose-300 border-rose-500/40" };
  if (s === "SUBMITTED" || s === "PENDING_REVIEW")
    return { label: "submitted", icon: Clock, light: "bg-amber-100 text-amber-700 border-amber-300", dark: "bg-amber-500/15 text-amber-300 border-amber-500/40" };
  return { label: "not started", icon: CircleDot, light: "bg-neutral-100 text-neutral-500 border-neutral-300", dark: "bg-white/5 text-white/45 border-white/15" };
}

// First clean sentence of a task brief — the "why this matters" preview.
// Task descriptions often open with character dialogue ("Amaka: '...'"),
// so we keep it short and trim trailing fragments.
export function previewOf(description: string): string {
  const flat = description.replace(/\s+/g, " ").trim();
  const sentenceEnd = flat.search(/[.!?]\s/);
  let preview = sentenceEnd > 0 ? flat.slice(0, sentenceEnd + 1) : flat;
  if (preview.length > 160) preview = preview.slice(0, 157).trimEnd() + "…";
  return preview;
}

// The mission board as one ordered sequence of desk work — a numbered
// timeline, not a scattered card grid. Each row tells the intern what the
// task is, a one-line "why this matters", and where it stands.
export function BoardTaskList({ slug, theme, tasks, statusByTask }: Props) {
  return (
    <ol className="space-y-3">
      {tasks.map((t) => {
        const tone = toneFor(statusByTask.get(t.id));
        const ToneIcon = tone.icon;
        return (
          <li key={t.id}>
            <Link
              href={stageUrl(slug, `/tasks/${t.order}`)}
              className={`${theme.cardClass} group flex items-start gap-4 p-4 sm:p-5 transition`}
            >
              <span
                className={`shrink-0 grid place-items-center w-10 h-10 rounded-xl text-sm font-bold ${theme.ctaBgClass} text-white`}
              >
                {String(t.order).padStart(2, "0")}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className={`${theme.bodyTextClass} font-semibold leading-snug`}>
                    {t.title}
                  </h3>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                      theme.light ? tone.light : tone.dark
                    }`}
                  >
                    <ToneIcon className="w-3 h-3" />
                    {tone.label}
                  </span>
                </div>

                <p className={`${theme.mutedTextClass} text-[12.5px] leading-relaxed mt-1`}>
                  {previewOf(t.description)}
                </p>

                <div className={`flex items-center gap-3 mt-2 text-[11px] font-mono ${theme.mutedTextClass}`}>
                  <span>{t.maxPoints} pts</span>
                  <span aria-hidden="true">·</span>
                  <span>{t.widget.replace(/_/g, " ").toLowerCase()}</span>
                  <span
                    className={`ml-auto inline-flex items-center gap-1 ${theme.accentTextClass} opacity-0 group-hover:opacity-100 transition-opacity`}
                  >
                    open task <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
