import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolvedInternCode } from "@/lib/intern-code";
import { stageWindowAcceptsSubmissions } from "@/lib/stage-window";

function derive(secret: string, binding: string, label: string, length = 24): string {
  return createHmac("sha256", secret).update(`${binding}:${label}`).digest("hex").slice(0, length);
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    const next = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search);
    return Response.redirect(new URL(`/login?next=${next}`, request.url));
  }

  const intern = await prisma.intern.findUnique({
    where: { userId: session.id },
    select: { id: true, track: true, currentStage: true, isActive: true },
  });
  if (!intern?.isActive) return Response.json({ error: "Intern profile not found" }, { status: 404 });
  if (intern.track !== "ETHICAL_HACKING" || intern.currentStage !== "STAGE_8") {
    return Response.json({ error: "This private input is available only to active Stage 8 Ethical Hacking associates" }, { status: 403 });
  }

  const window = await prisma.stageWindow.findUnique({ where: { stage: "STAGE_8" } });
  if (!stageWindowAcceptsSubmissions(window)) {
    return Response.json({ error: "Stage 8 is not open" }, { status: 403 });
  }

  const grant = await prisma.advancedArtifactGrant.findUnique({
    where: { internId_stage: { internId: intern.id, stage: "STAGE_8" } },
    select: { track: true, variant: true, marker: true, revokedAt: true, expiresAt: true },
  });
  if (
    !grant ||
    grant.track !== intern.track ||
    grant.revokedAt ||
    (grant.expiresAt && grant.expiresAt.getTime() <= Date.now())
  ) {
    return Response.json({ error: "A valid Stage 8 artifact grant is required" }, { status: 403 });
  }

  const application = await prisma.publicApplication.findFirst({
    where: { email: session.email.toLowerCase() },
    select: { internId: true },
  });
  const internCode = resolvedInternCode(application?.internId);
  const secret = process.env.ADVANCED_ARTIFACT_SECRET;
  if (!secret || secret.length < 32) {
    return Response.json({ error: "Private input signing is unavailable" }, { status: 503 });
  }

  const binding = createHmac("sha256", secret)
    .update(`stage8-portable-eh:${intern.id}:${internCode}:${grant.variant}:${grant.marker}`)
    .digest("hex");
  const suffix = derive(secret, binding, "name", 8);
  const payload = {
    schema_version: "2.0",
    project: "EH-A4-PORTABLE",
    intern_code: internCode,
    variant: grant.variant.replace(/^V/, "D"),
    marker: grant.marker,
    candidate_binding: binding.slice(0, 20),
    domain_dn: "DC=netforge,DC=local",
    domain_netbios: "NETFORGE",
    foothold_user: `candidate-${suffix}`,
    foothold_secret: derive(secret, binding, "foothold"),
    service_user: `svc-archive-${suffix}`,
    service_secret: derive(secret, binding, "service"),
    path_1_proof: `NF-AD1-${derive(secret, binding, "path-1", 28)}`,
    path_2_proof: `NF-AD2-${derive(secret, binding, "path-2", 28)}`,
  };

  return new Response(`${JSON.stringify(payload, null, 2)}\n`, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${internCode.toLowerCase()}-stage-8-eh-variant.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
