import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

// Read-only. Checks that every closed (eliminated) account has a consistent
// 7-day grace: i.e. it has an eliminatedAt the login gate can read, and the
// PublicApplication.stageStatus mirror agrees with the Intern row. Writes nothing.
const prisma = new PrismaClient();
const GRACE_DAYS = 7;
const GRACE_MS = GRACE_DAYS * 24 * 60 * 60 * 1000;

async function main() {
  const now = Date.now();

  // 1. Interns with an eliminatedAt — these have a working grace clock.
  const elim = await prisma.intern.findMany({
    where: { eliminatedAt: { not: null } },
    select: { eliminatedAt: true, isActive: true, user: { select: { email: true } } },
  });
  let inGrace = 0, past = 0;
  for (const e of elim) {
    const d = now - new Date(e.eliminatedAt as Date).getTime();
    if (d < GRACE_MS) inGrace++; else past++;
  }
  console.log(`Interns with eliminatedAt set: ${elim.length}`);
  console.log(`  in 7-day grace (can log in once deployed): ${inGrace}`);
  console.log(`  past 7 days (stay locked, purge-eligible):  ${past}`);

  // 2. Consistency: PublicApplications marked eliminated whose backing intern
  //    has NO eliminatedAt (the gate would block them with no grace) or is
  //    still isActive (stale mirror).
  const apps = await prisma.publicApplication.findMany({
    where: { stageStatus: "eliminated" },
    select: { email: true },
  });
  let missingClock = 0, staleActive = 0, noIntern = 0;
  const badRows: string[] = [];
  for (const a of apps) {
    const user = await prisma.user.findFirst({
      where: { email: { equals: a.email, mode: "insensitive" } },
      select: { intern: { select: { eliminatedAt: true, isActive: true } } },
    });
    const i = user?.intern;
    if (!user || !i) { noIntern++; continue; }
    if (i.eliminatedAt == null) { missingClock++; badRows.push(`${a.email} (eliminated app, but eliminatedAt=null -> would be blocked, no grace)`); }
    if (i.isActive === true) { staleActive++; badRows.push(`${a.email} (eliminated app, but intern still isActive=true)`); }
  }
  console.log(`\nPublicApplications stageStatus=eliminated: ${apps.length}`);
  console.log(`  inconsistent - no eliminatedAt clock: ${missingClock}`);
  console.log(`  inconsistent - intern still active:   ${staleActive}`);
  console.log(`  no matching intern row:               ${noIntern}`);
  if (badRows.length) {
    console.log("\n  rows needing attention:");
    for (const r of badRows.slice(0, 30)) console.log("   - " + r);
  } else {
    console.log("\n  All eliminated accounts are consistent: every one has a grace clock the gate can read.");
  }
  console.log("\n(read-only — nothing modified)");
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); }).finally(() => prisma.$disconnect());
