import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../src/lib/db";
import { socStage5ActivityFacts, socStage5DiscrepancyFor } from "../src/lib/advanced-discrepancy";
import { resolvedInternCode } from "../src/lib/intern-code";

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
  const grants = await prisma.advancedArtifactGrant.findMany({
    where: { stage: "STAGE_5", revokedAt: null },
    include: {
      intern: { select: { track: true, user: { select: { email: true } } } },
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
  const artifactRoot = path.resolve(process.cwd(), "stage5-artifacts");
  const artifactFacts = new Map<string, { size: number; hash: string }>();
  const counts: Record<string, number> = {};
  const realCounts: Record<string, number> = {};
  const socAssignments = new Set<string>();

  for (const grant of grants) {
    let facts = artifactFacts.get(grant.artifactKey);
    if (!facts) {
      const file = path.resolve(artifactRoot, grant.artifactKey);
      if (!file.startsWith(`${artifactRoot}${path.sep}`)) throw new Error("unsafe artifact key");
      const details = await stat(file);
      facts = { size: details.size, hash: await sha256(file) };
      artifactFacts.set(grant.artifactKey, facts);
    }
    if (
      grant.track !== grant.intern.track ||
      grant.sizeBytes !== facts.size ||
      grant.sha256 !== facts.hash ||
      facts.size > 100 * 1024 * 1024
    ) {
      throw new Error(`grant or artifact mismatch: ${grant.id}`);
    }

    counts[grant.track] = (counts[grant.track] ?? 0) + 1;
    if (!grant.intern.user.email.endsWith("@netforge.invalid")) {
      realCounts[grant.track] = (realCounts[grant.track] ?? 0) + 1;
    }
    if (grant.track !== "SOC_ANALYSIS") continue;

    const internCode = codeByEmail.get(grant.intern.user.email.toLowerCase()) ?? resolvedInternCode(undefined);
    const discrepancy = socStage5DiscrepancyFor(grant.internId, internCode, grant.marker);
    if (discrepancy.reviewCandidates.length !== 96 || discrepancy.changeRecords.length !== 96) {
      throw new Error(`SOC discrepancy cardinality mismatch: ${grant.id}`);
    }
    const validFalsePositives = discrepancy.changeRecords.filter((record) => {
      const fact = socStage5ActivityFacts(Number(record.activityId.slice(-4)));
      const observedAt = new Date(fact.timestamp).getTime();
      return (
        record.assetId === fact.assetId &&
        record.actor === fact.actor &&
        record.approvedBy === "change-board" &&
        record.status === "APPROVED" &&
        new Date(record.startsAt).getTime() <= observedAt &&
        observedAt <= new Date(record.endsAt).getTime()
      );
    }).length;
    if (validFalsePositives !== 80) {
      throw new Error(`SOC false-positive count is ${validFalsePositives}: ${grant.id}`);
    }
    if (socAssignments.has(discrepancy.assignmentId)) {
      throw new Error(`duplicate SOC assignment: ${discrepancy.assignmentId}`);
    }
    socAssignments.add(discrepancy.assignmentId);
  }

  const expectedReal = { SOC_ANALYSIS: 92, ETHICAL_HACKING: 56, GRC: 20 };
  if (Object.entries(expectedReal).some(([track, count]) => realCounts[track] !== count)) {
    throw new Error(`real cohort mismatch: ${JSON.stringify(realCounts)}`);
  }
  console.log(JSON.stringify({
    grants: grants.length,
    artifacts: artifactFacts.size,
    counts,
    realCounts,
    uniqueSocAssignments: socAssignments.size,
    socValidFalsePositivesPerIntern: 80,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
