import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import { PrismaClient, type Prisma } from "../src/generated/prisma/index.js";

const inheritedDatabaseUrl = process.env.DATABASE_URL;
config({ quiet: true });
config({ path: ".env.local", override: true, quiet: true });
if (inheritedDatabaseUrl) process.env.DATABASE_URL = inheritedDatabaseUrl;

const prisma = new PrismaClient();
const COMMIT = process.env.COMMIT === "1";
const CONFIRMATION = "QUEUE-COHORT-ONE-CEREMONY";
const RELEASE_ID = "cohort-one-closing-ceremony-2026-11-14";
const SUBJECT = "Tomorrow: UBI Cohort One Closing Ceremony";
const EXPECTED_RECIPIENTS = 506;
const ORIGIN = "https://ubuntubridgeinitiatives.org";
const COVER_URL = `${ORIGIN}/events/cohort-one-closing-ceremony.jpg`;
const PREVIEW_COVER_URL = "../public/events/cohort-one-closing-ceremony.jpg";
const MEET_URL = "https://meet.google.com/bvt-ahtb-dew";
const MORE_NUMBERS_URL = "https://tel.meet/bvt-ahtb-dew?pin=9272502479711";
const CALENDAR_URL =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  "&text=UBI%20Cohort%20One%20Closing%20Ceremony" +
  "&dates=20261114T160000Z%2F20261114T180000Z" +
  "&details=Join%20the%20Ubuntu%20Bridge%20Initiative%20Cohort%20One%20closing%20ceremony.%20Google%20Meet%3A%20https%3A%2F%2Fmeet.google.com%2Fbvt-ahtb-dew" +
  "&location=https%3A%2F%2Fmeet.google.com%2Fbvt-ahtb-dew";
const PREVIEW_PATH = path.join(process.cwd(), ".tmp", "cohort-one-ceremony-invitation-preview.html");

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderEmail(firstName: string, coverUrl = COVER_URL): string {
  const name = escapeHtml(firstName || "there");

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="x-ua-compatible" content="ie=edge"><title>${SUBJECT}</title></head>
<body style="margin:0;padding:0;background:#EEF1F7;color:#18213A;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Tomorrow at 5:00 PM WAT: celebrate Cohort One, meet the finalists, and see what this community built.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#EEF1F7;">
    <tr><td align="center" style="padding:24px 10px;">
      <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#FFFFFF;border:1px solid #D9DEEA;border-radius:8px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;box-shadow:0 14px 38px rgba(28,31,74,.12);">
        <tr><td style="height:7px;background:#6D28D9;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:16px 26px;background:#111735;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
            <td style="color:#FFFFFF;font-size:14px;font-weight:800;">Ubuntu Bridge Initiative</td>
            <td align="right" style="color:#CFCAFF;font-size:10px;font-weight:800;text-transform:uppercase;">Cohort One</td>
          </tr></table>
        </td></tr>
        <tr><td><img src="${coverUrl}" width="640" alt="Invitation to the UBI End of Programme Ceremony on 14 November 2026" style="display:block;width:100%;height:auto;border:0;"></td></tr>
        <tr><td style="padding:34px 30px 16px;">
          <p style="margin:0 0 18px;color:#34405E;font-size:15px;line-height:1.72;">Hi ${name},</p>
          <h1 style="margin:0 0 18px;color:#111735;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.24;letter-spacing:0;">Tomorrow, we close Cohort One together.</h1>
          <p style="margin:0 0 18px;color:#34405E;font-size:15px;line-height:1.72;">This is not another task, deadline, or assessment. It is the moment we pause and look at what all of us built: the work, the growth, the people who kept going, and the community that now exists because you were part of it.</p>
          <p style="margin:0 0 24px;color:#34405E;font-size:15px;line-height:1.72;">Whether your UBI journey ended early or carried you into the final ten, you belong in this room. Come for the finalist project showcase, awards and recognition, the story of Cohort One, and a first look at what comes next. Please do not hear about it afterward. Be there with us.</p>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;border:1px solid #DED8F5;background:#F6F3FF;border-radius:7px;">
            <tr>
              <td width="50%" valign="top" style="padding:18px 18px;border-right:1px solid #DED8F5;">
                <div style="margin-bottom:5px;color:#6D28D9;font-size:10px;font-weight:800;text-transform:uppercase;">When</div>
                <div style="color:#111735;font-size:15px;line-height:1.5;font-weight:800;">Saturday, 14 November 2026</div>
              </td>
              <td width="50%" valign="top" style="padding:18px 18px;">
                <div style="margin-bottom:5px;color:#6D28D9;font-size:10px;font-weight:800;text-transform:uppercase;">Time</div>
                <div style="color:#111735;font-size:15px;line-height:1.5;font-weight:800;">5:00 PM - 7:00 PM WAT<br><span style="font-size:12px;font-weight:600;color:#67708B;">4:00 PM - 6:00 PM GMT</span></div>
              </td>
            </tr>
          </table>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 12px;"><tr><td align="center">
            <a href="${MEET_URL}" style="display:inline-block;width:88%;max-width:430px;padding:15px 18px;background:#6D28D9;border:1px solid #6D28D9;border-radius:6px;color:#FFFFFF;text-decoration:none;text-align:center;font-size:15px;font-weight:800;">Join the ceremony on Google Meet</a>
          </td></tr></table>
          <p style="margin:0 0 22px;text-align:center;color:#67708B;font-size:12px;line-height:1.55;">The room opens through <a href="${MEET_URL}" style="color:#5B21B6;font-weight:700;">meet.google.com/bvt-ahtb-dew</a></p>

          <div style="margin:0 0 22px;padding:17px 18px;background:#F8FAFD;border:1px solid #DCE2ED;border-radius:6px;color:#4B5672;font-size:12px;line-height:1.65;">
            <strong style="display:block;margin-bottom:4px;color:#18213A;">Joining by phone?</strong>
            United Kingdom: +44 20 3873 3170<br>
            PIN: 927 250 247 9711#<br>
            <a href="${MORE_NUMBERS_URL}" style="color:#5B21B6;font-weight:700;">See more dial-in numbers</a>
          </div>

          <p style="margin:0 0 20px;text-align:center;"><a href="${CALENDAR_URL}" style="color:#5B21B6;font-size:13px;font-weight:800;">Add the ceremony to Google Calendar</a></p>

          <div style="margin:26px 0 0;padding:20px;background:#111735;border-radius:7px;color:#E7E9F5;font-size:14px;line-height:1.65;">
            <strong style="display:block;margin-bottom:5px;color:#FFFFFF;font-family:Georgia,'Times New Roman',serif;font-size:19px;">One cohort. One final gathering.</strong>
            Set the reminder now. Charge your device. Find a quiet place. Tomorrow, let us celebrate what you helped begin.
          </div>

          <p style="margin:27px 0 4px;color:#34405E;font-size:15px;line-height:1.7;">See you tomorrow.<br><br><strong style="color:#111735;">Somto from UBI</strong><br><span style="color:#7A839A;font-size:13px;">Ubuntu Bridge Initiative</span></p>
        </td></tr>
        <tr><td style="padding:17px 30px;background:#F7F8FC;border-top:1px solid #E2E6EF;color:#7A839A;font-size:11px;line-height:1.55;">You are receiving this invitation because you were admitted into Ubuntu Bridge Initiative Cohort One.</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function belongsToRelease(context: unknown): boolean {
  return Boolean(
    context &&
      typeof context === "object" &&
      !Array.isArray(context) &&
      (context as Record<string, unknown>).releaseId === RELEASE_ID,
  );
}

async function main(): Promise<void> {
  const applications = await prisma.publicApplication.findMany({
    where: {
      credentialsEmailSentAt: { not: null },
      status: { not: "preview" },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, fullName: true, email: true },
  });

  const recipients = applications.map((application) => ({
    id: application.id,
    email: application.email.trim().toLowerCase(),
    firstName: application.fullName.trim().split(/\s+/)[0] || "there",
  }));

  if (recipients.length !== EXPECTED_RECIPIENTS) {
    throw new Error(`Expected ${EXPECTED_RECIPIENTS} credentialed Cohort One applicants; found ${recipients.length}.`);
  }
  if (new Set(recipients.map((recipient) => recipient.email)).size !== EXPECTED_RECIPIENTS) {
    throw new Error("The ceremony audience contains duplicate email addresses.");
  }
  if (recipients.some((recipient) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email))) {
    throw new Error("The ceremony audience contains an invalid email address.");
  }

  const existingRows = await prisma.emailQueueItem.findMany({
    where: { status: { in: ["PENDING", "SENT", "FAILED"] } },
    select: { status: true, context: true },
  });
  const existing = existingRows.filter((row) => belongsToRelease(row.context));
  if (existing.length) {
    if (existing.length !== EXPECTED_RECIPIENTS) {
      throw new Error(`Campaign exists partially with ${existing.length} rows; refusing duplicates.`);
    }
    const statuses = existing.reduce<Record<string, number>>((counts, row) => {
      counts[row.status] = (counts[row.status] ?? 0) + 1;
      return counts;
    }, {});
    console.log(JSON.stringify({ mode: "ALREADY_QUEUED", releaseId: RELEASE_ID, rows: existing.length, statuses }, null, 2));
    return;
  }

  await mkdir(path.dirname(PREVIEW_PATH), { recursive: true });
  await writeFile(PREVIEW_PATH, renderEmail("Somto", PREVIEW_COVER_URL), "utf8");

  console.log(JSON.stringify({
    mode: COMMIT ? "COMMIT" : "DRY_RUN",
    releaseId: RELEASE_ID,
    subject: SUBJECT,
    recipients: recipients.length,
    audienceRule: "PublicApplication.credentialsEmailSentAt is set; preview records excluded",
    meetUrl: MEET_URL,
    preview: PREVIEW_PATH,
  }, null, 2));

  if (!COMMIT) return;
  if (process.env.CONFIRM !== CONFIRMATION) {
    throw new Error(`Refusing to queue without CONFIRM=${CONFIRMATION}.`);
  }

  const users = await prisma.user.findMany({
    where: { email: { in: recipients.map((recipient) => recipient.email) } },
    select: { id: true, email: true },
  });
  const userByEmail = new Map(users.map((user) => [user.email.toLowerCase(), user.id]));
  const rows: Prisma.EmailQueueItemCreateManyInput[] = recipients.map((recipient) => ({
    userId: userByEmail.get(recipient.email) ?? null,
    kind: "GENERAL",
    toEmail: recipient.email,
    subject: SUBJECT,
    body: renderEmail(recipient.firstName),
    status: "PENDING",
    context: {
      releaseId: RELEASE_ID,
      audience: "COHORT_ONE_CREDENTIALED_506",
      applicationId: recipient.id,
      eventStartsAt: "2026-11-14T16:00:00.000Z",
    },
  }));

  let queued = 0;
  for (let index = 0; index < rows.length; index += 100) {
    const result = await prisma.emailQueueItem.createMany({ data: rows.slice(index, index + 100) });
    queued += result.count;
  }
  if (queued !== EXPECTED_RECIPIENTS) {
    throw new Error(`Expected to queue ${EXPECTED_RECIPIENTS} emails; queued ${queued}.`);
  }
  console.log(JSON.stringify({ queued, releaseId: RELEASE_ID }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
