import { json, requireShowcaseAdmin } from "@/lib/showcase-http";
import { getShowcaseResults, getSuspiciousActivity } from "@/lib/showcase-admin";
import { getShowcaseSettings, votingPhase } from "@/lib/showcase-vote";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const auth = await requireShowcaseAdmin();
  if (auth.response) return auth.response;
  const [results, suspicious, settings] = await Promise.all([getShowcaseResults(), getSuspiciousActivity(), getShowcaseSettings()]);
  return json({ settings, phase: votingPhase(settings), results, suspicious });
}
