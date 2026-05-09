import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";

// List EmailQueueItem rows for the admin email viewer at /admin/emails.
// Filter by status (PENDING / SENT / FAILED) so the admin can quickly
// surface failed sends and retry them.
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status"); // FAILED | SENT | PENDING | (null = all)
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") || "50") || 50));

    const where = status ? { status: status as never } : {};
    const items = await prisma.emailQueueItem.findMany({
      where,
      orderBy: { enqueuedAt: "desc" },
      take: limit,
      select: {
        id: true,
        toEmail: true,
        subject: true,
        status: true,
        attempts: true,
        sentAt: true,
        failReason: true,
        enqueuedAt: true,
        context: true,
      },
    });

    const counts = await prisma.emailQueueItem.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    const countMap: Record<string, number> = {};
    for (const c of counts) {
      countMap[c.status] = c._count._all;
    }

    return Response.json({ items, counts: countMap });
  } catch (error) {
    logger.error("list_emails_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
