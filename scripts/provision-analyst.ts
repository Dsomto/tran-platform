import { config } from "dotenv"; config(); config({ path: ".env.local" });
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma";

/**
 * Provision a read-only ANALYST account. The analyst can ONLY see
 * /admin/analytics (enforced in src/app/admin/layout.tsx) — no grading, no PII
 * actions, no DB writes. They will be prompted to set up 2FA on first login.
 *
 *   EMAIL="analyst@x.org" NAME="Data Analyst" COMMIT=1 npx tsx scripts/provision-analyst.ts
 *
 * Without COMMIT=1 it is a dry run. A strong temp password is generated and
 * printed once — share it with the analyst over a secure channel.
 */
const COMMIT = process.env.COMMIT === "1";
const EMAIL = (process.env.EMAIL || "").toLowerCase().trim();
const NAME = process.env.NAME || "Data Analyst";
const PASSWORD = process.env.PASSWORD || randomBytes(9).toString("base64url");

const p = new PrismaClient();

async function withRetry<T>(fn: () => Promise<T>, n = 30): Promise<T> {
  let last: unknown;
  for (let i = 0; i < n; i++) {
    try { return await fn(); } catch (e) { last = e; process.stdout.write(`retry ${i + 1}... `); await new Promise((r) => setTimeout(r, 8000)); }
  }
  throw last;
}

async function main() {
  if (!EMAIL) throw new Error("Set EMAIL=...");
  const [firstName, ...rest] = NAME.split(" ");
  const lastName = rest.join(" ") || "Analyst";

  const existing = await withRetry(() => p.user.findUnique({ where: { email: EMAIL }, select: { id: true, role: true } }));
  console.log(`Mode: ${COMMIT ? "COMMIT" : "DRY RUN"}`);
  console.log(`Email: ${EMAIL}  Name: ${firstName} ${lastName}  Role: ANALYST`);
  if (existing) {
    console.log(`User already exists (role ${existing.role}).`);
    if (!COMMIT) { console.log("Would update role -> ANALYST and reset password."); return; }
    const hash = await bcrypt.hash(PASSWORD, 12);
    await withRetry(() => p.user.update({
      where: { email: EMAIL },
      data: { role: "ANALYST" as never, password: hash, tokenVersion: { increment: 1 }, totpEnabled: false, totpSecret: null },
    }));
    console.log("Updated to ANALYST and reset password.");
  } else {
    if (!COMMIT) { console.log("Would create new ANALYST user."); console.log(`Temp password (on commit): ${PASSWORD}`); return; }
    const hash = await bcrypt.hash(PASSWORD, 12);
    await withRetry(() => p.user.create({
      data: { email: EMAIL, password: hash, firstName, lastName, role: "ANALYST" as never },
    }));
    console.log("Created ANALYST user.");
  }
  console.log("\n──────── SHARE THESE OVER A SECURE CHANNEL ────────");
  console.log(`Login:    ${process.env.PUBLIC_APP_URL || "https://ubuntubridgeinitiatives.org"}/login`);
  console.log(`Email:    ${EMAIL}`);
  console.log(`Password: ${PASSWORD}`);
  console.log("They will be asked to set up 2FA on first login, then land on /admin/analytics.");
}

main().catch((e) => { console.error("FAILED:", (e as Error).message ?? e); process.exit(1); }).finally(() => p.$disconnect());
