import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

// READ-ONLY diagnostic for the email queue. No writes. Mirrors the exact
// claimability logic the email-drain cron uses, so we can see why the cron
// reports "No claimable rows" while PENDING rows exist.

const prisma = new PrismaClient();

async function main() {
  const STALE_MS = 5 * 60 * 1000;
  const now = Date.now();
  const staleCutoff = new Date(now - STALE_MS);

  const byStatus = await prisma.emailQueueItem.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  console.log("=== EmailQueueItem by status ===");
  for (const r of byStatus) console.log(" ", r.status, "->", r._count._all);

  const pendingTotal = await prisma.emailQueueItem.count({ where: { status: "PENDING" } });
  const pendingUnlocked = await prisma.emailQueueItem.count({
    where: { status: "PENDING", lockedAt: null },
  });
  const pendingStale = await prisma.emailQueueItem.count({
    where: { status: "PENDING", lockedAt: { lt: staleCutoff } },
  });
  const pendingFresh = await prisma.emailQueueItem.count({
    where: { status: "PENDING", lockedAt: { gte: staleCutoff } },
  });
  // Exact query the cron's candidates step runs:
  const claimable = await prisma.emailQueueItem.count({
    where: {
      status: "PENDING",
      OR: [{ lockedAt: null }, { lockedAt: { lt: staleCutoff } }],
    },
  });

  console.log("\n=== PENDING lock breakdown ===");
  console.log(" total PENDING:                 ", pendingTotal);
  console.log(" lockedAt = null (claimable):   ", pendingUnlocked);
  console.log(" lockedAt OLDER than 5m (stale): ", pendingStale);
  console.log(" lockedAt WITHIN 5m (fresh-lock):", pendingFresh);
  console.log(" => CLAIMABLE by the cron query: ", claimable);

  const oldest = await prisma.emailQueueItem.findFirst({
    where: { status: "PENDING", lockedAt: { not: null } },
    orderBy: { lockedAt: "asc" },
    select: { lockedAt: true },
  });
  const newest = await prisma.emailQueueItem.findFirst({
    where: { status: "PENDING", lockedAt: { not: null } },
    orderBy: { lockedAt: "desc" },
    select: { lockedAt: true },
  });
  console.log("\n=== lock timestamps (PENDING, locked) ===");
  console.log(" server now:        ", new Date(now).toISOString());
  if (oldest?.lockedAt) {
    const age = Math.round((now - oldest.lockedAt.getTime()) / 1000);
    console.log(" oldest lockedAt:   ", oldest.lockedAt.toISOString(), `(${age}s ago)`);
  }
  if (newest?.lockedAt) {
    const age = Math.round((now - newest.lockedAt.getTime()) / 1000);
    console.log(" newest lockedAt:   ", newest.lockedAt.toISOString(), `(${age}s ago)`);
  }

  const sample = await prisma.emailQueueItem.findMany({
    where: { status: "PENDING" },
    orderBy: { enqueuedAt: "asc" },
    take: 8,
    select: {
      id: true,
      kind: true,
      lockedAt: true,
      attempts: true,
      enqueuedAt: true,
      failReason: true,
    },
  });
  console.log("\n=== sample PENDING rows (oldest first) ===");
  for (const s of sample) {
    console.log(
      ` ${s.id} | kind=${s.kind} | attempts=${s.attempts} | lockedAt=${
        s.lockedAt ? s.lockedAt.toISOString() : "null"
      } | failReason=${s.failReason ?? "-"}`
    );
  }
}

main().finally(() => prisma.$disconnect());
