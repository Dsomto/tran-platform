import { config } from "dotenv"; config(); config({ path: ".env.local" });
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { PrismaClient } from "../src/generated/prisma";

/**
 * Generate one no-login feedback invite per intern (active AND eliminated), then
 * write a CSV of name,email,link for a mail-merge. Idempotent: only creates
 * invites for people who don't already have one. Mirrors the admin
 * /admin/feedback-invites "Generate" action so either path is safe to use.
 *
 *   npx tsx scripts/generate-feedback-invites.ts            # DRY RUN (counts only)
 *   COMMIT=1 npx tsx scripts/generate-feedback-invites.ts   # create + write CSV
 *
 * Output CSV: marking-guides/feedback-invites.csv  (kept local, not committed)
 */
const COMMIT = process.env.COMMIT === "1";
const ORIGIN = (process.env.PUBLIC_APP_URL || "https://ubuntubridgeinitiatives.org").replace(/\/$/, "");
const OUT = process.env.OUT || "marking-guides/feedback-invites.csv";
const stageNum = (s: string) => Number(String(s).replace("STAGE_", ""));

const p = new PrismaClient();
async function withRetry<T>(fn: () => Promise<T>, n = 30): Promise<T> {
  let last: unknown;
  for (let i = 0; i < n; i++) {
    try { return await fn(); } catch (e) { last = e; process.stdout.write(`retry ${i + 1}... `); await new Promise((r) => setTimeout(r, 8000)); }
  }
  throw last;
}

async function main() {
  const interns = await withRetry(() => p.intern.findMany({
    include: { user: { select: { email: true, firstName: true, lastName: true } } },
  }));
  const existing = await withRetry(() => p.feedbackInvite.findMany({ select: { email: true } }));
  const have = new Set(existing.map((i) => i.email.toLowerCase()));

  const toCreate = interns.filter((i) => !have.has(i.user.email.toLowerCase()));
  console.log(`Mode: ${COMMIT ? "COMMIT" : "DRY RUN"}`);
  console.log(`Interns: ${interns.length}  Existing invites: ${have.size}  New to create: ${toCreate.length}`);

  if (!COMMIT) { console.log("Dry run only. Re-run with COMMIT=1 to create invites + write CSV."); return; }

  let created = 0;
  for (const intern of toCreate) {
    const outcome = intern.finalist ? "finalist" : intern.isActive ? "active" : "eliminated";
    await withRetry(() => p.feedbackInvite.create({
      data: {
        token: randomBytes(18).toString("base64url"),
        email: intern.user.email.toLowerCase(),
        name: `${intern.user.firstName} ${intern.user.lastName}`.trim() || null,
        lastStage: stageNum(intern.currentStage as unknown as string),
        outcome,
        track: intern.track as unknown as string,
      },
    }));
    created++;
  }

  // Re-read all invites and write the mail-merge CSV.
  const all = await withRetry(() => p.feedbackInvite.findMany({
    orderBy: { createdAt: "asc" },
    select: { token: true, email: true, name: true, outcome: true, sentAt: true, respondedAt: true },
  }));
  const rows = all.map((i) =>
    [
      `"${(i.name ?? "").replace(/"/g, "'")}"`,
      i.email,
      i.outcome ?? "",
      i.sentAt ? "yes" : "no",
      i.respondedAt ? "yes" : "no",
      `${ORIGIN}/feedback/${i.token}`,
    ].join(",")
  );
  writeFileSync(OUT, "name,email,outcome,sent,responded,link\n" + rows.join("\n") + "\n");
  console.log(`Created ${created} new invite(s). Wrote ${all.length} rows to ${OUT}.`);
}

main().catch((e) => { console.error("FAILED:", (e as Error).message ?? e); process.exit(1); }).finally(() => p.$disconnect());
