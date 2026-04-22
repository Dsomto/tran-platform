import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }

    const { internIds, action } = await request.json();

    if (!internIds || !Array.isArray(internIds) || internIds.length === 0) {
      return Response.json(
        { error: "internIds array is required" },
        { status: 400 }
      );
    }

    if (!action || !["promote", "demote"].includes(action)) {
      return Response.json(
        { error: "Action must be 'promote' or 'demote'" },
        { status: 400 }
      );
    }

    const interns = await prisma.intern.findMany({
      where: { id: { in: internIds } },
    });

    const results = await Promise.allSettled(
      interns.map(async (intern) => {
        const currentNum = parseInt(intern.currentStage.replace("STAGE_", ""));
        const newNum =
          action === "promote"
            ? Math.min(currentNum + 1, 9)
            : Math.max(currentNum - 1, 0);

        if (newNum === currentNum) return { id: intern.id, skipped: true };

        const newStage = `STAGE_${newNum}` as "STAGE_0" | "STAGE_1" | "STAGE_2" | "STAGE_3" | "STAGE_4" | "STAGE_5" | "STAGE_6" | "STAGE_7" | "STAGE_8" | "STAGE_9";

        await prisma.intern.update({
          where: { id: intern.id },
          data: { currentStage: newStage },
        });

        await prisma.stageHistory.create({
          data: {
            internId: intern.id,
            fromStage: intern.currentStage,
            toStage: newStage,
            promotedBy: session.id,
            reason: `Bulk ${action}`,
          },
        });

        return { id: intern.id, from: intern.currentStage, to: newStage };
      })
    );

    return Response.json({
      results: results.map((r) =>
        r.status === "fulfilled" ? r.value : { error: "Failed" }
      ),
    });
  } catch (error) {
    console.error("Bulk promote error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
