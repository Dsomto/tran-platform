import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { generatePerformanceRecord, type StageRow } from "@/lib/generate-performance-record";
import { isAdvancedTrack } from "@/lib/advanced-stage";
import { isReportResultReleased } from "@/lib/report-visibility";
import {
  isValidPerformanceRecordShareSig,
  performanceRecordIdFor,
} from "@/lib/certificate-link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAGE_LABEL: Record<string, string> = {
  STAGE_0: "Stage 0 — Foundations",
  STAGE_1: "Stage 1 — Applied Cryptography",
  STAGE_2: "Stage 2 — Web Application Security",
  STAGE_3: "Stage 3 — Incident Response",
  STAGE_4: "Stage 4 — Governance & Risk",
  STAGE_5: "Stage 5 — Signal",
  STAGE_6: "Stage 6 — Exposure",
  STAGE_7: "Stage 7 — Architecture",
  STAGE_8: "Stage 8 — Adversity",
  STAGE_9: "Stage 9 — The Final Case",
};

// Personal performance record. Unlike every other document route this one is
// not about a single report: it covers the intern's whole run through the
// programme. `reportId` addresses the finalised result the record is issued
// off the back of, and the rest of the history is looked up from its intern.
//
// The one rule that matters here: only RELEASED results may appear. A report
// that is GRADED or PENDING_* has a score the intern has not been told yet,
// and printing it in a downloadable PDF would publish a decision before the
// programme does. isReportResultReleased is the same gate the dashboard uses.
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await ctx.params;
    const url = new URL(request.url);
    const sig = url.searchParams.get("sig");

    const anchor = await prisma.stageReport.findUnique({
      where: { id: reportId },
      include: { intern: { include: { user: true } } },
    });
    if (!anchor) {
      return Response.json({ error: "Performance record not found" }, { status: 404 });
    }
    if (!isReportResultReleased(anchor.status)) {
      return Response.json(
        { error: "The performance record is only available once the result is finalised." },
        { status: 403 }
      );
    }
    if (!isValidPerformanceRecordShareSig(anchor.id, anchor.intern.id, sig)) {
      return Response.json({ error: "Invalid or missing signature" }, { status: 403 });
    }
    if (!isAdvancedTrack(anchor.intern.track)) {
      logger.error("performance_record_invalid_track", {
        reportId: anchor.id,
        track: anchor.intern.track,
      });
      return Response.json({ error: "Invalid track" }, { status: 500 });
    }

    const [reports, windows] = await Promise.all([
      prisma.stageReport.findMany({
        where: { internId: anchor.intern.id },
        orderBy: { stage: "asc" },
        select: {
          stage: true, status: true, score: true, finalScore: true, feedback: true,
        },
      }),
      prisma.stageWindow.findMany({ select: { stage: true, passingScore: true } }),
    ]);

    const passingByStage = new Map(windows.map((w) => [w.stage, w.passingScore]));

    const stages: StageRow[] = reports
      .filter((r) => isReportResultReleased(r.status))
      .map((r) => ({
        label: STAGE_LABEL[r.stage] ?? r.stage,
        score: r.finalScore ?? r.score ?? null,
        passingScore: passingByStage.get(r.stage) ?? 70,
        status: r.status,
        feedback: r.feedback,
      }));

    if (stages.length === 0) {
      return Response.json(
        { error: "No finalised results to report yet." },
        { status: 404 }
      );
    }

    const fullName =
      `${anchor.intern.user.firstName} ${anchor.intern.user.lastName}`.trim() ||
      anchor.intern.user.email;

    const application = await prisma.publicApplication.findFirst({
      where: { email: anchor.intern.user.email.toLowerCase() },
      select: { internId: true },
    });

    const pdf = await generatePerformanceRecord({
      fullName,
      internCode: application?.internId ?? null,
      track: anchor.intern.track,
      issuedAt: anchor.finalizedAt ?? anchor.gradedAt ?? new Date(),
      recordId: performanceRecordIdFor(anchor.id),
      stages,
    });

    const safeName = fullName.replace(/[^A-Za-z0-9\s-]/g, "").replace(/\s+/g, "-");
    const filename = `UBI-Performance-Record-${safeName}.pdf`;
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
    logger.error("performance_record_generate_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
