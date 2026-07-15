import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdvancedStage, type AdvancedTrack } from "@/lib/advanced-stage";
import { stageRank } from "@/lib/stage-login";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRACK_SLUGS: Record<AdvancedTrack, string> = {
  SOC_ANALYSIS: "soc",
  ETHICAL_HACKING: "eh",
  GRC: "grc",
};

const CONTENT_TYPES: Record<string, string> = {
  ".csv": "text/csv; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".sql": "text/plain; charset=utf-8",
  ".yaml": "application/yaml; charset=utf-8",
  ".yml": "application/yaml; charset=utf-8",
};

function parseResource(resourcePath: string) {
  if (resourcePath.includes("..") || resourcePath.includes("\\") || resourcePath.includes("\0")) {
    return null;
  }

  const common = resourcePath.match(/^\/advanced-stage\/common\/([a-z0-9][a-z0-9._-]*)$/i);
  if (common) return { fileName: common[1], stage: null, track: null };

  const sharedStage = resourcePath.match(
    /^\/advanced-stage\/stage-([5-9])\/(integrity-attestation\.md)$/i
  );
  if (sharedStage) {
    return { fileName: sharedStage[2], stage: `STAGE_${sharedStage[1]}`, track: null };
  }

  const tracked = resourcePath.match(
    /^\/advanced-stage\/stage-([5-9])\/(soc|eh|grc)\/([a-z0-9][a-z0-9._-]*)$/i
  );
  if (!tracked) return null;
  return {
    fileName: tracked[3],
    stage: `STAGE_${tracked[1]}`,
    track: tracked[2].toLowerCase(),
  };
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const requestedStage = request.nextUrl.searchParams.get("stage")?.toUpperCase() ?? "";
  const resourcePath = request.nextUrl.searchParams.get("path") ?? "";
  const resource = parseResource(resourcePath);
  if (!isAdvancedStage(requestedStage) || !resource) {
    return Response.json({ error: "Resource not found" }, { status: 404 });
  }
  if (resource.stage && resource.stage !== requestedStage) {
    return Response.json({ error: "Resource not found" }, { status: 404 });
  }

  const privileged =
    session.role === "GRADER" || session.role === "ADMIN" || session.role === "SUPER_ADMIN";

  if (!privileged) {
    const intern = await prisma.intern.findUnique({
      where: { userId: session.id },
      select: { currentStage: true, track: true, isActive: true },
    });
    if (!intern?.isActive || stageRank(requestedStage) > stageRank(intern.currentStage)) {
      return Response.json({ error: "Resource not found" }, { status: 404 });
    }
    if (resource.track && TRACK_SLUGS[intern.track] !== resource.track) {
      return Response.json({ error: "Resource not found" }, { status: 404 });
    }

    const window = await prisma.stageWindow.findUnique({
      where: { stage: requestedStage },
      select: { status: true },
    });
    if (window?.status !== "OPEN") {
      return Response.json({ error: "Stage is not open" }, { status: 403 });
    }
  }

  const publicRoot = path.resolve(process.cwd(), "public");
  const absolutePath = path.resolve(publicRoot, `.${resourcePath}`);
  if (!absolutePath.startsWith(`${publicRoot}${path.sep}`)) {
    return Response.json({ error: "Resource not found" }, { status: 404 });
  }

  try {
    const file = await readFile(absolutePath);
    const extension = path.extname(resource.fileName).toLowerCase();
    return new Response(new Uint8Array(file), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `inline; filename="${resource.fileName}"`,
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Content-Type": CONTENT_TYPES[extension] ?? "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "Resource not found" }, { status: 404 });
  }
}
