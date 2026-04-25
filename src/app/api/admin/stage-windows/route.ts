import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";

// GET /api/admin/stage-windows
// Read-only listing of stage windows. Authenticated users only.
// Status changes go through /api/admin/stage-windows/status (super admin).
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
