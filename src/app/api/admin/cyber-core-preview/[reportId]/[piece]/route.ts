import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireApiSuperAdmin } from "@/lib/api-auth";
import { certificateIdFor } from "@/lib/certificate-link";
import { generateStageCertificate } from "@/lib/generate-certificate";
import {
  promotionLetter,
  inDepthLetter,
  completionCard,
  badge,
  type CyberCoreData,
} from "@/lib/generate-cyber-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRACK_LABEL: Record<string, string> = {
  SOC_ANALYSIS: "SOC Analysis",
  ETHICAL_HACKING: "Ethical Hacking",
  GRC: "GRC",
};

const OBJECT_ID = /^[a-f0-9]{24}$/i;

// Super-admin-only preview of the Cyber Core package for ANY Stage 4 report,
// regardless of PASSED status. Lets the programme office see exactly what each
// associate will download before running finalize. Requires a super-admin
// session (no share signature needed).
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ reportId: string; piece: string }> }
) {
  try {
    const auth = await requireApiSuperAdmin();
    if (auth.response) return auth.response;

    const { reportId, piece } = await ctx.params;
    if (!OBJECT_ID.test(reportId)) {
      return Response.json({ error: "Malformed report id." }, { status: 404 });
    }

    const report = await prisma.stageReport.findUnique({
      where: { id: reportId },
      include: { intern: { include: { user: true } } },
    });
    if (!report) return Response.json({ error: "Report not found" }, { status: 404 });

    const win = await prisma.stageWindow.findUnique({
      where: { stage: report.stage },
      select: { passingScore: true },
    });
    const fullName =
      `${report.intern.user.firstName ?? ""} ${report.intern.user.lastName ?? ""}`.trim() ||
      report.intern.user.email;
    const data: CyberCoreData = {
      fullName,
      firstName: report.intern.user.firstName || "there",
      uid: certificateIdFor(report.id),
      track: TRACK_LABEL[report.intern.track] ?? "Specialisation",
      score: report.finalScore ?? report.score ?? win?.passingScore ?? 0,
      cohort: "01",
      issuedAt: report.finalizedAt ?? report.gradedAt ?? new Date(),
    };

    let pdf: Buffer;
    if (piece === "certificate") {
      pdf = await generateStageCertificate({
        fullName,
        stageLabel: "Stage 4 — Governance & Risk",
        score: data.score,
        passingScore: win?.passingScore ?? 70,
        issuedAt: data.issuedAt,
        certId: data.uid,
        stageKey: report.stage,
      });
    } else if (piece === "promotion") pdf = await promotionLetter(data);
    else if (piece === "indepth") pdf = await inDepthLetter(data);
    else if (piece === "card") pdf = await completionCard(data);
    else if (piece === "badge") pdf = await badge(data);
    else return Response.json({ error: `Unknown piece "${piece}".` }, { status: 404 });

    return new Response(pdf as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="preview-${piece}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logger.error("cyber_core_preview_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
