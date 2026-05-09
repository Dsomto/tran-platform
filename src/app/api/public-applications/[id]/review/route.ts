import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  sendPublicAcceptanceEmail,
  sendPublicRejectionEmail,
  renderPublicAcceptanceEmail,
} from "@/lib/email";
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

      // Send the welcome email synchronously. If the send fails, we persist
      // a FAILED EmailQueueItem row so the admin can see the failure at
      // /admin/emails and retry — instead of the email being lost in the logs.
      logger.info("acceptance_flow_start", { applicationId: id, email: application.email, internId });

      let emailError: string | null = null;
      try {
        await sendPublicAcceptanceEmail(
          application.email,
          application.fullName,
          application.trackInterest,
          internId,
          tempPassword
        );
        logger.info("acceptance_email_ok", { applicationId: id, email: application.email });
      } catch (err) {
        emailError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        logger.error("acceptance_email_failed", err, { email: application.email, internId, emailError });

        // Persist the failure so it shows up in the admin email queue viewer
        // for retry. Stores the rendered body verbatim — retry just resends.
        if (userId) {
          try {
            const { subject, html } = renderPublicAcceptanceEmail({
              fullName: application.fullName,
              trackInterest: application.trackInterest,
              internId,
              tempPassword,
            });
            await prisma.emailQueueItem.create({
              data: {
                userId,
                kind: "GENERAL",
                toEmail: application.email,
                subject,
                body: html,
                status: "FAILED",
                attempts: 1,
                failReason: emailError.slice(0, 500),
                context: { type: "acceptance", applicationId: id, internId },
              },
            });
          } catch (persistErr) {
            logger.error("acceptance_email_persist_failed", persistErr, { applicationId: id });
          }
        }
      }

      return Response.json({
        success: true,
        application: updated,
        emailSent: emailError === null,
        emailError,
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
