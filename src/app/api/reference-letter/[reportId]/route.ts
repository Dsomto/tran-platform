import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { generateReferenceLetter } from "@/lib/generate-reference-letter";
import { credentialFor, isAdvancedStage } from "@/lib/advanced-credential";
import { isAdvancedTrack, type AdvancedTrack } from "@/lib/advanced-stage";
import { isValidReferenceShareSig, referenceIdFor } from "@/lib/certificate-link";

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

// Employer-facing reference letter ("To whom it may concern") for advanced
// programme results. Mirrors the certificate and close-letter routes:
// HMAC-signed URL, gated on a finalised result, PDF response.
//
// Unlike those two, this one serves BOTH outcomes, and reads the same either
// way: it describes work that was performed and assessed, and never mentions
// whether the holder advanced. A reference exists to open a door, and a
// capped-cohort ranking decision is a fact about our capacity rather than
// their ability. `completed` only adds the conferred-standing line, and
// `completedWork` lists solely stages actually PASSED, so nothing here implies
// a credential the holder does not hold.
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

    // Body of work: only stages actually PASSED. The letter leans on this list
    // as its evidence, so a stage that was failed or never finalised must not
    // appear in it. The furthest stage is described separately in the prose.
    const history = await prisma.stageReport.findMany({
      where: { internId: report.intern.id, status: "PASSED" },
      orderBy: { stage: "asc" },
      select: { stage: true },
    });
    const completedWork = history.map((h) => ({
      label: STAGE_LABEL[h.stage] ?? h.stage,
      project: isAdvancedStage(h.stage)
        ? credentialFor(h.stage, report.intern.track as AdvancedTrack).project
        : null,
    }));

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
      completedWork,
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
