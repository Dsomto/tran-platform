import "dotenv/config";
import { mkdirSync, writeFileSync } from "fs";
import { PrismaClient } from "../src/generated/prisma";
import { disqualifier } from "../src/lib/applicant-score";

// READ-ONLY. Dumps the pending applications that PASS the hard gates
// (real full name, not a one/two-liner, prior cybersecurity knowledge) into
// chunk files under /tmp/app-review/ so a fleet of review agents can each
// score one chunk. Gate-failing applicants are skipped — they are excluded
// from the Recommended list anyway. Writes nothing to the database.

const prisma = new PrismaClient();
const CHUNKS = 20;
const OUT = "/tmp/app-review";

async function main() {
  const apps = await prisma.publicApplication.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      ageRange: true,
      currentStatus: true,
      trackInterest: true,
      dedication: true,
      experience: true,
      whyPickYou: true,
      goals: true,
    },
  });

  const qualified = apps.filter((a) => disqualifier(a) === null);
  console.log(
    `${apps.length} pending; ${qualified.length} pass the hard gates; ` +
      `${apps.length - qualified.length} gated out.`
  );

  mkdirSync(OUT, { recursive: true });
  const per = Math.ceil(qualified.length / CHUNKS);
  let written = 0;
  for (let i = 0; i < CHUNKS; i++) {
    const slice = qualified.slice(i * per, (i + 1) * per);
    if (slice.length === 0) break;
    const name = `${OUT}/chunk-${String(i).padStart(2, "0")}.json`;
    writeFileSync(name, JSON.stringify(slice, null, 1));
    written++;
    console.log(`${name}  (${slice.length} applications)`);
  }
  console.log(`\nTotal: ${qualified.length} qualified applications across ${written} chunks.`);
}

main().finally(() => prisma.$disconnect());
