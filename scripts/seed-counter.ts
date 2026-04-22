import { prisma } from "../src/lib/db";

async function main() {
  const rows = await prisma.publicApplication.findMany({
    where: { internId: { not: null } },
    select: { internId: true },
  });

  const maxByYear: Record<string, number> = {};
  for (const { internId } of rows) {
    if (!internId) continue;
    const m = internId.match(/^UBI-(\d{4})-(\d+)$/);
    if (!m) continue;
    const year = m[1];
    const n = parseInt(m[2]);
    if (!maxByYear[year] || n > maxByYear[year]) maxByYear[year] = n;
  }

  const seeded: Array<{ year: string; value: number }> = [];
  for (const [year, maxN] of Object.entries(maxByYear)) {
    const id = `internId:${year}`;
    await prisma.counter.upsert({
      where: { id },
      create: { id, value: maxN },
      update: { value: { set: maxN } },
    });
    seeded.push({ year, value: maxN });
  }

  console.log(JSON.stringify({ seeded }, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
