import { writeFileSync } from "node:fs";
import { prisma } from "../src/lib/db";
import { Stage } from "../src/generated/prisma";

async function main() {
  const output = process.env.OUTPUT;
  const interns = await prisma.intern.findMany({
    where: {
      isActive: true,
      currentStage: Stage.STAGE_4,
      user: { email: { not: { endsWith: "@netforge.invalid" } } },
      reports: { some: { stage: Stage.STAGE_4, status: "PASSED" } },
    },
    select: { track: true, user: { select: { email: true } } },
  });
  const admissions = interns
    .map((intern) => ({ email: intern.user.email.toLowerCase(), track: intern.track }))
    .sort((left, right) => left.email.localeCompare(right.email));
  const counts: Record<string, number> = {};
  for (const admission of admissions) {
    counts[admission.track] = (counts[admission.track] ?? 0) + 1;
  }
  if (output) writeFileSync(output, `${JSON.stringify(admissions, null, 2)}\n`, { flag: "wx" });
  console.log(JSON.stringify({ output: output ?? null, admissions: admissions.length, counts }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
