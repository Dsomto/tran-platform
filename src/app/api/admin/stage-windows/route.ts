import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";

const STAGE_KEYS = [
  "STAGE_0",
  "STAGE_1",
  "STAGE_2",
  "STAGE_3",
  "STAGE_4",
  "STAGE_5",
  "STAGE_6",
  "STAGE_7",
  "STAGE_8",
  "STAGE_9",
] as const;
type StageKey = (typeof STAGE_KEYS)[number];

function isStageKey(v: unknown): v is StageKey {
  return typeof v === "string" && (STAGE_KEYS as readonly string[]).includes(v);
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });
    const windows = await prisma.stageWindow.findMany({ orderBy: { stage: "asc" } });
    return Response.json({ windows });
  } catch (error) {
    logger.error("list_stage_windows_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { stage, activeFrom, submitUntil, passingScore } = body ?? {};

    if (!isStageKey(stage)) {
      return Response.json({ error: "Invalid stage" }, { status: 400 });
    }
    const from = new Date(activeFrom);
    const until = new Date(submitUntil);
    if (isNaN(from.getTime()) || isNaN(until.getTime())) {
      return Response.json({ error: "Invalid dates" }, { status: 400 });
    }
    if (until <= from) {
      return Response.json({ error: "submitUntil must be after activeFrom" }, { status: 400 });
    }
    const score = Number(passingScore);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      return Response.json({ error: "passingScore must be 0-100" }, { status: 400 });
    }

    const window = await prisma.stageWindow.upsert({
      where: { stage },
      create: { stage, activeFrom: from, submitUntil: until, passingScore: Math.round(score) },
      update: { activeFrom: from, submitUntil: until, passingScore: Math.round(score) },
    });

    return Response.json({ window });
  } catch (error) {
    logger.error("upsert_stage_window_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
