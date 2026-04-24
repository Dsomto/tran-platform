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

// decodeForStage used to apply a per-stage decoding rule (base64, binary, hex,
// ROT13+b64). We stripped that layer — every stage now accepts the password
// exactly as it was emailed. The signature is retained so the stage-login
// route stays untouched.
export function decodeForStage(_stage: StageSlug, input: string): string | null {
  const raw = input.trim();
  return raw || null;
}

/** Human-readable hint text shown on the themed login page. */
export function stageEncodingHint(_stage: StageSlug): { rule: string; example: string } {
  return {
    rule: "Enter your password exactly as it was emailed.",
    example: "your-emailed-password",
  };
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
