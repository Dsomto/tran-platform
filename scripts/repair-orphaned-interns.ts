import "dotenv/config";
import { writeFileSync } from "node:fs";
import { PrismaClient, Track } from "../src/generated/prisma";

/**
 * Find every User with role=INTERN that has no linked Intern row but does
 * have an approved PublicApplication (matched by email), and create the
 * missing Intern row.
 *
 * Why this happens: onboardApprovedApplicant() in src/lib/onboard.ts creates
 * User and Intern as two serial Prisma calls because MongoDB can't chain on
 * freshly-created IDs inside a $transaction array. If the second call fails
 * (network blip, timeout, etc.) the user is left with a working login but
 * no Intern row. Their dashboard renders the pre-intern card and the
 * "applications closed" trail follows from there. This script converges
 * those partial states.
 *
 * SAFETY:
 *   INSPECT-only by default — prints the plan, writes a JSON backup of
 *   every affected user, no DB writes.
 *   COMMIT=1 actually creates the Intern rows.
 *
 * USAGE:
 *   # See the plan:
 *   npx tsx scripts/repair-orphaned-interns.ts
 *
 *   # Apply it:
 *   COMMIT=1 npx tsx scripts/repair-orphaned-interns.ts
 *
 *   # Limit to one email (useful for spot fixes):
 *   ONLY_EMAIL=godswillanyemaji123@gmail.com COMMIT=1 \
 *     npx tsx scripts/repair-orphaned-interns.ts
 */

const prisma = new PrismaClient();

const COMMIT = process.env.COMMIT === "1";
const ONLY_EMAIL = process.env.ONLY_EMAIL?.trim().toLowerCase() ?? null;

function mapTrack(trackInterest: string): Track {
  const s = trackInterest.toLowerCase();
  if (s.includes("soc")) return Track.SOC_ANALYSIS;
  if (s.includes("ethical") || s.includes("hack") || s.includes("pen")) return Track.ETHICAL_HACKING;
  if (s.includes("grc") || s.includes("govern") || s.includes("complian")) return Track.GRC;
  return Track.SOC_ANALYSIS;
}

async function main() {
  // Pull the orphan population: role=INTERN users with no Intern row.
  const internUsers = await prisma.user.findMany({
    where: { role: "INTERN", ...(ONLY_EMAIL ? { email: ONLY_EMAIL } : {}) },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      intern: { select: { id: true } },
    },
  });
  const orphans = internUsers.filter((u) => !u.intern);

  if (orphans.length === 0) {
    console.log(
      ONLY_EMAIL
        ? `No orphan found for email ${ONLY_EMAIL}. (Either no such user, the user already has an Intern row, or their role is not INTERN.)`
        : "No orphaned User-with-no-Intern rows found. Nothing to repair."
    );
    return;
  }

  console.log(`Orphans (role=INTERN, no Intern row): ${orphans.length}\n`);

  type Plan = {
    userId: string;
    email: string;
    fullName: string;
    pubAppId: string | null;
    pubAppStatus: string;
    trackInterest: string | null;
    inferredTrack: Track | null;
    canRepair: boolean;
    reason?: string;
  };

  const plans: Plan[] = [];
  for (const u of orphans) {
    const app = await prisma.publicApplication.findUnique({
      where: { email: u.email.toLowerCase() },
      select: { id: true, status: true, trackInterest: true },
    });
    const fullName = `${u.firstName} ${u.lastName}`.trim();
    if (!app) {
      plans.push({
        userId: u.id,
        email: u.email,
        fullName,
        pubAppId: null,
        pubAppStatus: "(none)",
        trackInterest: null,
        inferredTrack: null,
        canRepair: false,
        reason: "no PublicApplication for this email — cannot infer track. Investigate manually.",
      });
      continue;
    }
    if (app.status !== "approved") {
      plans.push({
        userId: u.id,
        email: u.email,
        fullName,
        pubAppId: app.id,
        pubAppStatus: app.status,
        trackInterest: app.trackInterest,
        inferredTrack: null,
        canRepair: false,
        reason: `PublicApplication.status is "${app.status}", not "approved" — do not auto-promote. If they should be an intern, approve them in the admin UI first.`,
      });
      continue;
    }
    plans.push({
      userId: u.id,
      email: u.email,
      fullName,
      pubAppId: app.id,
      pubAppStatus: app.status,
      trackInterest: app.trackInterest,
      inferredTrack: mapTrack(app.trackInterest),
      canRepair: true,
    });
  }

  console.log("=== Plan ===");
  for (const p of plans) {
    const mark = p.canRepair ? "✓" : "✗";
    console.log(
      `  ${mark} ${p.fullName.padEnd(28)} | ${p.email.padEnd(40)} | pubApp=${p.pubAppStatus.padEnd(10)} | track=${p.trackInterest ?? "—"} → ${p.inferredTrack ?? "(skip)"}`
    );
    if (p.reason) console.log(`      reason: ${p.reason}`);
  }

  const repairable = plans.filter((p) => p.canRepair);
  const skipped = plans.length - repairable.length;
  console.log(`\nWill repair: ${repairable.length}.  Skipped: ${skipped}.`);

  // Backup before any write.
  const backupPath = `scripts/backup-orphaned-interns-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}.json`;
  writeFileSync(backupPath, JSON.stringify({ orphans, plans }, null, 2));
  console.log(`Backup: ${backupPath}`);

  if (!COMMIT) {
    console.log(`\nMode: INSPECT — no writes. Re-run with COMMIT=1 to apply.`);
    return;
  }

  if (repairable.length === 0) {
    console.log(`\nMode: COMMIT — but nothing repairable. Exiting.`);
    return;
  }

  console.log(`\nMode: COMMIT — creating ${repairable.length} Intern row(s)...`);
  let created = 0;
  for (const p of repairable) {
    try {
      // Re-check existence inside the loop (defensive — concurrent run protection).
      const exists = await prisma.intern.findUnique({ where: { userId: p.userId } });
      if (exists) {
        console.log(`  skip ${p.email}: Intern row appeared between INSPECT and COMMIT (id=${exists.id}).`);
        continue;
      }
      const intern = await prisma.intern.create({
        data: { userId: p.userId, track: p.inferredTrack as Track },
      });
      console.log(`  ✓ ${p.email}: Intern created (id=${intern.id}, track=${p.inferredTrack}).`);
      created++;
    } catch (err) {
      console.error(`  ✗ ${p.email}: failed to create Intern row —`, err);
    }
  }
  console.log(`\n✅ Created ${created} Intern row(s).`);
  console.log(`Affected users can now refresh their dashboard and proceed to the stage.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
