import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const email = "tester@example.com";

  const publicApp = await prisma.publicApplication.findUnique({ where: { email } });
  console.log("PublicApplication:", publicApp ? {
    email: publicApp.email,
    internId: publicApp.internId,
    status: publicApp.status,
    stage: publicApp.stage,
  } : "NOT FOUND");

  const user = await prisma.user.findUnique({
    where: { email },
    include: { intern: true },
  });
  console.log("User:", user ? {
    email: user.email,
    role: user.role,
    intern: user.intern ? {
      currentStage: user.intern.currentStage,
      isActive: user.intern.isActive,
      stageDoorCode: user.intern.stageDoorCode,
    } : null,
  } : "NOT FOUND");

  const byInternId = await prisma.publicApplication.findUnique({
    where: { internId: "UBI-2026-0001" },
  });
  console.log("Lookup by internId UBI-2026-0001:", byInternId ? "FOUND" : "NOT FOUND");
}

main().finally(() => prisma.$disconnect());
