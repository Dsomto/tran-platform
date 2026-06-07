// Finalize SUBMITTED reports that already have at least one real (submitted)
// grade row. These pre-date solo mode — under the old two-grader flow they
// were waiting for grader 2 of 2. Now in solo mode, the first grade is
// enough to finalise.
//
// Picks the most recent submitted grade as the canonical one. Skips reports
// where no real grade exists (orphan claims only).
//
// Usage:
//   DRY=1 npx tsx scripts/finalize-orphan-submitted.ts   # preview
//   COMMIT=1 npx tsx scripts/finalize-orphan-submitted.ts # finalize
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
const prisma = new PrismaClient();
const COMMIT = process.env.COMMIT === "1";
(async () => {
  const reports = await prisma.stageReport.findMany({
    where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] }, divergent: false },
    include: {
      grades: { include: { grader: { select: { email: true } } } },
      intern: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
    },
  });
  const orphanFinalisable = reports.filter((r) =>
    r.grades.some((g) => g.score !== null && g.feedback)
  );
  console.log(`Reports with ≥1 real submitted grade but not finalised: ${orphanFinalisable.length}`);
  for (const r of orphanFinalisable) {
    const real = r.grades.filter((g) => g.score !== null && g.feedback);
    const final = real.reduce((latest, g) =>
      !latest || (g.gradedAt && g.gradedAt > (latest.gradedAt ?? new Date(0))) ? g : latest,
      null as typeof real[number] | null
    )!;
    const name = `${r.intern.user.firstName} ${r.intern.user.lastName}`;
    console.log(`  ${COMMIT ? "✓" : "→"} ${r.id} ${r.stage} ${name}: ${real.length} real grade(s), finalising at ${final.score} (by ${final.grader.email})`);
    if (COMMIT) {
      await prisma.stageReport.update({
        where: { id: r.id },
        data: {
          status: "GRADED",
          score: final.score!,
          feedback: final.feedback!,
          gradedAt: final.gradedAt ?? new Date(),
          divergent: false,
        },
      });
    }
  }
  if (!COMMIT) console.log("\nDRY — re-run with COMMIT=1 to finalize.");
  await prisma.$disconnect();
})();
