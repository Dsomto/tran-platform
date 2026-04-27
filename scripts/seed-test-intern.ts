import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const internCode = "UBI-2026-0001";
  const email = "tester@example.com";
  const accountPassword = "tester123456";
  const stageDoorCode = "swift-panther-42";

  const hashed = await bcrypt.hash(accountPassword, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { firstName: "Test", lastName: "Tester", password: hashed, role: "INTERN" },
    create: {
      email,
      password: hashed,
      firstName: "Test",
      lastName: "Tester",
      role: "INTERN",
    },
  });

  await prisma.publicApplication.upsert({
    where: { email },
    update: { internId: internCode, status: "approved", stage: 4, stageStatus: "active" },
    create: {
      fullName: "Test Tester",
      email,
      country: "Nigeria",
      ageRange: "22-25",
      currentStatus: "student",
      experience: "Demo account",
      trackInterest: "ETHICAL_HACKING",
      dedication: "20 hrs/week",
      goals: "Test the stage rooms end-to-end.",
      status: "approved",
      stage: 4,
      stageStatus: "active",
      internId: internCode,
      loginPassword: accountPassword,
    },
  });

  await prisma.intern.upsert({
    where: { userId: user.id },
    update: {
      currentStage: "STAGE_4",
      isActive: true,
      stageDoorCode,
    },
    create: {
      userId: user.id,
      track: "ETHICAL_HACKING",
      currentStage: "STAGE_4",
      isActive: true,
      stageDoorCode,
      points: 0,
    },
  });

  console.log("");
  console.log("  DUMMY TEST CREDENTIALS");
  console.log("  ---------------------");
  console.log("  Intern ID:           ", internCode);
  console.log("  Stage-door password: ", stageDoorCode);
  console.log("");
  console.log("  Encode per stage:");
  console.log("    stage-0:  swift-panther-42");
  console.log("    stage-1:  c3dpZnQtcGFudGhlci00Mg==");
  console.log("    stage-2:  01110011 01110111 01101001 01100110 01110100 00101101 01110000 01100001 01101110 01110100 01101000 01100101 01110010 00101101 00110100 00110010");
  console.log("    stage-3:  73776966742d70616e746865722d3432");
  console.log("    stage-4:  (ROT13 then base64)");
  console.log("");
  console.log("  Dashboard login (for /login page):");
  console.log("    email:    ", email);
  console.log("    password: ", accountPassword);
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
