import { prisma } from "../src/lib/db";

// Wipe every applicant-side record so the apply flow can be re-tested from
// zero. Keeps admin/super-admin/grader accounts and all configuration intact.
//
// LOCAL / TEST DATABASES ONLY. This is destructive and irreversible. The site
// is live with real applications, so this script refuses to run unless it can
// see it is NOT pointed at production.
//
// Run (local):       CONFIRM_WIPE=YES npx tsx scripts/wipe-applications.ts
// Run (non-local):   CONFIRM_WIPE=YES WIPE_ALLOW_PRODUCTION=YES npx tsx scripts/wipe-applications.ts
//
// The second flag is deliberately awkward — there is no safe accidental path
// to wiping a production database.
async function main() {
  // Hard stop: this is a developer tool, never something a deploy runs.
  if (process.env.VERCEL) {
    console.error(
      "Refusing to run: this script must never execute on Vercel infrastructure.\n" +
        "It is a local development / test tool only."
    );
    process.exit(1);
  }

  if (process.env.CONFIRM_WIPE !== "YES") {
    console.error(
      "Refusing to run without CONFIRM_WIPE=YES. Set it explicitly:\n" +
        "  CONFIRM_WIPE=YES npx tsx scripts/wipe-applications.ts"
    );
    process.exit(1);
  }

  // Production guard: a DATABASE_URL that is not obviously a local database
  // (or NODE_ENV=production) requires a second, explicit acknowledgement.
  const dbUrl = process.env.DATABASE_URL || "";
  const looksLocal = /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(dbUrl);
  const isProdLike = process.env.NODE_ENV === "production" || !looksLocal;
  if (isProdLike && process.env.WIPE_ALLOW_PRODUCTION !== "YES") {
    console.error(
      "Refusing to run: DATABASE_URL does not look like a local database" +
        (process.env.NODE_ENV === "production" ? " (and NODE_ENV=production)" : "") +
        ".\n" +
        "This wipes ALL applicant, intern and application data — it cannot be undone.\n" +
        "If you are CERTAIN this is a throwaway database, re-run with BOTH flags:\n" +
        "  CONFIRM_WIPE=YES WIPE_ALLOW_PRODUCTION=YES npx tsx scripts/wipe-applications.ts\n" +
        `Target DB: ${dbUrl.replace(/\/\/[^@]*@/, "//***:***@") || "(DATABASE_URL unset)"}`
    );
    process.exit(1);
  }

  // Identify intern users so we can scope user-side deletion correctly. Anyone
  // with role ADMIN / SUPER_ADMIN / GRADER stays.
  const internUsers = await prisma.user.findMany({
    where: { role: "INTERN" },
    select: { id: true, email: true },
  });
  const internUserIds = internUsers.map((u) => u.id);

  // Active intern profile rows derive from approved applicants.
  const interns = await prisma.intern.findMany({ select: { id: true } });
  const internIds = interns.map((i) => i.id);

  console.log("=".repeat(50));
  console.log("WIPE PLAN");
  console.log("=".repeat(50));
  console.log("Intern Users to delete:", internUsers.length);
  console.log("Intern profile rows to delete:", interns.length);

  const counts = {
    publicApplications: await prisma.publicApplication.count(),
    applications: await prisma.application.count(),
    stageReports: await prisma.stageReport.count(),
    reportGrades: await prisma.reportGrade.count(),
    submissions: await prisma.submission.count(),
    stageAccess: await prisma.stageAccess.count(),
    stageHistory: await prisma.stageHistory.count(),
    counters: await prisma.counter.count({ where: { id: { startsWith: "internId:" } } }),
    emailQueue: internUserIds.length
      ? await prisma.emailQueueItem.count({ where: { userId: { in: internUserIds } } })
      : 0,
  };
  console.table(counts);
  console.log("=".repeat(50));
  console.log("Proceeding in 3s. Ctrl-C now to abort.");
  await new Promise((r) => setTimeout(r, 3000));

  // Delete in leaf-to-root order so no FK references dangle.
  const deletedReportGrades = await prisma.reportGrade.deleteMany({});
  console.log("ReportGrade deleted:", deletedReportGrades.count);

  const deletedReports = await prisma.stageReport.deleteMany({});
  console.log("StageReport deleted:", deletedReports.count);

  const deletedSubmissions = await prisma.submission.deleteMany({});
  console.log("Submission deleted:", deletedSubmissions.count);

  const deletedAccess = await prisma.stageAccess.deleteMany({});
  console.log("StageAccess deleted:", deletedAccess.count);

  const deletedHistory = await prisma.stageHistory.deleteMany({});
  console.log("StageHistory deleted:", deletedHistory.count);

  const deletedInterns = await prisma.intern.deleteMany({});
  console.log("Intern deleted:", deletedInterns.count);

  const deletedApplications = await prisma.application.deleteMany({});
  console.log("Application deleted:", deletedApplications.count);

  const deletedPublic = await prisma.publicApplication.deleteMany({});
  console.log("PublicApplication deleted:", deletedPublic.count);

  if (internUserIds.length) {
    const deletedQueue = await prisma.emailQueueItem.deleteMany({
      where: { userId: { in: internUserIds } },
    });
    console.log("EmailQueueItem deleted:", deletedQueue.count);
  }

  const deletedUsers = await prisma.user.deleteMany({ where: { role: "INTERN" } });
  console.log("Intern Users deleted:", deletedUsers.count);

  const deletedCounters = await prisma.counter.deleteMany({
    where: { id: { startsWith: "internId:" } },
  });
  console.log("internId counters reset:", deletedCounters.count);

  console.log("=".repeat(50));
  console.log("Wipe complete. Apply flow is now testable from a clean slate.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
