// Per-stage secret path tokens. Each stage is reached at domain.com/<token>/...
// Tokens are hard-to-guess random alphanumerics so the stages aren't casually
// discoverable from the landing page. Rotate by editing this file.
//
// Why this exists: Vercel Hobby doesn't support wildcard subdomains, so instead
// of stage-1.domain.com we use domain.com/<token> and rewrite internally to
// /subdomains/stage-1/...

export const STAGE_TOKENS = {
  "stage-0": "k7m2xq9bt4",
  "stage-1": "j9p3r8nhv2",
  "stage-2": "w4c7qy5dlm",
  "stage-3": "z2f8gt3kxs",
  "stage-4": "h6vb1wnq7e",
} as const;

export type StageSlug = keyof typeof STAGE_TOKENS;

// Reverse map: token → stage slug (for proxy.ts lookup).
export const TOKEN_TO_STAGE: Record<string, StageSlug> = Object.fromEntries(
  Object.entries(STAGE_TOKENS).map(([slug, token]) => [token, slug as StageSlug])
);

export function stageUrl(slug: StageSlug, subpath: string = ""): string {
  const token = STAGE_TOKENS[slug];
  const clean = subpath.startsWith("/") ? subpath : subpath ? `/${subpath}` : "";
  return `/${token}${clean}`;
}
