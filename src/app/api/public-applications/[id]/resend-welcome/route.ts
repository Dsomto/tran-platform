import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { canSendEmails } from "@/lib/email-permissions";
import { sendPublicAcceptanceEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

// Manual resend of the welcome email for an already-approved applicant.
// Synchronous send — Resend is reliable enough that single attempts deliver.
// Reuses the password we already issued (PublicApplication.loginPassword).
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !canSendEmails(session.email)) {
      return Response.json({ error: "Only the authorised account can send emails." }, { status: 403 });
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

    let emailError: string | null = null;
    try {
      await sendPublicAcceptanceEmail(
        application.email,
        application.fullName,
        application.trackInterest,
        application.internId,
        application.loginPassword
      );
      // Mark the welcome email as delivered so the "Send pending welcome
      // emails" batch never re-queues this applicant later.
      await prisma.publicApplication.update({
        where: { id },
        data: { welcomeEmailSentAt: new Date() },
      });
    } catch (err) {
      emailError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      logger.error("acceptance_email_failed", err, { email: application.email, internId: application.internId, emailError });
    }

    return Response.json({
      ok: emailError === null,
      emailSent: emailError === null,
      emailError,
      sentTo: application.email,
    });
  } catch (error) {
    logger.error("resend_welcome_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
