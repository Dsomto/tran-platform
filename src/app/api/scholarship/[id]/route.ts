import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { recordAudit, auditMetaFromRequest } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await ctx.params;
    const body = await request.json();
    const { status, reviewNotes } = body ?? {};

    if (status && !["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }
    if (reviewNotes && typeof reviewNotes !== "string") {
      return Response.json({ error: "reviewNotes must be a string" }, { status: 400 });
    }
    if (reviewNotes && reviewNotes.length > 3000) {
      return Response.json({ error: "reviewNotes too long" }, { status: 400 });
    }

    const app = await prisma.dataScholarshipApplication.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(reviewNotes !== undefined ? { reviewNotes: reviewNotes || null } : {}),
        reviewerId: session.id,
        reviewedAt: new Date(),
      },
    });

    await recordAudit({
      actor: session,
      action: status ? `scholarship.${status.toLowerCase()}` : "scholarship.note",
      targetType: "SCHOLARSHIP",
      targetId: app.id,
      details: {
        applicantEmail: app.email,
        status: app.status,
        hasNotes: Boolean(reviewNotes),
      },
      ...auditMetaFromRequest(request),
    });

    // If approved/rejected, enqueue a result email.
    if (status === "APPROVED" || status === "REJECTED") {
      const user = await prisma.user.findUnique({ where: { email: app.email } });
      if (user) {
        await prisma.emailQueueItem.create({
          data: {
            userId: user.id,
            toEmail: app.email,
            kind: "SCHOLARSHIP_RESULT",
            subject:
              status === "APPROVED"
                ? "Data Scholarship — Approved"
                : "Data Scholarship — Result",
            body: renderScholarshipEmail(app.fullName.split(" ")[0], status, reviewNotes),
          },
        });
      }
    }

    return Response.json({ application: app });
  } catch (error) {
    logger.error("scholarship_update_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

function renderScholarshipEmail(
  firstName: string,
  status: "APPROVED" | "REJECTED",
  notes?: string | null
) {
  const safeNotes = (notes || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
  const headline =
    status === "APPROVED"
      ? "Good news — your data scholarship has been approved."
      : "Thank you for applying to the data scholarship.";
  const body =
    status === "APPROVED"
      ? "You will begin receiving weekly mobile data credits. Watch your phone for top-up confirmations."
      : "We have reviewed your application. Unfortunately, we are not able to extend a scholarship at this time. You remain welcome in the programme.";
  return `
    <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#F8FAFC;padding:40px 20px;">
      <div style="background:white;padding:32px;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <h2 style="color:#0F172A;margin:0 0 12px;">Hi ${firstName},</h2>
        <p style="color:#334155;line-height:1.7;margin:0 0 12px;">${headline}</p>
        <p style="color:#475569;line-height:1.7;margin:0 0 16px;">${body}</p>
        ${safeNotes ? `<div style="background:#F8FAFC;border-left:4px solid #2563EB;padding:12px 16px;border-radius:0 8px 8px 0;color:#334155;line-height:1.6;font-size:14px;">${safeNotes}</div>` : ""}
        <p style="color:#94A3B8;font-size:12px;margin-top:24px;">Ubuntu Bridge Initiative · a programme of The Root Access Network</p>
      </div>
    </div>
  `;
}
