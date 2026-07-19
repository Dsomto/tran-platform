import { randomInt } from "node:crypto";
import { config } from "dotenv";

config();
config({ path: ".env.local", override: true });
// Production validates document links against both CRON_SECRET and NEXTAUTH_SECRET.
// Local operations do not hold the deployment-only cron secret, so sign with the
// shared fallback that production explicitly accepts.
process.env.CRON_SECRET ||= process.env.NEXTAUTH_SECRET;

import { Prisma, PrismaClient, Stage, Track } from "../src/generated/prisma";
import { onboardApprovedApplicant } from "../src/lib/onboard";
import {
  renderCredentialsEmail,
  sendRawHtmlEmail,
  sendRawHtmlEmailWithAttachments,
} from "../src/lib/email";
import {
  certificateIdFor,
  passLetterIdFor,
} from "../src/lib/certificate-link";
import { generateStageCertificate } from "../src/lib/generate-certificate";
import { generatePassLetter } from "../src/lib/generate-pass-letter";

const prisma = new PrismaClient();
const COMMIT = process.env.COMMIT === "1";
const ACTION = process.env.ACTION ?? "rebuild";
const EMAIL = "dakang346@gmail.com";
const INTERN_CODE = "UBI-2026-0025";
const FULL_NAME = "Dakang Victor Ladat";
const REPORT_URL = "https://drive.google.com/drive/folders/1wE1k67DLt7ibMyFVdPuj0FchBAjW9OpB";
const SCORE = 86;
const TERMINAL_SCORE = 100;
const FINAL_SCORE = 89;
const PASSING_SCORE = 70;
const FEEDBACK =
  "[REINSTATED] Stage 4 recovered from ungraded Drive submission and graded by programme: " +
  "capstone 283/330 \u224886%, blended \u224889% (cutoff 70). D1 47 D2 50 D3 30 D4 36 D5 49 D6 71. " +
  "Wrongly eliminated \u2014 submission was never captured.";
const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

function generatePassword(length = 14): string {
  return Array.from({ length }, () => PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]).join("");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadApplication() {
  const application = await prisma.publicApplication.findFirst({
    where: { email: { equals: EMAIL, mode: "insensitive" } },
  });
  if (!application) throw new Error("Victor's surviving PublicApplication was not found");
  if (application.internId !== INTERN_CODE) {
    throw new Error(`Expected ${INTERN_CODE}, found ${application.internId ?? "no intern code"}`);
  }
  if (application.fullName !== FULL_NAME) {
    throw new Error(`Expected ${FULL_NAME}, found ${application.fullName}`);
  }
  return application;
}

async function rebuild(): Promise<void> {
  const application = await loadApplication();
  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: EMAIL, mode: "insensitive" } },
    include: { intern: true },
  });
  if (existingUser) {
    throw new Error("Victor already has a User account; refusing to reset credentials or duplicate the rebuild");
  }
  if (application.stageStatus !== "eliminated") {
    throw new Error(`Expected eliminated application, found ${application.stageStatus}`);
  }

  console.log(JSON.stringify({
    mode: COMMIT ? "COMMIT" : "DRY_RUN",
    action: "rebuild",
    applicationId: application.id,
    email: EMAIL,
    internCode: INTERN_CODE,
    fromStageStatus: application.stageStatus,
    accountExists: false,
    target: {
      stageStatus: "active",
      currentStage: Stage.STAGE_4,
      track: Track.SOC_ANALYSIS,
      reportStatus: "PASSED",
      score: SCORE,
      terminalScore: TERMINAL_SCORE,
      finalScore: FINAL_SCORE,
      history: "STAGE_4 -> STAGE_5 / reinstate-victor",
    },
  }, null, 2));
  if (!COMMIT) return;

  const loginPassword = generatePassword();
  await prisma.publicApplication.update({
    where: { id: application.id },
    data: {
      status: "approved",
      stage: 4,
      stageStatus: "active",
      loginPassword,
      credentialsEmailSentAt: null,
    },
  });

  const onboarded = await onboardApprovedApplicant({
    email: EMAIL,
    fullName: FULL_NAME,
    trackInterest: "SOC Analysis",
    loginPassword,
  });
  const now = new Date();
  const report = await prisma.$transaction(async (tx) => {
    await tx.intern.update({
      where: { id: onboarded.internDbId },
      data: {
        currentStage: Stage.STAGE_4,
        track: Track.SOC_ANALYSIS,
        isActive: true,
        eliminatedAt: null,
        archivedAt: null,
        finalist: true,
      },
    });
    const created = await tx.stageReport.create({
      data: {
        internId: onboarded.internDbId,
        stage: Stage.STAGE_4,
        executiveSummary: "Recovered Stage 4 capstone submission graded by the programme after a capture failure.",
        reportUrl: REPORT_URL,
        status: "PASSED",
        score: SCORE,
        terminalScore: TERMINAL_SCORE,
        finalScore: FINAL_SCORE,
        feedback: FEEDBACK,
        submittedAt: now,
        gradedAt: now,
        finalizedAt: now,
      },
    });
    await tx.stageHistory.create({
      data: {
        internId: onboarded.internDbId,
        fromStage: Stage.STAGE_4,
        toStage: Stage.STAGE_5,
        promotedBy: "reinstate-victor",
        reason: "Wrongful elimination corrected after the missing Stage 4 submission was recovered and passed",
      },
    });
    return created;
  });

  console.log(JSON.stringify({
    rebuilt: true,
    userId: onboarded.userId,
    internDbId: onboarded.internDbId,
    reportId: report.id,
    login: {
      identifier: INTERN_CODE,
      email: EMAIL,
      temporaryPassword: loginPassword,
    },
  }, null, 2));
}

function passPackageHtml(opts: { firstName: string }): string {
  return `
    <div style="font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:#F1F5F9;padding:40px 20px;">
      <div style="max-width:600px;margin:0 auto;background:#FFFFFF;padding:36px;border-radius:12px;">
        <p style="color:#B45309;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">Ubuntu Bridge Initiative - Cyber Core</p>
        <h1 style="color:#0A1F44;font-size:28px;line-height:1.25;">Congratulations, ${opts.firstName}. You are a Cyber Core Associate.</h1>
        <p style="color:#334155;font-size:15px;line-height:1.75;">We recovered your Stage 4 Drive submission and completed the grading that should have happened before the cohort decision. You scored <strong>${FINAL_SCORE}/100</strong> against the ${PASSING_SCORE} cutoff and have been reinstated into the SOC Analysis Advanced Stage cohort.</p>
        <p style="color:#334155;font-size:15px;line-height:1.75;">Your Stage 4 certificate and achievement letter will arrive as PDF attachments in a separate message.</p>
        <p style="color:#475569;font-size:14px;line-height:1.7;">We are sorry your submission was not captured when it should have been. The correction is now reflected in your programme record.</p>
      </div>
    </div>`;
}

async function sendAndRecord(opts: {
  userId: string;
  subject: string;
  html: string;
  context: Prisma.InputJsonValue;
}): Promise<void> {
  const row = await prisma.emailQueueItem.create({
    data: {
      userId: opts.userId,
      toEmail: EMAIL,
      kind: "GENERAL",
      subject: opts.subject,
      body: opts.html,
      status: "PENDING",
      lockedAt: new Date(),
      context: opts.context,
    },
  });
  try {
    await sendRawHtmlEmail(EMAIL, opts.subject, opts.html);
    await prisma.emailQueueItem.update({
      where: { id: row.id },
      data: { status: "SENT", sentAt: new Date(), attempts: 1, lockedAt: null },
    });
  } catch (error) {
    await prisma.emailQueueItem.update({
      where: { id: row.id },
      data: {
        status: "FAILED",
        attempts: 1,
        lockedAt: null,
        failReason: (error instanceof Error ? error.message : String(error)).slice(0, 500),
      },
    });
    throw error;
  }
}

async function emailPackage(): Promise<void> {
  const application = await loadApplication();
  const user = await prisma.user.findFirst({
    where: { email: { equals: EMAIL, mode: "insensitive" } },
    include: {
      intern: {
        include: {
          reports: { where: { stage: Stage.STAGE_4 }, take: 1 },
          advancedArtifacts: { where: { stage: Stage.STAGE_5 }, take: 1 },
        },
      },
    },
  });
  const intern = user?.intern;
  const report = intern?.reports[0];
  const grant = intern?.advancedArtifacts[0];
  if (!user || !intern || !report || !grant) {
    throw new Error("Account, Stage 4 report, and Stage 5 grant must exist before email delivery");
  }
  if (
    application.stageStatus !== "advanced" ||
    application.stage !== 5 ||
    intern.currentStage !== Stage.STAGE_5 ||
    intern.track !== Track.SOC_ANALYSIS ||
    report.status !== "PASSED" ||
    !application.loginPassword
  ) {
    throw new Error("Victor's admission state is incomplete; refusing to send credentials");
  }
  const prior = await prisma.emailQueueItem.findMany({
    where: { toEmail: EMAIL, status: "SENT" },
    select: { context: true },
  });
  if (prior.some((row) => {
    const context = row.context as { type?: string } | null;
    return context?.type === "victor-reinstatement-pass" || context?.type === "victor-reinstatement-credentials";
  })) {
    throw new Error("Reinstatement email has already been sent; refusing a duplicate delivery");
  }

  const issuedAt = report.finalizedAt ?? report.gradedAt ?? new Date();
  const [certificate, letter] = await Promise.all([
    generateStageCertificate({
      fullName: FULL_NAME,
      stageLabel: "Stage 4 - Governance & Risk",
      stageKey: Stage.STAGE_4,
      score: FINAL_SCORE,
      passingScore: PASSING_SCORE,
      issuedAt,
      certId: certificateIdFor(report.id),
    }),
    generatePassLetter({
      fullName: FULL_NAME,
      stageLabel: "Stage 4 - Governance & Risk",
      stageKey: Stage.STAGE_4,
      score: FINAL_SCORE,
      passingScore: PASSING_SCORE,
      issuedAt,
      letterId: passLetterIdFor(report.id),
      nextStageLabel: "Stage 5 - Track Specialisation",
    }),
  ]);
  const validPdf = (value: Buffer) => value.length > 1_000 && value.subarray(0, 5).toString("ascii") === "%PDF-";
  if (!validPdf(certificate) || !validPdf(letter)) {
    throw new Error("Generated Stage 4 PDF validation failed");
  }
  const passSubject = "Congratulations, Dakang. You are now a Cyber Core Associate.";
  const passHtml = passPackageHtml({ firstName: user.firstName });
  const credentials = renderCredentialsEmail({
    fullName: FULL_NAME,
    internId: INTERN_CODE,
    tempPassword: application.loginPassword,
  });

  console.log(JSON.stringify({
    mode: COMMIT ? "COMMIT" : "DRY_RUN",
    action: "email",
    to: EMAIL,
    messages: [passSubject, credentials.subject],
    certificateBytes: certificate.length,
    letterBytes: letter.length,
    pacingMs: 1100,
  }, null, 2));
  if (!COMMIT) return;

  await sendAndRecord({
    userId: user.id,
    subject: passSubject,
    html: passHtml,
    context: { type: "victor-reinstatement-pass", reportId: report.id },
  });
  await sleep(1100);
  await sendAndRecord({
    userId: user.id,
    subject: credentials.subject,
    html: credentials.html,
    context: { type: "victor-reinstatement-credentials", applicationId: application.id },
  });
  await prisma.publicApplication.update({
    where: { id: application.id },
    data: { credentialsEmailSentAt: new Date() },
  });
  console.log("Reinstatement pass package and credentials email sent.");
}

async function emailDocumentAttachments(): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { email: { equals: EMAIL, mode: "insensitive" } },
    include: { intern: { include: { reports: { where: { stage: Stage.STAGE_4 }, take: 1 } } } },
  });
  const intern = user?.intern;
  const report = intern?.reports[0];
  if (!user || !intern || !report || report.status !== "PASSED") {
    throw new Error("Passed Stage 4 report is required before attachment delivery");
  }
  const prior = await prisma.emailQueueItem.findMany({
    where: { toEmail: EMAIL, status: "SENT" },
    select: { context: true },
  });
  if (prior.some((row) => (row.context as { type?: string } | null)?.type === "victor-reinstatement-documents")) {
    throw new Error("Stage 4 document attachments have already been sent");
  }
  const issuedAt = report.finalizedAt ?? report.gradedAt ?? new Date();
  const [certificate, letter] = await Promise.all([
    generateStageCertificate({
      fullName: FULL_NAME,
      stageLabel: "Stage 4 - Governance & Risk",
      stageKey: Stage.STAGE_4,
      score: FINAL_SCORE,
      passingScore: PASSING_SCORE,
      issuedAt,
      certId: certificateIdFor(report.id),
    }),
    generatePassLetter({
      fullName: FULL_NAME,
      stageLabel: "Stage 4 - Governance & Risk",
      stageKey: Stage.STAGE_4,
      score: FINAL_SCORE,
      passingScore: PASSING_SCORE,
      issuedAt,
      letterId: passLetterIdFor(report.id),
      nextStageLabel: "Stage 5 - Track Specialisation",
    }),
  ]);
  const subject = "Your Stage 4 certificate and pass letter (attached)";
  const html = `
    <div style="font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:#F1F5F9;padding:40px 20px;">
      <div style="max-width:600px;margin:0 auto;background:#FFFFFF;padding:36px;border-radius:12px;">
        <h1 style="color:#0A1F44;font-size:26px;">Your Stage 4 documents, Dakang</h1>
        <p style="color:#334155;font-size:15px;line-height:1.75;">Your signed Cyber Core certificate and Stage 4 achievement letter are attached to this email as PDFs.</p>
        <p style="color:#334155;font-size:15px;line-height:1.75;"><strong>Please use these attachments instead of the download buttons in the earlier message.</strong> Those buttons were generated from an operations signing context that is not accepted by the production document server. The attached PDFs are the authoritative copies.</p>
        <p style="color:#475569;font-size:14px;line-height:1.7;">Your programme record remains corrected at 89/100 and your SOC Analysis Stage 5 admission is active.</p>
      </div>
    </div>`;

  console.log(JSON.stringify({
    mode: COMMIT ? "COMMIT" : "DRY_RUN",
    action: "documents",
    to: EMAIL,
    subject,
    certificateBytes: certificate.length,
    letterBytes: letter.length,
  }, null, 2));
  if (!COMMIT) return;

  const row = await prisma.emailQueueItem.create({
    data: {
      userId: user.id,
      toEmail: EMAIL,
      kind: "GENERAL",
      subject,
      body: html,
      status: "PENDING",
      lockedAt: new Date(),
      context: { type: "victor-reinstatement-documents", reportId: report.id },
    },
  });
  try {
    await sendRawHtmlEmailWithAttachments(EMAIL, subject, html, [
      {
        filename: "UBI-Certificate-Dakang-Victor-Ladat-STAGE_4.pdf",
        content: certificate,
        contentType: "application/pdf",
      },
      {
        filename: "UBI-Pass-Letter-Dakang-Victor-Ladat-STAGE_4.pdf",
        content: letter,
        contentType: "application/pdf",
      },
    ]);
    await prisma.emailQueueItem.update({
      where: { id: row.id },
      data: { status: "SENT", sentAt: new Date(), attempts: 1, lockedAt: null },
    });
  } catch (error) {
    await prisma.emailQueueItem.update({
      where: { id: row.id },
      data: {
        status: "FAILED",
        attempts: 1,
        lockedAt: null,
        failReason: (error instanceof Error ? error.message : String(error)).slice(0, 500),
      },
    });
    throw error;
  }
  console.log("Stage 4 certificate and pass letter attachments sent.");
}

async function main(): Promise<void> {
  if (ACTION === "rebuild") return rebuild();
  if (ACTION === "email") return emailPackage();
  if (ACTION === "documents") return emailDocumentAttachments();
  throw new Error("ACTION must be rebuild, email, or documents");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
