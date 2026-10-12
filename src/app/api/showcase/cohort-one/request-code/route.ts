import { after, type NextRequest } from "next/server";
import { sendRawHtmlEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { crossSiteRejection, json, limitBy, networkKey, requestIp, SHOWCASE_LIMITS } from "@/lib/showcase-http";
import { emailHash, normalizeEmail, renderVotingCodeEmail, requestVotingCode } from "@/lib/showcase-vote";

export const dynamic = "force-dynamic";

async function deliverCode(to: string, code: string): Promise<void> {
  // Pace account-wide so a burst of voters cannot trip the provider's limit.
  for (let attempt = 0; attempt < 15; attempt += 1) {
    const slot = await rateLimit("showcase:code-mail:global", SHOWCASE_LIMITS.codeMailGlobal);
    if (slot.ok) break;
    await new Promise((r) => setTimeout(r, Math.max(250, slot.retryAfterMs)));
  }
  const { subject, html } = renderVotingCodeEmail(code);
  try {
    await sendRawHtmlEmail(to, subject, html);
  } catch (err) {
    // Never log the code or the address.
    logger.error("showcase_code_email_failed", err);
  }
}

export async function POST(req: NextRequest) {
  const blocked = crossSiteRejection(req);
  if (blocked) return blocked;

  const network = networkKey(req);
  const byNetwork = await limitBy("code:net", network, SHOWCASE_LIMITS.codePerNetwork);
  if (byNetwork) return byNetwork;

  const payload = await req.json().catch(() => null);
  const email = normalizeEmail(payload?.email);
  if (email) {
    const byEmail = await limitBy("code:email", emailHash(email).slice(0, 32), SHOWCASE_LIMITS.codePerEmail);
    if (byEmail) return byEmail;
  }

  try {
    const outcome = await requestVotingCode(payload?.email, requestIp(req));
    const delivery = outcome.deliver;
    if (delivery) after(() => deliverCode(delivery.to, delivery.code));
    return json(outcome.body, outcome.status);
  } catch (err) {
    logger.error("showcase_request_code_failed", err);
    return json({ error: "Something went wrong. Please try again in a moment." }, 500);
  }
}
