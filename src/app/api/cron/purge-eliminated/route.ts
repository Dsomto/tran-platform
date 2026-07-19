import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { ELIMINATION_GRACE_MS } from "@/lib/elimination-grace";

// Daily archival of eliminated interns.
//
// Elimination sets Intern.isActive = false + eliminatedAt = now (and
// PublicApplication.stageStatus = "eliminated"). The intern keeps read-only
// dashboard access for the grace window (ELIMINATION_GRACE_MS); after it, this
// cron revokes the account sessions and marks the intern archived. Historical
// work remains available for results, audits, and grading review.
//
// Step 1 (reconcile) heals historical inconsistency: some applicants were
// eliminated (PublicApplication.stageStatus = "eliminated") but their backing
// Intern.isActive was never flipped — usually an email-case mismatch — so they
// still show in staff lists. We match by lower-cased email and flip them,
// stamping eliminatedAt = now so the 2-day clock starts from this heal.
//
// The PublicApplication row remains the durable intake ledger. Login is blocked
// by the eliminated status, and tokenVersion invalidates existing sessions.
const GRACE_MS = ELIMINATION_GRACE_MS;

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

    // ── Step 2: archive and revoke sessions ────────────────────────────
    const cutoff = new Date(Date.now() - GRACE_MS);
    const dueArchive = await prisma.intern.findMany({
      where: {
        isActive: false,
        eliminatedAt: { lte: cutoff },
        OR: [{ archivedAt: null }, { archivedAt: { isSet: false } }],
      },
      select: { id: true, userId: true, user: { select: { email: true } } },
      take: 500,
    });

    let archived = 0;
    for (const intern of dueArchive) {
      try {
        const archivedAt = new Date();
        await prisma.$transaction([
          prisma.user.update({
            where: { id: intern.userId },
            data: { tokenVersion: { increment: 1 } },
          }),
          prisma.intern.update({
            where: { id: intern.id },
            data: { archivedAt, stageDoorCode: null },
          }),
        ]);
        logger.info("archive_eliminated", {
          internId: intern.id,
          email: intern.user?.email,
          archivedAt: archivedAt.toISOString(),
        });
        archived++;
      } catch (err) {
        logger.error("archive_eliminated_row_failed", err, { internId: intern.id });
      }
    }

    return Response.json({
      reconciled,
      archived,
      dueFound: dueArchive.length,
      purged: 0,
    });
  } catch (error) {
    logger.error("archive_eliminated_failed", error);
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
