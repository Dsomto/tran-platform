import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma";
import { hashPassword } from "../src/lib/auth";

/**
 * One-off: provision a sixth grader account that the batch-grading flow
 * attributes its grades to. The account looks identical to the existing
 * grader1..5@ubuntubridgeinitiatives.org seeds — same email pattern, same
 * shape, role=GRADER. It exists so the system's grade-row writes have a
 * real graderId on them; nothing about the account surfaces "AI" or
 * "automated" anywhere in the intern- or peer-grader-facing UI.
 *
 * The account never logs in interactively; the password is a long random
 * string we discard. If you ever need to log in as it, reset via the
 * normal forgot-password flow (it has an email like the others) or rerun
 * this script with COMMIT=1 — re-runs are no-ops on the User row but will
 * print the userId for reference.
 *
 * USAGE:
 *
 *   # Inspect (no writes):
 *   npx tsx scripts/provision-batch-grader.ts
 *
 *   # Commit:
 *   COMMIT=1 npx tsx scripts/provision-batch-grader.ts
 */

const prisma = new PrismaClient();
const COMMIT = process.env.COMMIT === "1";
const EMAIL = "grader6@ubuntubridgeinitiatives.org";

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: EMAIL },
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  });

  if (existing) {
    console.log("Grader6 already exists — idempotent no-op.");
    console.log(`  userId: ${existing.id}`);
    console.log(`  email:  ${existing.email}`);
    console.log(`  name:   ${existing.firstName} ${existing.lastName}`);
    console.log(`  role:   ${existing.role}`);
    return;
  }

  console.log("Will create:");
  console.log(`  email:    ${EMAIL}`);
  console.log(`  name:     Grader Six`);
  console.log(`  role:     GRADER`);
  console.log(`  password: <random 32-byte hex, discarded>`);

  if (!COMMIT) {
    console.log("\nMode: INSPECT. Re-run with COMMIT=1 to actually create.");
    return;
  }

  const password = randomBytes(32).toString("hex");
  const hashed = await hashPassword(password);
  const created = await prisma.user.create({
    data: {
      email: EMAIL,
      firstName: "Grader",
      lastName: "Six",
      role: "GRADER",
      password: hashed,
      totpEnabled: false,
    },
    select: { id: true, email: true, role: true },
  });
  console.log("\n✓ Created.");
  console.log(`  userId: ${created.id}`);
  console.log(`  email:  ${created.email}`);
  console.log(`  role:   ${created.role}`);
  console.log("\nThe ai-grade-batch script will look this account up by email.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
