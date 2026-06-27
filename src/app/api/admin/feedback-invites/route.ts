import { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";

function isAdmin(role?: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

const stageNum = (s: string) => Number(String(s).replace("STAGE_", ""));

// Admin-only. Generates one FeedbackInvite per intern who does not already have
// one, capturing how far they got (lastStage/outcome) for analytics segmentation.
// Idempotent: re-running only adds invites for newly-eligible people.
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !isAdmin(session.role)) {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const action = body?.action;

    if (action === "generate") {
      const interns = await prisma.intern.findMany({
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      });
      const existing = new Set(
        (await prisma.feedbackInvite.findMany({ select: { email: true } })).map((i) =>
          i.email.toLowerCase()
        )
      );

      let created = 0;
      for (const intern of interns) {
        const email = intern.user.email.toLowerCase();
        if (existing.has(email)) continue;
        const outcome = intern.finalist
          ? "finalist"
          : intern.isActive
          ? "active"
          : "eliminated";
        await prisma.feedbackInvite.create({
          data: {
            token: randomBytes(18).toString("base64url"),
            email,
            name: `${intern.user.firstName} ${intern.user.lastName}`.trim() || null,
            lastStage: stageNum(intern.currentStage as unknown as string),
            outcome,
            track: intern.track as unknown as string,
          },
        });
        existing.add(email);
        created++;
      }
      return Response.json({ success: true, created, total: existing.size });
    }

    if (action === "mark-sent") {
      const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
      const where = ids.length ? { id: { in: ids } } : { sentAt: null };
      const res = await prisma.feedbackInvite.updateMany({
        where,
        data: { sentAt: new Date() },
      });
      return Response.json({ success: true, updated: res.count });
    }

    return Response.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    logger.error("feedback_invites_failed", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}
