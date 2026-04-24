// Single source of truth for the public-facing app URL used in emails and
// anywhere we need an absolute link. Reads PUBLIC_APP_URL from env; falls back
// to the production domain rather than guessing from VERCEL_URL (which resolves
// to the branch-deploy URL, not the custom domain).

const PRODUCTION_FALLBACK = "https://ubuntubridgeinitiatives.org";

export function publicAppUrl(): string {
  const env = process.env.PUBLIC_APP_URL?.trim();
  const base = env && env.length > 0 ? env : PRODUCTION_FALLBACK;
  return base.replace(/\/+$/, "");
}
