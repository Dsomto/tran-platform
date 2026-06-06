// Make sure every submitted Stage 0 intern is represented in the result review.
//
// We've graded every intern whose submission we could open. The rest fall into
// two buckets:
//   1. Drive folder shared, files inside not shared. Permission-fix email was
//      sent on 2026-06-06 (subject: "Stage 0 submission — your file sharing
//      settings need updating").
//   2. Empty folders / single-file links we can't fetch programmatically.
//
// Either way, the intern is still in SUBMITTED or UNDER_REVIEW (non-divergent)
// with no Grader Six grade attached, which means they don't appear on the
// Result Review tab — and that's how the user discovered the gap.
//
// This script writes a placeholder Grader Six grade (score = 0, with a
// feedback explaining the issue + a reminder of the permission email). When
// the super-admin re-applies the cutoff, these rows land in the failing bucket
// in the review tab where they can be manually swapped or score-bumped if the
// admin verifies the actual submission by clicking the Drive link.
//
// Idempotent: skips reports Grader Six has already graded.
//
// Usage:
//   DRY=1 npx tsx scripts/grade-inaccessible-as-zero.ts   # preview only
//   COMMIT=1 npx tsx scripts/grade-inaccessible-as-zero.ts # write grades

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();
const COMMIT = process.env.COMMIT === "1";
const GRADER_EMAIL = "grader6@ubuntubridgeinitiatives.org";

const FEEDBACK = `The graders could not open the contents of your Stage 0 submission folder. The shared link returns a "request access" page when the files inside are opened, which suggests the folder is shared but each file inside it still has the default private permission applied. Google Drive does not inherit a folder's "Anyone with the link" setting onto the files; each file has to be set individually.

You were emailed about this on 6 June 2026 (subject: "Stage 0 submission — your file sharing settings need updating") and the same notice was pinned on your Stage 0 dashboard. If you have already re-shared the four deliverables (D1, D2, D3, D4) with "Anyone with the link → Viewer" applied to each file, the programme office can re-run the grading on your submission and adjust this score.

If your link on file is wrong or the deliverables are in a different folder than the one we have, update the link from your dashboard before requesting a re-grade.`;

const INTERN_MESSAGE = `Your submission could not be opened. See the email and dashboard notice from 6 June 2026 about your file sharing settings.`;

async function main() {
  console.log(`Mode: ${COMMIT ? "COMMIT" : "DRY-RUN"}`);

  const grader = await prisma.user.findUnique({
    where: { email: GRADER_EMAIL },
    select: { id: true },
  });
  if (!grader) {
    console.error("Grader Six account missing");
    process.exit(2);
  }

  // SUBMITTED reports that Grader Six hasn't touched.
  const candidates = await prisma.stageReport.findMany({
    where: {
      stage: "STAGE_0",
      status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      submittedAt: { not: null },
      divergent: false,
      grades: { none: { graderId: grader.id } },
    },
    include: {
      intern: {
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      },
    },
  });
  console.log(`Reports to grade as 0 (inaccessible): ${candidates.length}\n`);

  let written = 0;
  for (const r of candidates) {
    const name = `${r.intern.user.firstName} ${r.intern.user.lastName}`;
    if (COMMIT) {
      await prisma.reportGrade.create({
        data: {
          reportId: r.id,
          graderId: grader.id,
          score: 0,
          feedback: FEEDBACK,
          aiFlagged: false,
          gradedAt: new Date(),
        },
      });
      await prisma.stageReport.update({
        where: { id: r.id },
        data: {
          status: "GRADED",
          score: 0,
          feedback: INTERN_MESSAGE,
          gradedAt: new Date(),
          divergent: false,
        },
      });
    }
    written++;
    console.log(`  ${COMMIT ? "✓" : "→"} ${r.id} ${name} <${r.intern.user.email}>`);
  }

  console.log("");
  console.log(`Wrote ${written} grade(s).`);
  if (!COMMIT) console.log("DRY RUN — re-run with COMMIT=1 to write grades.");
  console.log("\nNext: re-apply the Stage 0 cutoff on /admin/stage-results so these");
  console.log("reports get sorted into the review tab alongside everyone else.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
