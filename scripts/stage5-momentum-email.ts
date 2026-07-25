import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma";

config();
config({ path: ".env.local" });

const prisma = new PrismaClient();
const SEND = process.env.SEND === "1";
const FORCE = process.env.FORCE === "1";
const TRIAL_TO = process.env.TRIAL_TO?.trim().toLowerCase() || null;
const CONFIRMATION = "STAGE5-MOMENTUM-APPROVED";
const FROM = `"Somto from UBI" <noreply@ubuntubridgeinitiatives.org>`;
const REPLY_TO = "dsomto891@gmail.com";
const ORIGIN =
  process.env.PUBLIC_APP_URL && !process.env.PUBLIC_APP_URL.includes("localhost")
    ? process.env.PUBLIC_APP_URL.replace(/\/$/, "")
    : "https://ubuntubridgeinitiatives.org";
const DASHBOARD_URL = `${ORIGIN}/dashboard/advanced`;
const HERO_URL = `${ORIGIN}/email/stage5-keep-pushing.png`;
const SUBJECT = "A personal note from me about Stage 5";
const PREVIEW_PATH = path.join(
  process.cwd(),
  ".tmp",
  "stage5-momentum-email-preview.html"
);

type CampaignStats = {
  cohort: number;
  entered: number;
  downloaded: number;
  notDownloaded: number;
  deadline: Date | null;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function deadlineLabel(deadline: Date | null): string {
  if (!deadline) return "Sunday at 18:00 WAT";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(deadline)
    .replace(" at ", " - ")
    .concat(" WAT");
}

function renderEmail(firstName: string, stats: CampaignStats): string {
  const safeName = escapeHtml(firstName || "there");
  const closes = escapeHtml(deadlineLabel(stats.deadline));

  return `
    <div style="margin:0;background:#F3F5F7;padding:28px 12px;color:#202124;">
      <div style="max-width:580px;margin:0 auto;background:#FFFFFF;border:1px solid #DADCE0;border-radius:8px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;">
        <div style="height:4px;background:#A61B1B;"></div>
        <div style="padding:24px 30px 28px;">
          <div style="margin:0 0 24px;padding-bottom:15px;border-bottom:1px solid #E8EAED;">
            <div style="color:#202124;font-size:13px;font-weight:700;">Ubuntu Bridge Initiative</div>
            <div style="color:#80868B;font-size:12px;">A personal note from Somto</div>
          </div>

          <p style="margin:0 0 18px;">Hi ${safeName},</p>
          <p style="margin:0 0 18px;">
            <strong>Imagine the life you want.</strong> Imagine yourself as the Chief Information
            Security Officer of an international bank, walking into the room where difficult
            decisions are made and knowing your judgement can protect millions of people. Imagine
            the confidence, freedom, and life that level of mastery could give you. Whatever your
            own picture is, hold it in your mind for a moment.
          </p>

          <div style="margin:22px 0;text-align:center;">
            <img src="${HERO_URL}" width="390" alt="Keep moving forward" style="display:inline-block;width:100%;max-width:390px;height:auto;border:0;border-radius:6px;">
          </div>

          <p style="margin:0 0 18px;">
            I know some of you may not like me very much right now. Some of you may even joke that
            you hate me because the tasks are hard and I keep asking for more. I can accept that for
            now. I did not make this difficult to punish you. I made it difficult because the life
            you are imagining will demand judgement, discipline, and the ability to keep moving when
            the answer is not obvious.
          </p>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:22px 0;">
            <tr>
              <td width="33.33%" style="padding:0 4px 0 0;">
                <div style="padding:13px 6px;background:#F8F9FA;border:1px solid #E0E3E7;border-radius:6px;text-align:center;">
                  <div style="font-size:23px;font-weight:700;color:#202124;">${stats.cohort}</div>
                  <div style="font-size:10px;color:#6B7280;text-transform:uppercase;">Active</div>
                </div>
              </td>
              <td width="33.33%" style="padding:0 2px;">
                <div style="padding:13px 6px;background:#F8F9FA;border:1px solid #E0E3E7;border-radius:6px;text-align:center;">
                  <div style="font-size:23px;font-weight:700;color:#202124;">${stats.entered}</div>
                  <div style="font-size:10px;color:#6B7280;text-transform:uppercase;">Entered</div>
                </div>
              </td>
              <td width="33.33%" style="padding:0 0 0 4px;">
                <div style="padding:13px 6px;background:#F8F9FA;border:1px solid #E0E3E7;border-radius:6px;text-align:center;">
                  <div style="font-size:23px;font-weight:700;color:#202124;">${stats.downloaded}</div>
                  <div style="font-size:10px;color:#6B7280;text-transform:uppercase;">Downloaded</div>
                </div>
              </td>
            </tr>
          </table>

          <p style="margin:0 0 18px;">
            ${stats.notDownloaded} active candidates still have no recorded download. I am not
            sharing these figures to frighten you. I am sharing them to remind you that continuing
            matters. You are still here. Keep going.
          </p>
          <p style="margin:0 0 18px;">
            Remember why you started. You have already crossed four stages to reach this point.
            Do not let tiredness make the decision for you. Take a breath, return to the work, and
            finish what you came here to do.
          </p>

          <div style="margin:21px 0;padding:14px 16px;background:#F8F9FA;border-left:3px solid #A61B1B;">
            <div style="font-size:12px;color:#5F6368;">Stage 5 closes</div>
            <div style="font-size:15px;font-weight:700;color:#202124;">${closes}</div>
          </div>

          <p style="margin:0 0 18px;">
            You can return to
            <a href="${DASHBOARD_URL}" style="color:#1155CC;text-decoration:underline;">your Stage 5 dashboard here</a>.
          </p>
          <p style="margin:0 0 24px;font-weight:700;">
            This is me telling you personally: keep pushing. I believe the effort will be worth it.
          </p>
          <p style="margin:0;">
            Somto Okoma<br>
            <span style="color:#5F6368;">Head of Programme, Ubuntu Bridge Initiative</span>
          </p>
        </div>
      </div>
    </div>`;
}

function renderText(firstName: string, stats: CampaignStats): string {
  return `Hi ${firstName || "there"},

Imagine the life you want. Imagine yourself as the Chief Information Security Officer of an international bank, walking into the room where difficult decisions are made and knowing your judgement can protect millions of people. Whatever your own picture is, hold it in your mind for a moment.

I know some of you may not like me very much right now. Some of you may even joke that you hate me because the tasks are hard and I keep asking for more. I can accept that for now. I did not make this difficult to punish you. I made it difficult because the life you are imagining will demand judgement, discipline, and the ability to keep moving when the answer is not obvious.

Right now, ${stats.entered} people have entered Stage 5 and ${stats.downloaded} have downloaded their assigned artefact. ${stats.notDownloaded} active candidates still have no recorded download. I am not sharing those figures to frighten you. I am sharing them to remind you that continuing matters. You are still here. Keep going.

Remember why you started. Do not let tiredness make the decision for you. Take a breath, return to the work, and finish what you came here to do.

Stage 5 closes ${deadlineLabel(stats.deadline)}.
${DASHBOARD_URL}

This is me telling you personally: keep pushing. I believe the effort will be worth it.

Somto Okoma
Head of Programme
Ubuntu Bridge Initiative`;
}

function renderPreviewDocument(emailHtml: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${SUBJECT}</title>
</head>
<body style="margin:0;background:#E9EEF5;">
${emailHtml}
</body>
</html>`;
}

async function sendEmail(to: string, html: string, text: string): Promise<void> {
  const key = process.env.RESEND_API_KEY || process.env.api_key;
  if (!key) {
    throw new Error("No Resend key is configured in RESEND_API_KEY or api_key.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to,
      subject: SUBJECT,
      html,
      text,
      reply_to: REPLY_TO,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend ${response.status}: ${await response.text()}`);
  }
}

async function main(): Promise<void> {
  const interns = await prisma.intern.findMany({
    where: {
      currentStage: "STAGE_5",
      isActive: true,
      user: { email: { not: { endsWith: "@netforge.invalid" } } },
    },
    orderBy: { user: { firstName: "asc" } },
    select: {
      id: true,
      userId: true,
      user: { select: { email: true, firstName: true, lastName: true } },
    },
  });
  const internIds = interns.map((intern) => intern.id);
  const [entered, downloaded, stageWindow] = await Promise.all([
    prisma.stageAccess.count({
      where: { stage: "STAGE_5", internId: { in: internIds } },
    }),
    prisma.advancedArtifactGrant.count({
      where: {
        stage: "STAGE_5",
        internId: { in: internIds },
        OR: [{ downloadCount: { gt: 0 } }, { lastDownloadedAt: { not: null } }],
      },
    }),
    prisma.stageWindow.findUnique({
      where: { stage: "STAGE_5" },
      select: { submitUntil: true },
    }),
  ]);

  const stats: CampaignStats = {
    cohort: interns.length,
    entered,
    downloaded,
    notDownloaded: interns.length - downloaded,
    deadline: stageWindow?.submitUntil ?? null,
  };
  const previewHtml = renderPreviewDocument(renderEmail("Somto", stats));
  await mkdir(path.dirname(PREVIEW_PATH), { recursive: true });
  await writeFile(PREVIEW_PATH, previewHtml, "utf8");

  console.log(`Mode: ${SEND ? "SEND" : "PREVIEW ONLY"}`);
  console.log(
    `Live figures: cohort=${stats.cohort}, entered=${stats.entered}, downloaded=${stats.downloaded}, notDownloaded=${stats.notDownloaded}`
  );
  console.log(`Deadline: ${deadlineLabel(stats.deadline)}`);
  console.log(`Recipients: ${interns.length}`);
  console.log(`Preview: ${PREVIEW_PATH}`);
  console.log(
    `Resend key: ${process.env.RESEND_API_KEY || process.env.api_key ? "configured" : "missing"}`
  );

  if (!SEND) {
    console.log(
      `No email was sent. Sending requires SEND=1 CONFIRM=${CONFIRMATION}.`
    );
    return;
  }
  if (process.env.CONFIRM !== CONFIRMATION) {
    throw new Error(
      `Refusing to send: set CONFIRM=${CONFIRMATION} only after the preview is approved.`
    );
  }

  if (TRIAL_TO) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(TRIAL_TO)) {
      throw new Error(`Invalid TRIAL_TO address: ${TRIAL_TO}`);
    }
    const html = renderEmail("Somto", stats);
    await sendEmail(TRIAL_TO, html, renderText("Somto", stats));
    console.log(`Trial sent to ${TRIAL_TO}. No cohort recipients were contacted.`);
    return;
  }

  let sent = 0;
  let skipped = 0;
  const failed: string[] = [];
  for (const intern of interns) {
    const existing = await prisma.email.count({
      where: { userId: intern.userId, subject: SUBJECT, status: "sent" },
    });
    if (existing > 0 && !FORCE) {
      skipped++;
      continue;
    }

    const html = renderEmail(intern.user.firstName, stats);
    try {
      await sendEmail(
        intern.user.email,
        html,
        renderText(intern.user.firstName, stats)
      );
      await prisma.email.create({
        data: {
          userId: intern.userId,
          subject: SUBJECT,
          body: html,
          status: "sent",
        },
      });
      sent++;
      console.log(
        `[${sent + skipped}/${interns.length}] sent ${intern.user.email}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failed.push(`${intern.user.email}: ${message}`);
      console.error(`FAILED ${intern.user.email}: ${message}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 1100));
  }

  console.log(`Complete: sent=${sent}, skipped=${skipped}, failed=${failed.length}`);
  if (failed.length > 0) {
    console.log(failed.join("\n"));
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
