import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";
import { crossSiteRejection, json, limitBy, networkKey, SHOWCASE_LIMITS } from "@/lib/showcase-http";
import { emailHash, normalizeEmail, verifyVotingCode, VOTER_COOKIE, VOTER_SESSION_SECONDS } from "@/lib/showcase-vote";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = crossSiteRejection(req);
  if (blocked) return blocked;

  const byNetwork = await limitBy("verify:net", networkKey(req), SHOWCASE_LIMITS.verifyPerNetwork);
  if (byNetwork) return byNetwork;

  const payload = await req.json().catch(() => null);
  const email = normalizeEmail(payload?.email);
  if (email) {
    const byEmail = await limitBy("verify:email", emailHash(email).slice(0, 32), SHOWCASE_LIMITS.verifyPerEmail);
    if (byEmail) return byEmail;
  }

  try {
    const outcome = await verifyVotingCode(payload?.email, payload?.code);
    if (outcome.token) {
      (await cookies()).set(VOTER_COOKIE, outcome.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: VOTER_SESSION_SECONDS,
      });
    }
    return json(outcome.body, outcome.status);
  } catch (err) {
    logger.error("showcase_verify_code_failed", err);
    return json({ error: "Something went wrong. Please try again in a moment." }, 500);
  }
}
