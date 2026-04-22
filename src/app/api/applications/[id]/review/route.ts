import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendWelcomeEmail, sendRejectionEmail } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }

    const { id } = await params;
    const { action, reviewNotes } = await request.json();

    if (!action || !["APPROVED", "REJECTED"].includes(action)) {
      return Response.json(
        { error: "Invalid action. Must be APPROVED or REJECTED" },
        { status: 400 }
      );
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!application) {
      return Response.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (application.status !== "PENDING") {
      return Response.json(
        { error: "Application has already been reviewed" },
        { status: 400 }
      );
    }

    // Update application status
    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: action,
        reviewedBy: session.id,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || null,
      },
    });

    // If approved, create intern record
    if (action === "APPROVED") {
      await prisma.intern.create({
        data: {
          userId: application.userId,
          track: application.preferredTrack,
          currentStage: "STAGE_0",
          points: 0,
        },
      });

      // Send welcome email (non-blocking)
      sendWelcomeEmail(application.user.email, application.user.firstName).catch(
        (err) => console.error("Failed to send welcome email:", err)
      );
    } else {
      // Send rejection email (non-blocking)
      sendRejectionEmail(application.user.email, application.user.firstName).catch(
        (err) => console.error("Failed to send rejection email:", err)
      );
    }

    return Response.json({ application: updated });
  } catch (error) {
    console.error("Review application error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
