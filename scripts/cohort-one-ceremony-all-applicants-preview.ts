import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const ALL_APPLICANTS_CEREMONY_SUBJECT = "Today, Cohort One graduates. You are invited.";
const MEET_URL = "https://meet.google.com/bvt-ahtb-dew";
const MORE_NUMBERS_URL = "https://tel.meet/bvt-ahtb-dew?pin=9272502479711";
const COVER_URL = "https://ubuntubridgeinitiatives.org/events/cohort-one-closing-ceremony.jpg";
const PREVIEW_COVER_URL = "cohort-one-closing-ceremony.jpg";
const CALENDAR_URL =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  "&text=UBI%20Cohort%20One%20Closing%20Ceremony" +
  "&dates=20261114T160000Z%2F20261114T180000Z" +
  "&details=Celebrate%20Ubuntu%20Bridge%20Initiative%20Cohort%20One.%20Join%20on%20Google%20Meet%3A%20https%3A%2F%2Fmeet.google.com%2Fbvt-ahtb-dew" +
  "&location=https%3A%2F%2Fmeet.google.com%2Fbvt-ahtb-dew";
const PREVIEW_DIR = path.join(process.cwd(), ".tmp", "cohort-one-ceremony-applicants-preview");
const PREVIEW_PATH = path.join(PREVIEW_DIR, "index.html");

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderAllApplicantsCeremonyEmail(firstName: string, coverUrl = COVER_URL): string {
  const name = escapeHtml(firstName || "there");

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="x-ua-compatible" content="ie=edge"><title>${ALL_APPLICANTS_CEREMONY_SUBJECT}</title></head>
<body style="margin:0;padding:0;background:#EEF1F7;color:#18213A;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">You were there at the beginning. Today, come and see how the first UBI cohort completes its journey.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#EEF1F7;">
    <tr><td align="center" style="padding:24px 10px;">
      <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#FFFFFF;border:1px solid #D9DEEA;border-radius:8px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;box-shadow:0 14px 38px rgba(28,31,74,.12);">
        <tr><td style="height:7px;background:#6D28D9;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:17px 28px;background:#111735;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
            <td><div style="color:#FFFFFF;font-size:14px;font-weight:800;">Ubuntu Bridge Initiative</div><div style="margin-top:3px;color:#B9C0DC;font-size:11px;">A personal invitation from Somto</div></td>
            <td align="right"><div style="display:inline-block;padding:6px 9px;border:1px solid #4A5276;border-radius:4px;color:#E1DFFF;font-size:9px;font-weight:800;text-transform:uppercase;">Today</div></td>
          </tr></table>
        </td></tr>
        <tr><td><img src="${coverUrl}" width="640" alt="Invitation to the UBI End of Programme Ceremony" style="display:block;width:100%;height:auto;border:0;"></td></tr>
        <tr><td style="padding:34px 30px 39px;">
          <p style="margin:0 0 18px;color:#34405E;font-size:15px;line-height:1.72;">Hi ${name},</p>
          <div style="margin:0 0 9px;color:#6D28D9;font-size:11px;font-weight:800;text-transform:uppercase;">You were there at the beginning</div>
          <h1 style="margin:0 0 19px;color:#111735;font-family:Georgia,'Times New Roman',serif;font-size:31px;line-height:1.23;letter-spacing:0;">Today, come and see how the story ends.</h1>
          <p style="margin:0 0 18px;color:#34405E;font-size:15px;line-height:1.72;">At some point this year, you filled the Ubuntu Bridge Initiative application. That single action made you part of the first group of people who believed this programme could become something real.</p>
          <p style="margin:0 0 18px;color:#34405E;font-size:15px;line-height:1.72;">Some applicants entered the programme. Some continued for a few stages. Some stayed until the work became brutally difficult. Ten people reached the final. But every application showed us that thousands of people were ready for a serious, practical path into cybersecurity.</p>
          <p style="margin:0 0 25px;font-family:Georgia,'Times New Roman',serif;color:#111735;font-size:21px;line-height:1.52;font-weight:700;">Today, the first UBI cohort graduates. I would like you to be there with us.</p>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 25px;">
            <tr>
              <td width="33.33%" align="center" style="padding:16px 5px;background:#111735;color:#FFFFFF;border-right:1px solid #3B4367;">
                <div style="font-size:23px;font-weight:800;">2,800+</div><div style="margin-top:4px;color:#B9C0DC;font-size:9px;text-transform:uppercase;">Applicants</div>
              </td>
              <td width="33.33%" align="center" style="padding:16px 5px;background:#111735;color:#FFFFFF;border-right:1px solid #3B4367;">
                <div style="font-size:23px;font-weight:800;">10</div><div style="margin-top:4px;color:#B9C0DC;font-size:9px;text-transform:uppercase;">Finalists</div>
              </td>
              <td width="33.33%" align="center" style="padding:16px 5px;background:#111735;color:#FFFFFF;">
                <div style="font-size:23px;font-weight:800;">1</div><div style="margin-top:4px;color:#B9C0DC;font-size:9px;text-transform:uppercase;">First cohort</div>
              </td>
            </tr>
          </table>

          <p style="margin:0 0 18px;color:#34405E;font-size:15px;line-height:1.72;">You will see the finalist projects, celebrate the people who kept showing up, hear what this community has achieved, and learn what we are taking forward into Cohort Two. This is the public closing chapter of the journey you once applied to join.</p>
          <p style="margin:0 0 24px;color:#34405E;font-size:15px;line-height:1.72;">Do not let this be something you only hear about afterward. Come into the room. See what became of the idea. Celebrate with us.</p>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;border:1px solid #DED8F5;background:#F6F3FF;border-radius:7px;">
            <tr>
              <td width="50%" valign="top" style="padding:18px;border-right:1px solid #DED8F5;">
                <div style="margin-bottom:5px;color:#6D28D9;font-size:10px;font-weight:800;text-transform:uppercase;">Date</div>
                <div style="color:#111735;font-size:15px;line-height:1.5;font-weight:800;">Today<br>Saturday, 14 November 2026</div>
              </td>
              <td width="50%" valign="top" style="padding:18px;">
                <div style="margin-bottom:5px;color:#6D28D9;font-size:10px;font-weight:800;text-transform:uppercase;">Time</div>
                <div style="color:#111735;font-size:15px;line-height:1.5;font-weight:800;">5:00 PM - 7:00 PM WAT<br><span style="font-size:12px;font-weight:600;color:#67708B;">4:00 PM - 6:00 PM GMT</span></div>
              </td>
            </tr>
          </table>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 12px;"><tr><td align="center">
            <a href="${MEET_URL}" style="display:inline-block;width:88%;max-width:430px;padding:15px 18px;background:#6D28D9;border:1px solid #6D28D9;border-radius:6px;color:#FFFFFF;text-decoration:none;text-align:center;font-size:15px;font-weight:800;">Join today on Google Meet</a>
          </td></tr></table>
          <p style="margin:0 0 22px;text-align:center;color:#67708B;font-size:12px;line-height:1.55;">Direct link: <a href="${MEET_URL}" style="color:#5B21B6;font-weight:700;">meet.google.com/bvt-ahtb-dew</a></p>

          <div style="margin:0 0 22px;padding:17px 18px;background:#F8FAFD;border:1px solid #DCE2ED;border-radius:6px;color:#4B5672;font-size:12px;line-height:1.65;">
            <strong style="display:block;margin-bottom:4px;color:#18213A;">Joining by phone?</strong>
            United Kingdom: +44 20 3873 3170<br>
            PIN: 927 250 247 9711#<br>
            <a href="${MORE_NUMBERS_URL}" style="color:#5B21B6;font-weight:700;">See more dial-in numbers</a>
          </div>

          <p style="margin:0 0 24px;text-align:center;"><a href="${CALENDAR_URL}" style="color:#5B21B6;font-size:13px;font-weight:800;">Add the ceremony to Google Calendar</a></p>

          <div style="margin:0 0 24px;padding:21px 20px;background:#111735;border-radius:7px;color:#DDE1F2;font-size:14px;line-height:1.68;">
            <div style="margin:0 0 7px;color:#D8B4FE;font-size:10px;font-weight:800;text-transform:uppercase;">What comes next</div>
            <strong style="display:block;margin-bottom:6px;color:#FFFFFF;font-family:Georgia,'Times New Roman',serif;font-size:20px;">Cohort One is graduating. Cohort Two is coming.</strong>
            Today is a celebration, but it is also a doorway into the next version of UBI. Join us and stay close to the community.
          </div>

          <p style="margin:0;color:#34405E;font-size:15px;line-height:1.7;">See you in the room.<br><br><strong style="color:#111735;">Somto from UBI</strong><br><span style="color:#7A839A;font-size:13px;">Ubuntu Bridge Initiative</span></p>
        </td></tr>
        <tr><td style="padding:17px 30px;background:#F7F8FC;border-top:1px solid #E2E6EF;color:#7A839A;font-size:11px;line-height:1.55;">You are receiving this one-time invitation because you applied to Ubuntu Bridge Initiative Cohort One.</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function main(): Promise<void> {
  await mkdir(PREVIEW_DIR, { recursive: true });
  await copyFile(
    path.join(process.cwd(), "public", "events", "cohort-one-closing-ceremony.jpg"),
    path.join(PREVIEW_DIR, "cohort-one-closing-ceremony.jpg"),
  );
  await writeFile(PREVIEW_PATH, renderAllApplicantsCeremonyEmail("Somto", PREVIEW_COVER_URL), "utf8");
  console.log(JSON.stringify({ mode: "PREVIEW_ONLY", subject: ALL_APPLICANTS_CEREMONY_SUBJECT, preview: PREVIEW_PATH, sent: false }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}
