const REQUIRED = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "SMTP_USER",
  "SMTP_PASS",
] as const;

type RequiredKey = (typeof REQUIRED)[number];

function assertEnv(): Record<RequiredKey, string> {
  const missing: string[] = [];
  const weak: string[] = [];
  const out = {} as Record<RequiredKey, string>;

  for (const key of REQUIRED) {
    const v = process.env[key];
    if (!v || !v.trim()) {
      missing.push(key);
      continue;
    }
    out[key] = v;
  }

  if (process.env.NODE_ENV === "production") {
    const secret = process.env.NEXTAUTH_SECRET;
    if (secret && (secret === "fallback-secret-change-me" || secret.length < 32)) {
      weak.push("NEXTAUTH_SECRET (must be >=32 chars and not the fallback)");
    }
  }

  const problems = [...missing.map((k) => `missing ${k}`), ...weak];
  if (problems.length > 0) {
    const msg = `Environment configuration error: ${problems.join("; ")}`;
    if (process.env.NODE_ENV === "production") {
      throw new Error(msg);
    } else {
      console.warn(`[env] ${msg}`);
    }
  }

  return out;
}

export const env = assertEnv();
