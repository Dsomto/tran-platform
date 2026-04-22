import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

    const { id } = await ctx.params;
    const intern = await prisma.intern.findUnique({ where: { userId: session.id } });
    if (!intern) return Response.json({ error: "Intern profile not found" }, { status: 404 });

    const report = await prisma.stageReport.findUnique({ where: { id } });
    if (!report) return Response.json({ error: "Report not found" }, { status: 404 });
    if (report.internId !== intern.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    return Response.json({ report });
  } catch (error) {
    logger.error("get_report_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
