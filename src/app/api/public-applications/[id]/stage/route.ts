import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

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

  return Response.json({ success: true, application: updated });
}
