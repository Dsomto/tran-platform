import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolvedInternCode } from "@/lib/intern-code";
import { socStage5DiscrepancyFor } from "@/lib/advanced-discrepancy";
import { stageRank } from "@/lib/stage-login";
import { stageWindowAcceptsSubmissions } from "@/lib/stage-window";

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
    select: { status: true, activeFrom: true, submitUntil: true },
  });
  if (!stageWindowAcceptsSubmissions(window)) {
    return Response.json({ error: "Stage is not open" }, { status: 403 });
  }

  const [publicApp, grant] = await Promise.all([
    prisma.publicApplication.findFirst({
      where: { email: session.email.toLowerCase() },
      select: { internId: true },
    }),
    prisma.advancedArtifactGrant.findUnique({
      where: { internId_stage: { internId: intern.id, stage: "STAGE_5" } },
      select: { track: true, marker: true, expiresAt: true, revokedAt: true },
    }),
  ]);
  if (
    !grant || grant.track !== "SOC_ANALYSIS" || grant.revokedAt ||
    (grant.expiresAt && grant.expiresAt.getTime() <= Date.now())
  ) {
    return Response.json({ error: "Discrepancy set not found" }, { status: 404 });
  }
  const internCode = resolvedInternCode(publicApp?.internId);
  const discrepancy = socStage5DiscrepancyFor(intern.id, internCode, grant.marker);

  return new Response(`${JSON.stringify(discrepancy, null, 2)}\n`, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${internCode.toLowerCase()}-stage-5-discrepancy.json"`,
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
