import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { Stage } from "@/generated/prisma";

export type LandingStats = {
  applicants: number;
  interns: number;
  passedStage1: number;
  tracks: number;
};

// Interns who cleared Stage 1 sit at Stage 2 or beyond.
const PASSED_STAGE_1: Stage[] = [
  Stage.STAGE_2,
  Stage.STAGE_3,
  Stage.STAGE_4,
  Stage.STAGE_5,
  Stage.STAGE_6,
  Stage.STAGE_7,
  Stage.STAGE_8,
  Stage.STAGE_9,
];

const TRACKS = 3;

// Default any individual count to 0 if it throws — the public landing must
// never crash on a DB hiccup, and one failing count shouldn't zero the rest.
const safe = (p: Promise<number>): Promise<number> => p.catch(() => 0);

// Live, but cached for ~30 minutes so an unauthenticated public page doesn't
// hit the database on every request.
export const getLandingStats = unstable_cache(
  async (): Promise<LandingStats> => {
    const [applicants, interns, passedStage1] = await Promise.all([
      safe(prisma.publicApplication.count()),
      safe(prisma.intern.count()),
      safe(prisma.intern.count({ where: { currentStage: { in: PASSED_STAGE_1 } } })),
    ]);

    return { applicants, interns, passedStage1, tracks: TRACKS };
  },
  ["landing-stats"],
  { revalidate: 1800 }
);
