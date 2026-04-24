import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/logger";

const STAGE_KEYS = ["STAGE_0", "STAGE_1", "STAGE_2", "STAGE_3", "STAGE_4"] as const;
type StageKey = (typeof STAGE_KEYS)[number];

function isStageKey(v: unknown): v is StageKey {
  return typeof v === "string" && (STAGE_KEYS as readonly string[]).includes(v);
}

// Admin re-locks a stage without sending any notification.
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { stage } = await request.json().catch(() => ({}));
    if (!isStageKey(stage)) {
      return Response.json({ error: "Invalid stage" }, { status: 400 });
    }

    const existing = await prisma.stageWindow.findUnique({ where: { stage } });
    if (!existing) {
      return Response.json({ error: "Stage has never been configured" }, { status: 404 });
    }

    const window = await prisma.stageWindow.update({
      where: { stage },
      data: { isLocked: true },
    });

    return Response.json({ window });
  } catch (error) {
    logger.error("stage_lock_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
