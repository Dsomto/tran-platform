import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { STAGE_SLUGS, STAGE_SLUG_TO_ENUM, StageSlug } from "@/lib/stage-login";
import { getStageAccess } from "@/lib/stage-access";
import { computeFlag } from "@/lib/flag";
import { rateLimit, getClientKey, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { verifySqli, verifySsrf, VerifyOutcome } from "@/lib/payload-verify";

/**
 * POST /api/stage/[slug]/tasks/[taskId]/verify
 *
 * Server-side payload gate for Stage-2 tasks that carry a `widgetConfig.verify`
 * block (T3 SQLi, T6 SSRF). The candidate POSTs { payload } — the injection
 * string or SSRF URL. We check its structure SERVER-SIDE and, only on success,
 * return the per-intern flag (computed server-side; the salt is withheld from
 * the client for these tasks). The candidate then submits that flag through the
 * normal /answer route, which grades it unchanged.
 *
 * The `error` codes are stable/verbatim: the task-9 rubric greps for them when
 * it asks the candidate to paste their first failed attempt.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; taskId: string }> }
) {
  try {
    const { slug, taskId } = await params;
    if (!STAGE_SLUGS.includes(slug as StageSlug)) {
      return Response.json({ ok: false, error: "unknown-stage" }, { status: 404 });
    }

    const result = await getStageAccess(slug as StageSlug);
    if (!result.ok) {
      const status = result.reason === "no-session" ? 401 : 403;
      return Response.json({ ok: false, error: result.reason }, { status });
    }
    const internId = result.access.internId;

    // Brute-force guard: keyed on the *intern* (server-derived), not just IP, so
    // one candidate can't grind the column count / role-name. 20/min mirrors the
    // flag-submit limit on /answer.
    const rl = await rateLimit(getClientKey(request, internId), RATE_LIMITS.flagSubmit);
    if (!rl.ok) return rateLimitResponse(rl);

    const body = await request.json().catch(() => ({}));
    const payload = typeof body?.payload === "string" ? body.payload : "";
    if (!payload || payload.length > 4000) {
      return Response.json(
        { ok: false, error: "payload-required", message: "Send a non-empty payload string." },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.findUnique({ where: { id: taskId } });
    if (!assignment) {
      return Response.json({ ok: false, error: "task-not-found" }, { status: 404 });
    }
    if (assignment.stage !== STAGE_SLUG_TO_ENUM[slug as StageSlug]) {
      return Response.json({ ok: false, error: "wrong-stage" }, { status: 400 });
    }
    if (assignment.track && assignment.track !== result.access.track) {
      return Response.json({ ok: false, error: "task-not-found" }, { status: 404 });
    }
    if (assignment.isClosed) {
      return Response.json({ ok: false, error: "task-closed" }, { status: 409 });
    }

    const wc = (assignment.widgetConfig as Record<string, unknown> | null) ?? null;
    const verify = (wc?.verify as { kind?: string } | undefined) ?? undefined;
    if (!verify?.kind) {
      // Only T3/T6 carry a verify block. Everything else uses the normal flow.
      return Response.json({ ok: false, error: "not-verifiable-task" }, { status: 400 });
    }

    let outcome: VerifyOutcome;
    if (verify.kind === "sqli") {
      outcome = verifySqli(payload, verify as Parameters<typeof verifySqli>[1]);
    } else if (verify.kind === "ssrf") {
      outcome = verifySsrf(payload, verify as Parameters<typeof verifySsrf>[1]);
    } else {
      return Response.json({ ok: false, error: "not-verifiable-task" }, { status: 400 });
    }

    if (!outcome.ok) {
      // Distinct, STABLE error code — the task-9 rubric greps for these.
      return Response.json(
        { ok: false, error: outcome.error, message: outcome.message },
        { status: 422 }
      );
    }

    // Structure is valid → release the per-intern flag. Salt stays server-side;
    // grading is still done by /answer when the candidate submits this string.
    if (!assignment.flagSalt) {
      logger.error("verify_missing_salt", undefined, { taskId });
      return Response.json({ ok: false, error: "task-misconfigured" }, { status: 500 });
    }
    const flag = computeFlag(assignment.flagSalt, internId);
    return Response.json({ ok: true, flag });
  } catch (err) {
    logger.error("stage_verify_failed", err);
    return Response.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
