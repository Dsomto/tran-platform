// Stage 1 opening notification — emails every active intern on STAGE_1
// telling them the stage is open + reminding them of the brief.
//
// Pipeline mirrors notify-permission-locked.ts: one EmailQueueItem per intern
// (kind=GENERAL) shipped via /api/cron/email-drain, plus one pinned
// Announcement on Stage 1 so the notice also lands on the dashboard.
//
// Idempotent: re-runs skip anyone already queued the same subject today.
//
// Usage:
//   DRY=1 npx tsx scripts/notify-stage-1-open.ts     # preview only
//   COMMIT=1 npx tsx scripts/notify-stage-1-open.ts  # enqueue + announce

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();
const COMMIT = process.env.COMMIT === "1";

const SUBJECT = "Stage 1 is open — Ciphers & Secrets";
const APP_URL = process.env.PUBLIC_APP_URL || "https://ubuntubridgeinitiatives.org";

function emailBody(firstName: string): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#F1F5F9;padding:32px 16px;color:#0F172A;">
      <div style="background:white;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,0.06),0 8px 24px rgba(15,23,42,0.06);">
        <div style="display:flex;align-items:stretch;">
          <div style="width:6px;background:#10B981;flex-shrink:0;"></div>
          <div style="padding:28px 32px 12px 32px;flex:1;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;color:#64748B;text-transform:uppercase;margin-bottom:2px;">
              Ubuntu Bridge Initiative
            </div>
            <div style="font-size:11px;color:#94A3B8;">Cybersecurity Internship · Cohort 1</div>
          </div>
        </div>
        <div style="padding:8px 32px 32px 38px;">
          <h1 style="font-size:24px;font-weight:700;line-height:1.3;margin:18px 0 6px;color:#0F172A;">
            Stage 1 is open, ${firstName}.
          </h1>
          <p style="font-size:15px;line-height:1.65;color:#334155;margin:0 0 18px;">
            Ciphers &amp; Secrets — the applied cryptography stage — is live on your
            dashboard. The brief, the artefacts The Griot left behind, and the
            deliverable slots are all up.
          </p>
          <p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 22px;">
            Quick context: your Stage 0 dismissal-pattern argument is what triggered
            the emergency crypto audit you're now doing. Tunde pulled a zip off a
            staging server The Griot abandoned 48 hours after the IP block went live.
            None of it is hard. All of it tells you how the attacker thinks.
          </p>

          <div style="margin:0 0 22px;padding:18px 20px;background:#F0F9FF;border-left:4px solid #0284C7;border-radius:0 8px 8px 0;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#0C4A6E;letter-spacing:0.02em;text-transform:uppercase;">
              What to do first
            </p>
            <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.7;color:#0C4A6E;">
              <li style="margin-bottom:6px;">
                Open the Stage 1 brief and read it once end-to-end before opening any
                of the artefacts. The brief sets the constraints the rest of the
                puzzle depends on.
              </li>
              <li style="margin-bottom:6px;">
                Pull the evidence pack and confirm the file list matches what the
                brief says you should have.
              </li>
              <li>
                Block out a clean two-hour window on the first deliverable. Stage 1
                moves quicker than Stage 0 — there is no version of this that gets
                easier under deadline.
              </li>
            </ul>
          </div>

          <div style="margin:0 0 18px;">
            <a href="${APP_URL}/dashboard/assignments" style="display:inline-block;background:#2563EB;color:white;padding:11px 24px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
              Open Stage 1 on the dashboard
            </a>
          </div>

          <p style="font-size:13px;line-height:1.6;color:#64748B;margin:24px 0 0;">
            Mentor office hours are in Slack. The Stage 1 channel is pinned at the
            top of the workspace — drop questions there as you go rather than
            saving them for the end.
          </p>

          <div style="margin-top:28px;padding-top:20px;border-top:1px solid #E2E8F0;">
            <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.7;">
              — Okoma &amp; Quadri<br/>
              <span style="color:#64748B;font-size:13px;">Programme office, TRAN</span>
            </p>
          </div>
        </div>
      </div>
      <p style="text-align:center;color:#94A3B8;font-size:11px;margin:18px 0 0;">
        Sent from the programme office · TRAN, The Root Access Network
      </p>
    </div>
  `;
}

const ANNOUNCEMENT_TITLE = "Stage 1 is open — Ciphers & Secrets";
const ANNOUNCEMENT_CONTENT = `Stage 1 — Ciphers & Secrets is live on your dashboard. Open it from /dashboard/assignments. The brief, the evidence pack, and the deliverable slots are all up.

Read the brief end-to-end before opening any artefacts. Drop questions in the Stage 1 Slack channel as you go.`;

async function main() {
  console.log(`Mode: ${COMMIT ? "COMMIT" : "DRY-RUN"}`);

  const interns = await prisma.intern.findMany({
    where: { currentStage: "STAGE_1", isActive: true },
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
  });
  console.log(`Active interns on STAGE_1: ${interns.length}\n`);

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  let enqueued = 0;
  let skipped = 0;
  for (const i of interns) {
    const existing = await prisma.emailQueueItem.findFirst({
      where: {
        userId: i.user.id,
        kind: "GENERAL",
        subject: SUBJECT,
        enqueuedAt: { gte: todayStart },
      },
      select: { id: true, status: true },
    });
    if (existing) {
      skipped++;
      continue;
    }
    if (COMMIT) {
      await prisma.emailQueueItem.create({
        data: {
          userId: i.user.id,
          toEmail: i.user.email,
          kind: "GENERAL",
          subject: SUBJECT,
          body: emailBody(i.user.firstName),
          context: { stage: "STAGE_1", reason: "stage-1-opens" },
        },
      });
    }
    enqueued++;
    if (enqueued <= 5) {
      console.log(`  ${COMMIT ? "✓" : "→"} ${i.user.firstName} ${i.user.lastName} <${i.user.email}>`);
    }
  }
  if (enqueued > 5) console.log(`  ... (${enqueued - 5} more)`);

  // Announcement — single pinned post on STAGE_1.
  let annAction: "created" | "kept" | "skipped" = "skipped";
  const existingAnn = await prisma.announcement.findFirst({
    where: { title: ANNOUNCEMENT_TITLE, stage: "STAGE_1" },
    select: { id: true },
  });
  if (existingAnn) {
    annAction = "kept";
  } else if (COMMIT) {
    const author = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
      select: { id: true },
    });
    if (author) {
      await prisma.announcement.create({
        data: {
          title: ANNOUNCEMENT_TITLE,
          content: ANNOUNCEMENT_CONTENT,
          authorId: author.id,
          stage: "STAGE_1",
          isPinned: true,
        },
      });
      annAction = "created";
    }
  }

  console.log("");
  console.log(`Emails enqueued: ${enqueued}`);
  console.log(`Skipped (already queued today): ${skipped}`);
  console.log(`Announcement: ${annAction}`);
  if (!COMMIT) console.log("\nDRY RUN — re-run with COMMIT=1 to actually enqueue / create.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
