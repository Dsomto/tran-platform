import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { generateProofOfWorkBadge } from "@/lib/generate-proof-of-work-badge";
import { isValidProofBadgeShareSig, proofBadgeIdFor } from "@/lib/certificate-link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await ctx.params;
    const url = new URL(request.url);
    const sig = url.searchParams.get("sig");

    const report = await prisma.stageReport.findUnique({
      where: { id: reportId },
      include: { intern: { include: { user: true } } },
    });
    if (!report) {
      return Response.json({ error: "Badge not found" }, { status: 404 });
    }
    if (report.stage !== "STAGE_3" || report.status !== "PASSED") {
      return Response.json(
        { error: "Proof-of-work badge is only available for passed Stage 3 reports." },
        { status: 403 }
      );
    }

    if (!isValidProofBadgeShareSig(report.id, report.intern.id, sig)) {
      return Response.json({ error: "Invalid or missing signature" }, { status: 403 });
    }

    const fullName =
      `${report.intern.user.firstName} ${report.intern.user.lastName}`.trim() ||
      report.intern.user.email;
    const win = await prisma.stageWindow.findUnique({
      where: { stage: report.stage },
      select: { passingScore: true },
    });

    const svg = generateProofOfWorkBadge({
      fullName,
      score: report.finalScore ?? report.score ?? 0,
      passingScore: win?.passingScore ?? 70,
      issuedAt: report.finalizedAt ?? report.gradedAt ?? new Date(),
      badgeId: proofBadgeIdFor(report.id),
    });

    const safeName = fullName.replace(/[^A-Za-z0-9\s-]/g, "").replace(/\s+/g, "-");
    const filename = `UBI-Proof-of-Work-Badge-${safeName}-STAGE_3.svg`;

    return new Response(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    logger.error("proof_badge_generate_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
