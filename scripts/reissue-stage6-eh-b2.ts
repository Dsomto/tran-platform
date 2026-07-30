import { createHash, createHmac } from "node:crypto";
import { createReadStream, readFileSync } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../src/lib/db";
import { advancedVariantFor } from "../src/lib/advanced-variant";
import { resolvedInternCode } from "../src/lib/intern-code";
import { Stage, Track } from "../src/generated/prisma";

type SharedArtifact = {
  track: "ethical_hacking";
  stage: "STAGE_6";
  revision: "B2";
  artifact_key: string;
  size_bytes: number;
  sha256: string;
};

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
  const commit = process.env.COMMIT === "1";
  const artifactSecret = process.env.ADVANCED_ARTIFACT_SECRET;
  if (!artifactSecret || artifactSecret.length < 32) {
    throw new Error("ADVANCED_ARTIFACT_SECRET must be at least 32 characters");
  }

  const artifactRoot = path.resolve(process.env.ADVANCED_STAGE_ARTIFACT_ROOT ?? "advanced-stage-artifacts");
  const manifest = JSON.parse(
    readFileSync(path.join(artifactRoot, "manifest.json"), "utf8")
  ) as { artifacts: SharedArtifact[] };
  const artifact = manifest.artifacts.find(
    (item) =>
      item.stage === "STAGE_6" &&
      item.track === "ethical_hacking" &&
      item.revision === "B2"
  );
  if (!artifact) throw new Error("Stage 6 EH B2 is missing from the release manifest");

  const artifactPath = path.resolve(artifactRoot, artifact.artifact_key);
  if (!artifactPath.startsWith(`${artifactRoot}${path.sep}`)) {
    throw new Error("Unsafe Stage 6 EH B2 artifact key");
  }
  const details = await stat(artifactPath);
  if (
    !details.isFile() ||
    details.size !== artifact.size_bytes ||
    details.size > 100 * 1024 * 1024 ||
    await sha256(artifactPath) !== artifact.sha256
  ) {
    throw new Error("Stage 6 EH B2 does not match the release manifest");
  }

  const grants = await prisma.advancedArtifactGrant.findMany({
    where: {
      stage: Stage.STAGE_6,
      track: Track.ETHICAL_HACKING,
      revokedAt: null,
      intern: { isActive: true, track: Track.ETHICAL_HACKING },
    },
    include: {
      intern: {
        select: {
          id: true,
          user: { select: { email: true } },
        },
      },
    },
  });
  const applications = await prisma.publicApplication.findMany({
    where: { email: { in: grants.map((grant) => grant.intern.user.email) } },
    select: { email: true, internId: true },
  });
  const codeByEmail = new Map(
    applications.map((application) => [
      application.email.toLowerCase(),
      resolvedInternCode(application.internId),
    ])
  );

  const generatedAt = new Date().toISOString();
  const updates = [];
  for (const grant of grants) {
    const internCode = codeByEmail.get(grant.intern.user.email.toLowerCase());
    if (!internCode) throw new Error(`Missing intern code for grant ${grant.id}`);
    const assignment = advancedVariantFor(grant.intern.id, internCode, Stage.STAGE_6);
    if (grant.variant !== assignment.variant || grant.marker !== assignment.marker) {
      throw new Error(`Private assignment mismatch for grant ${grant.id}`);
    }

    const binding = createHmac("sha256", artifactSecret)
      .update(
        `artifact:${grant.intern.id}:${internCode}:${Track.ETHICAL_HACKING}:6:${assignment.variant}:${assignment.marker}`
      )
      .digest("hex");
    const unsigned = {
      schema_version: "1.0",
      intern_id: grant.intern.id,
      intern_code: internCode,
      track: Track.ETHICAL_HACKING,
      stage: Stage.STAGE_6,
      project: "EH-A2",
      variant: assignment.variant,
      marker: assignment.marker,
      candidate_binding: binding,
      artifact_key: artifact.artifact_key,
      file_name: "ethical-hacking-stage-6-shared-b2.tar.gz",
      sha256: artifact.sha256,
      size_bytes: artifact.size_bytes,
      generated_at: generatedAt,
    };
    const signature = createHmac("sha256", artifactSecret)
      .update(canonicalUnsigned(unsigned))
      .digest("hex");
    updates.push({
      id: grant.id,
      data: {
        artifactKey: artifact.artifact_key,
        fileName: unsigned.file_name,
        sha256: artifact.sha256,
        manifestSignature: signature,
        sizeBytes: artifact.size_bytes,
      },
    });
  }

  let announcementAction = "DRY_RUN";
  if (commit) {
    for (let offset = 0; offset < updates.length; offset += 20) {
      await Promise.all(
        updates.slice(offset, offset + 20).map((update) =>
          prisma.advancedArtifactGrant.update({
            where: { id: update.id },
            data: update.data,
          })
        )
      );
    }

    const author = await prisma.user.findFirst({
      where: {
        role: "SUPER_ADMIN",
        OR: [
          { firstName: { contains: "Somto", mode: "insensitive" } },
          { lastName: { contains: "Okoma", mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });
    if (!author) throw new Error("Somto Okoma SUPER_ADMIN account was not found");

    const title = "Stage 6 EH correction: B2 assigned flags";
    const content = [
      "The original Stage 6 Ethical Hacking B1 VM source omitted `user.txt` and `root.txt`. This was an assessment-pack defect.",
      "",
      "B2 is now available from your Stage 6 room. Verify SHA-256 `" + artifact.sha256 + "` before use.",
      "",
      "Fresh build: export the exact `UBI_STAGE6_MARKER` from your private overlay, then run `vagrant up vulnerable patched`.",
      "",
      "Existing B1 VM: copy `lab-source/install-assigned-flags.sh` from B2 into your existing B1 `lab-source/` directory and follow the two migration commands in `lab-source/README.md`. You do not need to rebuild your VM.",
      "",
      "B1 UID-0 evidence captured before this correction remains valid. Nobody will be penalized for missing flags in B1. Flags bind your evidence to your assignment but do not replace the exploit transcript, five clean runs, cleanup, patches, or negative retests.",
    ].join("\n");
    const existing = await prisma.announcement.findFirst({
      where: {
        title,
        stage: Stage.STAGE_6,
        track: Track.ETHICAL_HACKING,
      },
      select: { id: true },
    });
    if (existing) {
      await prisma.announcement.update({
        where: { id: existing.id },
        data: { content, authorId: author.id, isPinned: true },
      });
      announcementAction = "UPDATED";
    } else {
      await prisma.announcement.create({
        data: {
          title,
          content,
          authorId: author.id,
          stage: Stage.STAGE_6,
          track: Track.ETHICAL_HACKING,
          isPinned: true,
        },
      });
      announcementAction = "CREATED";
    }
  }

  console.log(JSON.stringify({
    mode: commit ? "COMMIT" : "DRY_RUN",
    artifact: {
      key: artifact.artifact_key,
      sizeBytes: artifact.size_bytes,
      sha256: artifact.sha256,
    },
    activeStage6EhGrants: grants.length,
    grantsToReissue: updates.length,
    announcement: announcementAction,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
