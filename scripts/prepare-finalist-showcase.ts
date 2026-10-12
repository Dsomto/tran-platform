import { config } from "dotenv";
config();
config({ path: ".env.local" });

/**
 * Prepare the Cohort One finalist showcase. Dry-run is the default.
 *
 *   npx tsx scripts/prepare-finalist-showcase.ts
 *   COMMIT=1 npx tsx scripts/prepare-finalist-showcase.ts
 *
 * Additive and idempotent. Touches only the six FinalistShowcase* collections:
 *   1. unique/lookup indexes (named as `prisma db push` names them)
 *   2. the frozen voter roll — exactly 506, or nothing is written
 *   3. one entry per consented finalist — exactly 4 / 3 / 3, or nothing is written
 *   4. the settings record: published, voting DRAFT
 * An existing roll is verified, never widened. Existing entries and settings
 * are left as an admin set them. Never opens voting and never sends email.
 */
const COMMIT = process.env.COMMIT === "1";

const INDEXES: Record<string, { key: Record<string, 1 | -1>; name: string; unique?: boolean }[]> = {
  FinalistShowcaseEntry: [
    { key: { submissionId: 1 }, name: "FinalistShowcaseEntry_submissionId_key", unique: true },
    { key: { slug: 1 }, name: "FinalistShowcaseEntry_slug_key", unique: true },
    { key: { track: 1, published: 1 }, name: "FinalistShowcaseEntry_track_published_idx" },
  ],
  FinalistShowcaseSettings: [{ key: { key: 1 }, name: "FinalistShowcaseSettings_key_key", unique: true }],
  FinalistShowcaseEligibleVoter: [
    { key: { publicApplicationId: 1 }, name: "FinalistShowcaseEligibleVoter_publicApplicationId_key", unique: true },
    { key: { emailHash: 1 }, name: "FinalistShowcaseEligibleVoter_emailHash_key", unique: true },
  ],
  FinalistShowcaseVerification: [
    { key: { voterId: 1, createdAt: -1 }, name: "FinalistShowcaseVerification_voterId_createdAt_idx" },
    { key: { signalHash: 1 }, name: "FinalistShowcaseVerification_signalHash_idx" },
  ],
  FinalistShowcaseBallot: [
    { key: { voterId: 1 }, name: "FinalistShowcaseBallot_voterId_key", unique: true },
    { key: { signalHash: 1 }, name: "FinalistShowcaseBallot_signalHash_idx" },
  ],
  FinalistShowcaseVote: [
    { key: { ballotId: 1, track: 1 }, name: "FinalistShowcaseVote_ballotId_track_key", unique: true },
    { key: { entryId: 1 }, name: "FinalistShowcaseVote_entryId_idx" },
  ],
};

async function main() {
  const { prisma } = await import("../src/lib/db");
  const { planShowcaseEntries, planVoterRoll } = await import("../src/lib/showcase-entries");
  const { missingUniqueIndexes, launchBlockers } = await import("../src/lib/showcase-admin");
  const { SHOWCASE_KEY } = await import("../src/lib/showcase-public");

  console.log(COMMIT ? "MODE: COMMIT" : "MODE: DRY RUN (set COMMIT=1 to apply)");

  // Plans are read-only and throw (fail closed) on any mismatch.
  const roll = await planVoterRoll();
  const entries = await planShowcaseEntries();
  console.log(`Roll plan: ${roll.length} unique eligible emails`);
  console.log(`Entry plan: ${entries.length} entries`);
  for (const e of entries) console.log(`  ${e.track.padEnd(16)} ${e.slug}`);

  const existingRoll = await prisma.finalistShowcaseEligibleVoter.findMany({ select: { emailHash: true } });
  if (existingRoll.length > 0) {
    const planned = new Set(roll.map((r) => r.emailHash));
    const same = existingRoll.length === planned.size && existingRoll.every((r) => planned.has(r.emailHash));
    if (!same) throw new Error("Stored voter roll differs from the audited audience. Refusing to change it.");
  }
  const existingEntries = new Set(
    (await prisma.finalistShowcaseEntry.findMany({ select: { submissionId: true } })).map((e) => e.submissionId),
  );
  const newEntries = entries.filter((e) => !existingEntries.has(e.submissionId));
  const settings = await prisma.finalistShowcaseSettings.findUnique({ where: { key: SHOWCASE_KEY } });

  console.log(`Roll: ${existingRoll.length ? `already present (${existingRoll.length}, verified identical)` : `will create ${roll.length}`}`);
  console.log(`Entries: ${existingEntries.size} present, will create ${newEntries.length}`);
  console.log(`Settings: ${settings ? `present (published=${settings.published}, voting=${settings.votingState}) — left as is` : "will create (published, DRAFT)"}`);

  if (!COMMIT) {
    await prisma.$disconnect();
    return;
  }

  for (const [collection, indexes] of Object.entries(INDEXES)) {
    await prisma.$runCommandRaw({
      createIndexes: collection,
      indexes: indexes.map((i) => ({ key: i.key, name: i.name, ...(i.unique ? { unique: true } : {}) })),
    });
  }
  const missing = await missingUniqueIndexes();
  if (missing.length > 0) throw new Error(`Indexes still missing: ${missing.join("; ")}`);
  console.log("Indexes: ensured");

  if (existingRoll.length === 0) {
    const res = await prisma.finalistShowcaseEligibleVoter.createMany({ data: roll });
    console.log(`Roll: created ${res.count}`);
  }
  const now = new Date();
  for (const e of newEntries) {
    await prisma.finalistShowcaseEntry.create({
      data: {
        submissionId: e.submissionId,
        slug: e.slug,
        track: e.track,
        published: true,
        publishedAt: now,
        reviewedVideoUrl: null,
        reviewedProjectUrl: null,
        linkNote: null,
      },
    });
  }
  console.log(`Entries: created ${newEntries.length}`);
  if (!settings) {
    await prisma.finalistShowcaseSettings.create({
      data: { key: SHOWCASE_KEY, published: true, votingState: "DRAFT", opensAt: null, closesAt: null, updatedById: null },
    });
    console.log("Settings: created (published, DRAFT)");
  }

  const blockers = await launchBlockers();
  console.log(blockers.length === 0 ? "Launch readiness: all checks pass" : `Launch readiness blockers: ${blockers.join(" | ")}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
