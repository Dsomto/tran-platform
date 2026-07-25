import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
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
const FROM =
  process.env.RESEND_FROM ||
  `"Somto from Ubuntu Bridge Initiative" <noreply@ubuntubridgeinitiatives.org>`;
const ORIGIN =
  process.env.PUBLIC_APP_URL && !process.env.PUBLIC_APP_URL.includes("localhost")
    ? process.env.PUBLIC_APP_URL.replace(/\/$/, "")
    : "https://ubuntubridgeinitiatives.org";
const DASHBOARD_URL = `${ORIGIN}/dashboard/advanced`;
const HERO_URL = `${ORIGIN}/email/stage5-keep-pushing.png`;
const HERO_SOURCE_PATH = path.join(
  process.cwd(),
  "public",
  "email",
  "stage5-keep-pushing.png"
);
const PREVIEW_HERO_PATH = path.join(
  process.cwd(),
  ".tmp",
  "stage5-keep-pushing.png"
);
const SUBJECT = "Imagine the life you want - keep pushing through Stage 5";
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

function statCell(value: number, label: string, color: string): string {
  return `
    <td width="33.33%" valign="top" style="padding:0 4px;">
      <div style="min-height:88px;padding:15px 10px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;text-align:center;">
        <div style="font-size:28px;line-height:1;font-weight:800;color:${color};">${value}</div>
        <div style="margin-top:8px;font-size:11px;line-height:1.35;font-weight:700;text-transform:uppercase;color:#64748B;">${label}</div>
      </div>
    </td>`;
}

function renderEmail(
  firstName: string,
  stats: CampaignStats,
  heroUrl = HERO_URL
): string {
  const safeName = escapeHtml(firstName || "there");
  const closes = escapeHtml(deadlineLabel(stats.deadline));
  const safeHeroUrl = escapeHtml(heroUrl);

  return `
    <div style="margin:0;background:#E9EEF5;padding:32px 12px;color:#0F172A;">
      <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
        <div style="background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,0.08),0 12px 28px rgba(15,23,42,0.08);">
          <img
            src="${safeHeroUrl}"
            width="600"
            alt="Keep moving forward through Stage 5"
            style="display:block;width:100%;max-width:600px;height:auto;border:0;"
          >
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td width="6" style="width:6px;background:#B91C1C;"></td>
              <td style="padding:27px 30px 20px;">
                <div style="font-size:11px;font-weight:800;letter-spacing:0.12em;color:#64748B;text-transform:uppercase;">
                  Ubuntu Bridge Initiative
                </div>
                <div style="margin-top:3px;font-size:11px;color:#94A3B8;">
                  Cybersecurity Internship &middot; Advanced Stage
                </div>
              </td>
            </tr>
          </table>

          <div style="padding:5px 30px 32px 36px;">
            <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#B91C1C;font-weight:800;">
              A personal note from Somto
            </div>
            <h1 style="font-size:28px;font-weight:800;line-height:1.18;margin:11px 0 10px;color:#0A1F44;">
              Imagine the life you want, ${safeName}.
            </h1>
            <p style="font-size:15px;line-height:1.72;color:#334155;margin:0 0 22px;">
              Imagine yourself as the Chief Information Security Officer of an international bank.
              Imagine walking into the room where the difficult decisions are made, knowing that
              your judgement can protect millions of people. Imagine the confidence, the freedom,
              and the life that level of mastery could give you. Whatever your own picture is,
              hold it in your mind for a moment.
            </p>

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 23px;">
              <tr>
                ${statCell(stats.cohort, "Active cohort", "#0A1F44")}
                ${statCell(stats.entered, "Entered Stage 5", "#1D4ED8")}
                ${statCell(stats.downloaded, "Downloaded artefact", "#047857")}
              </tr>
            </table>

            <div style="margin:0 0 22px;padding:17px 18px;background:#EFF6FF;border-left:4px solid #2563EB;border-radius:7px;">
              <div style="font-size:12px;font-weight:800;text-transform:uppercase;color:#1E40AF;margin:0 0 7px;">
                You are closer than it feels
              </div>
              <p style="font-size:14px;line-height:1.68;color:#1E3A8A;margin:0;">
                ${stats.entered} people have entered Stage 5 and ${stats.downloaded} have downloaded
                their assigned artefact. ${stats.notDownloaded} active candidates still have no
                recorded download. These numbers are not here to frighten you. They are here to
                remind you that continuing, finishing, and submitting still matters. You are still
                in the room. Keep going.
              </p>
            </div>

            <p style="font-size:14px;line-height:1.72;color:#334155;margin:0 0 20px;">
              I know some of you may not like me very much right now. Some of you may even joke that
              you hate me because the tasks are hard, the evidence requirements are strict, and I
              keep asking for more. I can accept that for now. I did not make this difficult to
              punish you. I made it difficult because the life you are imagining will demand
              judgement, discipline, and the ability to keep moving when the answer is not obvious.
            </p>

            <div style="margin:0 0 23px;padding:18px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;">
              <div style="font-size:12px;font-weight:800;text-transform:uppercase;color:#0A1F44;margin:0 0 10px;">
                Keep moving
              </div>
              <p style="font-size:14px;line-height:1.65;color:#334155;margin:0 0 7px;">
                <strong>1.</strong> Return to the task and take the next clear step.
              </p>
              <p style="font-size:14px;line-height:1.65;color:#334155;margin:0 0 7px;">
                <strong>2.</strong> Finish the work carefully, even if it is not yet perfect.
              </p>
              <p style="font-size:14px;line-height:1.65;color:#334155;margin:0;">
                <strong>3.</strong> Package your evidence, submit it, and give yourself the chance
                to be assessed.
              </p>
            </div>

            <div style="text-align:center;margin:0 0 22px;">
              <a href="${DASHBOARD_URL}" style="display:inline-block;background:#B91C1C;color:#FFFFFF;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;">
                Finish Stage 5
              </a>
            </div>

            <div style="padding:14px 16px;background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;text-align:center;">
              <div style="font-size:11px;font-weight:800;text-transform:uppercase;color:#991B1B;">Submission closes</div>
              <div style="margin-top:5px;font-size:15px;font-weight:800;color:#7F1D1D;">${closes}</div>
            </div>

            <p style="font-size:15px;line-height:1.72;color:#334155;margin:24px 0 0;">
              Remember why you started. You have already crossed four stages to reach this room.
              Opportunities that ask this much of you and give you this much room to prove yourself
              do not appear every day. Do not let tiredness make the decision for you. Take a breath,
              return to the work, and finish what you came here to do.
            </p>
            <p style="font-size:15px;line-height:1.72;color:#0A1F44;margin:17px 0 0;font-weight:700;">
              This is me telling you personally: keep pushing. I believe the effort will be worth it.
            </p>

            <div style="margin-top:27px;padding-top:19px;border-top:1px solid #E2E8F0;">
              <p style="margin:0;color:#0F172A;font-size:14px;line-height:1.7;">
                &mdash; Somto Okoma<br>
                <span style="color:#64748B;font-size:13px;">Head of Programme, Ubuntu Bridge Initiative</span>
              </p>
            </div>
          </div>
        </div>
        <p style="text-align:center;color:#7C8798;font-size:11px;line-height:1.55;margin:17px 0 0;">
          Sent from the programme office &middot; TRAN, The Root Access Network
        </p>
      </div>
    </div>`;
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

async function sendEmail(
  to: string,
  html: string,
  inlineHero = false
): Promise<void> {
  const key = process.env.RESEND_API_KEY || process.env.api_key;
  if (!key) {
    throw new Error("No Resend key is configured in RESEND_API_KEY or api_key.");
  }

  const attachments = inlineHero
    ? [
        {
          content: (await readFile(HERO_SOURCE_PATH)).toString("base64"),
          filename: "stage5-keep-pushing.png",
          content_id: "stage5-hero",
        },
      ]
    : undefined;
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
      ...(attachments ? { attachments } : {}),
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
  const previewHeroUrl = "http://localhost:4173/stage5-keep-pushing.png";
  const previewHtml = renderPreviewDocument(
    renderEmail("Somto", stats, previewHeroUrl)
  );
  await mkdir(path.dirname(PREVIEW_PATH), { recursive: true });
  await copyFile(HERO_SOURCE_PATH, PREVIEW_HERO_PATH);
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
    const html = renderEmail("Somto", stats, "cid:stage5-hero");
    await sendEmail(TRIAL_TO, html, true);
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
      await sendEmail(intern.user.email, html);
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
