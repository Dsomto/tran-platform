import { json, requireShowcaseAdmin } from "@/lib/showcase-http";
import { checkEntryLinks } from "@/lib/showcase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 30;

export async function POST() {
  const auth = await requireShowcaseAdmin();
  if (auth.response) return auth.response;
  return json({ checks: await checkEntryLinks(), checkedAt: new Date().toISOString() });
}
