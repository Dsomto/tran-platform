import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { sendSubmissionReceipt } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const intern = await prisma.intern.findUnique({ where: { userId: session.id } });
    if (!intern) {
      return Response.json({ error: "Intern profile not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const assignmentId = url.searchParams.get("assignmentId");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1") || 1);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50") || 50));

    const where = {
      internId: intern.id,
      ...(assignmentId ? { assignmentId } : {}),
    };

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          assignment: {
            select: { id: true, title: true, dueDate: true, maxPoints: true, stage: true, track: true },
          },
        },
        orderBy: { submittedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.submission.count({ where }),
    ]);

    return Response.json({
      submissions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error("list_submissions_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const intern = await prisma.intern.findUnique({
      where: { userId: session.id },
      include: { user: true },
    });

    if (!intern) {
      return Response.json({ error: "Intern profile not found" }, { status: 404 });
    }

    const { assignmentId, content, attachmentUrl } = await request.json();

    if (!assignmentId || typeof content !== "string" || !content.trim()) {
      return Response.json(
        { error: "Assignment ID and non-empty content are required" },
        { status: 400 }
      );
    }
    if (content.length > 20000) {
      return Response.json({ error: "Content is too long (max 20,000 chars)" }, { status: 400 });
    }
    if (attachmentUrl && typeof attachmentUrl === "string") {
      try {
        const u = new URL(attachmentUrl);
        if (!/^https?:$/.test(u.protocol)) throw new Error("bad protocol");
      } catch {
        return Response.json({ error: "Attachment URL must be a valid http(s) URL" }, { status: 400 });
      }
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return Response.json({ error: "Assignment not found" }, { status: 404 });
    }

    const isLate = assignment.dueDate != null && new Date() > assignment.dueDate;

    // Upsert so a re-submission updates the existing record (matches the
    // @@unique([internId, assignmentId]) constraint).
    const submission = await prisma.submission.upsert({
      where: { internId_assignmentId: { internId: intern.id, assignmentId } },
      create: {
        internId: intern.id,
        assignmentId,
        content: content.trim(),
        attachmentUrl: attachmentUrl?.trim() || null,
        status: isLate ? "LATE" : "SUBMITTED",
      },
      update: {
        content: content.trim(),
        attachmentUrl: attachmentUrl?.trim() || null,
        status: isLate ? "LATE" : "SUBMITTED",
        submittedAt: new Date(),
        score: null,
        feedback: null,
        gradedAt: null,
      },
    });

    // Fire-and-forget confirmation email.
    sendSubmissionReceipt(
      intern.user.email,
      intern.user.firstName,
      assignment.title,
      submission.status as "SUBMITTED" | "LATE"
    ).catch((err) =>
      logger.error("submission_receipt_email_failed", err, {
        email: intern.user.email,
        submissionId: submission.id,
      })
    );

    return Response.json({ submission }, { status: 201 });
  } catch (error) {
    logger.error("create_submission_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
