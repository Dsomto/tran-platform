// One source of truth for the Tailwind class bundle each foundation room
// uses on its landing page and mission board.
//
// Before this file existed, every stage page.tsx and every board page.tsx
// re-declared the same nine-field object inline — five copies drifting out
// of sync. StageLanding, BoardRecap, StageJourneyMap and BoardTaskList all
// read from here instead.

import type { StageSlug } from "./stage-routes";

export interface StageLandingTheme {
  slug: StageSlug;
  /** Static card surface — a stage-local CSS class (e.g. `stage-0-panel`).
   *  No hover movement; use for briefing sections that are not clickable. */
  panelClass: string;
  /** Interactive card surface — panel plus a hover-lift. Use only on
   *  elements that are actually clickable (task links, etc.). */
  cardClass: string;
  /** Heading colour/weight class (e.g. `stage-0-heading`). */
  headingClass: string;
  /** Small uppercase pill class (e.g. `stage-0-pill`). */
  pillClass: string;
  /** Accent text colour. */
  accentTextClass: string;
  /** Body copy colour. */
  bodyTextClass: string;
  /** Muted / caption colour. */
  mutedTextClass: string;
  /** Solid accent background for primary buttons. */
  ctaBgClass: string;
  /** Hover state for the primary button. */
  ctaHoverClass: string;
  /** Hairline border colour. */
  dividerClass: string;
  /** True when this room renders on a light surface (stages 0 and 2). Lets
   *  shared components pick hover/zebra tints that read on the right
   *  background without each call site special-casing it. */
  light: boolean;
  /** Subtle inset surface that reads against this room's panel — a dark
   *  wash on light stages, a light wash on dark ones. Use for cards nested
   *  inside a panel (desk note, capstone items, journey steps). */
  softBgClass: string;
  /** Hover companion to softBgClass. */
  softHoverClass: string;
}

export const STAGE_LANDING_THEMES: Record<StageSlug, StageLandingTheme> = {
  "stage-0": {
    slug: "stage-0",
    panelClass: "stage-0-panel",
    cardClass: "stage-0-panel stage-0-card",
    headingClass: "stage-0-heading",
    pillClass: "stage-0-pill",
    accentTextClass: "text-emerald-700",
    bodyTextClass: "text-neutral-700",
    mutedTextClass: "text-neutral-500",
    ctaBgClass: "bg-emerald-600",
    ctaHoverClass: "hover:bg-emerald-700",
    dividerClass: "border-neutral-200",
    light: true,
    softBgClass: "bg-neutral-900/[0.035]",
    softHoverClass: "hover:bg-neutral-900/[0.06]",
  },
  "stage-1": {
    slug: "stage-1",
    panelClass: "stage-1-panel",
    cardClass: "stage-1-panel stage-1-card",
    headingClass: "stage-1-heading",
    pillClass: "stage-1-pill",
    // Stage 1 renders on #fafafa (src/app/subdomains/stage-1/theme.css),
    // not on the dark background the original palette assumed. The
    // violet-300 / violet-50 / violet-200 tints were invisible on white —
    // interns reported the entire brief was unreadable. Mirror stage-2's
    // light-theme palette with violet swapped in for rose.
    accentTextClass: "text-violet-700",
    bodyTextClass: "text-neutral-800",
    mutedTextClass: "text-neutral-600",
    ctaBgClass: "bg-violet-600",
    ctaHoverClass: "hover:bg-violet-700",
    dividerClass: "border-violet-100",
    light: true,
    softBgClass: "bg-neutral-900/[0.035]",
    softHoverClass: "hover:bg-neutral-900/[0.06]",
  },
  "stage-2": {
    slug: "stage-2",
    panelClass: "stage-2-panel",
    cardClass: "stage-2-panel stage-2-card",
    headingClass: "stage-2-heading",
    pillClass: "stage-2-pill",
    accentTextClass: "text-rose-700",
    bodyTextClass: "text-neutral-700",
    mutedTextClass: "text-neutral-500",
    ctaBgClass: "bg-rose-600",
    ctaHoverClass: "hover:bg-rose-700",
    dividerClass: "border-rose-100",
    light: true,
    softBgClass: "bg-neutral-900/[0.035]",
    softHoverClass: "hover:bg-neutral-900/[0.06]",
  },
  "stage-3": {
    slug: "stage-3",
    panelClass: "stage-3-panel",
    cardClass: "stage-3-panel stage-3-card",
    headingClass: "stage-3-heading",
    pillClass: "stage-3-pill",
    accentTextClass: "text-amber-400",
    bodyTextClass: "text-amber-50/85",
    mutedTextClass: "text-amber-200/55",
    ctaBgClass: "bg-amber-500",
    ctaHoverClass: "hover:bg-amber-600",
    dividerClass: "border-amber-500/20",
    light: false,
    softBgClass: "bg-white/5",
    softHoverClass: "hover:bg-white/[0.08]",
  },
  "stage-4": {
    slug: "stage-4",
    panelClass: "stage-4-panel",
    cardClass: "stage-4-panel stage-4-card",
    headingClass: "stage-4-heading",
    pillClass: "stage-4-pill",
    accentTextClass: "text-cyan-300",
    bodyTextClass: "text-cyan-50/85",
    mutedTextClass: "text-cyan-200/55",
    ctaBgClass: "bg-cyan-500",
    ctaHoverClass: "hover:bg-cyan-600",
    dividerClass: "border-cyan-400/20",
    light: false,
    softBgClass: "bg-white/5",
    softHoverClass: "hover:bg-white/[0.08]",
  },
};
