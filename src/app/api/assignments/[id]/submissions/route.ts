import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const assignment = await prisma.assignment.findUnique({ where: { id } });
    if (!assignment) {
      return Response.json({ error: "Assignment not found" }, { status: 404 });
    }

    const submissions = await prisma.submission.findMany({
      where: { assignmentId: id },
      include: {
        intern: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: [{ status: "asc" }, { submittedAt: "asc" }],
    });

    return Response.json({ assignment, submissions });
  } catch (error) {
    logger.error("list_assignment_submissions_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
