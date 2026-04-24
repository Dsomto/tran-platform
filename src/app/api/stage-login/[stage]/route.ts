import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  STAGE_SLUGS,
  STAGE_SLUG_TO_ENUM,
  StageSlug,
  decodeForStage,
  doorCookieName,
  signDoorToken,
} from "@/lib/stage-login";

/**
 * POST /api/stage-login/[stage]
 *
 * Body: { internCode: "UBI-2026-0001", password: "<encoded-per-stage>" }
 *
 * Verifies that:
 *   1. Intern exists and is active.
 *   2. Submitted password decodes cleanly under the stage's encoding rule.
 *   3. Decoded plaintext matches Intern.stageDoorCode.
 *   4. Intern's currentStage is ≥ requested stage (can always re-enter a
 *      room they've already cleared but not jump ahead).
 *
 * On success we set an httpOnly `<stage>-door` cookie for 7 days.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ stage: string }> }
) {
  try {
    const { stage: stageParam } = await params;
    if (!STAGE_SLUGS.includes(stageParam as StageSlug)) {
      return Response.json({ error: "Unknown stage" }, { status: 404 });
    }
    const stage = stageParam as StageSlug;

    const body = await request.json().catch(() => ({}));
    const internCode = typeof body.internCode === "string" ? body.internCode.trim().toUpperCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!/^UBI-\d{4}-\d+$/.test(internCode)) {
      return Response.json({ error: "Intern ID must look like UBI-2026-0001" }, { status: 400 });
    }
    if (!password) {
      return Response.json({ error: "Password required" }, { status: 400 });
    }

    const publicApp = await prisma.publicApplication.findUnique({
      where: { internId: internCode },
    });
    if (!publicApp) {
      return Response.json({ error: "Unknown Intern ID" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: publicApp.email.toLowerCase() },
      include: { intern: true },
    });
    if (!user?.intern?.isActive) {
      return Response.json({ error: "Intern not active" }, { status: 403 });
    }
    if (!user.intern.stageDoorCode) {
      return Response.json(
        { error: "No stage password set for this intern. Contact admin." },
        { status: 409 }
      );
    }

    const decoded = decodeForStage(stage, password);
    if (decoded == null) {
      return Response.json(
        { error: "Password could not be decoded under this stage's rule" },
        { status: 400 }
      );
    }
    if (decoded !== user.intern.stageDoorCode) {
      logger.warn("stage_login_bad_password", { internCode, stage });
      return Response.json({ error: "Password does not match" }, { status: 401 });
    }

    // Stage gating — can re-enter any stage up to currentStage.
    const currentIdx = ["STAGE_0", "STAGE_1", "STAGE_2", "STAGE_3", "STAGE_4"].indexOf(
      user.intern.currentStage
    );
    const requestedIdx = STAGE_SLUGS.indexOf(stage);
    if (currentIdx < 0 || requestedIdx > currentIdx) {
      return Response.json({ error: "You have not unlocked this stage yet" }, { status: 403 });
    }

    // Admin gate — refuse if the stage hasn't been opened for the cohort yet.
    // Missing StageWindow is treated as locked (the default post-migration).
    const stageEnum = STAGE_SLUG_TO_ENUM[stage];
    const window = await prisma.stageWindow.findUnique({ where: { stage: stageEnum } });
    if (!window || window.isLocked) {
      return Response.json(
        { error: "This stage is not open yet. Wait for the announcement." },
        { status: 403 }
      );
    }

    const token = signDoorToken({
      internId: user.intern.id,
      internCode,
      stage,
    });

    const store = await cookies();
    store.set(doorCookieName(stage), token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    logger.info("stage_login_success", { internCode, stage });
    return Response.json({ ok: true, stageEnum: STAGE_SLUG_TO_ENUM[stage] });
  } catch (err) {
    logger.error("stage_login_failed", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

/** DELETE the stage door cookie — used by "sign out of this room" buttons. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ stage: string }> }
) {
  const { stage: stageParam } = await params;
  if (!STAGE_SLUGS.includes(stageParam as StageSlug)) {
    return Response.json({ error: "Unknown stage" }, { status: 404 });
  }
  const store = await cookies();
  store.delete(doorCookieName(stageParam as StageSlug));
  return Response.json({ ok: true });
}
