import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { scheduleCohortBroadcast } from "@/lib/email";
import { publicAppUrl } from "@/lib/public-url";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(request.url);
    const stage = url.searchParams.get("stage");
    const track = url.searchParams.get("track");

    const where: Record<string, unknown> = {};
    if (stage) where.stage = stage;
    if (track) where.track = track;

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        _count: { select: { submissions: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    return Response.json({ assignments });
  } catch (error) {
    console.error("Get assignments error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }

    const { title, description, stage, track, dueDate, maxPoints, resources } =
      await request.json();

    if (!title || !description || !stage || !dueDate) {
      return Response.json(
        { error: "Title, description, stage, and due date are required" },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        stage,
        track: track || null,
        dueDate: new Date(dueDate),
        maxPoints: maxPoints || 100,
        resources: resources || null,
      },
    });

    // Notify the cohort that matches this assignment's stage (+ track if set).
    const interns = await prisma.intern.findMany({
      where: {
        isActive: true,
        currentStage: assignment.stage,
        ...(assignment.track ? { track: assignment.track } : {}),
      },
      select: { user: { select: { email: true, firstName: true } } },
    });
    const recipients = interns.map((i) => i.user.email).filter(Boolean);
    if (recipients.length > 0) {
      const due = assignment.dueDate
        ? assignment.dueDate.toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "No due date";
      const base = publicAppUrl();
      const html = `
        <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#F8FAFC;padding:32px 16px;">
          <div style="background:linear-gradient(135deg,#2563EB,#0891B2);padding:28px;border-radius:14px;text-align:center;color:white;">
            <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;">🛡️ UBI</h1>
            <p style="margin:0;font-size:12px;opacity:.9;">New assignment available</p>
          </div>
          <div style="background:white;padding:28px;border-radius:14px;margin-top:16px;box-shadow:0 1px 3px rgba(0,0,0,.08);">
            <h2 style="color:#0F172A;margin:0 0 12px;font-size:18px;">${assignment.title}</h2>
            <p style="color:#334155;line-height:1.55;font-size:14px;">${assignment.description.replace(/\n/g, "<br>")}</p>
            <p style="color:#475569;margin-top:16px;font-size:13px;"><strong>Due:</strong> ${due} &nbsp;·&nbsp; <strong>Max points:</strong> ${assignment.maxPoints}</p>
            <p style="margin:24px 0 0;"><a href="${base}/dashboard/assignments" style="display:inline-block;background:#2563EB;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">View assignment</a></p>
          </div>
        </div>`;
      scheduleCohortBroadcast(
        recipients,
        `New assignment: ${assignment.title}`,
        html,
        `assignment:${assignment.id}`
      );
    }

    return Response.json({ assignment, notifyingInterns: recipients.length }, { status: 201 });
  } catch (error) {
    logger.error("create_assignment_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
