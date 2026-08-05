import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { generateDiscontinuationLetter } from "@/lib/generate-discontinuation-letter";
import { generateHonourableCloseLetter } from "@/lib/generate-honourable-close-letter";
import { isAdvancedStage } from "@/lib/advanced-credential";
import { isAdvancedTrack } from "@/lib/advanced-stage";
import { isValidLetterShareSig, letterIdFor } from "@/lib/certificate-link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAGE_LABEL: Record<string, string> = {
  STAGE_0: "Stage 0 — Foundations",
  STAGE_1: "Stage 1 — Applied Cryptography",
  STAGE_2: "Stage 2 — Web Application Security",
  STAGE_3: "Stage 3 — Incident Response",
  STAGE_4: "Stage 4 — Governance & Risk",
  STAGE_5: "Stage 5 — Track Specialisation",
  STAGE_6: "Stage 6 — Advanced Exposure",
  STAGE_7: "Stage 7 — Security Architecture",
  STAGE_8: "Stage 8 — Adversarial Assessment",
  STAGE_9: "Stage 9 — Advanced Final Case",
};

// Discontinuation letter download. Mirrors the certificate route exactly —
// HMAC-signed URL, gated on report.status === "FAILED", PDF response.
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
      return Response.json({ error: "Letter not found" }, { status: 404 });
    }
    if (report.status !== "FAILED") {
      return Response.json(
        { error: "This letter is only available for finalised eliminated results." },
        { status: 403 }
      );
    }

    if (!isValidLetterShareSig(report.id, report.intern.id, sig)) {
      return Response.json({ error: "Invalid or missing signature" }, { status: 403 });
    }

    const fullName =
      `${report.intern.user.firstName} ${report.intern.user.lastName}`.trim() ||
      report.intern.user.email;
    const stageLabel = STAGE_LABEL[report.stage] ?? report.stage;

    // Effective discontinuation date is computed from finalizedAt (set when
    // the admin clicked Finalize) so the PDF reads the same date the email
    // already promised. Falls back to gradedAt if finalizedAt is missing
    // (older reports finalised before the field was added).
    const issuedAt = report.finalizedAt ?? report.gradedAt ?? new Date();
    const effectiveDate = new Date(issuedAt.getTime() + 2 * 24 * 60 * 60 * 1000);

    const letterId = letterIdFor(report.id);
    let pdf: Buffer;
    if (isAdvancedStage(report.stage)) {
      if (!isAdvancedTrack(report.intern.track)) {
        logger.error("advanced_close_letter_invalid_track", {
          reportId: report.id,
          track: report.intern.track,
        });
        return Response.json({ error: "Invalid advanced-programme track" }, { status: 500 });
      }
      const application = await prisma.publicApplication.findFirst({
        where: { email: report.intern.user.email.toLowerCase() },
        select: { returningCode: true },
      });
      pdf = await generateHonourableCloseLetter({
        fullName,
        stage: report.stage,
        track: report.intern.track,
        issuedAt,
        effectiveDate,
        letterId,
        returningCode: application?.returningCode ?? null,
        cohortAtStage: report.advancedCohortSize,
      });
    } else {
      // Core-stage letters retain the score-threshold wording used before the
      // advanced programme moved to within-track ranking.
      const win = await prisma.stageWindow.findUnique({
        where: { stage: report.stage },
        select: { passingScore: true },
      });
      pdf = await generateDiscontinuationLetter({
        fullName,
        stageLabel,
        score: report.finalScore ?? report.score ?? 0,
        passingScore: win?.passingScore ?? 70,
        issuedAt,
        effectiveDate,
        letterId,
      });
    }

    const safeName = fullName.replace(/[^A-Za-z0-9\s-]/g, "").replace(/\s+/g, "-");
    const filename = `UBI-Close-Letter-${safeName}-${report.stage}-${report.intern.track}.pdf`;

    return new Response(pdf as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    logger.error("letter_generate_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
