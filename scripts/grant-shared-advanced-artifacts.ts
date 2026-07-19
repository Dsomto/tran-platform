import { createHash, createHmac } from "node:crypto";
import { createReadStream, readFileSync } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../src/lib/db";
import { advancedVariantFor } from "../src/lib/advanced-variant";
import { resolvedInternCode } from "../src/lib/intern-code";
import { Stage, Track } from "../src/generated/prisma";

type ReleaseStage = "STAGE_6" | "STAGE_7" | "STAGE_8" | "STAGE_9";
type TrackKey = "soc_analysis" | "ethical_hacking" | "grc";

type SharedArtifact = {
  track: TrackKey;
  stage: ReleaseStage;
  revision: string;
  artifact_key: string;
  size_bytes: number;
  sha256: string;
};

type SharedManifest = {
  release_model: "application-bundled-shared-base-private-overlay";
  maximum_artifact_bytes: number;
  artifacts: SharedArtifact[];
};

const RELEASE_STAGES = [Stage.STAGE_6, Stage.STAGE_7, Stage.STAGE_8, Stage.STAGE_9] as const;
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
const PROJECT_PREFIX = {
  [Track.SOC_ANALYSIS]: "SOC",
  [Track.ETHICAL_HACKING]: "EH",
  [Track.GRC]: "GRC",
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
  const manifestPath = process.env.SHARED_RELEASE_MANIFEST ?? "advanced-stage-artifacts/manifest.json";
  const artifactRoot = path.resolve(process.env.ADVANCED_STAGE_ARTIFACT_ROOT ?? "advanced-stage-artifacts");
  const artifactSecret = process.env.ADVANCED_ARTIFACT_SECRET;
  const commit = process.env.COMMIT === "1";
  const includePreview = process.env.INCLUDE_PREVIEW === "1";
  if (!artifactSecret || artifactSecret.length < 32) {
    throw new Error("ADVANCED_ARTIFACT_SECRET must be at least 32 characters");
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as SharedManifest;
  if (manifest.release_model !== "application-bundled-shared-base-private-overlay") {
    throw new Error("manifest is not a bundled shared-base release");
  }
  if (manifest.artifacts.length !== 12) throw new Error("manifest must contain exactly 12 artifacts");

  const artifacts = new Map<string, SharedArtifact>();
  for (const artifact of manifest.artifacts) {
    const file = path.resolve(artifactRoot, artifact.artifact_key);
    if (!file.startsWith(`${artifactRoot}${path.sep}`)) throw new Error("unsafe artifact key");
    const details = await stat(file);
    if (
      artifact.size_bytes > 100 * 1024 * 1024 ||
      artifact.size_bytes > manifest.maximum_artifact_bytes ||
      details.size !== artifact.size_bytes ||
      await sha256(file) !== artifact.sha256
    ) {
      throw new Error(`${artifact.stage}/${artifact.track} does not match the release manifest`);
    }
    artifacts.set(`${artifact.stage}:${TRACK_BY_KEY[artifact.track]}`, artifact);
  }
  if (artifacts.size !== 12) throw new Error("manifest contains duplicate stage/track artifacts");

  const interns = await prisma.intern.findMany({
    where: includePreview
      ? {
          isActive: true,
          currentStage: Stage.STAGE_5,
          user: { email: { endsWith: "@netforge.invalid" } },
        }
      : {
          isActive: true,
          currentStage: Stage.STAGE_5,
          user: { email: { not: { endsWith: "@netforge.invalid" } } },
          reports: { some: { stage: Stage.STAGE_4, status: "PASSED" } },
        },
    select: { id: true, track: true, user: { select: { email: true } } },
  });
  const applications = await prisma.publicApplication.findMany({
    where: { email: { in: interns.map((intern) => intern.user.email) } },
    select: { email: true, internId: true },
  });
  const codeByEmail = new Map(
    applications.map((application) => [application.email.toLowerCase(), application.internId])
  );

  const counts: Record<string, number> = {};
  const operations: Array<() => Promise<unknown>> = [];
  const generatedAt = new Date().toISOString();
  for (const intern of interns) {
    const internCode = resolvedInternCode(codeByEmail.get(intern.user.email.toLowerCase()));
    for (const stage of RELEASE_STAGES) {
      const artifact = artifacts.get(`${stage}:${intern.track}`);
      if (!artifact) throw new Error(`missing ${stage} artifact for ${intern.track}`);
      const stageNumber = Number(stage.replace("STAGE_", ""));
      const assignment = advancedVariantFor(intern.id, internCode, stage);
      const binding = createHmac("sha256", artifactSecret)
        .update(`artifact:${intern.id}:${internCode}:${intern.track}:${stageNumber}:${assignment.variant}:${assignment.marker}`)
        .digest("hex");
      const unsigned = {
        schema_version: "1.0",
        intern_id: intern.id,
        intern_code: internCode,
        track: intern.track,
        stage,
        project: `${PROJECT_PREFIX[intern.track]}-A${stageNumber - 4}`,
        variant: assignment.variant,
        marker: assignment.marker,
        candidate_binding: binding,
        artifact_key: artifact.artifact_key,
        file_name: `${KEY_BY_TRACK[intern.track].replaceAll("_", "-")}-stage-${stageNumber}-shared-${artifact.revision.toLowerCase()}.tar.gz`,
        sha256: artifact.sha256,
        size_bytes: artifact.size_bytes,
        generated_at: generatedAt,
      };
      const signature = createHmac("sha256", artifactSecret)
        .update(canonicalUnsigned(unsigned))
        .digest("hex");
      counts[`${stage}:${intern.track}`] = (counts[`${stage}:${intern.track}`] ?? 0) + 1;
      operations.push(() => prisma.advancedArtifactGrant.upsert({
        where: { internId_stage: { internId: intern.id, stage } },
        create: {
          internId: intern.id,
          stage,
          track: intern.track,
          variant: assignment.variant,
          marker: assignment.marker,
          artifactKey: artifact.artifact_key,
          fileName: unsigned.file_name,
          sha256: artifact.sha256,
          manifestSignature: signature,
          sizeBytes: artifact.size_bytes,
          expiresAt: null,
          revokedAt: null,
        },
        update: {
          track: intern.track,
          variant: assignment.variant,
          marker: assignment.marker,
          artifactKey: artifact.artifact_key,
          fileName: unsigned.file_name,
          sha256: artifact.sha256,
          manifestSignature: signature,
          sizeBytes: artifact.size_bytes,
          expiresAt: null,
          revokedAt: null,
        },
      }));
    }
  }

  if (commit) {
    for (let offset = 0; offset < operations.length; offset += 20) {
      await Promise.all(operations.slice(offset, offset + 20).map((operation) => operation()));
    }
  }
  console.log(JSON.stringify({
    mode: commit ? "COMMIT" : "DRY_RUN",
    cohort: includePreview ? "PREVIEW" : "REAL",
    interns: interns.length,
    grants: operations.length,
    counts,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
