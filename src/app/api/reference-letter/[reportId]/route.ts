import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { generateReferenceLetter } from "@/lib/generate-reference-letter";
import { isAdvancedStage } from "@/lib/advanced-credential";
import { isAdvancedTrack } from "@/lib/advanced-stage";
import { isValidReferenceShareSig, referenceIdFor } from "@/lib/certificate-link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Employer-facing reference letter ("To whom it may concern") for advanced
// programme results. Mirrors the certificate and close-letter routes:
// HMAC-signed URL, gated on a finalised result, PDF response.
//
// Unlike those two, this one serves BOTH outcomes. A pass and a non-advance
// both describe work that was performed and assessed, which is what a
// reference attests to — `completed` only controls whether the letter may also
// state that the work met the advancement standard. It never implies a
// credential that was not earned.
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
      return Response.json({ error: "Reference letter not found" }, { status: 404 });
    }
    if (report.status !== "PASSED" && report.status !== "FAILED") {
      return Response.json(
        { error: "A reference letter is only available once the result is finalised." },
        { status: 403 }
      );
    }
    if (!isAdvancedStage(report.stage)) {
      return Response.json(
        { error: "Reference letters are issued for advanced-programme stages only." },
        { status: 404 }
      );
    }
    if (!isValidReferenceShareSig(report.id, report.intern.id, sig)) {
      return Response.json({ error: "Invalid or missing signature" }, { status: 403 });
    }
    if (!isAdvancedTrack(report.intern.track)) {
      logger.error("reference_letter_invalid_track", {
        reportId: report.id,
        track: report.intern.track,
      });
      return Response.json({ error: "Invalid advanced-programme track" }, { status: 500 });
    }

    const fullName =
      `${report.intern.user.firstName} ${report.intern.user.lastName}`.trim() ||
      report.intern.user.email;

    // The selectivity paragraph states a real number to a third party, so it
    // is counted at render time rather than carried as a constant. If the
    // count is unavailable the generator simply omits that paragraph — an
    // unverifiable figure in an employer-facing letter is worse than none.
    let applicantPool: number | null = null;
    try {
      applicantPool = await prisma.publicApplication.count();
    } catch (error) {
      logger.error("reference_letter_applicant_count_failed", error);
    }

    const pdf = await generateReferenceLetter({
      fullName,
      stage: report.stage,
      track: report.intern.track,
      issuedAt: report.finalizedAt ?? report.gradedAt ?? new Date(),
      letterId: referenceIdFor(report.id),
      completed: report.status === "PASSED",
      applicantPool,
      cohortAtStage: report.advancedCohortSize,
    });

    const safeName = fullName.replace(/[^A-Za-z0-9\s-]/g, "").replace(/\s+/g, "-");
    const filename = `UBI-Reference-${safeName}-${report.stage}.pdf`;
    // A reference is usually opened and read before being forwarded, so allow
    // inline viewing the same way the certificate route does.
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
    logger.error("reference_letter_generate_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
