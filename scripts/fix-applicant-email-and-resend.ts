import "dotenv/config";
import { writeFileSync } from "node:fs";
import { PrismaClient } from "../src/generated/prisma";
import { sendPublicAcceptanceEmail } from "../src/lib/email";

/**
 * Fix the email address on an applicant whose welcome email bounced
 * (typo on the application form) and re-send the welcome.
 *
 * Reuses the existing temp password stored on PublicApplication.loginPassword
 * — the platform stores the plaintext there until first login, so the
 * applicant receives the SAME password they were originally issued, not a
 * new one. (Once they log in, that field is wiped and the password lives
 * only as a bcrypt hash on User.password.)
 *
 * SAFETY:
 *   - INSPECT-ONLY by default — prints the plan, writes a backup, no DB
 *     writes, no email sent.
 *   - COMMIT=1 actually updates the email + sends the welcome.
 *   - Aborts if the NEW_EMAIL is already in use by a different applicant
 *     or user (would violate Prisma @unique).
 *   - Aborts if the applicant has already logged in (loginPassword is
 *     null) — at that point only the bcrypt hash exists, no plaintext
 *     to re-mail. In that case use the /forgot-password flow on the new
 *     email after updating it (or write a separate password-reset script).
 *
 * USAGE:
 *
 *   # Lookup by current email (when you know what they typed wrong):
 *   CURRENT_EMAIL=adeoyeifeoluwa@gmail.com NEW_EMAIL=adeoye.ifeoluwa@gmail.com \
 *     npx tsx scripts/fix-applicant-email-and-resend.ts
 *
 *   # Lookup by applicant id (when you grabbed it from the admin UI):
 *   APPLICANT_ID=<mongo-objectid> NEW_EMAIL=<correct@email> \
 *     npx tsx scripts/fix-applicant-email-and-resend.ts
 *
 *   # When the plan looks right, add COMMIT=1:
 *   CURRENT_EMAIL=... NEW_EMAIL=... COMMIT=1 \
 *     npx tsx scripts/fix-applicant-email-and-resend.ts
 */

const prisma = new PrismaClient();

const COMMIT = process.env.COMMIT === "1";
const APPLICANT_ID = process.env.APPLICANT_ID?.trim() ?? "";
const CURRENT_EMAIL = process.env.CURRENT_EMAIL?.trim().toLowerCase() ?? "";
const NEW_EMAIL = process.env.NEW_EMAIL?.trim().toLowerCase() ?? "";

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

async function main() {
  if (!NEW_EMAIL) {
    console.error("ERROR: NEW_EMAIL is required.");
    process.exit(2);
  }
  if (!isValidEmail(NEW_EMAIL)) {
    console.error(`ERROR: NEW_EMAIL "${NEW_EMAIL}" is not a valid email.`);
    process.exit(2);
  }
  if (!APPLICANT_ID && !CURRENT_EMAIL) {
    console.error("ERROR: Provide APPLICANT_ID or CURRENT_EMAIL.");
    process.exit(2);
  }

  const application = APPLICANT_ID
    ? await prisma.publicApplication.findUnique({ where: { id: APPLICANT_ID } })
    : await prisma.publicApplication.findUnique({ where: { email: CURRENT_EMAIL } });

  if (!application) {
    console.error(
      `ERROR: No PublicApplication found by ${APPLICANT_ID ? "id=" + APPLICANT_ID : "email=" + CURRENT_EMAIL}.`
    );
    process.exit(2);
  }

  console.log(`\n=== Applicant ===`);
  console.log(`  id:           ${application.id}`);
  console.log(`  fullName:     ${application.fullName}`);
  console.log(`  currentEmail: ${application.email}`);
  console.log(`  newEmail:     ${NEW_EMAIL}`);
  console.log(`  status:       ${application.status}`);
  console.log(`  trackInterest:${application.trackInterest}`);
  console.log(`  internId:     ${application.internId ?? "(not assigned)"}`);
  console.log(
    `  loginPassword:${application.loginPassword ? " <stored — same one will be re-emailed>" : " <null — applicant already logged in; use forgot-password instead>"}`
  );
  console.log(
    `  welcomeEmailSentAt: ${application.welcomeEmailSentAt?.toISOString() ?? "(never)"}`
  );

  if (application.status !== "approved") {
    console.error(
      `\nERROR: status is "${application.status}". Only approved applicants get the welcome email. Approve them in the admin UI first.`
    );
    process.exit(2);
  }
  if (!application.internId || !application.loginPassword) {
    console.error(
      `\nERROR: This applicant has no stored credentials (internId or loginPassword is null). Likely they've already logged in (which wipes loginPassword), or onboarding never completed. Either:
       (a) update the email anyway via the admin UI, then have them use /login → "Forgot password" to set a new one, or
       (b) write a separate password-reset script that calls bcrypt and updates User.password.`
    );
    process.exit(2);
  }

  // Collision checks — Prisma @unique on both PublicApplication.email and User.email.
  const appCollision = await prisma.publicApplication.findUnique({ where: { email: NEW_EMAIL } });
  if (appCollision && appCollision.id !== application.id) {
    console.error(
      `\nERROR: Another PublicApplication already uses ${NEW_EMAIL} (id=${appCollision.id}, name=${appCollision.fullName}). Cannot reuse a different applicant's email.`
    );
    process.exit(2);
  }
  const userCollision = await prisma.user.findUnique({ where: { email: NEW_EMAIL } });

  // The linked User row, looked up by the CURRENT (about-to-be-replaced) email.
  const linkedUser = await prisma.user.findUnique({
    where: { email: application.email.toLowerCase() },
  });
  if (linkedUser) {
    console.log(`  linkedUser:   id=${linkedUser.id} role=${linkedUser.role}`);
  } else {
    console.log(`  linkedUser:   (none — applicant has no User row yet; PublicApplication only)`);
  }

  if (userCollision && userCollision.id !== linkedUser?.id) {
    console.error(
      `\nERROR: Another User already uses ${NEW_EMAIL} (id=${userCollision.id}). Cannot reassign.`
    );
    process.exit(2);
  }

  // Backup before any write — copy of every row we're about to touch.
  const backupPath = `scripts/backup-applicant-email-fix-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}.json`;
  writeFileSync(
    backupPath,
    JSON.stringify({ application, linkedUser, NEW_EMAIL }, null, 2)
  );
  console.log(`\nBackup: ${backupPath}`);

  if (!COMMIT) {
    console.log(`\nMode: INSPECT — no writes, no email.`);
    console.log(`Re-run with COMMIT=1 to apply:`);
    console.log(
      `  ${APPLICANT_ID ? `APPLICANT_ID=${APPLICANT_ID}` : `CURRENT_EMAIL=${CURRENT_EMAIL}`} NEW_EMAIL=${NEW_EMAIL} COMMIT=1 npx tsx scripts/fix-applicant-email-and-resend.ts`
    );
    return;
  }

  console.log(`\nMode: COMMIT — updating email...`);

  const ops = [
    prisma.publicApplication.update({
      where: { id: application.id },
      // Clear welcomeEmailSentAt so the batch-resend tool would re-pick this
      // applicant if the send below fails. The success path below sets it
      // back to the current time.
      data: { email: NEW_EMAIL, welcomeEmailSentAt: null },
    }),
    ...(linkedUser
      ? [
          prisma.user.update({
            where: { id: linkedUser.id },
            data: { email: NEW_EMAIL },
          }),
        ]
      : []),
  ];
  await prisma.$transaction(ops);
  console.log(
    `Email updated → PublicApplication${linkedUser ? " + User" : ""} now use ${NEW_EMAIL}.`
  );

  console.log(`Sending welcome email to ${NEW_EMAIL}...`);
  try {
    await sendPublicAcceptanceEmail(
      NEW_EMAIL,
      application.fullName,
      application.trackInterest,
      application.internId,
      application.loginPassword
    );
    await prisma.publicApplication.update({
      where: { id: application.id },
      data: { welcomeEmailSentAt: new Date() },
    });
    console.log(`✅ Welcome email sent to ${NEW_EMAIL}.`);
    console.log(`   internId:      ${application.internId}`);
    console.log(`   temp password: <unchanged — same as the original send>`);
    console.log(
      `\nApplicant can log in at https://ubuntubridgeinitiatives.org/login with the new email + the temp password from the email.`
    );
  } catch (err) {
    console.error(`\n⚠️ Email send failed:`, err);
    console.error(
      `The email field WAS updated (DB write succeeded), but the welcome email did NOT go out. Retry by re-running this script with the SAME env vars — it will see the email is already updated and just attempt the send again.`
    );
    process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
