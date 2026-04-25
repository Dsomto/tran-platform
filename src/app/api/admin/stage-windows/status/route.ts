import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { scheduleCohortBroadcast } from "@/lib/email";
import { publicAppUrl } from "@/lib/public-url";

const STAGE_KEYS = ["STAGE_0", "STAGE_1", "STAGE_2", "STAGE_3", "STAGE_4"] as const;
type StageKey = (typeof STAGE_KEYS)[number];

const VALID_STATUSES = ["OPEN", "PAUSED", "CLOSED"] as const;
type StageStatus = (typeof VALID_STATUSES)[number];

function isStageKey(v: unknown): v is StageKey {
  return typeof v === "string" && (STAGE_KEYS as readonly string[]).includes(v);
}
function isStatus(v: unknown): v is StageStatus {
  return typeof v === "string" && (VALID_STATUSES as readonly string[]).includes(v);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// POST /api/admin/stage-windows/status
// Body: { stage, status, announce?: { title, message } }
//
// Sets the stage's status. If status === OPEN AND announce is provided,
// also creates a pinned announcement and broadcasts to every active intern.
// Other transitions are silent.
export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperAdmin();
    const body = await request.json().catch(() => ({}));
    const { stage, status, announce } = body ?? {};

    if (!isStageKey(stage)) {
      return Response.json({ error: "Invalid stage" }, { status: 400 });
    }
    if (!isStatus(status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }

    const now = new Date();

    const window = await prisma.stageWindow.upsert({
      where: { stage },
      create: {
        stage,
        status,
        passingScore: 70,
        // Legacy mirror so anything still reading isLocked sees the right thing.
        isLocked: status !== "OPEN",
        ...(status === "OPEN"
          ? { openedAt: now, openedById: session.id }
          : {}),
      },
      update: {
        status,
        isLocked: status !== "OPEN",
        ...(status === "OPEN"
          ? { openedAt: now, openedById: session.id }
          : {}),
      },
    });

    let notifying = 0;
    if (status === "OPEN" && announce) {
      const stageNum = stage.replace("STAGE_", "");
      const title = String(announce.title ?? `Stage ${stageNum} is open`).trim().slice(0, 200);
      const message = String(
        announce.message ?? `Stage ${stageNum} is now open. Log into your dashboard to begin.`
      ).trim();

      await prisma.announcement.create({
        data: {
          title,
          content: message,
          authorId: session.id,
          stage: null,
          track: null,
          isPinned: true,
        },
      });

      const interns = await prisma.intern.findMany({
        where: { isActive: true },
        select: { user: { select: { email: true } } },
      });
      const recipients = interns.map((i) => i.user.email).filter(Boolean);
      notifying = recipients.length;

      if (recipients.length > 0) {
        const base = publicAppUrl();
        const html = `
          <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#F8FAFC;padding:32px 16px;">
            <div style="background:linear-gradient(135deg,#2563EB,#0891B2);padding:28px;border-radius:14px;text-align:center;color:white;">
              <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;">🛡️ Stage ${stageNum} is open</h1>
              <p style="margin:0;font-size:12px;opacity:.9;">Ubuntu Bridge Initiative</p>
            </div>
            <div style="background:white;padding:28px;border-radius:14px;margin-top:16px;box-shadow:0 1px 3px rgba(0,0,0,.08);">
              <h2 style="color:#0F172A;margin:0 0 12px;font-size:18px;">${escapeHtml(title)}</h2>
              <div style="color:#334155;line-height:1.6;font-size:14px;">${escapeHtml(message).replace(/\n/g, "<br>")}</div>
              <p style="margin:24px 0 0;"><a href="${base}/dashboard" style="display:inline-block;background:#2563EB;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Open dashboard</a></p>
            </div>
          </div>`;
        scheduleCohortBroadcast(
          recipients,
          `[UBI] Stage ${stageNum} is now open`,
          html,
          `stage-open:${stage}:${now.toISOString()}`
        );
      }
    }

    return Response.json({ window, notifying });
  } catch (error) {
    logger.error("stage_status_change_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
