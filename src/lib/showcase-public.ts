// Cohort One finalist showcase — the public, publication-safe half.
// Nothing in this file may touch vote data. PublicShowcaseEntry is the ONLY
// shape that crosses into public HTML / client props; its keys are pinned by
// a test so a count, rank or percentage can never be added by accident.

export const SHOWCASE_KEY = "cohort-one";
export const SHOWCASE_PATH = "/showcase/cohort-one";

export const SHOWCASE_TRACKS = ["SOC_ANALYSIS", "ETHICAL_HACKING", "GRC"] as const;
export type ShowcaseTrack = (typeof SHOWCASE_TRACKS)[number];

export const TRACK_LABEL: Record<ShowcaseTrack, string> = {
  SOC_ANALYSIS: "SOC Analysis",
  ETHICAL_HACKING: "Ethical Hacking",
  GRC: "GRC",
};

// The ballot rule. Change it here before voting opens; the API validates
// against it and the UI renders from it, so nothing else needs rewriting.
export const BALLOT_RULE = {
  selectionsPerTrack: 1,
  requireEveryTrack: true,
} as const;

// Who may vote. "PUBLIC": anyone who verifies an email, one ballot per email.
// "COHORT_ONE_ROLL": only the frozen 506-person Cohort One roll.
export const VOTING_AUDIENCE: "PUBLIC" | "COHORT_ONE_ROLL" = "PUBLIC";

// Launch invariants. Publication and roll seeding fail closed on any mismatch.
export const EXPECTED_ENTRY_COUNT: Record<ShowcaseTrack, number> = {
  SOC_ANALYSIS: 4,
  ETHICAL_HACKING: 3,
  GRC: 3,
};
export const EXPECTED_ROLL_SIZE = 506;

export type PublicShowcaseEntry = {
  id: string;
  slug: string;
  track: ShowcaseTrack;
  finalistName: string;
  projectTitle: string;
  projectSummary: string;
  projectUrl: string | null;
  videoEmbedUrl: string | null;
  videoOpenUrl: string | null;
  thumbnailUrl: string | null;
};

export const PUBLIC_ENTRY_KEYS: readonly (keyof PublicShowcaseEntry)[] = [
  "id",
  "slug",
  "track",
  "finalistName",
  "projectTitle",
  "projectSummary",
  "projectUrl",
  "videoEmbedUrl",
  "videoOpenUrl",
  "thumbnailUrl",
];

export function isShowcaseTrack(value: unknown): value is ShowcaseTrack {
  return typeof value === "string" && (SHOWCASE_TRACKS as readonly string[]).includes(value);
}

export function isObjectId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{24}$/i.test(value);
}

// Only public https URLs on a real hostname. A submission sitting in the
// database is not proof of a safe link.
export function safePublicUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  if (
    !host.includes(".") ||
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ||
    host.includes(":")
  ) {
    return null;
  }
  return url.toString();
}

export function driveFileId(raw: string | null | undefined): string | null {
  const safe = safePublicUrl(raw);
  if (!safe) return null;
  const url = new URL(safe);
  if (url.hostname !== "drive.google.com") return null;
  const fromPath = url.pathname.match(/^\/file\/d\/([a-zA-Z0-9_-]{10,})(?:\/|$)/);
  if (fromPath) return fromPath[1];
  if (url.pathname === "/open") {
    const id = url.searchParams.get("id");
    if (id && /^[a-zA-Z0-9_-]{10,}$/.test(id)) return id;
  }
  return null;
}

// /file/d/<id>/view?usp=… → /file/d/<id>/preview. Query strings (usp=sharing,
// drivesdk, drive_link) are dropped; the id alone addresses the file.
export function driveEmbedUrl(raw: string | null | undefined): string | null {
  const id = driveFileId(raw);
  return id ? `https://drive.google.com/file/d/${id}/preview` : null;
}

// Drive serves a public poster frame for any publicly shared video file.
export function driveThumbnailUrl(raw: string | null | undefined): string | null {
  const id = driveFileId(raw);
  return id ? `https://lh3.googleusercontent.com/d/${id}=w1280` : null;
}

export function driveOpenUrl(raw: string | null | undefined): string | null {
  const id = driveFileId(raw);
  return id ? `https://drive.google.com/file/d/${id}/view` : null;
}

// Finalist names were typed in whatever case people chose ("Nada maach",
// "ETIGBUE ADAEZE CLARET"). Normalise only all-upper / all-lower words so a
// deliberate mixed-case name is left alone.
export function displayName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`
    .trim()
    .split(/\s+/)
    .map((word) =>
      word === word.toUpperCase() || word === word.toLowerCase()
        ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        : word,
    )
    .join(" ");
}

export function showcaseSlug(name: string, title: string): string {
  const base = `${name}-${title.split(/[:—–-]/)[0]}`
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base.slice(0, 64).replace(/-+$/, "");
}

// Deterministic per-viewer order: sort by a hash of (seed, id). The same seed
// gives the same order on every render and hydration; a different viewer gets
// a different order. Vote data is not an input and cannot become one.
// cyrb53: a fast, well-mixed 53-bit string hash. Order only needs to be
// deterministic and unbiased, not secret, and this keeps the module usable
// in client components.
function orderKey(value: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < value.length; i += 1) {
    const ch = value.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export function stableShuffle<T extends { id: string }>(items: readonly T[], seed: string): T[] {
  return items
    .map((item) => ({ item, key: orderKey(`${seed}:${item.id}`) }))
    .sort((a, b) => a.key - b.key || (a.item.id < b.item.id ? -1 : 1))
    .map((k) => k.item);
}

export function orderForViewer(entries: readonly PublicShowcaseEntry[], seed: string): PublicShowcaseEntry[] {
  return SHOWCASE_TRACKS.flatMap((track) =>
    stableShuffle(entries.filter((e) => e.track === track), `${seed}:${track}`),
  );
}

export type BallotSelections = Partial<Record<ShowcaseTrack, string>>;

// Shape check against BALLOT_RULE. Existence / publication / track match of
// each entry is checked against the database by the caller.
export function ballotShapeError(input: unknown): string | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return "Choose your projects before submitting.";
  const record = input as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!isShowcaseTrack(key)) return "That ballot contains an unknown track.";
    if (!isObjectId(record[key])) return "That ballot contains an invalid project.";
  }
  if (BALLOT_RULE.requireEveryTrack) {
    const missing = SHOWCASE_TRACKS.filter((t) => !record[t]);
    if (missing.length > 0) {
      return `Choose one project in ${missing.map((t) => TRACK_LABEL[t]).join(", ")} before submitting.`;
    }
  }
  if (Object.keys(record).length === 0) return "Choose at least one project.";
  return null;
}
