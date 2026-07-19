import { requireSuperAdmin } from "@/lib/auth";
import { CutoffReviewPanel } from "./cutoff-review-panel";

const STAGE_KEYS = new Set([
  "STAGE_0",
  "STAGE_1",
  "STAGE_2",
  "STAGE_3",
  "STAGE_4",
  "STAGE_5",
  "STAGE_6",
  "STAGE_7",
  "STAGE_8",
  "STAGE_9",
]);

export default async function StageResultsReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  await requireSuperAdmin();
  const sp = await searchParams;
  const stage = sp.stage && STAGE_KEYS.has(sp.stage) ? sp.stage : "STAGE_0";
  return <CutoffReviewPanel stage={stage} />;
}
