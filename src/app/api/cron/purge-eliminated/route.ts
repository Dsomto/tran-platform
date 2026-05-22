import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// Daily purge of eliminated interns.
//
// Elimination sets Intern.isActive = false + eliminatedAt = now (and
// PublicApplication.stageStatus = "eliminated"). Two days after that, this cron
// HARD-DELETES the User account — which cascades to the Intern and all their
// work (submissions, reports, points, stage history, testimonials). It is
// irreversible; every purged account is logged first for audit.
//
// Step 1 (reconcile) heals historical inconsistency: some applicants were
// eliminated (PublicApplication.stageStatus = "eliminated") but their backing
// Intern.isActive was never flipped — usually an email-case mismatch — so they
// still show in staff lists. We match by lower-cased email and flip them,
// stamping eliminatedAt = now so the 2-day clock starts from this heal.
//
// The PublicApplication row is intentionally kept (a minimal audit trail that
// they applied and were eliminated); deleting the User already blocks login.
const GRACE_MS = 2 * 24 * 60 * 60 * 1000;

async function handlePurge(request: NextRequest): Promise<Response> {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      return Response.json({ error: "CRON_SECRET not configured" }, { status: 500 });
    }
    const auth = request.headers.get("authorization") || "";
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Step 1: reconcile ──────────────────────────────────────────────
    // Eliminated applications whose backing intern is still marked active.
    const eliminatedApps = await prisma.publicApplication.findMany({
      where: { stageStatus: "eliminated" },
      select: { email: true },
    });
    const emails = [...new Set(eliminatedApps.map((a) => a.email.toLowerCase().trim()))];

    let reconciled = 0;
    if (emails.length > 0) {
      const users = await prisma.user.findMany({
        where: { email: { in: emails }, role: "INTERN" },
        select: { intern: { select: { id: true, isActive: true } } },
      });
      const staleInternIds = users
        .map((u) => u.intern)
        .filter((i): i is { id: string; isActive: boolean } => !!i && i.isActive)
        .map((i) => i.id);
      if (staleInternIds.length > 0) {
        const res = await prisma.intern.updateMany({
          where: { id: { in: staleInternIds } },
          data: { isActive: false, eliminatedAt: new Date() },
        });
        reconciled = res.count;
      }
    }

    // ── Step 2: purge ──────────────────────────────────────────────────
    const cutoff = new Date(Date.now() - GRACE_MS);
    const duePurge = await prisma.intern.findMany({
      where: { isActive: false, eliminatedAt: { lte: cutoff } },
      select: { id: true, userId: true, user: { select: { email: true } } },
      take: 500,
    });

    let purged = 0;
    for (const intern of duePurge) {
      try {
        // Deleting the User cascades to the Intern and all their work.
        await prisma.user.delete({ where: { id: intern.userId } });
        logger.info("purge_eliminated", { internId: intern.id, email: intern.user?.email });
        purged++;
      } catch (err) {
        logger.error("purge_eliminated_row_failed", err, { internId: intern.id });
      }
    }

    return Response.json({ reconciled, purged, dueFound: duePurge.length });
  } catch (error) {
    logger.error("purge_eliminated_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handlePurge(request);
}
export async function POST(request: NextRequest) {
  return handlePurge(request);
}

export const maxDuration = 300;
