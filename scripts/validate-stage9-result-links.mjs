import { config } from "dotenv";
import { createHmac } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/index.js";

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
const RELEASE_ID = "stage9-results-2026-09-13";
const ORIGIN = "https://ubuntubridgeinitiatives.org";
const secret = process.env.NEXTAUTH_SECRET;
if (!secret || secret.length < 32) throw new Error("A strong NEXTAUTH_SECRET is required");

const scopes = new Map([
  ["/api/certificate/", "share"],
  ["/verify/", "share"],
  ["/api/pass-letter/", "pass-letter"],
  ["/api/letter/", "letter"],
  ["/api/reference-letter/", "reference"],
  ["/api/performance-record/", "performance-record"],
  ["/api/portfolio-dossier/", "dossier"],
]);

function expectedSig(scope, reportId, internId) {
  return createHmac("sha256", secret).update(`${scope}:${reportId}:${internId}`).digest("hex").slice(0, 16);
}

function urlsFrom(body) {
  return [...body.matchAll(/href="([^"]+)"/g)].map((match) => match[1].replaceAll("&amp;", "&"));
}

async function liveCheck(label, url, expectedStatus, expectedType) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch(url, { redirect: "manual", signal: controller.signal });
    const contentType = response.headers.get("content-type") ?? "";
    const valid = response.status === expectedStatus && (!expectedType || contentType.includes(expectedType));
    if (!valid) throw new Error(`${label}: received ${response.status} ${contentType}`);
    return { label, status: response.status, contentType, valid };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const all = await prisma.emailQueueItem.findMany({
    where: { status: { in: ["PENDING", "SENT", "FAILED"] } },
    select: { id: true, toEmail: true, status: true, body: true, context: true },
  });
  const queue = all.filter((item) => item.context?.releaseId === RELEASE_ID);
  if (queue.length !== 34 || new Set(queue.map((item) => item.toEmail.toLowerCase())).size !== 34) {
    throw new Error(`Expected 34 unique recipients, found ${queue.length}`);
  }
  if (queue.some((item) => item.status === "FAILED")) throw new Error("A Stage 9 result email failed before validation");
  if (queue.some((item) => /localhost|127\.0\.0\.1/i.test(item.body))) throw new Error("A queued email contains a local URL");

  const outcomeCounts = Object.fromEntries(["FINALIST", "ASSESSED_DEPARTURE", "NO_SUBMISSION"].map((outcome) => [outcome, queue.filter((item) => item.context?.outcome === outcome).length]));
  if (outcomeCounts.FINALIST !== 10 || outcomeCounts.ASSESSED_DEPARTURE !== 23 || outcomeCounts.NO_SUBMISSION !== 1) {
    throw new Error(`Unexpected outcome distribution: ${JSON.stringify(outcomeCounts)}`);
  }

  for (const item of queue) {
    const outcome = item.context.outcome;
    const allUrls = urlsFrom(item.body);
    const linkedInUrl = allUrls.find((url) => url.startsWith("https://www.linkedin.com/profile/add?"));
    const linkedInCredentialUrl = linkedInUrl ? new URL(linkedInUrl).searchParams.get("certUrl") : null;
    const programmeUrls = [
      ...allUrls.filter((url) => url.startsWith(ORIGIN)),
      ...(linkedInCredentialUrl?.startsWith(ORIGIN) ? [linkedInCredentialUrl] : []),
    ];
    if (outcome === "NO_SUBMISSION") {
      if (programmeUrls.length) throw new Error(`Non-submitter ${item.toEmail} received a document URL`);
      continue;
    }
    const reportId = item.context.reportId;
    const report = await prisma.stageReport.findUnique({ where: { id: reportId }, select: { internId: true, status: true } });
    if (!report) throw new Error(`Missing report ${reportId}`);
    if (outcome === "FINALIST" && programmeUrls.some((url) => url.includes("/api/certificate/") || url.includes("/verify/"))) {
      throw new Error(`Finalist ${item.toEmail} received a certificate link`);
    }
    if (outcome === "ASSESSED_DEPARTURE" && !programmeUrls.some((url) => url.includes("/api/certificate/"))) {
      throw new Error(`Assessed departure ${item.toEmail} is missing a certificate link`);
    }
    for (const value of programmeUrls) {
      const url = new URL(value);
      if (url.pathname === "/dashboard/reports") continue;
      const scopeEntry = [...scopes].find(([prefix]) => url.pathname.startsWith(prefix));
      if (!scopeEntry) throw new Error(`Unexpected programme URL in ${item.toEmail}: ${url.pathname}`);
      const [prefix, scope] = scopeEntry;
      const urlReportId = url.pathname.slice(prefix.length);
      if (urlReportId !== reportId) throw new Error(`Report mismatch in ${item.toEmail}`);
      if (url.searchParams.get("sig") !== expectedSig(scope, reportId, report.internId)) {
        throw new Error(`Invalid ${scope} signature in ${item.toEmail}`);
      }
    }
  }

  const finalist = queue.find((item) => item.context?.outcome === "FINALIST");
  const departure = queue.find((item) => item.context?.outcome === "ASSESSED_DEPARTURE");
  const finalistUrls = urlsFrom(finalist.body).filter((url) => url.startsWith(ORIGIN));
  const departureAllUrls = urlsFrom(departure.body);
  const departureUrls = departureAllUrls.filter((url) => url.startsWith(ORIGIN));
  const report = await prisma.stageReport.findUnique({ where: { id: finalist.context.reportId }, select: { internId: true } });
  const blockedCertificate = `${ORIGIN}/api/certificate/${finalist.context.reportId}?sig=${expectedSig("share", finalist.context.reportId, report.internId)}`;
  const checks = [];
  checks.push(await liveCheck("finalist-certificate-blocked", blockedCertificate, 403, "application/json"));
  for (const [label, needle, type] of [
    ["finalist-letter", "/api/pass-letter/", "application/pdf"],
    ["finalist-reference", "/api/reference-letter/", "application/pdf"],
    ["finalist-performance", "/api/performance-record/", "application/pdf"],
    ["finalist-dossier", "/api/portfolio-dossier/", "application/pdf"],
  ]) {
    checks.push(await liveCheck(label, finalistUrls.find((url) => url.includes(needle)), 200, type));
  }
  for (const [label, needle, type] of [
    ["departure-certificate", "/api/certificate/", "application/pdf"],
    ["departure-verification", "/verify/", "text/html"],
    ["departure-letter", "/api/letter/", "application/pdf"],
    ["departure-reference", "/api/reference-letter/", "application/pdf"],
    ["departure-performance", "/api/performance-record/", "application/pdf"],
    ["departure-dossier", "/api/portfolio-dossier/", "application/pdf"],
  ]) {
    const url = needle === "/verify/"
      ? departureAllUrls.find((value) => value.includes("linkedin.com/profile/add"))
      : departureUrls.find((value) => value.includes(needle));
    if (needle === "/verify/") {
      const linkedin = new URL(url);
      checks.push(await liveCheck(label, linkedin.searchParams.get("certUrl"), 200, type));
    } else {
      checks.push(await liveCheck(label, url, 200, type));
    }
  }
  console.log(JSON.stringify({ ready: true, recipients: queue.length, outcomeCounts, signaturesValidated: true, checks }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
