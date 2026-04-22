/**
 * Bootstrap, update, or replace the admin user.
 *
 * Usage:
 *   ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="..." npx tsx scripts/create-admin.ts
 *
 * Behaviour:
 *   - Creates (or updates) a SUPER_ADMIN with the given email + password.
 *   - Also removes the default seeded admin `admin@tran.io` if one exists
 *     (so there's only one admin going forward).
 *   - Safe to re-run.
 *   - Never commits the password anywhere — only reads it from env.
 */

import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DEFAULT_SEEDED_ADMIN = "admin@tran.io";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const firstName = process.env.ADMIN_FIRST_NAME ?? "Somto";
  const lastName = process.env.ADMIN_LAST_NAME ?? "Okoma";

  if (!email || !password) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD env vars are required.");
    process.exit(1);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("ADMIN_EMAIL is not a valid email.");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { password: hash, role: "SUPER_ADMIN", firstName, lastName },
    });
    console.log(`✓ Updated ${email} — role: SUPER_ADMIN, password rotated.`);
  } else {
    await prisma.user.create({
      data: { email, password: hash, firstName, lastName, role: "SUPER_ADMIN" },
    });
    console.log(`✓ Created SUPER_ADMIN: ${email}`);
  }

  // Remove the default seeded admin unless the operator IS that account.
  if (email !== DEFAULT_SEEDED_ADMIN) {
    const seeded = await prisma.user.findUnique({ where: { email: DEFAULT_SEEDED_ADMIN } });
    if (seeded) {
      await prisma.user.delete({ where: { email: DEFAULT_SEEDED_ADMIN } });
      console.log(`✓ Removed default seeded admin (${DEFAULT_SEEDED_ADMIN}).`);
    }
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
