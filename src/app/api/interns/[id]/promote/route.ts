import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Moving an intern between stages is a high-impact decision: it overrides
    // the grading flow and can trigger downstream emails. Promotion happens in
    // bulk via /admin/stage-results (super-admin only); one-off per-intern
    // moves stay super-admin too.
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }

    const { id } = await params;
    const { action } = await request.json(); // "promote" only

    // Demotion is not allowed: interns only ever advance (via the cutoff flow)
    // or are eliminated. Moving someone back a stage is never a valid action.
    if (action !== "promote") {
      return Response.json(
        { error: "Only promotion is allowed. Interns are eliminated rather than demoted." },
        { status: 400 }
      );
    }

    const intern = await prisma.intern.findUnique({ where: { id } });
    if (!intern) {
      return Response.json({ error: "Intern not found" }, { status: 404 });
    }

    const currentNum = parseInt(intern.currentStage.replace("STAGE_", ""));
    const newNum = Math.min(currentNum + 1, 9);

    if (newNum === currentNum) {
      return Response.json(
        { error: `Intern is already at Stage ${currentNum}` },
        { status: 400 }
      );
    }

    const newStage = `STAGE_${newNum}` as "STAGE_0" | "STAGE_1" | "STAGE_2" | "STAGE_3" | "STAGE_4" | "STAGE_5" | "STAGE_6" | "STAGE_7" | "STAGE_8" | "STAGE_9";

    const [updated] = await Promise.all([
      prisma.intern.update({
        where: { id },
        data: { currentStage: newStage },
      }),
      prisma.stageHistory.create({
        data: {
          internId: id,
          fromStage: intern.currentStage,
          toStage: newStage,
          promotedBy: session.id,
          reason: "Admin promotion",
        },
      }),
    ]);

    return Response.json({ intern: updated });
  } catch (error) {
    console.error("Promote/demote error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
