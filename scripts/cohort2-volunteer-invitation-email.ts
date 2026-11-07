import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import { PrismaClient, type Prisma } from "../src/generated/prisma/index.js";
import {
  renderVolunteerApplicationConfirmationEmail,
  renderVolunteerInvitationEmail,
} from "../src/lib/volunteer-email-templates";

const inheritedDatabaseUrl = process.env.DATABASE_URL;
config({ quiet: true });
config({ path: ".env.local", override: true, quiet: true });
if (inheritedDatabaseUrl) process.env.DATABASE_URL = inheritedDatabaseUrl;

const prisma = new PrismaClient();
const COMMIT = process.env.COMMIT === "1";
const CONFIRMATION = "QUEUE-COHORT2-VOLUNTEER-INVITATIONS";
const RELEASE_ID = "cohort2-volunteer-stage2plus-2026-11-07";
const EXPECTED_RECIPIENTS = 169;
const PREVIEW_DIR = path.join(process.cwd(), ".tmp", "volunteer-email-previews");

function isReleaseContext(context: unknown): boolean {
  return Boolean(
    context &&
      typeof context === "object" &&
      !Array.isArray(context) &&
      (context as Record<string, unknown>).releaseId === RELEASE_ID
  );
}

function previewIndex(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>UBI volunteer email previews</title>
  <style>
    :root{color-scheme:light;font-family:Arial,Helvetica,sans-serif;background:#0d2435;color:#fff}
    *{box-sizing:border-box}body{margin:0;background:#0d2435}.top{position:sticky;top:0;z-index:2;padding:18px 22px;background:rgba(13,36,53,.96);border-bottom:1px solid #355366;backdrop-filter:blur(14px)}
    h1{margin:0 0 5px;font-family:Georgia,serif;font-size:24px}.meta{margin:0;color:#aec1cc;font-size:13px}.tabs{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}.tabs a{padding:9px 12px;border-radius:5px;background:#173b52;color:#dfeaf0;text-decoration:none;font-size:12px;font-weight:800}.tabs a:hover{background:#1a8178;color:#fff}
    main{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;padding:18px;max-width:1500px;margin:0 auto}.panel{min-width:0}.label{display:flex;justify-content:space-between;align-items:center;margin:0 2px 9px;color:#dce7ec;font-size:12px;font-weight:800;text-transform:uppercase}.label span{color:#86a4b3;font-weight:600;text-transform:none}
    iframe{display:block;width:100%;height:1660px;border:1px solid #416174;border-radius:8px;background:#e8eef2}
    @media(max-width:1000px){main{grid-template-columns:1fr}.top{position:static}iframe{height:1660px}}
  </style>
</head>
<body>
  <header class="top"><h1>Cohort 2 volunteer emails</h1><p class="meta">Audience: 169 people who reached Stage 2 or beyond. Nothing has been sent.</p><nav class="tabs"><a href="#invitation">Invitation</a><a href="#confirmation">Application confirmation</a></nav></header>
  <main>
    <section class="panel" id="invitation"><div class="label">Invitation campaign <span>sent only after approval</span></div><iframe title="Invitation email" src="invitation.html"></iframe></section>
    <section class="panel" id="confirmation"><div class="label">After applying <span>automatic confirmation</span></div><iframe title="Application confirmation email" src="confirmation.html"></iframe></section>
  </main>
</body>
</html>`;
}

async function main(): Promise<void> {
  const applications = await prisma.publicApplication.findMany({
    where: {
      stage: { gte: 2 },
      status: { not: "preview" },
      credentialsEmailSentAt: { not: null },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      stage: true,
      stageStatus: true,
    },
  });

  const recipients = applications.map((application) => ({
    applicationId: application.id,
    email: application.email.trim().toLowerCase(),
    fullName: application.fullName.trim(),
    firstName: application.fullName.trim().split(/\s+/)[0] || "there",
    stage: application.stage,
    stageStatus: application.stageStatus,
  }));

  const uniqueEmails = new Set(recipients.map((recipient) => recipient.email));
  if (recipients.length !== EXPECTED_RECIPIENTS || uniqueEmails.size !== EXPECTED_RECIPIENTS) {
    throw new Error(
      `Expected ${EXPECTED_RECIPIENTS} unique Stage 2+ recipients; found ${recipients.length} rows and ${uniqueEmails.size} unique emails.`
    );
  }
  if (recipients.some((recipient) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email))) {
    throw new Error("The Stage 2+ audience contains an invalid email address.");
  }

  const existingRows = await prisma.emailQueueItem.findMany({
    where: { status: { in: ["PENDING", "SENT", "FAILED"] } },
    select: { status: true, context: true },
  });
  const existing = existingRows.filter((row) => isReleaseContext(row.context));
  if (existing.length > 0) {
    const statuses = existing.reduce<Record<string, number>>((counts, row) => {
      counts[row.status] = (counts[row.status] ?? 0) + 1;
      return counts;
    }, {});
    console.log(JSON.stringify({ mode: "ALREADY_QUEUED", releaseId: RELEASE_ID, rows: existing.length, statuses }, null, 2));
    return;
  }

  const invitation = renderVolunteerInvitationEmail("Somto");
  const confirmation = renderVolunteerApplicationConfirmationEmail(
    "Somto Okoma",
    "Curriculum & Learning Design"
  );
  await mkdir(PREVIEW_DIR, { recursive: true });
  await Promise.all([
    writeFile(path.join(PREVIEW_DIR, "index.html"), previewIndex(), "utf8"),
    writeFile(path.join(PREVIEW_DIR, "invitation.html"), invitation.html, "utf8"),
    writeFile(path.join(PREVIEW_DIR, "confirmation.html"), confirmation.html, "utf8"),
  ]);

  const stageBreakdown = recipients.reduce<Record<string, number>>((counts, recipient) => {
    const key = `stage-${recipient.stage}-${recipient.stageStatus}`;
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
  console.log(JSON.stringify({
    mode: COMMIT ? "COMMIT" : "DRY_RUN",
    releaseId: RELEASE_ID,
    subject: invitation.subject,
    recipients: recipients.length,
    audienceRule: "Credentialed Cohort One applications whose recorded highest stage is Stage 2 or later; preview records excluded",
    stageBreakdown,
    preview: path.join(PREVIEW_DIR, "index.html"),
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
  const rows: Prisma.EmailQueueItemCreateManyInput[] = recipients.map((recipient) => {
    const rendered = renderVolunteerInvitationEmail(recipient.fullName);
    return {
      userId: userByEmail.get(recipient.email) ?? null,
      kind: "GENERAL",
      toEmail: recipient.email,
      subject: rendered.subject,
      body: rendered.html,
      status: "PENDING",
      context: {
        releaseId: RELEASE_ID,
        audience: "COHORT_ONE_STAGE_2_PLUS",
        applicationId: recipient.applicationId,
        recordedStage: recipient.stage,
        recordedStageStatus: recipient.stageStatus,
      },
    };
  });

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
