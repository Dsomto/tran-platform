import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/index.js";

config({ quiet: true });
config({ path: ".env.local", override: true, quiet: true });

const prisma = new PrismaClient();
const RELEASE_ID = "cohort-one-closing-ceremony-2026-11-14";
const FROM = "Somto from UBI <noreply@ubuntubridgeinitiatives.org>";
const EXPECTED_RECIPIENTS = 506;
const INTERVAL_MS = 1100;
const LOCK_REFRESH_MS = 60_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function belongsToRelease(context: unknown): boolean {
  return Boolean(
    context &&
      typeof context === "object" &&
      !Array.isArray(context) &&
      (context as Record<string, unknown>).releaseId === RELEASE_ID,
  );
}

function statusCounts(rows: Array<{ status: string }>): Record<string, number> {
  return rows.reduce<Record<string, number>>((counts, row) => {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
    return counts;
  }, {});
}

async function main(): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY || process.env.api_key;
  if (!apiKey) throw new Error("Resend API key is not configured.");

  const all = await prisma.emailQueueItem.findMany({
    where: { status: { in: ["PENDING", "SENT", "FAILED"] } },
    orderBy: { enqueuedAt: "asc" },
  });
  const release = all.filter((item) => belongsToRelease(item.context));
  if (release.length !== EXPECTED_RECIPIENTS) {
    throw new Error(`Expected ${EXPECTED_RECIPIENTS} campaign rows; found ${release.length}.`);
  }
  if (new Set(release.map((item) => item.toEmail.toLowerCase())).size !== EXPECTED_RECIPIENTS) {
    throw new Error("Campaign contains duplicate recipients.");
  }

  const pending = release.filter((item) => item.status === "PENDING");
  if (!pending.length) {
    console.log(JSON.stringify({ sentThisRun: 0, statuses: statusCounts(release), note: "No campaign emails remain pending." }, null, 2));
    return;
  }
  if (pending.some((item) => item.lockedAt)) {
    throw new Error("At least one campaign email is already leased by another sender; refusing an overlapping delivery run.");
  }

  const pendingIds = pending.map((item) => item.id);
  const claimed = await prisma.emailQueueItem.updateMany({
    where: {
      id: { in: pendingIds },
      status: "PENDING",
      OR: [{ lockedAt: null }, { lockedAt: { isSet: false } }],
    },
    data: { lockedAt: new Date() },
  });
  if (claimed.count !== pendingIds.length) {
    throw new Error(`Claimed ${claimed.count} of ${pendingIds.length}; another sender changed the queue.`);
  }

  let sent = 0;
  let failed = 0;
  let lastLockRefresh = Date.now();

  for (let index = 0; index < pending.length; index += 1) {
    const item = pending[index];
    if (index > 0) await sleep(INTERVAL_MS);

    if (Date.now() - lastLockRefresh >= LOCK_REFRESH_MS) {
      await prisma.emailQueueItem.updateMany({
        where: { id: { in: pending.slice(index).map((row) => row.id) }, status: "PENDING" },
        data: { lockedAt: new Date() },
      });
      lastLockRefresh = Date.now();
    }

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
      sent += 1;
      if (sent % 25 === 0 || sent === pending.length) console.log(`sent ${sent}/${pending.length}`);
    } catch (error) {
      const reason = `${error instanceof Error ? error.name : "Error"}: ${error instanceof Error ? error.message : String(error)}`.slice(0, 500);
      const attempts = item.attempts + 1;
      await prisma.emailQueueItem.update({
        where: { id: item.id },
        data: { status: attempts >= 3 ? "FAILED" : "PENDING", attempts, failReason: reason, lockedAt: null },
      });
      failed += 1;
      console.error(`failed ${item.toEmail}: ${reason}`);
    }
  }

  await prisma.emailQueueItem.updateMany({
    where: { id: { in: pendingIds }, status: "PENDING" },
    data: { lockedAt: null },
  });

  const after = await prisma.emailQueueItem.findMany({
    where: { status: { in: ["PENDING", "SENT", "FAILED"] } },
    select: { status: true, context: true },
  });
  const finalRelease = after.filter((item) => belongsToRelease(item.context));
  console.log(JSON.stringify({ sentThisRun: sent, failedThisRun: failed, statuses: statusCounts(finalRelease) }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
