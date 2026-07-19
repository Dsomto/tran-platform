import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { advancedVariantFor } from "@/lib/advanced-variant";
import { resolvedInternCode } from "@/lib/intern-code";
import { socStage5DiscrepancyFor } from "@/lib/advanced-discrepancy";
import { stageRank } from "@/lib/stage-login";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const stage = request.nextUrl.searchParams.get("stage")?.toUpperCase() ?? "";
  if (stage !== "STAGE_5") {
    return Response.json({ error: "Discrepancy set not found" }, { status: 404 });
  }

  const intern = await prisma.intern.findUnique({
    where: { userId: session.id },
    select: { id: true, currentStage: true, track: true, isActive: true },
  });
  if (
    !intern?.isActive ||
    stageRank(intern.currentStage) < stageRank("STAGE_5") ||
    intern.track !== "SOC_ANALYSIS"
  ) {
    return Response.json({ error: "Discrepancy set not found" }, { status: 404 });
  }

  const window = await prisma.stageWindow.findUnique({
    where: { stage: "STAGE_5" },
    select: { status: true },
  });
  if (window?.status !== "OPEN") {
    return Response.json({ error: "Stage is not open" }, { status: 403 });
  }

  const publicApp = await prisma.publicApplication.findFirst({
    where: { email: session.email.toLowerCase() },
    select: { internId: true },
  });
  const internCode = resolvedInternCode(publicApp?.internId);
  const variant = advancedVariantFor(intern.id, internCode, "STAGE_5");
  const discrepancy = socStage5DiscrepancyFor(intern.id, internCode, variant.marker);

  return new Response(`${JSON.stringify(discrepancy, null, 2)}\n`, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${internCode.toLowerCase()}-stage-5-discrepancy.json"`,
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
