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
    const q = url.searchParams.get("q")?.trim(); // applicant name search (decision emails only)
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") || "50") || 50));

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    // Name search: the email row stores no name, so resolve the query to
    // recipient emails via PublicApplication (email is unique), then scope to
    // the stage decision kinds. An empty match list yields no results.
    if (q) {
      const apps = await prisma.publicApplication.findMany({
        where: { fullName: { contains: q, mode: "insensitive" } },
        select: { email: true },
      });
      where.kind = { in: ["STAGE_PASSED", "STAGE_FAILED"] };
      where.toEmail = { in: apps.map((a) => a.email) };
    }

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

    // Resolve the applicant name for each row (the name lives on
    // PublicApplication, not the email) so name searches show who matched.
    const apps = await prisma.publicApplication.findMany({
      where: { email: { in: items.map((i) => i.toEmail) } },
      select: { email: true, fullName: true },
    });
    const nameByEmail = new Map(apps.map((a) => [a.email, a.fullName]));
    const itemsWithName = items.map((i) => ({
      ...i,
      applicantName: nameByEmail.get(i.toEmail) ?? null,
    }));

    const counts = await prisma.emailQueueItem.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    const countMap: Record<string, number> = {};
    for (const c of counts) {
      countMap[c.status] = c._count._all;
    }

    return Response.json({ items: itemsWithName, counts: countMap });
  } catch (error) {
    logger.error("list_emails_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Permanently remove queue rows — for emails that have failed repeatedly and
// should NOT be sent. This only drops the queue row; it never sends anything,
// so it carries no 2FA gate (unlike retry). PENDING rows can be deleted too,
// which is the way to cancel an email before it goes out.
// DELETE body: { ids: string[] }
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const ids: unknown = body?.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json({ error: "ids must be a non-empty array" }, { status: 400 });
    }
    const idStrings = ids.filter((x): x is string => typeof x === "string");

    const result = await prisma.emailQueueItem.deleteMany({
      where: { id: { in: idStrings } },
    });
    logger.info("delete_emails", { by: session.email, deleted: result.count });
    return Response.json({ deleted: result.count });
  } catch (error) {
    logger.error("delete_emails_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
