import { config } from "dotenv";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/index.js";
import {
  ADVANCED_RANKING_STAGES,
  advancedSelectionPolicy,
  rankAdvancedStage,
} from "../src/lib/advanced-ranking.ts";
import {
  certificateIdFor,
  certificateUrl,
  dossierUrl,
  letterUrl,
  passLetterUrl,
  performanceRecordUrl,
  referenceUrl,
  verifyUrl,
} from "../src/lib/certificate-link.ts";
import { buildAddToProfileUrl } from "../src/lib/linkedin.ts";
import {
  renderStage9DepartureEmail,
  renderStage9FinalistEmail,
  renderStage9NoSubmissionEmail,
  stage9DepartureSubject,
  stage9FinalistSubject,
  stage9NoSubmissionSubject,
} from "../src/lib/stage9-result-email.ts";

config({ quiet: true });
config({ path: ".env.local", override: true, quiet: true });

if (process.env.DB_TIMEOUT_MS && process.env.DATABASE_URL) {
  const timeout = String(Number.parseInt(process.env.DB_TIMEOUT_MS, 10));
  if (/^[1-9]\d+$/.test(timeout)) {
    const databaseUrl = new URL(process.env.DATABASE_URL);
    databaseUrl.searchParams.set("serverSelectionTimeoutMS", timeout);
    databaseUrl.searchParams.set("connectTimeoutMS", timeout);
    databaseUrl.searchParams.set("socketTimeoutMS", timeout);
    process.env.DATABASE_URL = databaseUrl.toString();
  }
}

const prisma = new PrismaClient();
const COMMIT = process.env.COMMIT === "1";
const STAGE = "STAGE_9";
const ORIGIN = "https://ubuntubridgeinitiatives.org";
const RELEASE_ID = "stage9-results-2026-09-13";
const TRACKS = ["SOC_ANALYSIS", "ETHICAL_HACKING", "GRC"];
const EXPECTED_TARGETS = { SOC_ANALYSIS: 4, ETHICAL_HACKING: 3, GRC: 3 };
const EXPECTED_FINALISTS = new Set([
  "nnanna.adaobi.e@gmail.com",
  "mercynuella330@gmail.com",
  "nyimenkabenson@gmail.com",
  "adaezeetigbue@gmail.com",
  "adeyemisodik670@gmail.com",
  "egwuvictor232@gmail.com",
  "hamza.hashim.sec@gmail.com",
  "maachnada.20@gmail.com",
  "balqeesthamzedu@gmail.com",
  "jessicaighoraye@gmail.com",
]);
const REVIEWABLE = new Set(["GRADED", "PENDING_PROMOTION", "PENDING_ELIMINATION", "PASSED", "FAILED"]);
const ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789";

function fullName(user) {
  return `${user.firstName ?? ""} ${user.lastName ?? ""}`.replace(/\s+/g, " ").trim();
}

function codeSegment(length) {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

async function returningCodeFor(email) {
  const application = await prisma.publicApplication.findFirst({
    where: { email: email.toLowerCase() },
    select: { returningCode: true },
  });
  if (application?.returningCode) return { code: application.returningCode, mint: false };
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = `NF-${codeSegment(4)}-${codeSegment(4)}`;
    const exists = await prisma.publicApplication.findFirst({ where: { returningCode: code }, select: { id: true } });
    if (!exists) return { code, mint: true };
  }
  throw new Error(`Could not mint a returning code for ${email}`);
}

async function main() {
  if (/localhost|127\.0\.0\.1/i.test(ORIGIN)) throw new Error("Production result emails cannot use a local origin");
  const actor = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN", email: "dsomto891@gmail.com" },
    select: { id: true, email: true, role: true },
  });
  if (!actor) throw new Error("Somto's super-admin account was not found");

  const [window, grants, existingQueue] = await Promise.all([
    prisma.stageWindow.findUnique({ where: { stage: STAGE } }),
    prisma.advancedArtifactGrant.findMany({
      where: {
        stage: STAGE,
        revokedAt: null,
        intern: { isActive: true, currentStage: STAGE, user: { email: { not: { endsWith: "@netforge.invalid" } } } },
      },
      select: {
        internId: true,
        track: true,
        intern: { include: { user: true } },
      },
    }),
    prisma.emailQueueItem.findMany({
      where: { status: { in: ["PENDING", "SENT"] } },
      select: { context: true },
    }),
  ]);
  if (!window) throw new Error("Stage 9 window is missing");
  if (existingQueue.some((item) => item.context?.releaseId === RELEASE_ID)) {
    throw new Error(`Release ${RELEASE_ID} already exists; refusing to duplicate it`);
  }
  if (grants.length !== 34 || new Set(grants.map((grant) => grant.internId)).size !== 34) {
    throw new Error(`Expected 34 unique active Stage 9 grants, found ${grants.length}`);
  }

  const internIds = grants.map((grant) => grant.internId);
  const currentReports = await prisma.stageReport.findMany({
    where: { stage: STAGE, internId: { in: internIds }, status: "GRADED" },
    include: { intern: { include: { user: true } } },
  });
  if (currentReports.length !== 33) throw new Error(`Expected 33 graded submissions, found ${currentReports.length}`);
  if (currentReports.some((report) => report.qaVerified !== true || report.score === null || report.submittedAt === null)) {
    throw new Error("Every assessed Stage 9 report must have score, submission timestamp, and QA approval");
  }
  const reportInternIds = new Set(currentReports.map((report) => report.internId));
  const nonSubmitters = grants.filter((grant) => !reportInternIds.has(grant.internId));
  if (nonSubmitters.length !== 1 || nonSubmitters[0].intern.user.email.toLowerCase() !== "olayinkaojo.ng@gmail.com") {
    throw new Error(`Unexpected non-submitter set: ${nonSubmitters.map((row) => row.intern.user.email).join(", ")}`);
  }

  const includedStages = ADVANCED_RANKING_STAGES.slice(0, ADVANCED_RANKING_STAGES.indexOf(STAGE) + 1);
  const history = await prisma.stageReport.findMany({
    where: { stage: { in: [...includedStages] }, internId: { in: internIds }, status: { in: [...REVIEWABLE] } },
    select: {
      internId: true,
      stage: true,
      score: true,
      finalScore: true,
      advancedCohortSize: true,
      intern: { select: { track: true } },
    },
  });
  const records = history.flatMap((report) => {
    const score = report.finalScore ?? report.score;
    return score === null ? [] : [{
      internId: report.internId,
      track: report.intern.track,
      stage: report.stage,
      score,
      cohortSize: report.advancedCohortSize,
      gateFailed: false,
    }];
  });
  const noSubmitter = nonSubmitters[0];
  records.push({
    internId: noSubmitter.internId,
    track: noSubmitter.track,
    stage: STAGE,
    score: 0,
    cohortSize: grants.filter((grant) => grant.track === noSubmitter.track).length,
    gateFailed: false,
  });
  const candidates = currentReports.map((report) => ({
    reportId: report.id,
    internId: report.internId,
    track: report.intern.track,
    currentFinalScore: report.score,
    currentReportScore: report.score,
    gateFailed: false,
  }));
  const cohortSizes = Object.fromEntries(TRACKS.map((track) => [track, grants.filter((grant) => grant.track === track).length]));
  const ranking = rankAdvancedStage(STAGE, candidates, records, cohortSizes);
  const incomplete = ranking.flatMap((track) => track.rows.filter((row) => row.incomplete));
  if (incomplete.length) throw new Error(`${incomplete.length} candidates have incomplete Stage 5-9 history`);
  if (ranking.some((track) => track.boundaryTie)) throw new Error("A Stage 9 finalist boundary tie requires another manual review");
  for (const track of ranking) {
    const selected = track.rows.filter((row) => row.selected);
    if (selected.length !== EXPECTED_TARGETS[track.track]) {
      throw new Error(`${track.track} selected ${selected.length}; expected ${EXPECTED_TARGETS[track.track]}`);
    }
  }
  const selectedEmails = new Set(ranking.flatMap((track) => track.rows.filter((row) => row.selected)).map((row) => currentReports.find((report) => report.id === row.reportId).intern.user.email.toLowerCase()));
  if (selectedEmails.size !== EXPECTED_FINALISTS.size || [...EXPECTED_FINALISTS].some((email) => !selectedEmails.has(email))) {
    throw new Error("Computed finalists differ from the approved ten-person list");
  }

  const rows = ranking.flatMap((track) => track.rows).map((row) => ({
    ...row,
    report: currentReports.find((report) => report.id === row.reportId),
  }));
  const summary = {
    mode: COMMIT ? "COMMIT" : "DRY_RUN",
    releaseId: RELEASE_ID,
    cohort: grants.length,
    assessed: rows.length,
    finalists: rows.filter((row) => row.selected).map((row) => ({ name: fullName(row.report.intern.user), email: row.report.intern.user.email, track: row.track, rank: row.rank, score: row.currentReportScore, cumulative: row.cumulativePercentile })),
    assessedDepartures: rows.filter((row) => !row.selected).length,
    noSubmission: nonSubmitters.map((row) => ({ name: fullName(row.intern.user), email: row.intern.user.email })),
    stageWindowAfter: { status: "CLOSED", isLocked: true },
    emailsToQueue: 34,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (!COMMIT) return;

  const now = new Date();
  const policy = advancedSelectionPolicy(STAGE);
  const releaseEmails = [];
  for (const row of rows) {
    const report = row.report;
    const base = { origin: ORIGIN, reportId: report.id, internId: report.internId };
    const feedbackUrl = `${ORIGIN}/dashboard/reports`;
    if (row.selected) {
      releaseEmails.push({
        report,
        row,
        outcome: "FINALIST",
        returning: null,
        subject: stage9FinalistSubject(report.intern.user.firstName),
        body: renderStage9FinalistEmail({
          firstName: report.intern.user.firstName,
          track: report.intern.track,
          cohortSize: grants.length,
          technicalScore: report.score,
          rank: row.rank,
          trackCohortSize: row.cohortSize,
          cumulativePercentile: row.cumulativePercentile,
          finalistLetterUrl: passLetterUrl(base),
          referenceLetterUrl: referenceUrl(base),
          performanceRecordUrl: performanceRecordUrl(base),
          dossierUrl: dossierUrl(base),
          feedbackUrl,
        }),
      });
    } else {
      const returning = await returningCodeFor(report.intern.user.email);
      const certificate = certificateUrl(base);
      const verification = verifyUrl(base);
      releaseEmails.push({
        report,
        row,
        outcome: "ASSESSED_DEPARTURE",
        returning,
        subject: stage9DepartureSubject(report.intern.user.firstName),
        body: renderStage9DepartureEmail({
          firstName: report.intern.user.firstName,
          track: report.intern.track,
          cohortSize: grants.length,
          technicalScore: report.score,
          rank: row.rank,
          trackCohortSize: row.cohortSize,
          cumulativePercentile: row.cumulativePercentile,
          certificateUrl: certificate,
          addToLinkedInUrl: buildAddToProfileUrl({
            stageKey: STAGE,
            issuedAt: now,
            certId: certificateIdFor(report.id),
            certUrl: verification,
            credentialName: "Advanced Stage 9A: The Final Case — Completed and Assessed",
          }),
          personalLetterUrl: letterUrl(base),
          referenceLetterUrl: referenceUrl(base),
          performanceRecordUrl: performanceRecordUrl(base),
          dossierUrl: dossierUrl(base),
          feedbackUrl,
          returningCode: returning.code,
        }),
      });
    }
  }
  const noSubmissionEmail = {
    grant: noSubmitter,
    subject: stage9NoSubmissionSubject(noSubmitter.intern.user.firstName),
    body: renderStage9NoSubmissionEmail({
      firstName: noSubmitter.intern.user.firstName,
      track: noSubmitter.track,
      cohortSize: grants.length,
    }),
  };

  await prisma.$transaction(async (tx) => {
    for (const item of releaseEmails) {
      const { report, row } = item;
      await tx.stageReport.update({
        where: { id: report.id },
        data: {
          status: row.selected ? "PASSED" : "FAILED",
          finalScore: report.score,
          terminalScore: null,
          finalizedAt: now,
          advancedRank: row.rank,
          advancedCohortSize: row.cohortSize,
          advancedPercentile: row.percentile,
          advancedCumulativePercentile: row.cumulativePercentile,
          advancedSelectionRule: row.selectionReason,
          advancedGateFailed: false,
          advancedGateReason: null,
        },
      });
      if (row.selected) {
        await tx.intern.update({ where: { id: report.internId }, data: { finalist: true } });
        await tx.stageHistory.create({
          data: { internId: report.internId, fromStage: STAGE, toStage: STAGE, promotedBy: "stage9-finalize", reason: `Selected for Stage 9B; ${row.selectionReason}` },
        });
      } else {
        await tx.intern.update({ where: { id: report.internId }, data: { isActive: false, eliminatedAt: now, finalist: false } });
        await tx.publicApplication.updateMany({
          where: { email: report.intern.user.email.toLowerCase() },
          data: item.returning.mint ? { stageStatus: "eliminated", returningCode: item.returning.code, returningCodeIssuedAt: now, returningCodeStage: 9 } : { stageStatus: "eliminated" },
        });
      }
      await tx.emailQueueItem.create({
        data: {
          userId: report.intern.user.id,
          toEmail: report.intern.user.email,
          kind: row.selected ? "STAGE_PASSED" : "STAGE_FAILED",
          subject: item.subject,
          body: item.body,
          context: { releaseId: RELEASE_ID, stage: STAGE, outcome: item.outcome, reportId: report.id, score: report.score, rank: row.rank, trackCohortSize: row.cohortSize, cumulativePercentile: row.cumulativePercentile },
        },
      });
    }
    await tx.intern.update({ where: { id: noSubmitter.internId }, data: { isActive: false, eliminatedAt: now, finalist: false } });
    await tx.publicApplication.updateMany({ where: { email: noSubmitter.intern.user.email.toLowerCase() }, data: { stageStatus: "eliminated" } });
    await tx.emailQueueItem.create({
      data: {
        userId: noSubmitter.intern.user.id,
        toEmail: noSubmitter.intern.user.email,
        kind: "GENERAL",
        subject: noSubmissionEmail.subject,
        body: noSubmissionEmail.body,
        context: { releaseId: RELEASE_ID, stage: STAGE, outcome: "NO_SUBMISSION" },
      },
    });
    await tx.stageWindow.update({ where: { stage: STAGE }, data: { status: "CLOSED", isLocked: true, closedAt: now, closedById: actor.id, cutoffAppliedAt: now, cutoffById: actor.id } });
    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: "stage-results.finalize",
        targetType: "STAGE_RESULTS",
        targetId: STAGE,
        details: { stage: STAGE, releaseId: RELEASE_ID, policy, finalists: 10, assessedDepartures: 23, nonSubmitters: 1, queued: 34, source: "finalize-stage9-results.mjs" },
      },
    });
  }, { maxWait: 30_000, timeout: 180_000 });

  const queued = await prisma.emailQueueItem.findMany({ where: { status: "PENDING" }, select: { toEmail: true, context: true } });
  const releaseRows = queued.filter((item) => item.context?.releaseId === RELEASE_ID);
  console.log(JSON.stringify({ finalized: true, queued: releaseRows.length, uniqueRecipients: new Set(releaseRows.map((item) => item.toEmail.toLowerCase())).size }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
