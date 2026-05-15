import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

// One-off: revert Enyi Jerry from a committed intern back into the
// "queued_approved" pending list, because approving no longer onboards an
// intern up-front — that now happens when the welcome email is sent.
//
// Deletes his User + Intern records and resets the PublicApplication. Refuses
// to run if the intern has any stage reports / history (i.e. real activity).
//
// Run: CONFIRM_REVERT=YES npx tsx scripts/revert-enyi-jerry.ts

const APP_ID = "6a06e20c74bc5736e51c4532";
const EMAIL = "enyijerry67@gmail.com";

const prisma = new PrismaClient();

async function main() {
  const app = await prisma.publicApplication.findUnique({ where: { id: APP_ID } });
  if (!app) throw new Error(`PublicApplication ${APP_ID} not found`);
  console.log("BEFORE — PublicApplication:", {
    fullName: app.fullName,
    email: app.email,
    status: app.status,
    stage: app.stage,
    stageStatus: app.stageStatus,
    internId: app.internId,
  });

  const user = await prisma.user.findUnique({
    where: { email: EMAIL },
    include: { intern: true },
  });
  console.log("BEFORE — User:", user ? { id: user.id, role: user.role } : "none");
  console.log("BEFORE — Intern:", user?.intern ? { id: user.intern.id, currentStage: user.intern.currentStage } : "none");

  // Safety: refuse if the intern has any real activity.
  if (user?.intern) {
    const [reports, history] = await Promise.all([
      prisma.stageReport.count({ where: { internId: user.intern.id } }),
      prisma.stageHistory.count({ where: { internId: user.intern.id } }),
    ]);
    console.log(`Intern activity — stageReports: ${reports}, stageHistory: ${history}`);
    if (reports > 0 || history > 0) {
      throw new Error("Intern has stage activity — aborting; revert manually.");
    }
  }

  if (process.env.CONFIRM_REVERT !== "YES") {
    console.log("\nDry run. Set CONFIRM_REVERT=YES to apply.");
    return;
  }

  // Detach any queued/sent emails from the User so deleting it leaves no
  // dangling reference, then remove Intern + User.
  if (user) {
    const detached = await prisma.emailQueueItem.updateMany({
      where: { userId: user.id },
      data: { userId: null },
    });
    console.log(`Detached ${detached.count} email-queue row(s) from the user.`);
    if (user.intern) {
      await prisma.intern.delete({ where: { id: user.intern.id } });
      console.log("Deleted Intern.");
    }
    await prisma.user.delete({ where: { id: user.id } });
    console.log("Deleted User.");
  }

  const updated = await prisma.publicApplication.update({
    where: { id: APP_ID },
    data: {
      status: "queued_approved",
      stage: -1,
      stageStatus: "none",
      internId: null,
      loginPassword: null,
      welcomeEmailSentAt: null,
    },
  });
  console.log("AFTER — PublicApplication:", {
    status: updated.status,
    stage: updated.stage,
    stageStatus: updated.stageStatus,
    internId: updated.internId,
  });
  console.log("\nDone. Enyi Jerry is back in the Decision Emails pending list.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
