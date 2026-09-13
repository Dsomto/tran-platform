import { config } from "dotenv";
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
const FROM = "Somto from UBI <noreply@ubuntubridgeinitiatives.org>";
const INTERVAL_MS = 1100;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const apiKey = process.env.RESEND_API_KEY || process.env.api_key;
  if (!apiKey) throw new Error("Resend API key is not configured");
  const all = await prisma.emailQueueItem.findMany({
    where: { status: { in: ["PENDING", "SENT", "FAILED"] } },
    orderBy: { enqueuedAt: "asc" },
  });
  const release = all.filter((item) => item.context?.releaseId === RELEASE_ID);
  if (release.length !== 34 || new Set(release.map((item) => item.toEmail.toLowerCase())).size !== 34) {
    throw new Error(`Expected 34 unique release recipients, found ${release.length}`);
  }
  const pending = release.filter((item) => item.status === "PENDING" && !item.lockedAt);
  if (!pending.length) {
    console.log(JSON.stringify({ sentThisRun: 0, release: counts(release), note: "No unlocked Stage 9 result emails remain" }, null, 2));
    return;
  }
  const leaseAt = new Date();
  const ids = pending.map((item) => item.id);
  const claimed = await prisma.emailQueueItem.updateMany({
    where: { id: { in: ids }, status: "PENDING", OR: [{ lockedAt: null }, { lockedAt: { isSet: false } }] },
    data: { lockedAt: leaseAt },
  });
  if (claimed.count !== ids.length) throw new Error(`Claimed ${claimed.count} of ${ids.length}; another sender changed the queue`);

  let sent = 0;
  let failed = 0;
  for (let index = 0; index < pending.length; index++) {
    const item = pending[index];
    if (index > 0) await sleep(INTERVAL_MS);
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM, to: [item.toEmail], subject: item.subject, html: item.body }),
      });
      const responseBody = await response.text();
      if (!response.ok) throw new Error(`Resend ${response.status}: ${responseBody.slice(0, 400)}`);
      await prisma.emailQueueItem.update({
        where: { id: item.id },
        data: { status: "SENT", sentAt: new Date(), attempts: item.attempts + 1, failReason: null, lockedAt: null },
      });
      sent++;
      console.log(`sent ${sent}/${pending.length}: ${item.toEmail}`);
    } catch (error) {
      const reason = `${error?.name ?? "Error"}: ${error?.message ?? String(error)}`.slice(0, 500);
      await prisma.emailQueueItem.update({
        where: { id: item.id },
        data: { status: item.attempts + 1 >= 3 ? "FAILED" : "PENDING", attempts: item.attempts + 1, failReason: reason, lockedAt: null },
      });
      failed++;
      console.error(`failed ${item.toEmail}: ${reason}`);
    }
  }
  await prisma.emailQueueItem.updateMany({ where: { id: { in: ids }, status: "PENDING" }, data: { lockedAt: null } });
  const after = await prisma.emailQueueItem.findMany({ where: { status: { in: ["PENDING", "SENT", "FAILED"] } }, select: { status: true, context: true } });
  const finalRelease = after.filter((item) => item.context?.releaseId === RELEASE_ID);
  console.log(JSON.stringify({ sentThisRun: sent, failedThisRun: failed, release: counts(finalRelease) }, null, 2));
}

function counts(rows) {
  return {
    sent: rows.filter((item) => item.status === "SENT").length,
    pending: rows.filter((item) => item.status === "PENDING").length,
    failed: rows.filter((item) => item.status === "FAILED").length,
  };
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
