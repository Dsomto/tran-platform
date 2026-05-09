import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { renderPublicAcceptanceEmail, sendPublicRejectionEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { nextInternId } from "@/lib/intern-id";
import { onboardApprovedApplicant } from "@/lib/onboard";

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pw = "";
  for (let i = 0; i < 10; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)];
  }
  return pw;
}

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

    if (action === "approved") {
      const internId = await nextInternId();
      const tempPassword = generatePassword();

      const updated = await prisma.publicApplication.update({
        where: { id },
        data: {
          status: "approved",
          stage: 0,
          stageStatus: "active",
          internId,
          loginPassword: tempPassword,
        },
      });

      // Create the backing User + Intern so the applicant can log in.
      let userId: string | null = null;
      try {
        const onboarded = await onboardApprovedApplicant(updated);
        userId = onboarded.userId;
      } catch (err) {
        logger.error("onboarding_failed", err, { applicationId: id, email: application.email });
      }

      // Enqueue the welcome email instead of sending synchronously. The cron
      // at /api/cron/email-drain (hourly) picks it up with up to 3 retries —
      // resilient to the IONOS "Connection closed unexpectedly" TCP drops
      // we were seeing under day-0 rate limiting + Vercel function timeouts.
      logger.info("acceptance_flow_start", { applicationId: id, email: application.email, internId });

      let queuedAt: string | null = null;
      let queueError: string | null = null;
      try {
        if (!userId) throw new Error("No user record — onboarding must have failed");
        const { subject, html } = renderPublicAcceptanceEmail({
          fullName: application.fullName,
          trackInterest: application.trackInterest,
          internId,
          tempPassword,
        });
        const item = await prisma.emailQueueItem.create({
          data: {
            userId,
            kind: "GENERAL",
            toEmail: application.email,
            subject,
            body: html,
            context: {
              type: "acceptance",
              applicationId: id,
              internId,
            },
          },
        });
        queuedAt = item.enqueuedAt.toISOString();
        logger.info("acceptance_email_queued", { applicationId: id, queueItemId: item.id });
      } catch (err) {
        queueError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        logger.error("acceptance_email_queue_failed", err, { applicationId: id, queueError });
      }

      return Response.json({
        success: true,
        application: updated,
        emailQueued: queueError === null,
        queueError,
        queuedAt,
      });
    }

    // Rejected
    const updated = await prisma.publicApplication.update({
      where: { id },
      data: { status: "rejected" },
    });

    try {
      await sendPublicRejectionEmail(application.email, application.fullName);
    } catch (err) {
      logger.error("rejection_email_failed", err, { email: application.email });
    }

    return Response.json({ success: true, application: updated });
  } catch (error) {
    logger.error("review_failed", error);
    return Response.json(
      { error: "Something went wrong processing the review." },
      { status: 500 }
    );
  }
}
