/**
 * Returning-candidate codes.
 *
 * A returning-candidate code is a one-time "come back" pass issued to an intern
 * who SUBMITTED a stage but was eliminated at Finalize. It is NOT issued to
 * people who never submitted.
 *
 * Lifecycle
 * ---------
 *   1. MINT   — src/app/api/admin/stage-results/route.ts (handleFinalize, the
 *               elimination branch) calls generateUniqueReturningCode() and
 *               stores it on the intern's PublicApplication row
 *               (returningCode + returningCodeIssuedAt + returningCodeStage).
 *               Minting is idempotent: a row that already has a code keeps it,
 *               so re-running Finalize never invalidates an emailed code.
 *   2. DELIVER — the same Finalize path passes the code into the elimination
 *               email (renderResultEmail), so the candidate receives it.
 *   3. REDEEM — when a future cohort's applications are open, the candidate
 *               enters the code on /apply. src/app/api/apply/route.ts validates
 *               it with redeemReturningCode() and, on success, flips their
 *               existing PublicApplication row to status "queued_approved"
 *               (auto-approved) and stamps returningCodeRedeemedAt.
 *
 * Binding rule
 * ------------
 * A code is bound to the email it was issued to. To redeem, the candidate must
 * apply with that same email address. This keeps redemption to a single row and
 * sidesteps the PublicApplication.email unique constraint.
 *
 * Persistence
 * -----------
 * Everything lives in the database (PublicApplication.returningCode*) and this
 * module — there is no hard-coded list. Any future maintainer or tool can read
 * the schema + this file to understand and operate the system. See
 * docs/RETURNING-CANDIDATE-CODES.md.
 */
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

// Human-friendly alphabet: no 0/O/1/I/L/U to avoid transcription errors when a
// candidate copies the code out of an email months later.
const ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789";

function segment(len: number): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** A fresh candidate code, e.g. "NF-ABCD-2345". Not checked for uniqueness. */
export function makeReturningCode(): string {
  return `NF-${segment(4)}-${segment(4)}`;
}

/** Normalize user input (emails, whitespace, case) before lookup. */
export function normalizeReturningCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * Allocate a code that does not collide with any existing one. The @unique
 * index is the real guard; this loop just avoids a create-time failure. With a
 * 30-char alphabet over 8 characters the space is ~6.5e11, so collisions are
 * effectively impossible — but we retry a few times to be safe.
 */
export async function generateUniqueReturningCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = makeReturningCode();
    const clash = await prisma.publicApplication.findFirst({
      where: { returningCode: code },
      select: { id: true },
    });
    if (!clash) return code;
  }
  throw new Error("returning-code: could not allocate a unique code after 8 attempts");
}

export type RedeemResult =
  | { ok: true; applicationId: string }
  | { ok: false; reason: "not_found" | "already_used" | "email_mismatch" };

/**
 * Validate and redeem a code for the applicant identified by `email`.
 * On success the owning PublicApplication row is flipped to "queued_approved"
 * (auto-approved) and stamped redeemed. Contact/answer fields are refreshed from
 * the new submission via `refresh` so the returning application carries current
 * details. The caller supplies the already-normalized email.
 */
export async function redeemReturningCode(
  rawCode: string,
  normalizedEmail: string,
  refresh: {
    fullName: string;
    country: string;
    ageRange: string;
    gender: string | null;
    currentStatus: string;
    experience: string;
    trackInterest: string;
    dedication: string;
    goals: string;
    whyPickYou: string;
    referralSource: string | null;
  },
): Promise<RedeemResult> {
  const code = normalizeReturningCode(rawCode);
  const owner = await prisma.publicApplication.findFirst({
    where: { returningCode: code },
    select: { id: true, email: true, returningCodeRedeemedAt: true },
  });
  if (!owner) return { ok: false, reason: "not_found" };
  if (owner.returningCodeRedeemedAt) return { ok: false, reason: "already_used" };
  if (owner.email.toLowerCase() !== normalizedEmail) return { ok: false, reason: "email_mismatch" };

  await prisma.publicApplication.update({
    where: { id: owner.id },
    data: {
      ...refresh,
      // Re-enter the pipeline as an approved applicant for the new cohort.
      status: "queued_approved",
      stage: -1,
      stageStatus: "none",
      returningCodeRedeemedAt: new Date(),
    },
  });
  return { ok: true, applicationId: owner.id };
}
