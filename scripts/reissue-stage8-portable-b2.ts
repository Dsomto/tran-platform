import { createHash, createHmac } from "node:crypto";
import { createReadStream, readFileSync } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import { resolvedInternCode } from "../src/lib/intern-code";
import { Stage, Track } from "../src/generated/prisma";

config();
config({ path: ".env.local", override: true });

type TrackKey = "soc_analysis" | "ethical_hacking" | "grc";
type Artifact = {
  track: TrackKey;
  stage: "STAGE_8";
  revision: "B2";
  artifact_key: string;
  size_bytes: number;
  sha256: string;
};

const TRACK_BY_KEY = {
  soc_analysis: Track.SOC_ANALYSIS,
  ethical_hacking: Track.ETHICAL_HACKING,
  grc: Track.GRC,
} as const;
const KEY_BY_TRACK = {
  [Track.SOC_ANALYSIS]: "soc_analysis",
  [Track.ETHICAL_HACKING]: "ethical_hacking",
  [Track.GRC]: "grc",
} as const;
const EXPECTED = {
  [Track.SOC_ANALYSIS]: 36,
  [Track.ETHICAL_HACKING]: 22,
  [Track.GRC]: 8,
} as const;

function canonicalUnsigned(value: Record<string, unknown>): string {
  return JSON.stringify(Object.fromEntries(Object.keys(value).sort().map((key) => [key, value[key]])));
}

async function sha256(file: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const digest = createHash("sha256");
    const stream = createReadStream(file);
    stream.on("data", (block) => digest.update(block));
    stream.on("error", reject);
    stream.on("end", () => resolve(digest.digest("hex")));
  });
}

async function main() {
  const { prisma } = await import("../src/lib/db");
  const commit = process.env.COMMIT === "1";
  const secret = process.env.ADVANCED_ARTIFACT_SECRET;
  if (!secret || secret.length < 32) throw new Error("ADVANCED_ARTIFACT_SECRET must be at least 32 characters");

  const root = path.resolve(process.env.ADVANCED_STAGE_ARTIFACT_ROOT ?? "advanced-stage-artifacts");
  const manifest = JSON.parse(
    readFileSync(process.env.SHARED_RELEASE_MANIFEST ?? `${root}/manifest.json`, "utf8")
  ) as { maximum_artifact_bytes: number; artifacts: Artifact[] };
  const releases = manifest.artifacts.filter((item) => item.stage === "STAGE_8");
  if (releases.length !== 3 || releases.some((item) => item.revision !== "B2")) {
    throw new Error("manifest must contain exactly three Stage 8 B2 releases");
  }

  const releaseByTrack = new Map<Track, Artifact>();
  for (const release of releases) {
    const file = path.resolve(root, release.artifact_key);
    const details = await stat(file);
    if (
      !file.startsWith(`${root}${path.sep}`) ||
      details.size !== release.size_bytes ||
      release.size_bytes > 100 * 1024 * 1024 ||
      release.size_bytes > manifest.maximum_artifact_bytes ||
      (await sha256(file)) !== release.sha256
    ) throw new Error(`invalid B2 release for ${release.track}`);
    releaseByTrack.set(TRACK_BY_KEY[release.track], release);
  }

  const interns = await prisma.intern.findMany({
    where: {
      isActive: true,
      currentStage: Stage.STAGE_8,
      user: { email: { not: { endsWith: "@netforge.invalid" } } },
    },
    select: {
      id: true,
      track: true,
      user: { select: { email: true } },
      advancedArtifacts: {
        where: { stage: Stage.STAGE_8 },
        select: { id: true, variant: true, marker: true, revokedAt: true },
      },
    },
  });
  const counts = interns.reduce<Record<string, number>>((result, intern) => {
    result[intern.track] = (result[intern.track] ?? 0) + 1;
    return result;
  }, {});
  if (interns.length !== 66) throw new Error(`expected 66 active Stage 8 associates, found ${interns.length}`);
  for (const [track, expected] of Object.entries(EXPECTED)) {
    if ((counts[track] ?? 0) !== expected) throw new Error(`expected ${expected} ${track}, found ${counts[track] ?? 0}`);
  }
  if (interns.some((intern) => intern.advancedArtifacts.length !== 1 || intern.advancedArtifacts[0].revokedAt)) {
    throw new Error("every active Stage 8 associate must have one non-revoked Stage 8 grant");
  }

  const applications = await prisma.publicApplication.findMany({
    where: { email: { in: interns.map((intern) => intern.user.email) } },
    select: { email: true, internId: true },
  });
  const codeByEmail = new Map(applications.map((item) => [item.email.toLowerCase(), item.internId]));
  const generatedAt = new Date().toISOString();
  const operations = interns.map((intern) => {
    const release = releaseByTrack.get(intern.track);
    if (!release) throw new Error(`missing release for ${intern.track}`);
    const grant = intern.advancedArtifacts[0];
    const internCode = resolvedInternCode(codeByEmail.get(intern.user.email.toLowerCase()));
    const unsigned = {
      schema_version: "1.0",
      intern_id: intern.id,
      intern_code: internCode,
      track: intern.track,
      stage: Stage.STAGE_8,
      project: `${intern.track === Track.SOC_ANALYSIS ? "SOC" : intern.track === Track.ETHICAL_HACKING ? "EH" : "GRC"}-A4`,
      variant: grant.variant,
      marker: grant.marker,
      candidate_binding: createHmac("sha256", secret)
        .update(`artifact:${intern.id}:${internCode}:${intern.track}:8:${grant.variant}:${grant.marker}`)
        .digest("hex"),
      artifact_key: release.artifact_key,
      file_name: `${KEY_BY_TRACK[intern.track].replaceAll("_", "-")}-stage-8-shared-b2.tar.gz`,
      sha256: release.sha256,
      size_bytes: release.size_bytes,
      generated_at: generatedAt,
    };
    const signature = createHmac("sha256", secret).update(canonicalUnsigned(unsigned)).digest("hex");
    return () => prisma.advancedArtifactGrant.update({
      where: { id: grant.id },
      data: {
        artifactKey: release.artifact_key,
        fileName: unsigned.file_name,
        sha256: release.sha256,
        manifestSignature: signature,
        sizeBytes: release.size_bytes,
        expiresAt: null,
        revokedAt: null,
      },
    });
  });

  if (commit) {
    for (let index = 0; index < operations.length; index += 20) {
      await Promise.all(operations.slice(index, index + 20).map((operation) => operation()));
    }
  }
  console.log(JSON.stringify({ mode: commit ? "COMMIT" : "DRY_RUN", interns: interns.length, counts, releases }, null, 2));
  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
