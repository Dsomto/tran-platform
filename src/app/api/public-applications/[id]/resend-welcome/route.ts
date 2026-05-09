import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { renderPublicAcceptanceEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

// Manual resend of the welcome email for an already-approved applicant.
// Used when the original send failed silently (spam folder, transient SMTP
// error, mistyped email subsequently corrected). Reuses the password we
// already issued and stored on PublicApplication.loginPassword — does NOT
// generate a new one, so the applicant's existing credential remains valid.
//
// Enqueues into EmailQueueItem rather than sending synchronously so a
// transient IONOS connection drop gets retried by the cron drain (3 attempts).
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

    // Find the User row for this applicant — required for EmailQueueItem.userId.
    const user = await prisma.user.findUnique({
      where: { email: application.email.toLowerCase() },
      select: { id: true },
    });
    if (!user) {
      return Response.json(
        { error: "No User record exists for this applicant. Re-approving will create one." },
        { status: 400 }
      );
    }

    const { subject, html } = renderPublicAcceptanceEmail({
      fullName: application.fullName,
      trackInterest: application.trackInterest,
      internId: application.internId,
      tempPassword: application.loginPassword,
    });

    const item = await prisma.emailQueueItem.create({
      data: {
        userId: user.id,
        kind: "GENERAL",
        toEmail: application.email,
        subject,
        body: html,
        context: {
          type: "acceptance_resend",
          applicationId: id,
          internId: application.internId,
        },
      },
    });

    logger.info("acceptance_email_resent_queued", { applicationId: id, queueItemId: item.id });

    return Response.json({
      ok: true,
      queued: true,
      sentTo: application.email,
      note: "Queued for delivery — the cron drain will pick it up within the hour.",
    });
  } catch (error) {
    logger.error("resend_welcome_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
