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

    if (!action || !["approved", "rejected", "waitlisted"].includes(action)) {
      return Response.json(
        { error: "Invalid action. Must be 'approved', 'rejected' or 'waitlisted'." },
        { status: 400 }
      );
    }

    const application = await prisma.publicApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return Response.json({ error: "Application not found" }, { status: 404 });
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
    const desired =
      action === "approved"
        ? "queued_approved"
        : action === "waitlisted"
        ? "waitlisted"
        : "rejected";

    if (application.status === desired) {
      return Response.json({ success: true, status: desired, unchanged: true });
    }

    // Once a decision email has gone out, the decision is final here — the
    // applicant has already been told. Approved-and-onboarded likewise.
    if (application.status === "approved") {
      return Response.json(
        { error: "This applicant has already been onboarded — their decision can't be changed here." },
        { status: 400 }
      );
    }
    if (application.welcomeEmailSentAt || application.rejectionEmailSentAt) {
      return Response.json(
        { error: "A decision email has already been sent — the decision can no longer be changed." },
        { status: 400 }
      );
    }

    // Allowed source states: a fresh "pending" application, or a flip between
    // the not-yet-emailed decisions (queued_approved ⇄ rejected ⇄ waitlisted).
    if (!["pending", "queued_approved", "rejected", "waitlisted"].includes(application.status)) {
      return Response.json(
        { error: "This applicant's decision cannot be changed." },
        { status: 400 }
      );
    }

    // Conditional claim on the CURRENT status, so two admins acting on the
    // same applicant at once can't overwrite each other — the first write
    // wins, the second sees the row already moved.
    const claim = await prisma.publicApplication.updateMany({
      where: { id, status: application.status },
      data: { status: desired },
    });
    if (claim.count === 0) {
      return Response.json(
        { error: "This applicant was just updated by someone else — reload and try again." },
        { status: 409 }
      );
    }

    return Response.json({ success: true, status: desired, emailPending: true });
  } catch (error) {
    logger.error("review_failed", error);
    return Response.json(
      { error: "Something went wrong processing the review." },
      { status: 500 }
    );
  }
}
