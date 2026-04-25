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
}

/**
 * Verify the current user can enter this stage. Returns the access object
 * on success, or one of three failure reasons:
 *
 *   - "no-session"  → user is not logged in (redirect to /login)
 *   - "no-intern"   → user has no Intern record yet (redirect to /dashboard)
 *   - "locked"      → admin has not opened this stage (show locked state)
 *   - "ahead"       → intern's currentStage is behind this one
 *
 * Used by every /subdomains/stage-X/* page and the PDF route.
 */
export async function getStageAccess(
  slug: StageSlug
): Promise<{ ok: true; access: StageAccess } | { ok: false; reason: "no-session" | "no-intern" | "locked" | "ahead" }> {
  const session = await getSession();
  if (!session) return { ok: false, reason: "no-session" };

  const intern = await prisma.intern.findUnique({
    where: { userId: session.id },
    select: { id: true, currentStage: true, isActive: true },
  });
  if (!intern || !intern.isActive) return { ok: false, reason: "no-intern" };

  const requestedEnum = STAGE_SLUG_TO_ENUM[slug];
  if (stageRank(requestedEnum) > stageRank(intern.currentStage)) {
    return { ok: false, reason: "ahead" };
  }

  const window = await prisma.stageWindow.findUnique({
    where: { stage: requestedEnum },
    select: { isLocked: true },
  });
  if (!window || window.isLocked) {
    return { ok: false, reason: "locked" };
  }

  // We don't store the intern code on the user — derive it from PublicApplication.
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
    },
  };
}
