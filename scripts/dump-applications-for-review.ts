import "dotenv/config";
import { mkdirSync, writeFileSync } from "fs";
import { PrismaClient } from "../src/generated/prisma";

// READ-ONLY. Dumps every pending application into chunk files under
// /tmp/app-review/ so a fleet of review agents can each score one chunk.
// Writes nothing to the database.

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

  mkdirSync(OUT, { recursive: true });
  const per = Math.ceil(apps.length / CHUNKS);
  let written = 0;
  for (let i = 0; i < CHUNKS; i++) {
    const slice = apps.slice(i * per, (i + 1) * per);
    if (slice.length === 0) break;
    const name = `${OUT}/chunk-${String(i).padStart(2, "0")}.json`;
    writeFileSync(name, JSON.stringify(slice, null, 1));
    written++;
    console.log(`${name}  (${slice.length} applications)`);
  }
  console.log(`\nTotal: ${apps.length} pending applications across ${written} chunks.`);
}

main().finally(() => prisma.$disconnect());
