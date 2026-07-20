import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { config } from "dotenv";

config();
config({ path: ".env.local" });

import { Prisma, PrismaClient, Stage, Track } from "../src/generated/prisma";
import { advancedVariantFor } from "../src/lib/advanced-variant";
import { resolvedInternCode } from "../src/lib/intern-code";

/**
 * Rebind one active advanced intern and all Stage 5-9 grants to a new track.
 * Dry-run is the default.
 *
 * EMAIL=intern@example.com TARGET_TRACK=GRC npx tsx scripts/change-advanced-track.ts
 * EMAIL=intern@example.com TARGET_TRACK=GRC COMMIT=1 npx tsx scripts/change-advanced-track.ts
 */
const prisma = new PrismaClient();
const EMAIL = (process.env.EMAIL ?? "").trim().toLowerCase();
const TARGET_TRACK = (process.env.TARGET_TRACK ?? "").trim().toUpperCase() as Track;
const COMMIT = process.env.COMMIT === "1";
const ALLOW_DOWNLOADED = process.env.ALLOW_DOWNLOADED === "1";
const ACTOR_EMAIL = (process.env.ACTOR_EMAIL ?? "").trim().toLowerCase();
const ADVANCED_STAGES = [
  Stage.STAGE_5,
  Stage.STAGE_6,
  Stage.STAGE_7,
  Stage.STAGE_8,
  Stage.STAGE_9,
] as const;

type Artifact = {
  stage: Stage;
  track: Track;
  revision: string;
  artifactKey: string;
  sizeBytes: number;
  sha256: string;
};

function canonicalUnsigned(value: Record<string, unknown>): string {
  return JSON.stringify(
    Object.fromEntries(Object.keys(value).sort().map((key) => [key, value[key]]))
  );
}

function trackKey(track: Track): string {
  return track.toLowerCase().replaceAll("_", "-");
}

function projectPrefix(track: Track): string {
  if (track === Track.SOC_ANALYSIS) return "SOC";
  if (track === Track.ETHICAL_HACKING) return "EH";
  return "GRC";
}

function loadArtifacts(): Map<string, Artifact> {
  const stage5 = JSON.parse(readFileSync("stage5-artifacts/manifest.json", "utf8")) as {
    artifacts: Array<{
      track: Track;
      key: string;
      size_bytes: number;
      sha256: string;
    }>;
  };
  const future = JSON.parse(readFileSync("advanced-stage-artifacts/manifest.json", "utf8")) as {
    artifacts: Array<{
      track: string;
      stage: Stage;
      revision: string;
      artifact_key: string;
      size_bytes: number;
      sha256: string;
    }>;
  };
  const artifacts = new Map<string, Artifact>();
  for (const artifact of stage5.artifacts) {
    artifacts.set(`${Stage.STAGE_5}:${artifact.track}`, {
      stage: Stage.STAGE_5,
      track: artifact.track,
      revision: "B1",
      artifactKey: artifact.key,
      sizeBytes: artifact.size_bytes,
      sha256: artifact.sha256,
    });
  }
  for (const artifact of future.artifacts) {
    const track = artifact.track.toUpperCase() as Track;
    artifacts.set(`${artifact.stage}:${track}`, {
      stage: artifact.stage,
      track,
      revision: artifact.revision,
      artifactKey: artifact.artifact_key,
      sizeBytes: artifact.size_bytes,
      sha256: artifact.sha256,
    });
  }
  return artifacts;
}

async function main() {
  if (!EMAIL.includes("@")) throw new Error("EMAIL is required.");
  if (!Object.values(Track).includes(TARGET_TRACK)) {
    throw new Error("TARGET_TRACK must be SOC_ANALYSIS, ETHICAL_HACKING, or GRC.");
  }
  const artifactSecret = process.env.ADVANCED_ARTIFACT_SECRET;
  if (!artifactSecret || artifactSecret.length < 32) {
    throw new Error("ADVANCED_ARTIFACT_SECRET must be at least 32 characters.");
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: EMAIL, mode: "insensitive" } },
    select: { id: true, email: true, firstName: true, lastName: true },
  });
  if (!user) throw new Error(`No user found for ${EMAIL}.`);
  const intern = await prisma.intern.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      track: true,
      currentStage: true,
      isActive: true,
      advancedArtifacts: {
        where: { stage: { in: [...ADVANCED_STAGES] } },
        orderBy: { stage: "asc" },
        select: {
          id: true,
          stage: true,
          track: true,
          expiresAt: true,
          downloadCount: true,
          lastDownloadedAt: true,
        },
      },
      reports: {
        where: { stage: { in: [...ADVANCED_STAGES] } },
        select: { id: true, stage: true, status: true },
      },
    },
  });
  if (!intern) throw new Error(`No intern record found for ${EMAIL}.`);
  if (!intern.isActive || intern.currentStage !== Stage.STAGE_5) {
    throw new Error(`${EMAIL} is not an active Stage 5 intern.`);
  }
  if (intern.track === TARGET_TRACK) {
    throw new Error(`${EMAIL} is already assigned to ${TARGET_TRACK}.`);
  }
  if (intern.reports.length > 0) {
    throw new Error(`${EMAIL} already has an advanced report; refusing a track change.`);
  }
  if (intern.advancedArtifacts.length !== ADVANCED_STAGES.length) {
    throw new Error(`${EMAIL} must have exactly five advanced artifact grants.`);
  }
  const downloaded = intern.advancedArtifacts.filter(
    (grant) => grant.downloadCount > 0 || grant.lastDownloadedAt !== null
  );
  if (downloaded.length > 0 && !ALLOW_DOWNLOADED) {
    throw new Error(
      `${EMAIL} downloaded ${downloaded.length} old-track artifact(s); ` +
      "set ALLOW_DOWNLOADED=1 only after explicit programme approval."
    );
  }

  const publicApplication = await prisma.publicApplication.findFirst({
    where: { email: { equals: EMAIL, mode: "insensitive" } },
    select: { internId: true },
  });
  const internCode = resolvedInternCode(publicApplication?.internId);
  const artifacts = loadArtifacts();
  const generatedAt = new Date().toISOString();
  const updates = intern.advancedArtifacts.map((grant) => {
    const artifact = artifacts.get(`${grant.stage}:${TARGET_TRACK}`);
    if (!artifact) throw new Error(`No ${TARGET_TRACK} artifact found for ${grant.stage}.`);
    const stageNumber = Number(grant.stage.replace("STAGE_", ""));
    const assignment = advancedVariantFor(intern.id, internCode, grant.stage);
    const binding = createHmac("sha256", artifactSecret)
      .update(
        `artifact:${intern.id}:${internCode}:${TARGET_TRACK}:${stageNumber}:${assignment.variant}:${assignment.marker}`
      )
      .digest("hex");
    const unsigned = {
      schema_version: "1.0",
      intern_id: intern.id,
      intern_code: internCode,
      track: TARGET_TRACK,
      stage: grant.stage,
      project: `${projectPrefix(TARGET_TRACK)}-A${stageNumber - 4}`,
      variant: assignment.variant,
      marker: assignment.marker,
      candidate_binding: binding,
      artifact_key: artifact.artifactKey,
      file_name: `${trackKey(TARGET_TRACK)}-stage-${stageNumber}-shared-${artifact.revision.toLowerCase()}.tar.gz`,
      sha256: artifact.sha256,
      size_bytes: artifact.sizeBytes,
      generated_at: generatedAt,
    };
    return {
      grantId: grant.id,
      stage: grant.stage,
      expiresAt: grant.expiresAt,
      variant: assignment.variant,
      marker: assignment.marker,
      artifactKey: artifact.artifactKey,
      fileName: unsigned.file_name,
      sha256: artifact.sha256,
      sizeBytes: artifact.sizeBytes,
      manifestSignature: createHmac("sha256", artifactSecret)
        .update(canonicalUnsigned(unsigned))
        .digest("hex"),
    };
  });

  const stageAccessCount = await prisma.stageAccess.count({
    where: { internId: intern.id, stage: { in: [...ADVANCED_STAGES] } },
  });
  console.log(JSON.stringify({
    mode: COMMIT ? "COMMIT" : "DRY_RUN",
    intern: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    internCode,
    from: intern.track,
    to: TARGET_TRACK,
    advancedReports: intern.reports.length,
    oldTrackDownloads: downloaded.length,
    stageAccessRecordsPreserved: stageAccessCount,
    grants: updates.map((update) => ({
      stage: update.stage,
      variant: update.variant,
      marker: update.marker,
      artifactKey: update.artifactKey,
      sha256: update.sha256,
    })),
  }, null, 2));
  if (!COMMIT) {
    console.log("Dry run complete; no records changed. Set COMMIT=1 after review.");
    return;
  }

  const actor = ACTOR_EMAIL
    ? await prisma.user.findFirst({
        where: { email: { equals: ACTOR_EMAIL, mode: "insensitive" }, role: "SUPER_ADMIN" },
        select: { id: true, email: true, role: true },
      })
    : await prisma.user.findFirst({
        where: { role: "SUPER_ADMIN" },
        orderBy: { createdAt: "asc" },
        select: { id: true, email: true, role: true },
      });
  if (!actor) throw new Error("No super-admin audit actor is available.");

  await prisma.$transaction([
    prisma.intern.update({
      where: { id: intern.id },
      data: { track: TARGET_TRACK },
    }),
    ...updates.map((update) => prisma.advancedArtifactGrant.update({
      where: { id: update.grantId },
      data: {
        track: TARGET_TRACK,
        variant: update.variant,
        marker: update.marker,
        artifactKey: update.artifactKey,
        fileName: update.fileName,
        sha256: update.sha256,
        manifestSignature: update.manifestSignature,
        sizeBytes: update.sizeBytes,
        expiresAt: update.expiresAt,
        revokedAt: null,
      },
    })),
    prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: "advanced-track.change",
        targetType: "INTERN",
        targetId: intern.id,
        details: {
          email: user.email,
          internCode,
          from: intern.track,
          to: TARGET_TRACK,
          stagesRebound: updates.map((update) => update.stage),
          oldTrackDownloads: downloaded.length,
          stageAccessRecordsPreserved: stageAccessCount,
          requestedVia: "programme-owner-via-codex",
        } as Prisma.InputJsonValue,
        ip: null,
        userAgent: "scripts/change-advanced-track.ts",
      },
    }),
  ]);
  console.log(`Committed ${user.email}: ${intern.track} -> ${TARGET_TRACK}.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
