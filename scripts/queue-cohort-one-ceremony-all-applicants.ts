import { config } from "dotenv";
import { PrismaClient, type Prisma } from "../src/generated/prisma/index.js";
import {
  ALL_APPLICANTS_CEREMONY_SUBJECT,
  renderAllApplicantsCeremonyEmail,
} from "./cohort-one-ceremony-all-applicants-preview.js";

const inheritedDatabaseUrl = process.env.DATABASE_URL;
config({ quiet: true });
config({ path: ".env.local", override: true, quiet: true });
if (inheritedDatabaseUrl) process.env.DATABASE_URL = inheritedDatabaseUrl;

const prisma = new PrismaClient();
const COMMIT = process.env.COMMIT === "1";
const CONFIRMATION = "QUEUE-ALL-APPLICANTS-CEREMONY";
const RELEASE_ID = "cohort-one-ceremony-all-applicants-2026-11-14";
const EXPECTED_RECIPIENTS = 2_825;

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
    where: { status: { not: "preview" } },
    orderBy: { createdAt: "asc" },
    select: { id: true, fullName: true, email: true },
  });
  const recipients = applications.map((application) => ({
    id: application.id,
    email: application.email.trim().toLowerCase(),
    firstName: application.fullName.trim().split(/\s+/)[0] || "there",
  }));

  if (recipients.length !== EXPECTED_RECIPIENTS) {
    throw new Error(`Expected ${EXPECTED_RECIPIENTS} applicants; found ${recipients.length}.`);
  }
  if (new Set(recipients.map((recipient) => recipient.email)).size !== EXPECTED_RECIPIENTS) {
    throw new Error("The applicant audience contains duplicate email addresses.");
  }
  if (recipients.some((recipient) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email))) {
    throw new Error("The applicant audience contains an invalid email address.");
  }

  const subjectRows = await prisma.emailQueueItem.findMany({
    where: {
      subject: ALL_APPLICANTS_CEREMONY_SUBJECT,
      status: { in: ["PENDING", "SENT", "FAILED"] },
    },
    select: { status: true, context: true, toEmail: true },
  });
  const existing = subjectRows.filter((row) => belongsToRelease(row.context));
  if (existing.length) {
    if (existing.length !== EXPECTED_RECIPIENTS) {
      throw new Error(`Campaign exists partially with ${existing.length} rows; refusing duplicates.`);
    }
    if (new Set(existing.map((row) => row.toEmail.trim().toLowerCase())).size !== EXPECTED_RECIPIENTS) {
      throw new Error("Existing campaign contains duplicate recipients.");
    }
    const statuses = existing.reduce<Record<string, number>>((counts, row) => {
      counts[row.status] = (counts[row.status] ?? 0) + 1;
      return counts;
    }, {});
    console.log(JSON.stringify({ mode: "ALREADY_QUEUED", releaseId: RELEASE_ID, rows: existing.length, statuses }, null, 2));
    return;
  }

  console.log(JSON.stringify({
    mode: COMMIT ? "COMMIT" : "DRY_RUN",
    releaseId: RELEASE_ID,
    subject: ALL_APPLICANTS_CEREMONY_SUBJECT,
    recipients: recipients.length,
    audienceRule: "All non-preview PublicApplication records",
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
    subject: ALL_APPLICANTS_CEREMONY_SUBJECT,
    body: renderAllApplicantsCeremonyEmail(recipient.firstName),
    status: "PENDING",
    context: {
      releaseId: RELEASE_ID,
      audience: "ALL_COHORT_ONE_APPLICANTS_2825",
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
