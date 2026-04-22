import { requireAdmin } from "@/lib/auth";
import { StageResultsPanel } from "./stage-results-panel";

export default async function StageResultsPage() {
  await requireAdmin();
  return <StageResultsPanel />;
}
