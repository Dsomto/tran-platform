import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { syncApplicantStages } from "@/lib/applicant-stage";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { action } = await request.json();

  if (!action || !["advance", "eliminate"].includes(action)) {
    return Response.json(
      { error: "Invalid action. Must be 'advance' or 'eliminate'." },
      { status: 400 }
    );
  }

  const application = await prisma.publicApplication.findUnique({
    where: { id },
  });

  if (!application) {
    return Response.json({ error: "Application not found" }, { status: 404 });
  }

  if (application.stageStatus !== "active") {
    return Response.json(
      { error: "Applicant is not currently active in a stage." },
      { status: 400 }
    );
  }

  if (action === "eliminate") {
    const updated = await prisma.publicApplication.update({
      where: { id },
      data: { stageStatus: "eliminated" },
    });
    // Revoke any live session for this person immediately — bumping
    // tokenVersion invalidates their JWT, so they're logged out at once
    // and cannot log back in (the login check blocks eliminated interns).
    // updateMany so an applicant with no account is simply a no-op.
    await prisma.user.updateMany({
      where: { email: application.email.toLowerCase() },
      data: { tokenVersion: { increment: 1 } },
    });
    // Mirror onto the backing Intern (isActive -> false) and queue the
    // elimination email. Never throws.
    await syncApplicantStages(
      [{ id, email: application.email, fullName: application.fullName, stage: application.stage }],
      "eliminate"
    );
    return Response.json({ success: true, application: updated });
  }

  // Advance to next stage
  const nextStage = application.stage + 1;
  if (nextStage > 10) {
    return Response.json(
      { error: "Applicant has already reached the final stage." },
      { status: 400 }
    );
  }

  const updated = await prisma.publicApplication.update({
    where: { id },
    data: {
      stage: nextStage,
      stageStatus: nextStage === 10 ? "advanced" : "active",
    },
  });

  // Mirror onto the backing Intern (currentStage / finalist) and queue the
  // stage-passed email. Never throws.
  await syncApplicantStages(
    [{ id, email: application.email, fullName: application.fullName, stage: nextStage }],
    "advance"
  );

  return Response.json({ success: true, application: updated });
}
