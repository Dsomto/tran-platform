import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";
import {
  renderPublicAcceptanceEmail,
  sendPublicAcceptanceEmail,
  sendPublicRejectionEmail,
} from "@/lib/email";

// Batch-send the decision emails. Approving / rejecting an applicant only
// sets their status — no email goes out at that moment. This endpoint fans
// out the emails for everyone in a decision pool who hasn't been emailed yet.
//
// POST body: { type: "welcome" | "rejection" }
//
//   welcome   — every approved applicant with welcomeEmailSentAt == null
//   rejection — every rejected applicant with rejectionEmailSentAt == null
//
// Each send is independent: a failure on one applicant doesn't abort the run.
// Successes get their timestamp stamped so a re-run doesn't double-send.
// Failures are left un-stamped (so the next run retries them) and also
// surface in the response counts.
//
// GET — returns how many emails are pending in each pool, for the admin UI
// to show "Send N pending …" button counts.
export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [welcomePending, rejectionPending] = await Promise.all([
    prisma.publicApplication.count({
      where: { status: "approved", welcomeEmailSentAt: null },
    }),
    prisma.publicApplication.count({
      where: { status: "rejected", rejectionEmailSentAt: null },
    }),
  ]);
  return Response.json({ welcomePending, rejectionPending });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const type = body?.type;
    if (type !== "welcome" && type !== "rejection") {
      return Response.json(
        { error: "type must be 'welcome' or 'rejection'" },
        { status: 400 }
      );
    }

    if (type === "welcome") {
      const pending = await prisma.publicApplication.findMany({
        where: { status: "approved", welcomeEmailSentAt: null },
        orderBy: { createdAt: "asc" },
      });

      let sent = 0;
      let failed = 0;
      for (const app of pending) {
        if (!app.internId || !app.loginPassword) {
          // Onboarding never completed — skip; admin should re-approve.
          failed++;
          logger.error("send_pending_welcome_missing_credentials", null, {
            applicationId: app.id,
          });
          continue;
        }
        try {
          await sendPublicAcceptanceEmail(
            app.email,
            app.fullName,
            app.trackInterest,
            app.internId,
            app.loginPassword
          );
          await prisma.publicApplication.update({
            where: { id: app.id },
            data: { welcomeEmailSentAt: new Date() },
          });
          sent++;
        } catch (err) {
          failed++;
          logger.error("send_pending_welcome_failed", err, {
            applicationId: app.id,
            email: app.email,
          });
          // Persist a FAILED EmailQueueItem so it shows on /admin/emails.
          const user = await prisma.user.findUnique({
            where: { email: app.email.toLowerCase() },
            select: { id: true },
          });
          if (user) {
            const { subject, html } = renderPublicAcceptanceEmail({
              fullName: app.fullName,
              trackInterest: app.trackInterest,
              internId: app.internId,
              tempPassword: app.loginPassword,
            });
            await prisma.emailQueueItem
              .create({
                data: {
                  userId: user.id,
                  kind: "GENERAL",
                  toEmail: app.email,
                  subject,
                  body: html,
                  status: "FAILED",
                  attempts: 1,
                  failReason: (err instanceof Error ? err.message : String(err)).slice(0, 500),
                  context: { type: "acceptance", applicationId: app.id },
                },
              })
              .catch(() => undefined);
          }
        }
      }
      return Response.json({ type, total: pending.length, sent, failed });
    }

    // rejection
    const pending = await prisma.publicApplication.findMany({
      where: { status: "rejected", rejectionEmailSentAt: null },
      orderBy: { createdAt: "asc" },
    });

    let sent = 0;
    let failed = 0;
    for (const app of pending) {
      try {
        await sendPublicRejectionEmail(app.email, app.fullName);
        await prisma.publicApplication.update({
          where: { id: app.id },
          data: { rejectionEmailSentAt: new Date() },
        });
        sent++;
      } catch (err) {
        failed++;
        logger.error("send_pending_rejection_failed", err, {
          applicationId: app.id,
          email: app.email,
        });
      }
    }
    return Response.json({ type, total: pending.length, sent, failed });
  } catch (error) {
    logger.error("send_pending_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// On Vercel Pro: a batch of a few hundred sends comfortably fits in 5 minutes.
export const maxDuration = 300;
