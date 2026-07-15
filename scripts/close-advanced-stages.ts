import { config } from "dotenv";

config();
config({ path: ".env.local" });

import { PrismaClient, Stage, StageStatus } from "../src/generated/prisma";

const prisma = new PrismaClient();

const ADVANCED_STAGES = [
  Stage.STAGE_5,
  Stage.STAGE_6,
  Stage.STAGE_7,
  Stage.STAGE_8,
  Stage.STAGE_9,
] as const;

async function main() {
  const closed = await Promise.all(
    ADVANCED_STAGES.map((stage) =>
      prisma.stageWindow.upsert({
        where: { stage },
        create: {
          stage,
          status: StageStatus.CLOSED,
          isLocked: true,
          passingScore: 70,
        },
        update: {
          status: StageStatus.CLOSED,
          isLocked: true,
        },
        select: {
          stage: true,
          status: true,
          isLocked: true,
          updatedAt: true,
        },
      })
    )
  );

  for (const window of closed) {
    console.log(
      `${window.stage}: ${window.status} (legacy lock: ${window.isLocked ? "on" : "off"}) at ${window.updatedAt.toISOString()}`
    );
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
