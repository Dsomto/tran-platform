import { prisma } from "../src/lib/db";
import bcrypt from "bcryptjs";

// Set or reset a SUPER_ADMIN's password. Use when you've forgotten your admin
// login or need to provision a fresh super-admin on a clean database.
//
// Run:
//   npx tsx scripts/set-admin-password.ts <email> <new-password> [firstName] [lastName]
//
// If the email exists -> upgrade role to SUPER_ADMIN, set the new password,
// bump tokenVersion to invalidate any existing sessions.
// If the email does not exist -> create a fresh SUPER_ADMIN with that email.
async function main() {
  const [email, newPassword, firstNameArg, lastNameArg] = process.argv.slice(2);

  if (!email || !newPassword) {
    console.error(
      "Usage: npx tsx scripts/set-admin-password.ts <email> <new-password> [firstName] [lastName]"
    );
    process.exit(1);
  }
  if (newPassword.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(1);
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  const normalized = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        password: hashed,
        role: "SUPER_ADMIN",
        // Bump tokenVersion to revoke any active sessions issued before reset.
        tokenVersion: { increment: 1 },
        // Clear any lockout state so the new password works immediately.
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });
    console.log(`Updated existing user. email=${normalized} role=SUPER_ADMIN`);
    console.log(`Old sessions invalidated (tokenVersion bumped).`);
    return;
  }

  await prisma.user.create({
    data: {
      email: normalized,
      password: hashed,
      firstName: firstNameArg || "Admin",
      lastName: lastNameArg || "User",
      role: "SUPER_ADMIN",
    },
  });
  console.log(`Created new SUPER_ADMIN. email=${normalized}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
