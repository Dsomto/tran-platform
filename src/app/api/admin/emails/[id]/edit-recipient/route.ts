import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { guardAuthorisedAction } from "@/lib/email-send-guard";
import { logger } from "@/lib/logger";
import { Prisma } from "@/generated/prisma";

// Fix a typo'd recipient on a queued/sent/failed email and re-queue it for
// delivery. Updates three places so the corrected address sticks:
//
//   1. EmailQueueItem.toEmail               — what actually gets sent.
//   2. PublicApplication.email              — the applicant record, so any
//                                              future emails go to the right
//                                              place. Resolved via
//                                              context.applicationId.
//   3. User.email (if a User row exists)    — so welcome-flow accounts can
//                                              still log in with the corrected
//                                              address (welcome sends already
//                                              create the User).
//
// Then the queue row is reset (status=PENDING, attempts/sentAt/lockedAt/
// failReason cleared) so the email-drain cron picks it up on its next pass
// (~5 min) and sends to the new address.
//
// Gated by guardAuthorisedAction: this triggers a re-send, so it requires the
// single authorised account + a fresh 2FA code.
//
// POST body: { newEmail: string, totpCode: string }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const body = await request.json().catch(() => ({}));
    const blocked = await guardAuthorisedAction(
      session,
      body?.totpCode,
      "Only the authorised account can edit recipients and resend."
    );
    if (blocked) return blocked;

    const { id } = await params;
    const raw = typeof body?.newEmail === "string" ? body.newEmail.trim() : "";
    // Match the apply-form validation: a single "x@y.tld" with a real TLD.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw)) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    const newEmail = raw.toLowerCase();

    const queueItem = await prisma.emailQueueItem.findUnique({ where: { id } });
    if (!queueItem) {
      return Response.json({ error: "Queue item not found." }, { status: 404 });
    }

    // No-op guard: if the address didn't change, skip everything.
    if (queueItem.toEmail.toLowerCase() === newEmail) {
      return Response.json({ ok: true, unchanged: true });
    }

    // Pull the linked PublicApplication via context.applicationId (set when the
    // email was enqueued). Update its email so future sends use the corrected
    // one — handle the unique-email collision gracefully.
    const ctx = queueItem.context as { applicationId?: string } | null;
    const applicationId = typeof ctx?.applicationId === "string" ? ctx.applicationId : null;
    if (applicationId) {
      try {
        await prisma.publicApplication.update({
          where: { id: applicationId },
          data: { email: newEmail },
        });
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002"
        ) {
          return Response.json(
            { error: "That email is already used by another applicant." },
            { status: 409 }
          );
        }
        throw err;
      }
    }

    // If a User exists for the OLD address (welcome-flow already onboarded
    // them under the wrong email), move it to the new one too, so they can
    // log in. Same unique-collision handling.
    const existingUser = await prisma.user.findUnique({
      where: { email: queueItem.toEmail.toLowerCase() },
      select: { id: true },
    });
    if (existingUser) {
      try {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { email: newEmail },
        });
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002"
        ) {
          return Response.json(
            { error: "An account already exists at that email." },
            { status: 409 }
          );
        }
        throw err;
      }
    }

    // Re-queue: toEmail + reset send state so the drain picks it up.
    await prisma.emailQueueItem.update({
      where: { id },
      data: {
        toEmail: newEmail,
        status: "PENDING",
        attempts: 0,
        sentAt: null,
        lockedAt: null,
        failReason: null,
      },
    });

    logger.info("email_recipient_edited", {
      by: session!.email,
      queueItemId: id,
      from: queueItem.toEmail,
      to: newEmail,
    });

    return Response.json({ ok: true, newEmail });
  } catch (error) {
    logger.error("edit_recipient_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
