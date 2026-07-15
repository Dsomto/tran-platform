import { config } from "dotenv";
config();
config({ path: ".env.local" });

import { PrismaClient, Stage, Track } from "../src/generated/prisma";

/**
 * Read-only weighted ranking for the final integrity review. It never promotes.
 *   npx tsx scripts/advanced-track-ranking.ts > advanced-ranking.csv
 *   REQUIRE_QA=0 npx tsx scripts/advanced-track-ranking.ts
 */
const prisma = new PrismaClient();
const REQUIRE_QA = process.env.REQUIRE_QA !== "0";
const STAGES = [Stage.STAGE_5, Stage.STAGE_6, Stage.STAGE_7, Stage.STAGE_8, Stage.STAGE_9] as const;
const WEIGHTS = [0.1, 0.15, 0.2, 0.25, 0.3] as const;
const TRACKS = [Track.SOC_ANALYSIS, Track.ETHICAL_HACKING, Track.GRC] as const;
const REVIEWABLE = new Set(["GRADED", "PENDING_PROMOTION", "PASSED"]);

function csv(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

async function main() {
  const reports = await prisma.stageReport.findMany({
    where: { stage: { in: [...STAGES] } },
    select: {
      stage: true,
      status: true,
      score: true,
      finalScore: true,
      divergent: true,
      qaVerified: true,
      intern: {
        select: {
          id: true,
          track: true,
          isActive: true,
          user: { select: { email: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  const byIntern = new Map<string, typeof reports>();
  for (const report of reports) {
    const rows = byIntern.get(report.intern.id) ?? [];
    rows.push(report);
    byIntern.set(report.intern.id, rows);
  }

  const rankedByTrack = new Map<Track, Array<{
    name: string;
    email: string;
    scores: number[];
    weighted: number;
  }>>();
  let held = 0;

  for (const rows of byIntern.values()) {
    const first = rows[0];
    if (!first || !first.intern.isActive) continue;
    const ordered = STAGES.map((stage) => rows.find((row) => row.stage === stage));
    const eligible = ordered.every((row) =>
      row &&
      (row.finalScore ?? row.score) !== null &&
      REVIEWABLE.has(row.status) &&
      !row.divergent &&
      (!REQUIRE_QA || row.qaVerified === true)
    );
    if (!eligible) {
      held += 1;
      continue;
    }

    const scores = ordered.map((row) => (row!.finalScore ?? row!.score)!);
    const weighted = scores.reduce((sum, score, index) => sum + score * WEIGHTS[index], 0);
    const list = rankedByTrack.get(first.intern.track) ?? [];
    list.push({
      name: `${first.intern.user.firstName} ${first.intern.user.lastName}`.trim(),
      email: first.intern.user.email,
      scores,
      weighted: Math.round(weighted * 100) / 100,
    });
    rankedByTrack.set(first.intern.track, list);
  }

  console.error(`Read-only ranking. QA required: ${REQUIRE_QA}. Held as incomplete/unverified: ${held}.`);
  console.log("track,rank,review_status,name,email,advanced_1,advanced_2,advanced_3,advanced_4,advanced_5,weighted_score");

  for (const track of TRACKS) {
    const list = (rankedByTrack.get(track) ?? []).sort((a, b) => b.weighted - a.weighted || a.email.localeCompare(b.email));
    const boundary = list[2]?.weighted;
    const boundaryTie = boundary !== undefined && list[3]?.weighted === boundary;
    let priorScore: number | undefined;
    let rank = 0;
    list.forEach((entry, index) => {
      if (entry.weighted !== priorScore) rank = index + 1;
      priorScore = entry.weighted;
      const reviewStatus = boundaryTie && entry.weighted === boundary
        ? "BOUNDARY_REVIEW"
        : index < 3 ? "PROVISIONAL_TOP_3" : "RESERVE";
      console.log([
        track,
        rank,
        reviewStatus,
        entry.name,
        entry.email,
        ...entry.scores,
        entry.weighted.toFixed(2),
      ].map(csv).join(","));
    });
  }
}

main()
  .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); })
  .finally(() => prisma.$disconnect());
