import { prisma } from "../src/lib/db";

async function main() {
  const dupEmails = await prisma.publicApplication.groupBy({
    by: ["email"],
    _count: { email: true },
    having: { email: { _count: { gt: 1 } } },
  });

  const dupReferral = await prisma.publicApplication.groupBy({
    by: ["referralCode"],
    _count: { referralCode: true },
    having: { referralCode: { _count: { gt: 1 } } },
  });

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

  console.log(
    JSON.stringify(
      {
        duplicateEmails: dupEmails.length,
        duplicateReferralCodes: dupReferral.length,
        totalIssuedInternIds: rows.length,
        maxInternIdByYear: maxByYear,
        dupEmailsSample: dupEmails.slice(0, 5),
        dupReferralSample: dupReferral.slice(0, 5),
      },
      null,
      2
    )
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
