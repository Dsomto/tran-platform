import { STAGE_SLUGS, STAGE_SLUG_TO_ENUM, type StageSlug } from "@/lib/stage-login";
import { getStageAccess } from "@/lib/stage-access";
import { STAGE_BRIEFS } from "@/lib/stage-briefs";
import { generateStageBriefPdf } from "@/lib/generate-stage-brief";
import { logger } from "@/lib/logger";

// pdfkit needs Node APIs (filesystem for fonts) — never Edge.
export const runtime = "nodejs";
// Don't cache — every download recomputes with the current intern's stamp.
export const dynamic = "force-dynamic";

// GET /api/stage-brief/[stage]/pdf — downloadable capstone brief.
// Gated by the stage door session; the intern can only download the brief
// for a stage they've already unlocked and signed into.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ stage: string }> }
) {
  try {
    const { stage: rawSlug } = await params;
    const slug = rawSlug as StageSlug;
    if (!STAGE_SLUGS.includes(slug)) {
      return Response.json({ error: "Unknown stage" }, { status: 404 });
    }

    const result = await getStageAccess(slug);
    if (!result.ok) {
      const status = result.reason === "no-session" ? 401 : 403;
      return Response.json({ error: result.reason }, { status });
    }

    const enumKey = STAGE_SLUG_TO_ENUM[slug] as keyof typeof STAGE_BRIEFS;
    const brief = STAGE_BRIEFS[enumKey];
    if (!brief) {
      return Response.json({ error: "No brief for this stage" }, { status: 404 });
    }

    const pdf = await generateStageBriefPdf({
      brief,
      internCode: result.access.internCode,
      downloadedAt: new Date(),
    });

    const filename = `${slug}-capstone-brief.pdf`;
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=0, no-store",
      },
    });
  } catch (error) {
    logger.error("stage_brief_pdf_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
