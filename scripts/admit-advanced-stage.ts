import { config } from "dotenv";
config();
config({ path: ".env.local" });

import { readFileSync } from "node:fs";
import { PrismaClient, Stage, Track } from "../src/generated/prisma";

/**
 * Admit an explicitly selected cohort into Advanced 1. Dry-run is the default.
 *
 * INPUT=advanced-stage-staff/admissions.json npx tsx scripts/admit-advanced-stage.ts
 * INPUT=advanced-stage-staff/admissions.json COMMIT=1 npx tsx scripts/admit-advanced-stage.ts
 */
const prisma = new PrismaClient();
const COMMIT = process.env.COMMIT === "1";
const ALLOW_REACTIVATE = process.env.ALLOW_REACTIVATE === "1";
const INPUT = process.env.INPUT;
const VALID_TRACKS = new Set<string>(Object.values(Track));

type Admission = { email: string; track: Track };

function loadAdmissions(): Admission[] {
  if (!INPUT) throw new Error("INPUT must point to a JSON admissions file.");
  const parsed = JSON.parse(readFileSync(INPUT, "utf8")) as unknown;
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Admissions file must be a non-empty JSON array.");
  }

  const seen = new Set<string>();
  return parsed.map((row, index) => {
    if (!row || typeof row !== "object") throw new Error(`Row ${index + 1} is not an object.`);
    const email = String((row as { email?: unknown }).email ?? "").trim().toLowerCase();
    const track = String((row as { track?: unknown }).track ?? "") as Track;
    if (!email.includes("@")) throw new Error(`Row ${index + 1} has an invalid email.`);
    if (!VALID_TRACKS.has(track)) throw new Error(`Row ${index + 1} has invalid track ${track}.`);
    if (seen.has(email)) throw new Error(`Duplicate admission: ${email}`);
    seen.add(email);
    return { email, track };
  });
}

async function main() {
  const admissions = loadAdmissions();
  const checked: Array<Admission & {
    userId: string;
    internId: string;
    publicApplicationId: string;
    fromStage: Stage;
    alreadyAdmitted: boolean;
    reactivating: boolean;
  }> = [];

  for (const admission of admissions) {
    const user = await prisma.user.findFirst({
      where: { email: { equals: admission.email, mode: "insensitive" } },
      select: {
        id: true,
        email: true,
        intern: {
          select: {
            id: true,
            currentStage: true,
            track: true,
            isActive: true,
            eliminatedAt: true,
            reports: { where: { stage: Stage.STAGE_4 }, select: { status: true }, take: 1 },
          },
        },
      },
    });
    if (!user?.intern) throw new Error(`No intern account found for ${admission.email}.`);
    const publicApplication = await prisma.publicApplication.findFirst({
      where: { email: { equals: admission.email, mode: "insensitive" } },
      select: { id: true, internId: true },
    });
    if (!publicApplication?.internId) {
      throw new Error(`${admission.email} has no PublicApplication intern ID; admission would create inconsistent markers.`);
    }

    const stageNumber = Number(user.intern.currentStage.replace("STAGE_", ""));
    const alreadyAdmitted = stageNumber >= 5;
    if (alreadyAdmitted && user.intern.track !== admission.track) {
      throw new Error(`${admission.email} is already advanced on ${user.intern.track}; refusing a track change.`);
    }
    if (!alreadyAdmitted && user.intern.currentStage !== Stage.STAGE_4) {
      throw new Error(`${admission.email} is at ${user.intern.currentStage}, not STAGE_4.`);
    }
    if (!alreadyAdmitted && user.intern.reports[0]?.status !== "PASSED") {
      throw new Error(`${admission.email} does not have a PASSED Stage 4 report.`);
    }
    const reactivating = !user.intern.isActive || user.intern.eliminatedAt !== null;
    if (reactivating && !ALLOW_REACTIVATE) {
      throw new Error(
        `${admission.email} is inactive or eliminated; refusing reactivation. ` +
        "Use ALLOW_REACTIVATE=1 only after an explicit integrity review."
      );
    }

    checked.push({
      ...admission,
      userId: user.id,
      internId: user.intern.id,
      publicApplicationId: publicApplication.id,
      fromStage: user.intern.currentStage,
      alreadyAdmitted,
      reactivating,
    });
  }

  const counts = checked.reduce<Record<string, number>>((acc, row) => {
    acc[row.track] = (acc[row.track] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`Mode: ${COMMIT ? "COMMIT" : "DRY RUN"}`);
  console.log(`Validated ${checked.length} admissions: ${JSON.stringify(counts)}`);

  for (const row of checked) {
    if (row.alreadyAdmitted) {
      console.log(`SKIP already admitted ${row.email} (${row.track})`);
      continue;
    }
    console.log(
      `${COMMIT ? "ADMIT" : "WOULD ADMIT"} ${row.email} -> STAGE_5 / ${row.track}` +
      (row.reactivating ? " [EXPLICIT REACTIVATION]" : "")
    );
    if (!COMMIT) continue;

    await prisma.$transaction(async (tx) => {
      await tx.intern.update({
        where: { id: row.internId },
        data: {
          currentStage: Stage.STAGE_5,
          track: row.track,
          isActive: true,
          eliminatedAt: null,
          finalist: false,
        },
      });
      await tx.stageHistory.create({
        data: {
          internId: row.internId,
          fromStage: row.fromStage,
          toStage: Stage.STAGE_5,
          promotedBy: "advanced-admission-script",
          reason: "Selected for the Advanced Stage cohort",
        },
      });
      await tx.publicApplication.update({
        where: { id: row.publicApplicationId },
        data: { stage: 5, stageStatus: "advanced" },
      });
    });
  }

  console.log(COMMIT ? "Admission complete." : "Dry run complete; no records changed. Set COMMIT=1 after review.");
}

main()
  .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); })
  .finally(() => prisma.$disconnect());
