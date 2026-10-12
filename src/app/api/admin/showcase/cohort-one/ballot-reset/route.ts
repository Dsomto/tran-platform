import type { NextRequest } from "next/server";
import { auditMetaFromRequest, recordAudit } from "@/lib/audit";
import { guardAuthorisedAction } from "@/lib/email-send-guard";
import { json, requireShowcaseAdmin } from "@/lib/showcase-http";
import { resetBallotByEmail } from "@/lib/showcase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const auth = await requireShowcaseAdmin();
  if (auth.response) return auth.response;
  const body = await req.json().catch(() => null);
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (reason.length < 10 || reason.length > 500) return json({ error: "Give a reason of 10 to 500 characters." }, 400);

  const denied = await guardAuthorisedAction(auth.session, body?.totpCode, "Only the authorised account can reset a ballot.");
  if (denied) return denied;

  const result = await resetBallotByEmail(body?.email);
  if (!result.ok) return json({ error: result.error }, result.status);

  await recordAudit({
    actor: auth.session,
    action: "showcase.ballot.reset",
    targetType: "OTHER",
    targetId: result.ballotId,
    details: { reason, voterId: result.voterId, removedVotes: result.removedVotes },
    ...auditMetaFromRequest(req),
  });
  return json({ ok: true });
}
