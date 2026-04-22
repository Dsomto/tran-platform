import type { StageTheme } from "./StageShell";

/**
 * Five distinct visual identities — one per foundation room.
 *
 * Each room gets its own accent colour, background texture and logo glyph so
 * the interns feel like they are walking into a different world when they
 * progress. The backgroundClass values reference utility classes that each
 * stage folder registers in its local layout (bg-stage-0, bg-stage-1, …).
 */
export const STAGE_THEMES: Record<"stage-0" | "stage-1" | "stage-2" | "stage-3" | "stage-4", StageTheme> = {
  "stage-0": {
    slug: "stage-0",
    name: "Induction at the Gate",
    codename: "Operation Root Access · Chapter 1",
    accent: "emerald",
    accentHex: "#34d399",
    backgroundClass: "bg-stage-0",
    logoGlyph: "◆0",
  },
  "stage-1": {
    slug: "stage-1",
    name: "Ciphers & Secrets",
    codename: "Operation Root Access · Chapter 2",
    accent: "violet",
    accentHex: "#a78bfa",
    backgroundClass: "bg-stage-1",
    logoGlyph: "◇1",
  },
  "stage-2": {
    slug: "stage-2",
    name: "The Attack Surface",
    codename: "Operation Root Access · Chapter 3",
    accent: "rose",
    accentHex: "#fb7185",
    backgroundClass: "bg-stage-2",
    logoGlyph: "◢2",
  },
  "stage-3": {
    slug: "stage-3",
    name: "Inside the Walls",
    codename: "Operation Root Access · Chapter 4",
    accent: "amber",
    accentHex: "#fbbf24",
    backgroundClass: "bg-stage-3",
    logoGlyph: "◉3",
  },
  "stage-4": {
    slug: "stage-4",
    name: "The Debrief",
    codename: "Operation Root Access · Finale",
    accent: "cyan",
    accentHex: "#22d3ee",
    backgroundClass: "bg-stage-4",
    logoGlyph: "☰4",
  },
};
