import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

/**
 * Reinstate interns who were finalized as FAILED, so they go back into the
 * Stage Results review and can be promoted. For each email:
 *   - StageReport (the given stage) FAILED -> PENDING_PROMOTION, finalizedAt = null
 *   - Intern.isActive = true, eliminatedAt = null
 *   - PublicApplication.stageStatus = "active"
 * After running this, open /admin/stage-results/review for the stage, confirm
 * them in the Promote tab, and Finalize to send the pass email + certificate +
 * letter.
 *
 * Dry-run by default. Set COMMIT=1 to write.
 *
 *   EMAILS="a@x.com,b@y.com" STAGE=STAGE_1 npx tsx scripts/reinstate-failed.ts
 *   EMAILS="a@x.com,b@y.com" STAGE=STAGE_1 COMMIT=1 npx tsx scripts/reinstate-failed.ts
 */

const prisma = new PrismaClient();
const COMMIT = process.env.COMMIT === "1";
const STAGE = process.env.STAGE ?? "STAGE_1";

async function main() {
  const emails = (process.env.EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (emails.length === 0) throw new Error("EMAILS env required (comma-separated)");

  console.log(`Reinstating ${emails.length} intern(s) for ${STAGE}${COMMIT ? "" : "  [DRY RUN]"}\n`);

  for (const email of emails) {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    if (!user) {
      console.log(`  ! ${email} — no user, skipping`);
      continue;
    }
    const intern = await prisma.intern.findUnique({
      where: { userId: user.id },
      select: { id: true, isActive: true, eliminatedAt: true },
    });
    if (!intern) {
      console.log(`  ! ${email} — no intern row, skipping`);
      continue;
    }
    const report = await prisma.stageReport.findFirst({
      where: { internId: intern.id, stage: STAGE as never },
      select: { id: true, status: true },
    });
    const name = `${user.firstName} ${user.lastName}`;

    if (!report) {
      console.log(`  ! ${name} <${user.email}> — no ${STAGE} report, skipping`);
      continue;
    }
    if (report.status !== "FAILED") {
      console.log(`  ~ ${name} <${user.email}> — report is ${report.status}, not FAILED. Will still reactivate the account.`);
    }

    console.log(`  > ${name} <${user.email}>  report ${report.status} -> PENDING_PROMOTION; reactivate account`);

    if (COMMIT) {
      await prisma.stageReport.update({
        where: { id: report.id },
        data: { status: "PENDING_PROMOTION", finalizedAt: null },
      });
      await prisma.intern.update({
        where: { id: intern.id },
        data: { isActive: true, eliminatedAt: null },
      });
      await prisma.publicApplication.updateMany({
        where: { email: { equals: user.email, mode: "insensitive" } },
        data: { stageStatus: "active" },
      });
    }
  }

  console.log(`\n${COMMIT ? "Reinstated." : "Dry run only. Re-run with COMMIT=1 to apply."}`);
  console.log("Then finalize them in /admin/stage-results/review to send the pass email.");
}

main()
  .catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
