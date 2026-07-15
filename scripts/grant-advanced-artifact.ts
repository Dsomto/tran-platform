import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../src/lib/db";
import { advancedVariantFor } from "../src/lib/advanced-variant";

type GrantManifest = {
  schema_version: string;
  intern_id: string;
  intern_code: string;
  track: "SOC_ANALYSIS" | "ETHICAL_HACKING" | "GRC";
  stage: "STAGE_5" | "STAGE_6" | "STAGE_7" | "STAGE_8" | "STAGE_9";
  project: string;
  variant: string;
  marker: string;
  candidate_binding: string;
  artifact_key: string;
  file_name: string;
  sha256: string;
  size_bytes: number;
  generated_at: string;
  manifest_signature: string;
};

function canonicalUnsigned(manifest: GrantManifest): string {
  const unsigned = { ...manifest } as Partial<GrantManifest>;
  delete unsigned.manifest_signature;
  return JSON.stringify(
    Object.fromEntries(Object.keys(unsigned).sort().map((key) => [key, unsigned[key as keyof typeof unsigned]]))
  );
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
  const manifestFile = process.env.MANIFEST;
  const secret = process.env.ADVANCED_ARTIFACT_SECRET;
  if (!manifestFile) throw new Error("MANIFEST must point to a generated grant JSON file");
  if (!secret || secret.length < 32) throw new Error("ADVANCED_ARTIFACT_SECRET must be at least 32 characters");

  const manifest = JSON.parse(await readFile(manifestFile, "utf8")) as GrantManifest;
  const expectedSignature = createHmac("sha256", secret)
    .update(canonicalUnsigned(manifest))
    .digest("hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const suppliedBuffer = Buffer.from(manifest.manifest_signature, "hex");
  if (
    expectedBuffer.length !== suppliedBuffer.length ||
    !timingSafeEqual(expectedBuffer, suppliedBuffer)
  ) {
    throw new Error("grant manifest signature is invalid");
  }

  const intern = await prisma.intern.findUnique({
    where: { id: manifest.intern_id },
    select: { id: true, track: true, isActive: true },
  });
  if (!intern?.isActive) throw new Error("manifest intern is missing or inactive");
  if (intern.track !== manifest.track) throw new Error("manifest track does not match the intern record");

  const expected = advancedVariantFor(intern.id, manifest.intern_code, manifest.stage);
  if (expected.variant !== manifest.variant || expected.marker !== manifest.marker) {
    throw new Error("manifest variant/marker does not match the web assignment derivation");
  }

  const root = process.env.ADVANCED_ARTIFACT_ROOT;
  if (root) {
    const absolute = path.resolve(root, manifest.artifact_key);
    const resolvedRoot = path.resolve(root);
    if (!absolute.startsWith(`${resolvedRoot}${path.sep}`)) throw new Error("unsafe artifact key");
    const details = await stat(absolute);
    if (details.size !== manifest.size_bytes) throw new Error("artifact size does not match manifest");
    if ((await sha256(absolute)) !== manifest.sha256) throw new Error("artifact hash does not match manifest");
  }

  const expiresAt = process.env.EXPIRES_AT ? new Date(process.env.EXPIRES_AT) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) throw new Error("EXPIRES_AT must be ISO-8601");

  const grant = await prisma.advancedArtifactGrant.upsert({
    where: { internId_stage: { internId: intern.id, stage: manifest.stage } },
    create: {
      internId: intern.id,
      stage: manifest.stage,
      track: manifest.track,
      variant: manifest.variant,
      marker: manifest.marker,
      artifactKey: manifest.artifact_key,
      fileName: manifest.file_name,
      sha256: manifest.sha256,
      manifestSignature: manifest.manifest_signature,
      sizeBytes: manifest.size_bytes,
      expiresAt,
      createdById: process.env.CREATED_BY_ID || null,
    },
    update: {
      track: manifest.track,
      variant: manifest.variant,
      marker: manifest.marker,
      artifactKey: manifest.artifact_key,
      fileName: manifest.file_name,
      sha256: manifest.sha256,
      manifestSignature: manifest.manifest_signature,
      sizeBytes: manifest.size_bytes,
      expiresAt,
      revokedAt: null,
    },
  });

  console.log(JSON.stringify({ id: grant.id, internId: grant.internId, stage: grant.stage, artifactKey: grant.artifactKey }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
