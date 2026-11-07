import { requireApiAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

const VALID_STATUSES = new Set(["PENDING", "SHORTLISTED", "INTERVIEWING", "ACCEPTED", "DECLINED"]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAdmin();
  if (auth.response) return auth.response;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const status = typeof body.status === "string" ? body.status.trim().toUpperCase() : "";
    const reviewNotes = typeof body.reviewNotes === "string" ? body.reviewNotes.trim() : "";

    if (!VALID_STATUSES.has(status)) {
      return Response.json({ error: "Invalid volunteer status." }, { status: 400 });
    }
    if (reviewNotes.length > 4000) {
      return Response.json({ error: "Review notes must stay below 4000 characters." }, { status: 400 });
    }

    const application = await prisma.volunteerApplication.update({
      where: { id },
      data: {
        status,
        reviewNotes: reviewNotes || null,
        reviewedAt: new Date(),
        reviewedBy: auth.session.email,
      },
    });

    return Response.json({ success: true, application });
  } catch (error) {
    logger.error("volunteer_review_failed", error);
    return Response.json({ error: "The volunteer review could not be saved." }, { status: 500 });
  }
}
