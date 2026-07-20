import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { advancedTrackLabel, isAdvancedStage, type AdvancedTrack } from "@/lib/advanced-stage";
import { renderMarkdownPdf } from "@/lib/advanced-doc-pdf";
import { stageRank } from "@/lib/stage-login";
import { stageWindowAcceptsSubmissions } from "@/lib/stage-window";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRACK_SLUGS: Record<AdvancedTrack, string> = {
  SOC_ANALYSIS: "soc",
  ETHICAL_HACKING: "eh",
  GRC: "grc",
};

const TRACK_BY_SLUG: Record<string, AdvancedTrack> = {
  soc: "SOC_ANALYSIS",
  eh: "ETHICAL_HACKING",
  grc: "GRC",
};

/** Humanize a filename into a title when the markdown has no leading "# ". */
function titleFromFileName(fileName: string): string {
  return fileName
    .replace(/\.md$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function docTitleAndBody(markdown: string, fileName: string): { title: string; body: string } {
  const match = markdown.match(/^#\s+(.+?)\s*\n([\s\S]*)$/);
  if (match) return { title: match[1].trim(), body: match[2] };
  return { title: titleFromFileName(fileName), body: markdown };
}

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
  // Always a direct browser navigation (target=_blank), never fetch/XHR — a
  // bare 401 JSON body reads as "the download is broken" once the hour-long
  // session expires. Redirect to login with a return path instead.
  if (!session) {
    const next = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(new URL(`/login?next=${next}`, request.url));
  }

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
      select: { status: true, activeFrom: true, submitUntil: true },
    });
    if (!stageWindowAcceptsSubmissions(window)) {
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

    // Markdown briefs/contracts/templates render as a designed PDF so
    // interns get something meant to be read, not a raw .md file. Every
    // other extension (json/csv/yaml/sql) is untouched — same bytes, same
    // content type as before.
    if (extension === ".md") {
      const { title, body } = docTitleAndBody(file.toString("utf8"), resource.fileName);
      const eyebrow = resource.track
        ? `${advancedTrackLabel(TRACK_BY_SLUG[resource.track])} / ${requestedStage.replace("_", " ")}`
        : "UBI Advanced Programme / Common";
      const pdf = await renderMarkdownPdf({ eyebrow, title, markdown: body });
      const pdfName = resource.fileName.replace(/\.md$/i, ".pdf");
      return new Response(new Uint8Array(pdf), {
        headers: {
          "Cache-Control": "private, no-store",
          "Content-Disposition": `inline; filename="${pdfName}"`,
          "Content-Security-Policy": "default-src 'none'; sandbox",
          "Content-Type": "application/pdf",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

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
