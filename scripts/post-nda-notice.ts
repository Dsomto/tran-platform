// Internal communication: NDA breach notice.
// Posts a pinned Stage 1 announcement so every intern sees it on their
// dashboard. Also creates an EmailQueueItem per active intern so the
// notice reaches inboxes for anyone who hasn't logged in yet today.
//
// Idempotent: re-running keeps the existing announcement and skips any
// intern already emailed today.

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();
const COMMIT = process.env.COMMIT === "1";

const TITLE = "Internal communication — NDA breach";
// Hardcoded production URL. We deliberately do NOT read PUBLIC_APP_URL
// from env here — running this script locally would pull in a localhost
// value from .env and ship broken links to the live cohort. If we ever
// move the production host, change this constant.
const APP_URL = "https://ubuntubridgeinitiatives.org";

const CONTENT = `A small number of interns posted screenshots and excerpts of internal Stage 0 material — including PII from the evidence pack — to external social channels. This is a direct breach of the NDA you signed before starting the programme.

The accounts involved have been identified. Each individual will receive a formal query within the next 48 hours, and the matter will be handled in line with the disciplinary section of the agreement.

To be clear, for the rest of the cohort:
1. Stage materials, screenshots, evidence-pack files, decoded artefacts, and the brief itself are confidential. Do not post them externally — not on Slack, not on social media, not on personal blogs, not on portfolios.
2. You may discuss the experience generally ("I am working through a SOC dismissal-pattern case"). You may not publish artefacts.
3. Mentor office hours and the cohort Slack are the right channels for questions. Anything you would not want to read in a screenshot to a regulator stays out of public posts.

This is a one-time clarification. The breach above will be treated as a one-time clarification too. Future incidents — by anyone — will be handled under the agreement without further notice.

— Programme office, TRAN`;

const EMAIL_SUBJECT = "Internal communication — NDA breach (please read)";

function emailBody(firstName: string): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#F1F5F9;padding:32px 16px;color:#0F172A;">
      <div style="background:white;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,0.06),0 8px 24px rgba(15,23,42,0.06);">
        <div style="display:flex;align-items:stretch;">
          <div style="width:6px;background:#B91C1C;flex-shrink:0;"></div>
          <div style="padding:28px 32px 12px 32px;flex:1;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;color:#64748B;text-transform:uppercase;margin-bottom:2px;">
              Ubuntu Bridge Initiative
            </div>
            <div style="font-size:11px;color:#94A3B8;">Internal communication · Cohort 1</div>
          </div>
        </div>
        <div style="padding:8px 32px 32px 38px;">
          <h1 style="font-size:22px;font-weight:700;line-height:1.3;margin:18px 0 6px;color:#0F172A;">
            Hi ${firstName},
          </h1>
          <p style="font-size:15px;line-height:1.65;color:#334155;margin:0 0 16px;">
            A small number of interns posted screenshots and excerpts of internal
            Stage 0 material — including PII from the evidence pack — to external
            social channels. This is a direct breach of the NDA you signed before
            starting the programme.
          </p>
          <p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 18px;">
            The accounts involved have been identified. Each individual will
            receive a formal query within the next 48 hours, and the matter will
            be handled in line with the disciplinary section of the agreement.
          </p>
          <div style="margin:0 0 20px;padding:18px 20px;background:#FEF2F2;border-left:4px solid #DC2626;border-radius:0 8px 8px 0;">
            <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#7F1D1D;text-transform:uppercase;letter-spacing:0.04em;">
              For the rest of the cohort
            </p>
            <ol style="margin:0;padding-left:20px;font-size:14px;line-height:1.7;color:#7F1D1D;">
              <li style="margin-bottom:6px;">
                Stage materials, screenshots, evidence-pack files, decoded
                artefacts, and the brief itself are confidential. Do not post
                them externally — not on Slack, not on social media, not on
                personal blogs, not on portfolios.
              </li>
              <li style="margin-bottom:6px;">
                You may discuss the experience generally ("I am working through a
                SOC dismissal-pattern case"). You may not publish artefacts.
              </li>
              <li>
                Mentor office hours and the cohort Slack are the right channels
                for questions. Anything you would not want to read in a
                screenshot to a regulator stays out of public posts.
              </li>
            </ol>
          </div>
          <p style="font-size:14px;line-height:1.7;color:#334155;margin:0;">
            This is a one-time clarification. The breach above will be treated
            as a one-time clarification too. Future incidents — by anyone — will
            be handled under the agreement without further notice.
          </p>
          <p style="font-size:13px;line-height:1.6;color:#64748B;margin:24px 0 0;">
            The full notice is pinned on your dashboard at
            <a href="${APP_URL}/dashboard" style="color:#2563EB;text-decoration:none;font-weight:600;">${APP_URL}/dashboard</a>.
          </p>
          <div style="margin-top:24px;padding-top:18px;border-top:1px solid #E2E8F0;">
            <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.7;">
              — Programme office, TRAN
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

async function main() {
  console.log(`Mode: ${COMMIT ? "COMMIT" : "DRY-RUN"}`);

  // Pinned announcement — visible to every Stage 1 intern from their dashboard.
  const existingAnn = await prisma.announcement.findFirst({
    where: { title: TITLE, stage: "STAGE_1" },
    select: { id: true },
  });
  let annAction: "created" | "kept" = "kept";
  if (!existingAnn && COMMIT) {
    const author = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
      select: { id: true },
    });
    if (author) {
      await prisma.announcement.create({
        data: {
          title: TITLE,
          content: CONTENT,
          authorId: author.id,
          stage: "STAGE_1",
          isPinned: true,
        },
      });
      annAction = "created";
    }
  } else if (!existingAnn) {
    annAction = "created";
  }
  console.log(`Announcement: ${annAction}`);

  // Email blast — every active intern.
  const interns = await prisma.intern.findMany({
    where: { isActive: true },
    include: { user: { select: { id: true, email: true, firstName: true } } },
  });
  console.log(`Active interns: ${interns.length}`);

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  let enqueued = 0;
  let skipped = 0;
  for (const i of interns) {
    const existing = await prisma.emailQueueItem.findFirst({
      where: {
        userId: i.user.id,
        subject: EMAIL_SUBJECT,
        enqueuedAt: { gte: todayStart },
      },
      select: { id: true },
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
          subject: EMAIL_SUBJECT,
          body: emailBody(i.user.firstName),
          context: { reason: "nda-breach-notice" },
        },
      });
    }
    enqueued++;
  }
  console.log(`Emails enqueued: ${enqueued}`);
  console.log(`Skipped (already sent today): ${skipped}`);

  if (!COMMIT) console.log("\nDRY RUN — re-run with COMMIT=1 to actually post + email.");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
