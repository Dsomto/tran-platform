import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { generatePortfolioDossier, type DossierEntry } from "@/lib/generate-portfolio-dossier";
import { isAdvancedStage, standingFor } from "@/lib/advanced-credential";
import { isAdvancedTrack } from "@/lib/advanced-stage";
import { dossierIdFor, isValidDossierShareSig } from "@/lib/certificate-link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAGE_LABEL: Record<string, string> = {
  STAGE_0: "Stage 0 — Foundations",
  STAGE_1: "Stage 1 — Applied Cryptography",
  STAGE_2: "Stage 2 — Web Application Security",
  STAGE_3: "Stage 3 — Incident Response",
  STAGE_4: "Stage 4 — Governance & Risk",
  STAGE_5: "Advanced Stage 5 — Signal",
  STAGE_6: "Advanced Stage 6 — Exposure",
  STAGE_7: "Advanced Stage 7 — Architecture",
  STAGE_8: "Advanced Stage 8 — Adversity",
  STAGE_9: "Advanced Stage 9 — The Final Case",
};

// Portfolio dossier. Issued on the same terms as the reference letter — to
// anyone who reached an advanced project, whichever way the result went — and
// it never states advancement status. Only stages actually PASSED are listed,
// so the document needs no disclaimer to stay honest.
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
      return Response.json({ error: "Dossier not found" }, { status: 404 });
    }
    if (report.status !== "PASSED" && report.status !== "FAILED") {
      return Response.json(
        { error: "The dossier is only available once the result is finalised." },
        { status: 403 }
      );
    }
    if (!isAdvancedStage(report.stage)) {
      return Response.json(
        { error: "Dossiers are issued for advanced-programme stages only." },
        { status: 404 }
      );
    }
    if (!isValidDossierShareSig(report.id, report.intern.id, sig)) {
      return Response.json({ error: "Invalid or missing signature" }, { status: 403 });
    }
    if (!isAdvancedTrack(report.intern.track)) {
      logger.error("dossier_invalid_track", { reportId: report.id, track: report.intern.track });
      return Response.json({ error: "Invalid advanced-programme track" }, { status: 500 });
    }

    const passedReports = await prisma.stageReport.findMany({
      where: { internId: report.intern.id, status: "PASSED" },
      orderBy: { stage: "asc" },
      select: { stage: true },
    });
    const completed: DossierEntry[] = passedReports.map((r) => ({
      stage: r.stage,
      label: STAGE_LABEL[r.stage] ?? r.stage,
    }));
    if (completed.length === 0) {
      return Response.json({ error: "No completed work to report yet." }, { status: 404 });
    }

    // Highest standing genuinely earned — the furthest advanced stage PASSED,
    // which is not necessarily the stage this dossier was issued off.
    const highestAdvanced = [...passedReports]
      .map((r) => r.stage)
      .filter(isAdvancedStage)
      .pop();
    const earnedStanding = highestAdvanced
      ? standingFor(highestAdvanced, report.intern.track)
      : null;

    const fullName =
      `${report.intern.user.firstName} ${report.intern.user.lastName}`.trim() ||
      report.intern.user.email;

    const [application, applicantPool] = await Promise.all([
      prisma.publicApplication.findFirst({
        where: { email: report.intern.user.email.toLowerCase() },
        select: { internId: true },
      }),
      prisma.publicApplication.count().catch(() => null),
    ]);

    const pdf = await generatePortfolioDossier({
      fullName,
      internCode: application?.internId ?? null,
      track: report.intern.track,
      completed,
      earnedStanding,
      issuedAt: report.finalizedAt ?? report.gradedAt ?? new Date(),
      dossierId: dossierIdFor(report.id),
      applicantPool,
    });

    const safeName = fullName.replace(/[^A-Za-z0-9\s-]/g, "").replace(/\s+/g, "-");
    const filename = `UBI-Portfolio-Dossier-${safeName}.pdf`;
    const disposition = url.searchParams.get("inline") === "1" ? "inline" : "attachment";

    return new Response(pdf as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    logger.error("dossier_generate_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
