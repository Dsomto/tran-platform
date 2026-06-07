import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { generateDiscontinuationLetter } from "@/lib/generate-discontinuation-letter";
import { letterShareSig, letterIdFor } from "@/lib/certificate-link";

const STAGE_LABEL: Record<string, string> = {
  STAGE_0: "Stage 0 — Foundations",
  STAGE_1: "Stage 1 — Applied Cryptography",
  STAGE_2: "Stage 2 — Web Application Security",
  STAGE_3: "Stage 3 — Incident Response",
  STAGE_4: "Stage 4 — Governance & Risk",
  STAGE_5: "Stage 5 — Track Specialisation",
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

    const expectedSig = letterShareSig(report.id, report.intern.id);
    if (sig !== expectedSig) {
      return Response.json({ error: "Invalid or missing signature" }, { status: 403 });
    }

    const fullName =
      `${report.intern.user.firstName} ${report.intern.user.lastName}`.trim() ||
      report.intern.user.email;
    const stageLabel = STAGE_LABEL[report.stage] ?? report.stage;

    // StageWindow.passingScore is the threshold at the time of finalize.
    const win = await prisma.stageWindow.findUnique({
      where: { stage: report.stage },
      select: { passingScore: true },
    });
    const passingScore = win?.passingScore ?? 70;

    // Effective discontinuation date is computed from finalizedAt (set when
    // the admin clicked Finalize) so the PDF reads the same date the email
    // already promised. Falls back to gradedAt if finalizedAt is missing
    // (older reports finalised before the field was added).
    const issuedAt = report.finalizedAt ?? report.gradedAt ?? new Date();
    const effectiveDate = new Date(issuedAt.getTime() + 2 * 24 * 60 * 60 * 1000);

    const pdf = await generateDiscontinuationLetter({
      fullName,
      stageLabel,
      score: report.finalScore ?? report.score ?? 0,
      passingScore,
      issuedAt,
      effectiveDate,
      letterId: letterIdFor(report.id),
    });

    const safeName = fullName.replace(/[^A-Za-z0-9\s-]/g, "").replace(/\s+/g, "-");
    const filename = `UBI-Letter-${safeName}-${report.stage}.pdf`;

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
