import { PrismaClient } from "@/generated/prisma";
import "./env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Cache the client on globalThis in EVERY environment.
// - Dev: survives Next.js HMR so we don't spawn a fresh client per hot-reload.
// - Production (Vercel): when a serverless lambda is warm-reused for a new
//   request, the module can re-evaluate. Without this cache, each
//   re-evaluation calls `new PrismaClient()` and opens another connection
//   pool against MongoDB Atlas — the classic Flex-tier "max connections"
//   killer. Pinning the client on globalThis keeps the pool count bounded
//   to one per lambda instance, which together with `maxPoolSize=5` on
//   DATABASE_URL keeps cluster connections sane under load.
globalForPrisma.prisma = prisma;
