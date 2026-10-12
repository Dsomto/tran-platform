import type { NextRequest } from "next/server";
import { auditMetaFromRequest, recordAudit } from "@/lib/audit";
import { NO_STORE, requireShowcaseAdmin } from "@/lib/showcase-http";
import { getShowcaseResults, resultsCsv } from "@/lib/showcase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const auth = await requireShowcaseAdmin();
  if (auth.response) return auth.response;
  const results = await getShowcaseResults();
  await recordAudit({
    actor: auth.session,
    action: "showcase.results.export",
    targetType: "OTHER",
    targetId: "showcase:cohort-one",
    details: { completedBallots: results.completedBallots, reconciled: results.reconciled },
    ...auditMetaFromRequest(req),
  });
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  return new Response(resultsCsv(results), {
    headers: {
      ...NO_STORE,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ubi-cohort-one-showcase-results-${stamp}.csv"`,
    },
  });
}
