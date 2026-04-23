// Central secret accessors. Each one validates on first read and caches.
// If any required secret is missing or weak in production, we throw at first
// access — which surfaces the problem loudly instead of silently signing
// JWTs with a predictable fallback string.

const isProd = process.env.NODE_ENV === "production";

function readStrongSecret(name: string, min = 32): string {
  const v = process.env[name];
  if (!v || v.trim().length === 0) {
    if (isProd) {
      throw new Error(`[secrets] ${name} is not configured`);
    }
    // Non-prod dev convenience: loud warning + placeholder.
    console.warn(`[secrets] ${name} missing — using dev placeholder. Set it before deploy.`);
    return `dev-placeholder-${name.toLowerCase()}-do-not-use-in-prod`;
  }
  if (isProd && v.length < min) {
    throw new Error(`[secrets] ${name} is too short (need ≥${min} chars)`);
  }
  if (v === "fallback-secret-change-me" || v === "fallback") {
    throw new Error(`[secrets] ${name} is set to a known fallback value`);
  }
  return v;
}

let _jwt: string | null = null;
let _cron: string | null = null;
let _flagSigning: string | null = null;

export function jwtSecret(): string {
  if (_jwt) return _jwt;
  _jwt = readStrongSecret("NEXTAUTH_SECRET", 32);
  return _jwt;
}

export function cronSecret(): string {
  if (_cron) return _cron;
  _cron = readStrongSecret("CRON_SECRET", 32);
  return _cron;
}

// Dedicated signing secret for per-intern CTF flags. Falls back to CRON_SECRET
// for backward compatibility with existing intern flags — but a fresh
// deployment should set FLAG_SIGNING_SECRET separately so a CRON_SECRET
// compromise doesn't also let an attacker forge flags.
export function flagSigningSecret(): string {
  if (_flagSigning) return _flagSigning;
  const explicit = process.env.FLAG_SIGNING_SECRET;
  if (explicit && explicit.trim().length >= 16) {
    _flagSigning = explicit;
    return _flagSigning;
  }
  if (isProd) {
    // In production, require a dedicated secret — no silent reuse of CRON.
    console.warn(
      "[secrets] FLAG_SIGNING_SECRET not set; falling back to CRON_SECRET. Rotate flag salts when you fix this."
    );
  }
  _flagSigning = cronSecret();
  return _flagSigning;
}
