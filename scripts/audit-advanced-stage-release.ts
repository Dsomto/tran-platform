import { createHash } from "node:crypto";
import { createReadStream, readFileSync } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../src/lib/db";
import { Stage } from "../src/generated/prisma";

type Artifact = {
  track: string;
  stage: string;
  artifact_key: string;
  size_bytes: number;
  sha256: string;
};

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
  const root = path.resolve("advanced-stage-artifacts");
  const manifest = JSON.parse(readFileSync(path.join(root, "manifest.json"), "utf8")) as {
    release_model: string;
    maximum_artifact_bytes: number;
    artifacts: Artifact[];
  };
  if (manifest.release_model !== "application-bundled-shared-base-private-overlay") {
    throw new Error("unexpected release model");
  }
  if (manifest.artifacts.length !== 12) throw new Error("expected 12 shared artifacts");

  const artifactByKey = new Map<string, Artifact>();
  for (const artifact of manifest.artifacts) {
    const file = path.resolve(root, artifact.artifact_key);
    if (!file.startsWith(`${root}${path.sep}`)) throw new Error("unsafe artifact key");
    const details = await stat(file);
    if (
      details.size !== artifact.size_bytes ||
      details.size > 100 * 1024 * 1024 ||
      details.size > manifest.maximum_artifact_bytes ||
      await sha256(file) !== artifact.sha256
    ) {
      throw new Error(`artifact mismatch: ${artifact.artifact_key}`);
    }
    artifactByKey.set(artifact.artifact_key, artifact);
  }

  const stages = [Stage.STAGE_6, Stage.STAGE_7, Stage.STAGE_8, Stage.STAGE_9] as const;
  const expectedWindows = {
    [Stage.STAGE_6]: ["2026-07-27T08:00:00.000Z", "2026-07-31T17:10:00.000Z"],
    [Stage.STAGE_7]: ["2026-08-03T08:00:00.000Z", "2026-08-07T17:10:00.000Z"],
    [Stage.STAGE_8]: ["2026-08-10T08:00:00.000Z", "2026-08-14T17:10:00.000Z"],
    [Stage.STAGE_9]: ["2026-08-17T08:00:00.000Z", "2026-08-21T17:10:00.000Z"],
  } as const;
  const [grants, windows, stage5Window] = await Promise.all([
    prisma.advancedArtifactGrant.findMany({
      where: { stage: { in: [...stages] } },
      include: {
        intern: {
          select: {
            track: true,
            currentStage: true,
            isActive: true,
            user: { select: { email: true } },
          },
        },
      },
    }),
    prisma.stageWindow.findMany({ where: { stage: { in: [...stages] } } }),
    prisma.stageWindow.findUniqueOrThrow({ where: { stage: Stage.STAGE_5 } }),
  ]);

  const expected = { SOC_ANALYSIS: 94, ETHICAL_HACKING: 57, GRC: 21 };
  const counts: Record<string, number> = {};
  const realInterns = new Set<string>();
  const previewInterns = new Set<string>();
  for (const grant of grants) {
    const artifact = artifactByKey.get(grant.artifactKey);
    if (!artifact) throw new Error(`grant points outside release: ${grant.id}`);
    if (
      grant.intern.track !== grant.track ||
      artifact.stage !== grant.stage ||
      artifact.size_bytes !== grant.sizeBytes ||
      artifact.sha256 !== grant.sha256 ||
      grant.expiresAt !== null ||
      !grant.intern.isActive ||
      grant.intern.currentStage !== "STAGE_5"
    ) {
      throw new Error(`invalid future grant: ${grant.id}`);
    }
    const key = `${grant.stage}:${grant.track}`;
    counts[key] = (counts[key] ?? 0) + 1;
    if (grant.intern.user.email.endsWith("@netforge.invalid")) previewInterns.add(grant.internId);
    else realInterns.add(grant.internId);
  }

  for (const stage of stages) {
    for (const [track, count] of Object.entries(expected)) {
      if (counts[`${stage}:${track}`] !== count) {
        throw new Error(`${stage}/${track} grant count mismatch: ${counts[`${stage}:${track}`] ?? 0}; total=${grants.length}; keys=${Object.keys(counts).join(",")}`);
      }
    }
    const window = windows.find((item) => item.stage === stage);
    const expectedWindow = expectedWindows[stage];
    if (
      !window ||
      window.status !== "CLOSED" ||
      !window.isLocked ||
      window.activeFrom?.toISOString() !== expectedWindow[0] ||
      window.submitUntil?.toISOString() !== expectedWindow[1]
    ) {
      throw new Error(`${stage} must remain closed until an admin opens it`);
    }
  }
  if (
    stage5Window.status !== "OPEN" ||
    stage5Window.activeFrom?.toISOString() !== "2026-07-20T08:00:00.000Z" ||
    stage5Window.submitUntil?.toISOString() !== "2026-07-24T17:10:00.000Z"
  ) {
    throw new Error("Stage 5 weekly window mismatch");
  }
  if (realInterns.size !== 169 || previewInterns.size !== 3 || grants.length !== 688) {
    throw new Error("future cohort grant total mismatch");
  }

  console.log(JSON.stringify({
    release: "READY_CLOSED",
    artifacts: artifactByKey.size,
    largestArtifactBytes: Math.max(...manifest.artifacts.map((artifact) => artifact.size_bytes)),
    grants: grants.length,
    realInterns: realInterns.size,
    previewInterns: previewInterns.size,
    stage5Window: {
      status: stage5Window.status,
      activeFrom: stage5Window.activeFrom?.toISOString(),
      submitUntil: stage5Window.submitUntil?.toISOString(),
    },
    windows: Object.fromEntries(windows.map((window) => [window.stage, window.status])),
    counts,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
