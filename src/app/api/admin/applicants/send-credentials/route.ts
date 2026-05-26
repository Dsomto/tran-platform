import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { guardEmailSend } from "@/lib/email-send-guard";
import { logger } from "@/lib/logger";
import { renderCredentialsEmail } from "@/lib/email";
import { Prisma } from "@/generated/prisma";

// Send the credentials email — intern ID + temp password + Slack invite — to
// approved applicants who never received their login. This is the "what's
// next" follow-up the acceptance email promised. Idempotent per applicant via
// PublicApplication.credentialsEmailSentAt (mirrors welcomeEmailSentAt /
// rejectionEmailSentAt / waitlistEmailSentAt).
//
// POST body: { totpCode, applicationId? }
//   - With applicationId: send to that single applicant.
//   - Without: bulk-send to every approved applicant not yet sent credentials.
//
// Same lock as other applicant sends: authorised account + fresh 2FA code.

// MongoDB stores an optional field that was never written as ABSENT, not null.
// Match "absent OR null" so we catch every approved applicant who still owes
// a credentials email regardless of how their document was created.
const credentialsUnsent: Prisma.PublicApplicationWhereInput = {
  OR: [
    { credentialsEmailSentAt: null },
    { credentialsEmailSentAt: { isSet: false } },
  ],
};

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json().catch(() => ({}));
    const blocked = await guardEmailSend(session, body?.totpCode);
    if (blocked) return blocked;

    const onlyId = typeof body?.applicationId === "string" ? body.applicationId : undefined;

    // Pool: approved + has loginPassword (couldn't help them log in without it)
    // + still owes a credentials email (unless explicitly resending one).
    const pool = await prisma.publicApplication.findMany({
      where: {
        status: "approved",
        ...(onlyId ? { id: onlyId } : credentialsUnsent),
        loginPassword: { not: null },
        internId: { not: null },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        internId: true,
        loginPassword: true,
      },
    });
    if (pool.length === 0) {
      return Response.json({ type: "credentials", total: 0, queued: 0 });
    }

    // Claim each row by stamping credentialsEmailSentAt = claimAt so two runs
    // can't double-send. Single-applicant resends re-stamp regardless.
    const claimAt = new Date();
    const claimFilter: Prisma.PublicApplicationWhereInput = onlyId
      ? { id: { in: pool.map((a) => a.id) } }
      : { id: { in: pool.map((a) => a.id) }, ...credentialsUnsent };
    await prisma.publicApplication.updateMany({
      where: claimFilter,
      data: { credentialsEmailSentAt: claimAt },
    });
    const mine = pool.filter(
      (a) => a.internId !== null && a.loginPassword !== null
    );

    const users = await prisma.user.findMany({
      where: { email: { in: mine.map((a) => a.email.toLowerCase()) } },
      select: { id: true, email: true },
    });
    const userByEmail = new Map(users.map((u) => [u.email, u.id]));

    const rows: Prisma.EmailQueueItemCreateManyInput[] = mine.map((a) => {
      const { subject, html } = renderCredentialsEmail({
        fullName: a.fullName,
        internId: a.internId as string,
        tempPassword: a.loginPassword as string,
      });
      return {
        userId: userByEmail.get(a.email.toLowerCase()) ?? null,
        kind: "GENERAL",
        toEmail: a.email,
        subject,
        body: html,
        status: "PENDING",
        context: { type: "credentials", applicationId: a.id },
      };
    });

    let queued = 0;
    try {
      const r = await prisma.emailQueueItem.createMany({ data: rows });
      queued = r.count;
    } catch (err) {
      logger.error("send_credentials_enqueue_failed", err);
      // Roll back the claim on insert failure so the next run retries cleanly.
      await prisma.publicApplication.updateMany({
        where: { id: { in: mine.map((a) => a.id) } },
        data: { credentialsEmailSentAt: null },
      });
      return Response.json({ error: "Failed to enqueue credentials emails." }, { status: 500 });
    }

    logger.info("send_credentials", { by: session!.email, queued });
    return Response.json({ type: "credentials", total: pool.length, queued });
  } catch (error) {
    logger.error("send_credentials_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET — how many approved applicants still need their credentials.
export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const pending = await prisma.publicApplication.count({
    where: {
      status: "approved",
      ...credentialsUnsent,
      loginPassword: { not: null },
      internId: { not: null },
    },
  });
  return Response.json({ pending });
}

export const maxDuration = 300;
