import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendPublicAcceptanceEmail, sendPublicRejectionEmail } from "@/lib/email";
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
      try {
        await onboardApprovedApplicant(updated);
      } catch (err) {
        logger.error("onboarding_failed", err, { applicationId: id, email: application.email });
      }

      // Send the email synchronously and surface failure to the admin. The
      // welcome email carries the temp password — silently dropping it on
      // SMTP failure would lock the applicant out, so we tell the admin.
      logger.info("acceptance_flow_start", { applicationId: id, email: application.email, internId });

      let pdfBuffer: Buffer | undefined;
      let pdfError: string | null = null;
      try {
        const { generateAcceptancePDF } = await import("@/lib/generate-letter");
        pdfBuffer = await generateAcceptancePDF(application.fullName, application.trackInterest);
        logger.info("acceptance_pdf_ok", { applicationId: id, bytes: pdfBuffer.length });
      } catch (err) {
        pdfError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        logger.error("acceptance_pdf_generation_failed", err, { applicationId: id, pdfError });
      }

      let emailError: string | null = null;
      try {
        await sendPublicAcceptanceEmail(
          application.email,
          application.fullName,
          application.trackInterest,
          internId,
          tempPassword,
          pdfBuffer
        );
        logger.info("acceptance_email_ok", { applicationId: id, email: application.email });
      } catch (err) {
        emailError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        logger.error("acceptance_email_failed", err, { email: application.email, internId, emailError });
      }

      return Response.json({
        success: true,
        application: updated,
        emailSent: emailError === null,
        emailError,
        pdfError,
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
