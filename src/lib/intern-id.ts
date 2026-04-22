import { prisma } from "./db";

/**
 * Atomically allocate the next intern ID for the given calendar year.
 *
 * Year defaults to the current year. Counter docs are keyed per-year, so
 * numbering restarts each January (e.g. UBI-2026-0001). Prisma's atomic
 * `{ increment: 1 }` serializes allocation at the DB layer.
 */
export async function nextInternId(year: number = new Date().getFullYear()): Promise<string> {
  const counterId = `internId:${year}`;
  const counter = await prisma.counter.upsert({
    where: { id: counterId },
    create: { id: counterId, value: 1 },
    update: { value: { increment: 1 } },
  });
  return `UBI-${year}-${String(counter.value).padStart(4, "0")}`;
}
