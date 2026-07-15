import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { advancedVariantFor } from "@/lib/advanced-variant";
import { openAdvancedArtifact } from "@/lib/advanced-artifact-storage";
import { prisma } from "@/lib/db";
import { resolvedInternCode } from "@/lib/intern-code";
import { isAdvancedStage } from "@/lib/advanced-stage";
import { stageRank } from "@/lib/stage-login";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const stage = request.nextUrl.searchParams.get("stage")?.toUpperCase() ?? "";
  if (!isAdvancedStage(stage)) {
    return Response.json({ error: "Artifact not found" }, { status: 404 });
  }

  const intern = await prisma.intern.findUnique({
    where: { userId: session.id },
    select: { id: true, currentStage: true, track: true, isActive: true },
  });
  if (!intern?.isActive || stageRank(stage) > stageRank(intern.currentStage)) {
    return Response.json({ error: "Artifact not found" }, { status: 404 });
  }

  const [window, grant, publicApp] = await Promise.all([
    prisma.stageWindow.findUnique({ where: { stage }, select: { status: true } }),
    prisma.advancedArtifactGrant.findUnique({
      where: { internId_stage: { internId: intern.id, stage } },
    }),
    prisma.publicApplication.findFirst({
      where: { email: session.email.toLowerCase() },
      select: { internId: true },
    }),
  ]);

  if (window?.status !== "OPEN") {
    return Response.json({ error: "Stage is not open" }, { status: 403 });
  }
  if (!grant || grant.track !== intern.track || grant.revokedAt) {
    return Response.json({ error: "Artifact not found" }, { status: 404 });
  }
  if (grant.expiresAt && grant.expiresAt.getTime() <= Date.now()) {
    return Response.json({ error: "Artifact grant has expired" }, { status: 410 });
  }

  const internCode = resolvedInternCode(publicApp?.internId);
  const expected = advancedVariantFor(intern.id, internCode, stage);
  if (grant.variant !== expected.variant || grant.marker !== expected.marker) {
    return Response.json({ error: "Artifact assignment mismatch" }, { status: 409 });
  }

  const artifact = await openAdvancedArtifact(grant.artifactKey);
  if (!artifact || (artifact.size !== null && artifact.size !== grant.sizeBytes)) {
    return Response.json({ error: "Artifact is unavailable" }, { status: 503 });
  }

  await prisma.advancedArtifactGrant.update({
    where: { id: grant.id },
    data: { downloadCount: { increment: 1 }, lastDownloadedAt: new Date() },
  });

  return new Response(artifact.body, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${grant.fileName.replaceAll('"', "")}"`,
      "Content-Length": String(grant.sizeBytes),
      "Content-Type": "application/gzip",
      "X-Artifact-SHA256": grant.sha256,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
