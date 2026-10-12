import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";
import { crossSiteRejection, json, limitBy, networkKey, requestIp, SHOWCASE_LIMITS } from "@/lib/showcase-http";
import { readVoterSession, submitBallot, VOTER_COOKIE } from "@/lib/showcase-vote";

export const dynamic = "force-dynamic";

// Returns success or a neutral error only. Never a count, rank or total.
export async function POST(req: NextRequest) {
  const blocked = crossSiteRejection(req);
  if (blocked) return blocked;

  const byNetwork = await limitBy("ballot:net", networkKey(req), SHOWCASE_LIMITS.ballotPerNetwork);
  if (byNetwork) return byNetwork;

  const session = readVoterSession((await cookies()).get(VOTER_COOKIE)?.value);
  const payload = await req.json().catch(() => null);

  try {
    // The voter cookie is left to expire on its own: it lets the page show
    // "already recorded" on reload, and a second submit is refused anyway.
    const outcome = await submitBallot(session, payload?.selections, requestIp(req));
    return json(outcome.body, outcome.status);
  } catch (err) {
    logger.error("showcase_ballot_failed", err);
    return json({ error: "Your ballot was not recorded. Please try again." }, 500);
  }
}
