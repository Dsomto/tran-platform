import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { scheduleCohortBroadcast } from "@/lib/email";
import type { Prisma } from "@/generated/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");

    const announcements = await prisma.announcement.findMany({
      include: {
        author: {
          select: { firstName: true, lastName: true, avatarUrl: true },
        },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    return Response.json({ announcements });
  } catch (error) {
    console.error("Get announcements error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }

    const { title, content, stage, track, isPinned } = await request.json();

    if (!title || !content) {
      return Response.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        authorId: session.id,
        stage: stage || null,
        track: track || null,
        isPinned: isPinned || false,
      },
    });

    const where: Prisma.InternWhereInput = {
      isActive: true,
      ...(announcement.stage ? { currentStage: announcement.stage } : {}),
      ...(announcement.track ? { track: announcement.track } : {}),
    };
    const interns = await prisma.intern.findMany({
      where,
      select: { user: { select: { email: true } } },
    });
    const recipients = interns.map((i) => i.user.email).filter(Boolean);

    if (recipients.length > 0) {
      const base = process.env.PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
      const html = `
        <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#F8FAFC;padding:32px 16px;">
          <div style="background:linear-gradient(135deg,#2563EB,#0891B2);padding:28px;border-radius:14px;text-align:center;color:white;">
            <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;">🛡️ UBI</h1>
            <p style="margin:0;font-size:12px;opacity:.9;">Announcement</p>
          </div>
          <div style="background:white;padding:28px;border-radius:14px;margin-top:16px;box-shadow:0 1px 3px rgba(0,0,0,.08);">
            <h2 style="color:#0F172A;margin:0 0 12px;font-size:18px;">${announcement.title}</h2>
            <div style="color:#334155;line-height:1.55;font-size:14px;">${announcement.content.replace(/\n/g, "<br>")}</div>
            <p style="margin:24px 0 0;"><a href="${base}/dashboard" style="display:inline-block;background:#2563EB;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Open dashboard</a></p>
          </div>
        </div>`;
      scheduleCohortBroadcast(
        recipients,
        `[UBI] ${announcement.title}`,
        html,
        `announcement:${announcement.id}`
      );
    }

    return Response.json({ announcement, notifying: recipients.length }, { status: 201 });
  } catch (error) {
    logger.error("create_announcement_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
