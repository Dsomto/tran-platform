// Notify Stage 0 interns whose submission Drive folders we cannot extract.
//
// What "permission-locked" means here: their report is still SUBMITTED or
// UNDER_REVIEW (no GRADED yet), and grader-side fetches consistently come back
// empty or as an HTML "request access" page. From the intern's side the most
// common cause is that the folder is shared but the inner files inherit the
// default Drive permission, which isn't public.
//
// What this script sends:
//   1. One EmailQueueItem per affected intern (kind=GENERAL). The cron drain
//      picks these up and ships via SMTP, same as every other transactional
//      email. The body explains exactly what to do and gives a re-submit link.
//   2. One Announcement scoped to STAGE_0 so the same notice also lands on
//      the intern dashboard (in case the email is missed or filtered).
//
// Idempotent: re-running checks for an existing pending GENERAL email with the
// permission-fix subject for the same user this calendar day and skips it.
//
// Usage:
//   DRY=1 npx tsx scripts/notify-permission-locked.ts   # preview only
//   COMMIT=1 npx tsx scripts/notify-permission-locked.ts # enqueue + announce
//
// Optional: SUPER_ADMIN_EMAIL=... pins the Announcement author. Otherwise
// the first SUPER_ADMIN in the DB is used.

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();
const COMMIT = process.env.COMMIT === "1";

const SUBJECT = "Stage 0 submission — your file sharing settings need updating";
const APP_URL = process.env.PUBLIC_APP_URL || "https://ubuntubridgeinitiatives.org";

function buildEmailBody(firstName: string, reportUrl: string): string {
  const safeUrl = reportUrl
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `
    <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#F8FAFC;padding:40px 20px;">
      <div style="background:linear-gradient(135deg,#2563EB,#0891B2);padding:32px;border-radius:16px;text-align:center;color:white;">
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;">UBI</h1>
        <p style="margin:0;font-size:13px;opacity:0.9;">Ubuntu Bridge Initiative</p>
      </div>
      <div style="background:white;padding:32px;border-radius:16px;margin-top:20px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="color:#0F172A;margin:0 0 16px;">Hi ${firstName},</h2>

        <p style="color:#334155;line-height:1.7;margin:0 0 16px;">
          We tried to open your Stage 0 capstone submission and could not read the files inside
          your shared link. The folder is shared, but the individual files inside it are still set
          to private, so the graders cannot open them.
        </p>

        <div style="background:#FEF3C7;border-left:4px solid #D97706;padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0;">
          <p style="margin:0 0 8px;color:#0F172A;font-size:14px;font-weight:600;">What to do</p>
          <p style="margin:0;color:#92400E;font-size:14px;line-height:1.7;">
            Open your submission link, and for <strong>each of the 4 files inside</strong> (D1, D2, D3, D4),
            click Share and set the access to <strong>"Anyone with the link → Viewer"</strong>. Sharing the
            folder is not enough on Google Drive — every file inside has to be set individually,
            or the grader sees a "request access" page.
          </p>
        </div>

        <p style="color:#334155;line-height:1.7;margin:0 0 16px;">
          Once that's done, you don't need to re-submit. You can reply to this email to confirm and
          the graders will retry, or use the button below to confirm via your dashboard. Your
          original deadline still stands — this is just to make your existing files visible.
        </p>

        <p style="text-align:center;margin:24px 0;">
          <a href="${APP_URL}/dashboard/reports/STAGE_0" style="display:inline-block;background:#2563EB;color:white;padding:11px 24px;border-radius:9999px;font-size:14px;font-weight:600;text-decoration:none;">
            Open my Stage 0 submission
          </a>
        </p>

        <p style="color:#475569;line-height:1.7;font-size:13px;margin:24px 0 0;">
          Your current submission link on record: <br/>
          <a href="${safeUrl}" style="color:#2563EB;word-break:break-all;">${safeUrl}</a>
        </p>

        <p style="color:#475569;line-height:1.7;font-size:13px;margin:16px 0 0;">
          If you submitted a different link or the files have moved, update the link from the
          dashboard before fixing permissions. Reply to this email if you're stuck.
        </p>
      </div>
      <p style="text-align:center;color:#94A3B8;font-size:12px;margin-top:24px;">
        Ubuntu Bridge Initiative · ubuntubridgeinitiatives.org
      </p>
    </div>
  `;
}

const ANNOUNCEMENT_TITLE = "Stage 0 submission file sharing — action needed";
const ANNOUNCEMENT_CONTENT = `If you got an email titled "${SUBJECT}", it means the graders could open your shared folder but not the files inside it.

Google Drive does not inherit folder sharing onto the files. For each of your 4 deliverables (D1, D2, D3, D4), open the file, click Share, and set "Anyone with the link → Viewer".

Once you've fixed all four files, you do not need to re-submit. Reply to the email if you ran into trouble.`;

async function main() {
  console.log(`Mode: ${COMMIT ? "COMMIT" : "DRY-RUN"}`);

  // Anyone whose Stage 0 report is still in SUBMITTED or UNDER_REVIEW. These
  // are the ones grader-side fetches couldn't read; we don't filter further by
  // permission state because we already know they aren't graded and a follow-up
  // is harmless even if the issue is something else.
  const reports = await prisma.stageReport.findMany({
    where: {
      stage: "STAGE_0",
      status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      submittedAt: { not: null },
    },
    include: {
      intern: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
    },
  });
  console.log(`Affected reports: ${reports.length}\n`);

  // Same-day idempotency window: midnight UTC today.
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  let enqueued = 0;
  let skippedAlreadySent = 0;
  for (const r of reports) {
    const user = r.intern.user;
    const existing = await prisma.emailQueueItem.findFirst({
      where: {
        userId: user.id,
        kind: "GENERAL",
        subject: SUBJECT,
        enqueuedAt: { gte: todayStart },
      },
      select: { id: true, status: true },
    });
    if (existing) {
      skippedAlreadySent++;
      console.log(`  skip ${user.firstName} ${user.lastName} <${user.email}> — already enqueued today (${existing.status})`);
      continue;
    }
    if (COMMIT) {
      await prisma.emailQueueItem.create({
        data: {
          userId: user.id,
          toEmail: user.email,
          kind: "GENERAL",
          subject: SUBJECT,
          body: buildEmailBody(user.firstName, r.reportUrl ?? ""),
          context: { reportId: r.id, stage: "STAGE_0", reason: "permission-fix" },
        },
      });
    }
    enqueued++;
    console.log(`  ${COMMIT ? "✓" : "→"} ${user.firstName} ${user.lastName} <${user.email}>`);
  }

  // One announcement, regardless of how many interns. Re-runs reuse the
  // existing announcement if the title matches (so you don't get duplicates).
  let announcementAction: "created" | "kept" | "would-create" = "would-create";
  if (reports.length > 0) {
    const existingAnn = await prisma.announcement.findFirst({
      where: { title: ANNOUNCEMENT_TITLE, stage: "STAGE_0" },
      select: { id: true },
    });
    if (existingAnn) {
      announcementAction = "kept";
    } else if (COMMIT) {
      const author =
        (process.env.SUPER_ADMIN_EMAIL
          ? await prisma.user.findUnique({
              where: { email: process.env.SUPER_ADMIN_EMAIL },
              select: { id: true },
            })
          : null) ??
        (await prisma.user.findFirst({
          where: { role: "SUPER_ADMIN" },
          select: { id: true },
        }));
      if (!author) {
        console.error("No SUPER_ADMIN user found — cannot author Announcement. Set SUPER_ADMIN_EMAIL.");
      } else {
        await prisma.announcement.create({
          data: {
            title: ANNOUNCEMENT_TITLE,
            content: ANNOUNCEMENT_CONTENT,
            authorId: author.id,
            stage: "STAGE_0",
            isPinned: true,
          },
        });
        announcementAction = "created";
      }
    }
  }

  console.log("");
  console.log(`Emails enqueued: ${enqueued}`);
  console.log(`Skipped (already enqueued today): ${skippedAlreadySent}`);
  console.log(`Announcement: ${announcementAction}`);
  if (!COMMIT) console.log("\nDRY RUN — re-run with COMMIT=1 to actually enqueue / create.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
