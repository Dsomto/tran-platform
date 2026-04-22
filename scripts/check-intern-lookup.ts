import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const code = "UBI-2026-0001";

  const total = await prisma.publicApplication.count();
  console.log("Total PublicApplications:", total);

  const all = await prisma.publicApplication.findMany({
    select: { email: true, internId: true, status: true },
  });
  console.log("All records:", JSON.stringify(all, null, 2));

  const byUnique = await prisma.publicApplication.findUnique({ where: { internId: code } });
  console.log("findUnique by internId:", byUnique ? "FOUND" : "NULL");

  const byFirst = await prisma.publicApplication.findFirst({ where: { internId: code } });
  console.log("findFirst by internId:", byFirst ? "FOUND" : "NULL");

  const byRegex = await prisma.publicApplication.findFirst({
    where: { internId: { equals: code } },
  });
  console.log("findFirst equals:", byRegex ? "FOUND" : "NULL");
}

main().finally(() => prisma.$disconnect());
