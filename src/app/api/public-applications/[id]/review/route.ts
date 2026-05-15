import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { action } = await request.json();

    if (!action || !["approved", "rejected"].includes(action)) {
      return Response.json(
        { error: "Invalid action. Must be 'approved' or 'rejected'." },
        { status: 400 }
      );
    }

    const application = await prisma.publicApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return Response.json({ error: "Application not found" }, { status: 404 });
    }

    if (application.status !== "pending") {
      return Response.json(
        { error: "Application has already been reviewed." },
        { status: 400 }
      );
    }

    // Decision only — nothing is committed here.
    //
    // Approving does NOT create an intern account or assign a UBI ID. The
    // applicant is parked in the "queued_approved" pending list. The intern
    // account is minted later, when the welcome email is actually sent
    // (see /api/admin/applicants/send-pending → enqueueWelcome). That is the
    // single commit point — until then the applicant is neither an "approved"
    // applicant nor an intern, just a pending decision.
    //
    // Rejecting likewise only records the decision; the decline email goes out
    // in a batch from the same place.
    const status = action === "approved" ? "queued_approved" : "rejected";

    // Conditional claim: the write only lands if the row is STILL "pending",
    // so two admins deciding the same applicant at the same moment can't
    // overwrite each other — the first decision wins, the second gets the
    // "already reviewed" response.
    const claim = await prisma.publicApplication.updateMany({
      where: { id, status: "pending" },
      data: { status },
    });
    if (claim.count === 0) {
      return Response.json(
        { error: "Application has already been reviewed." },
        { status: 400 }
      );
    }

    return Response.json({ success: true, emailPending: true });
  } catch (error) {
    logger.error("review_failed", error);
    return Response.json(
      { error: "Something went wrong processing the review." },
      { status: 500 }
    );
  }
}
