import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { jwtSecret } from "./secrets";

export type StageSlug = "stage-0" | "stage-1" | "stage-2" | "stage-3" | "stage-4";

export const STAGE_SLUGS: StageSlug[] = [
  "stage-0",
  "stage-1",
  "stage-2",
  "stage-3",
  "stage-4",
];

export const STAGE_SLUG_TO_ENUM: Record<StageSlug, "STAGE_0" | "STAGE_1" | "STAGE_2" | "STAGE_3" | "STAGE_4"> = {
  "stage-0": "STAGE_0",
  "stage-1": "STAGE_1",
  "stage-2": "STAGE_2",
  "stage-3": "STAGE_3",
  "stage-4": "STAGE_4",
};

export interface StageDoorSession {
  internId: string;       // database intern record id
  internCode: string;     // UBI-YYYY-NNNN
  stage: StageSlug;
  iat: number;
}

export function doorCookieName(stage: StageSlug): string {
  return `${stage}-door`;
}

export function signDoorToken(payload: Omit<StageDoorSession, "iat">): string {
  return jwt.sign(payload, jwtSecret(), { expiresIn: "7d" });
}

export function verifyDoorToken(token: string): StageDoorSession | null {
  try {
    return jwt.verify(token, jwtSecret()) as StageDoorSession;
  } catch {
    return null;
  }
}

export async function getDoorSession(stage: StageSlug): Promise<StageDoorSession | null> {
  const store = await cookies();
  const tok = store.get(doorCookieName(stage))?.value;
  if (!tok) return null;
  const session = verifyDoorToken(tok);
  if (!session || session.stage !== stage) return null;
  return session;
}

/* ─── Per-stage password encoding rules ────────────────────────────────────
 *
 * Each stage accepts the intern's password in a different encoding. This
 * doubles as a mini crypto exercise just to enter the room — and it reinforces
 * the concepts the stage teaches.
 *
 * Stage 0 — plain text
 * Stage 1 — base64 (the intern base64-encodes their password before submitting)
 * Stage 2 — binary (each char of the password as 8-bit binary, space-separated)
 * Stage 3 — hex (UTF-8 hex encoding)
 * Stage 4 — ROT13 then base64 (two layers — capstone-level)
 *
 * decodeForStage takes the submitted string and returns the *underlying*
 * plaintext password, or null if the encoding is invalid for that stage.
 */

export function decodeForStage(stage: StageSlug, input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  try {
    switch (stage) {
      case "stage-0": {
        return raw;
      }
      case "stage-1": {
        // Base64
        if (!/^[A-Za-z0-9+/=]+$/.test(raw)) return null;
        const buf = Buffer.from(raw, "base64");
        const decoded = buf.toString("utf8");
        // Round-trip sanity — reject near-empty decodes
        if (!decoded || Buffer.from(decoded, "utf8").toString("base64").replace(/=+$/, "") !== raw.replace(/=+$/, "")) {
          return null;
        }
        return decoded;
      }
      case "stage-2": {
        // Binary, e.g. "01001000 01101001"
        const parts = raw.split(/\s+/);
        if (parts.some((p) => !/^[01]{8}$/.test(p))) return null;
        const bytes = parts.map((b) => parseInt(b, 2));
        return Buffer.from(bytes).toString("utf8");
      }
      case "stage-3": {
        // Hex — accept optional "0x" prefix, must be even-length
        const cleaned = raw.replace(/^0x/i, "").replace(/\s+/g, "");
        if (!/^[0-9a-f]+$/i.test(cleaned) || cleaned.length % 2 !== 0) return null;
        return Buffer.from(cleaned, "hex").toString("utf8");
      }
      case "stage-4": {
        // ROT13 applied to a base64 string — decode base64 first, then ROT13
        if (!/^[A-Za-z0-9+/=]+$/.test(raw)) return null;
        const b64 = Buffer.from(raw, "base64").toString("utf8");
        const rotated = b64.replace(/[a-zA-Z]/g, (c) => {
          const code = c.charCodeAt(0);
          const base = code >= 97 ? 97 : 65;
          return String.fromCharCode(((code - base + 13) % 26) + base);
        });
        return rotated;
      }
    }
  } catch {
    return null;
  }
}

/** Human-readable hint text per stage, shown on the themed login page. */
export function stageEncodingHint(stage: StageSlug): { rule: string; example: string } {
  switch (stage) {
    case "stage-0":
      return { rule: "Enter your password exactly as it was emailed.", example: "swift-panther-42" };
    case "stage-1":
      return { rule: "Base64-encode your emailed password before submitting.", example: "c3dpZnQtcGFudGhlci00Mg==" };
    case "stage-2":
      return { rule: "Convert each character of your password to its 8-bit binary, separated by spaces.", example: "01110011 01110111 01101001 ..." };
    case "stage-3":
      return { rule: "Hex-encode your password (UTF-8 bytes as hexadecimal).", example: "73776966742d70616e746865722d3432" };
    case "stage-4":
      return { rule: "Apply ROT13 to your password, then base64-encode the result.", example: "swift-panther-42 → fjvsg-cnagure-42 → Zmp2c2ctY25hZ3VyZS00Mg==" };
  }
}

/**
 * The password we keep for stage-door logins is a short human-memorable
 * phrase stored plaintext on the Intern row (separate from the main account
 * password, which stays bcrypt-hashed on User.password).  That way we can
 * regenerate the stage-door password, email it, and let the intern move
 * between encodings per stage without needing to re-hash at each door.
 */
export function generateDoorCode(): string {
  const adjectives = [
    "swift", "silent", "bronze", "cobalt", "crimson", "ember", "frost",
    "lunar", "neon", "obsidian", "quantum", "solar", "umbra", "vivid", "zephyr",
  ];
  const nouns = [
    "panther", "hawk", "falcon", "cipher", "lantern", "compass", "raven",
    "orbit", "summit", "anchor", "phoenix", "beacon", "monsoon", "canyon",
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(10 + Math.random() * 90);
  return `${adj}-${noun}-${num}`;
}
