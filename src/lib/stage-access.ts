import { getSession } from "./auth";
import { prisma } from "./db";
import {
  STAGE_SLUG_TO_ENUM,
  stageRank,
  type StageSlug,
} from "./stage-login";

export interface StageAccess {
  internId: string;
  internCode: string;
  userId: string;
  stageSlug: StageSlug;
  /** First + last name from the user's account — used for NDA validation. */
  fullName: string;
  /** ISO timestamp when this intern signed the NDA, or null. */
  ndaSignedAt: string | null;
}

export type StageAccessFailure =
  | "no-session"
  | "no-intern"
  | "ahead"
  | "paused"
  | "closed";

/**
 * Verify the current user can enter this stage. Returns the access object
 * on success, or a typed failure reason.
 *
 * On success, also UPSERTs a StageAccess row so the admin can see who has
 * walked into each stage and when.
 */
export async function getStageAccess(
  slug: StageSlug
): Promise<
  | { ok: true; access: StageAccess }
  | { ok: false; reason: StageAccessFailure }
> {
  const session = await getSession();
  if (!session) return { ok: false, reason: "no-session" };

  const intern = await prisma.intern.findUnique({
    where: { userId: session.id },
    select: { id: true, currentStage: true, isActive: true, ndaSignedAt: true },
  });
  if (!intern || !intern.isActive) return { ok: false, reason: "no-intern" };

  const requestedEnum = STAGE_SLUG_TO_ENUM[slug];
  if (stageRank(requestedEnum) > stageRank(intern.currentStage)) {
    return { ok: false, reason: "ahead" };
  }

  const window = await prisma.stageWindow.findUnique({
    where: { stage: requestedEnum },
    select: { status: true },
  });
  const status = window?.status ?? "CLOSED";
  if (status === "CLOSED") return { ok: false, reason: "closed" };
  if (status === "PAUSED") return { ok: false, reason: "paused" };

  // Track the visit. Fire-and-forget so a tracking failure can't block
  // the page render. The unique index on (internId, stage) guarantees one
  // row per intern per stage.
  void prisma.stageAccess
    .upsert({
      where: { internId_stage: { internId: intern.id, stage: requestedEnum } },
      create: {
        internId: intern.id,
        stage: requestedEnum,
      },
      update: {
        lastAccessedAt: new Date(),
        visitCount: { increment: 1 },
      },
    })
    .catch(() => {
      /* swallow — telemetry not load-bearing */
    });

  const publicApp = await prisma.publicApplication.findFirst({
    where: { email: session.email.toLowerCase() },
    select: { internId: true },
  });

  return {
    ok: true,
    access: {
      internId: intern.id,
      internCode: publicApp?.internId ?? "UBI-?",
      userId: session.id,
      stageSlug: slug,
      fullName: `${session.firstName} ${session.lastName}`.trim(),
      ndaSignedAt: intern.ndaSignedAt?.toISOString() ?? null,
    },
  };
}
