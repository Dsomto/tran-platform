import type { StageTheme } from "./StageShell";

/**
 * Foundation rooms keep distinct narrative identities. Advanced rooms use a
 * shared assessment surface with a stage-specific identity and difficulty.
 *
 * Each room gets its own accent colour, background texture and logo glyph so
 * the interns feel like they are walking into a different world when they
 * progress. The backgroundClass values reference utility classes that each
 * stage folder registers in its local layout.
 */
export const STAGE_THEMES: Record<StageTheme["slug"], StageTheme> = {
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
  "stage-5": {
    slug: "stage-5",
    name: "Signal",
    codename: "Advanced Stage · Project 1",
    accent: "emerald",
    accentHex: "#16a34a",
    backgroundClass: "bg-advanced-stage",
    logoGlyph: "A1",
  },
  "stage-6": {
    slug: "stage-6",
    name: "Exposure",
    codename: "Advanced Stage · Project 2",
    accent: "amber",
    accentHex: "#d97706",
    backgroundClass: "bg-advanced-stage",
    logoGlyph: "A2",
  },
  "stage-7": {
    slug: "stage-7",
    name: "Architecture",
    codename: "Advanced Stage · Project 3",
    accent: "blue",
    accentHex: "#2563eb",
    backgroundClass: "bg-advanced-stage",
    logoGlyph: "A3",
  },
  "stage-8": {
    slug: "stage-8",
    name: "Adversity",
    codename: "Advanced Stage · Project 4",
    accent: "rose",
    accentHex: "#e11d48",
    backgroundClass: "bg-advanced-stage",
    logoGlyph: "A4",
  },
  "stage-9": {
    slug: "stage-9",
    name: "The Final Case",
    codename: "Advanced Stage · Capstone",
    accent: "red",
    accentHex: "#dc2626",
    backgroundClass: "bg-advanced-stage",
    logoGlyph: "A5",
  },
};
