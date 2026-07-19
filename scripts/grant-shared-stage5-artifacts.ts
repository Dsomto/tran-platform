import { createHash, createHmac } from "node:crypto";
import { createReadStream, readFileSync } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../src/lib/db";
import { advancedVariantFor } from "../src/lib/advanced-variant";
import { resolvedInternCode } from "../src/lib/intern-code";
import { Stage, Track } from "../src/generated/prisma";

type TrackKey = "soc_analysis" | "ethical_hacking" | "grc";

type ManifestArtifact = {
  track: string;
  stage: "STAGE_5";
  revision?: string;
  key?: string;
  artifact_key?: string;
  size_bytes: number;
  sha256: string;
};

type SharedArtifact = {
  track: TrackKey;
  revision: string;
  artifact_key: string;
  size_bytes: number;
  sha256: string;
};

type SharedManifest = {
  release_model: string;
  max_archive_bytes?: number;
  maximum_artifact_bytes?: number;
  artifacts: ManifestArtifact[];
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

function normalizeTrack(value: string): TrackKey {
  const normalized = value.toLowerCase();
  if (normalized === "soc_analysis" || normalized === "ethical_hacking" || normalized === "grc") {
    return normalized;
  }
  throw new Error(`unsupported track in manifest: ${value}`);
}

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
  const manifestPath = process.env.SHARED_RELEASE_MANIFEST;
  const artifactSecret = process.env.ADVANCED_ARTIFACT_SECRET;
  const commit = process.env.COMMIT === "1";
  const includePreview = process.env.INCLUDE_PREVIEW === "1";
  if (!manifestPath) throw new Error("SHARED_RELEASE_MANIFEST is required");
  if (!artifactSecret || artifactSecret.length < 32) {
    throw new Error("ADVANCED_ARTIFACT_SECRET must be at least 32 characters");
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as SharedManifest;
  if (!["shared-base-private-overlay", "application-bundled-shared-base-private-overlay"].includes(manifest.release_model)) {
    throw new Error("manifest is not a shared-base release");
  }
  const normalizedArtifacts: SharedArtifact[] = manifest.artifacts.map((artifact) => ({
    track: normalizeTrack(artifact.track),
    revision: artifact.revision ?? "B1",
    artifact_key: artifact.artifact_key ?? artifact.key ?? "",
    size_bytes: artifact.size_bytes,
    sha256: artifact.sha256,
  }));
  if (normalizedArtifacts.some((artifact) => !artifact.artifact_key)) {
    throw new Error("manifest artifact is missing its object key");
  }
  const byTrack = new Map(
    normalizedArtifacts.map((artifact) => [TRACK_BY_KEY[artifact.track], artifact])
  );
  if (byTrack.size !== 3) throw new Error("manifest must contain exactly three track artifacts");
  const manifestLimit = manifest.maximum_artifact_bytes ?? manifest.max_archive_bytes ?? 100 * 1024 * 1024;
  for (const artifact of normalizedArtifacts) {
    if (artifact.size_bytes > 100 * 1024 * 1024 || artifact.size_bytes > manifestLimit) {
      throw new Error(`${artifact.track} artifact exceeds the 100 MiB release cap`);
    }
  }

  const root = process.env.ADVANCED_ARTIFACT_ROOT;
  if (root) {
    for (const artifact of normalizedArtifacts) {
      const file = path.resolve(root, artifact.artifact_key);
      const resolvedRoot = path.resolve(root);
      if (!file.startsWith(`${resolvedRoot}${path.sep}`)) throw new Error("unsafe artifact key");
      const details = await stat(file);
      if (details.size !== artifact.size_bytes || await sha256(file) !== artifact.sha256) {
        throw new Error(`${artifact.track} artifact does not match its shared manifest`);
      }
    }
  }

  const interns = await prisma.intern.findMany({
    where: includePreview
      ? {
          isActive: true,
          currentStage: Stage.STAGE_5,
          user: { email: { endsWith: "@netforge.invalid" } },
        }
      : {
          isActive: true,
          currentStage: { in: [Stage.STAGE_4, Stage.STAGE_5] },
          user: { email: { not: { endsWith: "@netforge.invalid" } } },
          reports: { some: { stage: Stage.STAGE_4, status: "PASSED" } },
        },
    select: {
      id: true,
      track: true,
      user: { select: { email: true } },
    },
  });
  const applications = await prisma.publicApplication.findMany({
    where: { email: { in: interns.map((intern) => intern.user.email) } },
    select: { email: true, internId: true },
  });
  const codeByEmail = new Map(applications.map((application) => [application.email.toLowerCase(), application.internId]));
  const expiresAt = process.env.EXPIRES_AT ? new Date(process.env.EXPIRES_AT) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) throw new Error("EXPIRES_AT must be ISO-8601");

  const counts: Record<string, number> = {};
  for (const intern of interns) {
    const artifact = byTrack.get(intern.track);
    if (!artifact) throw new Error(`missing shared artifact for ${intern.track}`);
    const internCode = resolvedInternCode(codeByEmail.get(intern.user.email.toLowerCase()));
    const assignment = advancedVariantFor(intern.id, internCode, Stage.STAGE_5);
    const binding = createHmac("sha256", artifactSecret)
      .update(`artifact:${intern.id}:${internCode}:${intern.track}:5:${assignment.variant}:${assignment.marker}`)
      .digest("hex");
    const unsigned = {
      schema_version: "1.0",
      intern_id: intern.id,
      intern_code: internCode,
      track: intern.track,
      stage: Stage.STAGE_5,
      project: `${KEY_BY_TRACK[intern.track].toUpperCase()}-A1`,
      variant: assignment.variant,
      marker: assignment.marker,
      candidate_binding: binding,
      artifact_key: artifact.artifact_key,
      file_name: `${KEY_BY_TRACK[intern.track].replaceAll("_", "-")}-stage-5-shared-${artifact.revision.toLowerCase()}.tar.gz`,
      sha256: artifact.sha256,
      size_bytes: artifact.size_bytes,
      generated_at: new Date().toISOString(),
    };
    const signature = createHmac("sha256", artifactSecret)
      .update(canonicalUnsigned(unsigned))
      .digest("hex");
    counts[intern.track] = (counts[intern.track] ?? 0) + 1;
    if (!commit) continue;
    await prisma.advancedArtifactGrant.upsert({
      where: { internId_stage: { internId: intern.id, stage: Stage.STAGE_5 } },
      create: {
        internId: intern.id,
        stage: Stage.STAGE_5,
        track: intern.track,
        variant: assignment.variant,
        marker: assignment.marker,
        artifactKey: artifact.artifact_key,
        fileName: unsigned.file_name,
        sha256: artifact.sha256,
        manifestSignature: signature,
        sizeBytes: artifact.size_bytes,
        expiresAt,
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
        expiresAt,
        revokedAt: null,
      },
    });
  }
  console.log(JSON.stringify({
    mode: commit ? "COMMIT" : "DRY_RUN",
    cohort: includePreview ? "PREVIEW" : "REAL",
    eligible: interns.length,
    counts,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
