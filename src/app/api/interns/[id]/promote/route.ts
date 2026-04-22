import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

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
    const { action } = await request.json(); // "promote" or "demote"

    const intern = await prisma.intern.findUnique({ where: { id } });
    if (!intern) {
      return Response.json({ error: "Intern not found" }, { status: 404 });
    }

    const currentNum = parseInt(intern.currentStage.replace("STAGE_", ""));
    let newNum: number;

    if (action === "promote") {
      newNum = Math.min(currentNum + 1, 9);
    } else if (action === "demote") {
      newNum = Math.max(currentNum - 1, 0);
    } else {
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }

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
          reason: action === "promote" ? "Admin promotion" : "Admin demotion",
        },
      }),
    ]);

    return Response.json({ intern: updated });
  } catch (error) {
    console.error("Promote/demote error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
