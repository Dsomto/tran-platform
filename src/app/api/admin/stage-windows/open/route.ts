import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { scheduleCohortBroadcast } from "@/lib/email";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const STAGE_KEYS = ["STAGE_0", "STAGE_1", "STAGE_2", "STAGE_3", "STAGE_4"] as const;
type StageKey = (typeof STAGE_KEYS)[number];

function isStageKey(v: unknown): v is StageKey {
  return typeof v === "string" && (STAGE_KEYS as readonly string[]).includes(v);
}

// Admin opens a stage and fans out an announcement.
// Creates/updates the StageWindow (isLocked=false), creates an Announcement row
// targeted at the stage, and enqueues a cohort-wide email broadcast.
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const { stage, title, message } = body;

    if (!isStageKey(stage)) {
      return Response.json({ error: "Invalid stage" }, { status: 400 });
    }

    const stageNum = stage.replace("STAGE_", "");
    const finalTitle = (title ?? `Stage ${stageNum} is open`).toString().slice(0, 200).trim();
    const finalMessage = (message ?? `Stage ${stageNum} is now open. Log into your dashboard to begin.`).toString().trim();

    // Default a 14-day window if the admin hasn't set one yet.
    const now = new Date();
    const fourteenDays = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const window = await prisma.stageWindow.upsert({
      where: { stage },
      create: {
        stage,
        activeFrom: now,
        submitUntil: fourteenDays,
        passingScore: 70,
        isLocked: false,
        openedAt: now,
        openedById: session.id,
      },
      update: {
        isLocked: false,
        openedAt: now,
        openedById: session.id,
      },
    });

    // Target `stage: null` so every intern sees the announcement on their
    // dashboard — not just the ones already AT this stage. Matches the
    // cohort-wide email broadcast below.
    const announcement = await prisma.announcement.create({
      data: {
        title: finalTitle,
        content: finalMessage,
        authorId: session.id,
        stage: null,
        track: null,
        isPinned: true,
      },
    });

    // Broadcast to every active intern — not just those already at the stage —
    // because opening a stage is cohort-wide news.
    const interns = await prisma.intern.findMany({
      where: { isActive: true },
      select: { user: { select: { email: true } } },
    });
    const recipients = interns.map((i) => i.user.email).filter(Boolean);

    if (recipients.length > 0) {
      const base = process.env.PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
      const html = `
        <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#F8FAFC;padding:32px 16px;">
          <div style="background:linear-gradient(135deg,#2563EB,#0891B2);padding:28px;border-radius:14px;text-align:center;color:white;">
            <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;">🛡️ Stage ${stageNum} is open</h1>
            <p style="margin:0;font-size:12px;opacity:.9;">Ubuntu Bridge Initiative</p>
          </div>
          <div style="background:white;padding:28px;border-radius:14px;margin-top:16px;box-shadow:0 1px 3px rgba(0,0,0,.08);">
            <h2 style="color:#0F172A;margin:0 0 12px;font-size:18px;">${escapeHtml(finalTitle)}</h2>
            <div style="color:#334155;line-height:1.6;font-size:14px;">${escapeHtml(finalMessage).replace(/\n/g, "<br>")}</div>
            <p style="margin:24px 0 0;"><a href="${base}/dashboard" style="display:inline-block;background:#2563EB;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Open dashboard</a></p>
          </div>
        </div>`;
      scheduleCohortBroadcast(
        recipients,
        `[UBI] Stage ${stageNum} is now open`,
        html,
        `stage-open:${stage}:${announcement.id}`
      );
    }

    return Response.json({
      window,
      announcement,
      notifying: recipients.length,
    });
  } catch (error) {
    logger.error("stage_open_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
