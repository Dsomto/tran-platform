import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/logger";

// One-off: for every Intern whose stageDoorCode is null, look up their email
// in PublicApplication and copy loginPassword over. This is the field the
// per-stage door login verifies against.
//
// POST /api/admin/interns/backfill-door-codes
export async function POST() {
  try {
    await requireAdmin();

    const interns = await prisma.intern.findMany({
      where: { stageDoorCode: null, isActive: true },
      include: { user: { select: { email: true } } },
    });

    let patched = 0;
    let skipped = 0;
    const unresolved: string[] = [];

    for (const intern of interns) {
      const app = await prisma.publicApplication.findFirst({
        where: { email: intern.user.email.toLowerCase() },
      });
      if (!app?.loginPassword) {
        unresolved.push(intern.user.email);
        skipped++;
        continue;
      }
      await prisma.intern.update({
        where: { id: intern.id },
        data: { stageDoorCode: app.loginPassword },
      });
      patched++;
    }

    return Response.json({
      totalCandidates: interns.length,
      patched,
      skipped,
      unresolved,
    });
  } catch (error) {
    logger.error("backfill_door_codes_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
