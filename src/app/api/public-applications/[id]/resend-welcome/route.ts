import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendPublicAcceptanceEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

// Manual resend of the welcome email for an already-approved applicant.
// Used when the original send failed silently (spam folder, transient SMTP
// error, mistyped email subsequently corrected). Reuses the password we
// already issued and stored on PublicApplication.loginPassword — does NOT
// generate a new one, so the applicant's existing credential remains valid.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const application = await prisma.publicApplication.findUnique({ where: { id } });
    if (!application) {
      return Response.json({ error: "Application not found" }, { status: 404 });
    }
    if (application.status !== "approved") {
      return Response.json(
        { error: "Application is not approved — only approved applicants get the welcome email." },
        { status: 400 }
      );
    }
    if (!application.internId || !application.loginPassword) {
      return Response.json(
        {
          error:
            "This applicant has no stored credentials. Re-approving them is the cleanest fix; that re-runs the full onboarding.",
        },
        { status: 400 }
      );
    }

    // Build the PDF on the fly so we don't need to persist it.
    let pdfBuffer: Buffer | undefined;
    let pdfError: string | null = null;
    try {
      const { generateAcceptancePDF } = await import("@/lib/generate-letter");
      pdfBuffer = await generateAcceptancePDF(application.fullName, application.trackInterest);
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
        application.internId,
        application.loginPassword,
        pdfBuffer
      );
    } catch (err) {
      emailError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      logger.error("acceptance_email_failed", err, { email: application.email, internId: application.internId, emailError });
    }

    return Response.json({
      ok: emailError === null,
      emailSent: emailError === null,
      emailError,
      pdfError,
      sentTo: application.email,
    });
  } catch (error) {
    logger.error("resend_welcome_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
