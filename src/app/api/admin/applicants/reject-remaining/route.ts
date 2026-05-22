import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { guardAuthorisedAction } from "@/lib/email-send-guard";
import { logger } from "@/lib/logger";

// One-click close-out: once the cohort is full, reject every applicant still
// undecided ("pending") in a single DB write. Decision-only — like the
// per-applicant review, this does NOT email anyone. The decline emails are
// sent later (and separately) from Decision Emails, where sending is locked to
// the authorised account + 2FA.
//
// This action is destructive at scale, so it is restricted to the authorised
// account and gated by a fresh 2FA code.
//
// GET — how many applicants are still pending (for the button's count).
export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const pending = await prisma.publicApplication.count({ where: { status: "pending" } });
  return Response.json({ pending });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json().catch(() => ({}));
    const blocked = await guardAuthorisedAction(
      session,
      body?.totpCode,
      "Only the authorised account can reject applicants."
    );
    if (blocked) return blocked;

    // Only "pending" (undecided) rows. Approved / queued / waitlisted / already
    // rejected are left untouched. Pending rows have never been emailed, so
    // there is no sent-email guard to honour here.
    const result = await prisma.publicApplication.updateMany({
      where: { status: "pending" },
      data: { status: "rejected" },
    });

    logger.info("reject_remaining", { by: session!.email, rejected: result.count });
    return Response.json({ rejected: result.count });
  } catch (error) {
    logger.error("reject_remaining_failed", error);
    return Response.json({ error: "Something went wrong rejecting the remaining applicants." }, { status: 500 });
  }
}
