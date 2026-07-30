import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma";

config();
config({ path: ".env.local", override: true });

const prisma = new PrismaClient();
const SEND = process.env.SEND === "1";
const TRIAL_TO = process.env.TRIAL_TO?.trim().toLowerCase() || null;
const CONFIRMATION = "STAGE6-CONFUSION-NOTE-APPROVED";
const FROM = `"Somto from UBI" <noreply@ubuntubridgeinitiatives.org>`;
const REPLY_TO = "dsomto891@gmail.com";
const ORIGIN =
  process.env.PUBLIC_APP_URL && !process.env.PUBLIC_APP_URL.includes("localhost")
    ? process.env.PUBLIC_APP_URL.replace(/\/$/, "")
    : "https://ubuntubridgeinitiatives.org";
const DASHBOARD_URL = `${ORIGIN}/dashboard/advanced`;
const HERO_URL = `${ORIGIN}/email/stage6-stones-cover.jpg`;
const PREVIEW_HERO_URL = "../public/email/stage6-stones-cover.jpg";
const SUBJECT = "A direct note about the confusion in Stage 6";
const PREVIEW_PATH = path.join(
  process.cwd(),
  ".tmp",
  "stage6-confusion-email-preview.html"
);

type CampaignStats = {
  cohort: number;
  entered: number;
  downloaded: number;
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
  if (!deadline) return "Tuesday at 18:00 WAT";
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

function statCard(value: number, label: string, accent = "#202124"): string {
  return `<td width="33.33%" style="padding:0 3px;">
    <div style="min-height:72px;padding:12px 4px;background:#F8F9FA;border:1px solid #E0E3E7;border-radius:6px;text-align:center;">
      <div style="font-size:22px;font-weight:700;color:${accent};">${value}</div>
      <div style="font-size:9px;line-height:1.3;color:#6B7280;text-transform:uppercase;">${label}</div>
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

  return `
    <div style="margin:0;background:#EEF1F4;padding:28px 12px;color:#202124;">
      <div style="max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #DADCE0;border-radius:8px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;">
        <div style="height:5px;background:#991B1B;"></div>
        <div style="padding:22px 30px 10px;">
          <div style="padding-bottom:15px;border-bottom:1px solid #E8EAED;">
            <div style="color:#202124;font-size:13px;font-weight:700;">Ubuntu Bridge Initiative</div>
            <div style="color:#80868B;font-size:12px;">A direct note from Somto</div>
          </div>
        </div>

        <img src="${heroUrl}" width="600" alt="A hand collecting stones from a shoreline" style="display:block;width:100%;height:auto;border:0;">

        <div style="padding:26px 30px 30px;">
          <p style="margin:0 0 18px;">Hi ${safeName},</p>
          <p style="margin:0 0 20px;font-size:20px;line-height:1.45;font-weight:700;">
            It is easier to forgive yourself after giving an opportunity your very best than to
            live with the knowledge that you could have done more and chose not to.
          </p>
          <p style="margin:0 0 18px;">
            There is an old parable about travellers who reached a beach in the darkness. They were
            told to pick up stones before leaving. They were tired, the stones looked ordinary, and
            the instruction did not make much sense. One traveller picked up only two and placed
            them in his bag.
          </p>
          <p style="margin:0 0 18px;">
            In the morning, the stones had become diamonds. He was grateful for the two he carried,
            but when he returned, the opportunity was gone. What stayed with him was not only the
            value of what he had gained. It was the knowledge that he had stood among abundance and
            chosen to carry almost nothing away.
          </p>
          <p style="margin:0 0 18px;">
            I am not telling you this because I am here to motivate you today. I am telling you
            because an opportunity can look like an ordinary stone while you are tired, confused,
            and unsure what to do next.
          </p>
          <p style="margin:0 0 18px;">
            The confusion you are feeling was here last week too. It is not proof that you do not
            belong here. Confusion is part of the journey at this level: you read, attempt, fail,
            ask a precise question, correct your assumptions, and try again.
          </p>
          <p style="margin:0 0 18px;">
            I gave you until Tuesday for a reason. The additional time was not provided so that you
            could wait for the task to become comfortable. It was provided so that you would have
            room to work through uncertainty, correct mistakes, and still produce something
            complete and assessable.
          </p>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:22px 0;">
            <tr>
              ${statCard(stats.cohort, "Still here")}
              ${statCard(stats.entered, "Entered")}
              ${statCard(stats.downloaded, "Downloaded")}
            </tr>
          </table>

          <p style="margin:0 0 18px;color:#4B5563;font-size:13px;">
            These figures show that people are present and working. They do not measure everything
            happening offline, and they are not included to frighten or rush you.
          </p>

          <div style="margin:22px 0;padding:18px;background:#F8F9FA;border-left:4px solid #991B1B;">
            <div style="font-size:16px;font-weight:700;color:#202124;margin-bottom:7px;">
              There is still an uncomfortable truth.
            </div>
            <div style="color:#4B5563;">
              If you decide not to submit, you make room for somebody else to advance. That is how
              the attrition system works.
            </div>
          </div>

          <p style="margin:0 0 18px;">
            Stage 5 demonstrated this clearly. Non-submitters were removed first under the
            track-based attrition rule. In one track, enough people did not submit that every
            candidate with a valid submission advanced, including candidates whose technical
            scores were comparatively low. Their work did not have to be perfect. It had to exist,
            be accessible, and be assessable.
          </p>
          <p style="margin:0 0 18px;">
            This is not permission to submit careless work. It is a warning not to confuse
            perfectionism, fear, or silence with serious effort. Open the brief again. Break the
            project into deliverables. Complete the first verifiable piece. Preserve your evidence.
            When blocked, ask a question that includes what you ran, what you expected, what
            happened, and the exact error.
          </p>
          <p style="margin:0 0 18px;">
            Keep trying. Keep making small, concrete progress. The project does not have to feel
            clear before you begin, and the first attempt does not have to be your final answer.
          </p>

          <div style="margin:22px 0;padding:16px;background:#F8F9FA;border:1px solid #E0E3E7;border-radius:6px;">
            <div style="font-size:12px;color:#5F6368;">Stage 6 submission deadline</div>
            <div style="font-size:17px;font-weight:700;color:#202124;">${closes}</div>
          </div>

          <p style="margin:0 0 22px;">
            Return to your
            <a href="${DASHBOARD_URL}" style="color:#1155CC;text-decoration:underline;font-weight:700;">Stage 6 dashboard</a>,
            make the next concrete move, and carry as much from this opportunity as you can while
            it is still in front of you.
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

It is easier to forgive yourself after giving an opportunity your very best than to live with the knowledge that you could have done more and chose not to.

There is an old parable about travellers who reached a beach in the darkness. They were told to pick up stones before leaving. They were tired, the stones looked ordinary, and the instruction did not make much sense. One traveller picked up only two and placed them in his bag.

In the morning, the stones had become diamonds. He was grateful for the two he carried, but when he returned, the opportunity was gone. What stayed with him was not only the value of what he had gained. It was the knowledge that he had stood among abundance and chosen to carry almost nothing away.

I am not telling you this because I am here to motivate you today. I am telling you because an opportunity can look like an ordinary stone while you are tired, confused, and unsure what to do next.

The confusion you are feeling was here last week too. It is not proof that you do not belong here. Confusion is part of the journey at this level: you read, attempt, fail, ask a precise question, correct your assumptions, and try again.

I gave you until Tuesday for a reason. The additional time was provided so that you would have room to work through uncertainty and still produce something complete and assessable.

There are ${stats.cohort} interns still here. ${stats.entered} have entered Stage 6 and ${stats.downloaded} have downloaded their artifact. These figures show that people are present and working. They do not measure everything happening offline.

There is still an uncomfortable truth: if you decide not to submit, you make room for somebody else to advance. That is how the attrition system works.

Stage 5 demonstrated this clearly. Non-submitters were removed first under the track-based attrition rule. In one track, enough people did not submit that every candidate with a valid submission advanced, including candidates whose technical scores were comparatively low. Their work did not have to be perfect. It had to exist, be accessible, and be assessable.

Open the brief again. Break the project into deliverables. Complete the first verifiable piece. Preserve your evidence. When blocked, ask a question that includes what you ran, what you expected, what happened, and the exact error.

Keep trying. Keep making small, concrete progress. The project does not have to feel clear before you begin, and the first attempt does not have to be your final answer.

Stage 6 closes ${deadlineLabel(stats.deadline)}.
${DASHBOARD_URL}

Carry as much from this opportunity as you can while it is still in front of you.

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
  if (!key) throw new Error("No Resend API key is configured.");

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
      currentStage: "STAGE_6",
      isActive: true,
      user: { email: { not: { endsWith: "@netforge.invalid" } } },
    },
    orderBy: { user: { firstName: "asc" } },
    select: {
      id: true,
      userId: true,
      user: { select: { email: true, firstName: true } },
    },
  });
  const internIds = interns.map((intern) => intern.id);
  const [entered, downloaded, stageWindow] = await Promise.all([
    prisma.stageAccess.count({
      where: { stage: "STAGE_6", internId: { in: internIds } },
    }),
    prisma.advancedArtifactGrant.count({
      where: {
        stage: "STAGE_6",
        internId: { in: internIds },
        OR: [{ downloadCount: { gt: 0 } }, { lastDownloadedAt: { not: null } }],
      },
    }),
    prisma.stageWindow.findUnique({
      where: { stage: "STAGE_6" },
      select: { submitUntil: true, status: true },
    }),
  ]);
  if (stageWindow?.status !== "OPEN") {
    throw new Error("Stage 6 is not open; refusing to prepare a live-deadline campaign.");
  }

  const stats: CampaignStats = {
    cohort: interns.length,
    entered,
    downloaded,
    deadline: stageWindow.submitUntil,
  };
  const previewHtml = renderPreviewDocument(
    renderEmail("Somto", stats, PREVIEW_HERO_URL)
  );
  await mkdir(path.dirname(PREVIEW_PATH), { recursive: true });
  await writeFile(PREVIEW_PATH, previewHtml, "utf8");

  console.log(`Mode: ${SEND ? "SEND" : "PREVIEW ONLY"}`);
  console.log(JSON.stringify({ stats, recipients: interns.length, preview: PREVIEW_PATH }, null, 2));
  if (!SEND) {
    console.log(`No email was sent. Sending requires SEND=1 CONFIRM=${CONFIRMATION}.`);
    return;
  }
  if (process.env.CONFIRM !== CONFIRMATION) {
    throw new Error(`Refusing to send without CONFIRM=${CONFIRMATION}.`);
  }

  const recipients = TRIAL_TO
    ? [{ email: TRIAL_TO, firstName: "Somto", userId: null }]
    : interns.map((intern) => ({
        email: intern.user.email,
        firstName: intern.user.firstName,
        userId: intern.userId,
      }));
  let sent = 0;
  let skipped = 0;
  for (const recipient of recipients) {
    if (recipient.userId) {
      const existing = await prisma.email.count({
        where: {
          userId: recipient.userId,
          subject: SUBJECT,
          status: "sent",
        },
      });
      if (existing > 0) {
        skipped++;
        continue;
      }
    }

    const html = renderEmail(recipient.firstName, stats);
    await sendEmail(recipient.email, html, renderText(recipient.firstName, stats));
    if (recipient.userId) {
      await prisma.email.create({
        data: {
          userId: recipient.userId,
          subject: SUBJECT,
          body: html,
          status: "sent",
        },
      });
    }
    sent++;
    await new Promise((resolve) => setTimeout(resolve, 1_100));
  }
  console.log(`Sent ${sent}; skipped ${skipped} already-sent recipient${skipped === 1 ? "" : "s"}.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
