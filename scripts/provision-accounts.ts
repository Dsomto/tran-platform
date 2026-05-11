import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";

// Provision admin + grader accounts in bulk. Generates a strong random
// password per account, bcrypt-hashes it, creates or updates the User row,
// and PRINTS the plaintext password to your terminal exactly once. After
// the script exits, the plaintext is gone — store it in a password manager.
//
// 2FA enforcement: the moment any of these users logs in, the admin layout
// bounces them to /setup-2fa because their totpEnabled is false. No code
// here needs to do anything special — the gate is already in place.
//
// Usage:
//   1. Edit the ACCOUNTS array below with real email addresses + names
//   2. Run:   CONFIRM_PROVISION=YES npx tsx scripts/provision-accounts.ts
//   3. Copy each printed line into a password manager and share via a
//      secure channel (1Password share link, Signal, anything but email)
//   4. Tell each new user to log in at /login and set up 2FA when prompted

interface AccountSpec {
  email: string;
  firstName: string;
  lastName: string;
  role: "SUPER_ADMIN" | "GRADER";
}

// EDIT THIS LIST with real values before running.
const ACCOUNTS: AccountSpec[] = [
  // The additional super-admin
  { email: "co-admin@ubuntubridgeinitiatives.org",  firstName: "Co",      lastName: "Admin",   role: "SUPER_ADMIN" },

  // Five graders
  { email: "grader1@ubuntubridgeinitiatives.org",   firstName: "Grader",  lastName: "One",     role: "GRADER" },
  { email: "grader2@ubuntubridgeinitiatives.org",   firstName: "Grader",  lastName: "Two",     role: "GRADER" },
  { email: "grader3@ubuntubridgeinitiatives.org",   firstName: "Grader",  lastName: "Three",   role: "GRADER" },
  { email: "grader4@ubuntubridgeinitiatives.org",   firstName: "Grader",  lastName: "Four",    role: "GRADER" },
  { email: "grader5@ubuntubridgeinitiatives.org",   firstName: "Grader",  lastName: "Five",    role: "GRADER" },
];

// 24-character base64url string — ~144 bits of entropy. Strong enough that
// nobody is brute-forcing this; readable enough that pasting once into a
// password manager isn't painful.
function strongPassword(): string {
  return crypto.randomBytes(18).toString("base64url");
}

async function main() {
  if (process.env.CONFIRM_PROVISION !== "YES") {
    console.error(
      "Refusing to run without CONFIRM_PROVISION=YES.\n" +
        "  CONFIRM_PROVISION=YES npx tsx scripts/provision-accounts.ts\n" +
        "Edit the ACCOUNTS array first."
    );
    process.exit(1);
  }

  console.log("=".repeat(78));
  console.log("PROVISIONING ACCOUNTS — save these immediately, this output is one-shot");
  console.log("=".repeat(78));
  console.log("");

  for (const spec of ACCOUNTS) {
    const email = spec.email.toLowerCase().trim();
    const password = strongPassword();
    const hashed = await bcrypt.hash(password, 12);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          password: hashed,
          role: spec.role,
          firstName: spec.firstName,
          lastName: spec.lastName,
          tokenVersion: { increment: 1 },
          failedLoginCount: 0,
          lockedUntil: null,
          // Force re-enrolment of 2FA: clear any pending secret so they
          // start fresh and the admin layout bounces them to /setup-2fa.
          totpSecret: null,
          totpEnabled: false,
        },
      });
      console.log(`[updated] ${spec.role.padEnd(12)} ${spec.email}`);
    } else {
      await prisma.user.create({
        data: {
          email,
          password: hashed,
          firstName: spec.firstName,
          lastName: spec.lastName,
          role: spec.role,
        },
      });
      console.log(`[created] ${spec.role.padEnd(12)} ${spec.email}`);
    }

    console.log(`          password: ${password}`);
    console.log("");
  }

  console.log("=".repeat(78));
  console.log("Done. Each user will be bounced to /setup-2fa on first login");
  console.log("and must enrol an authenticator app before reaching /admin.");
  console.log("");
  console.log("Now: scroll up, copy each (email, password) pair into your");
  console.log("password manager, then close this terminal so nothing lingers");
  console.log("in scrollback. Share each pair with the human via a secure");
  console.log("channel (1Password share link / Signal / face-to-face).");
  console.log("=".repeat(78));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
