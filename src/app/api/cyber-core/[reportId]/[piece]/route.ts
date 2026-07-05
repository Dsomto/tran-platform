import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { isValidCyberCoreShareSig, certificateIdFor } from "@/lib/certificate-link";
import {
  promotionLetter,
  inDepthLetter,
  completionCard,
  badge,
  type CyberCoreData,
} from "@/lib/generate-cyber-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GENERATORS: Record<string, (d: CyberCoreData) => Promise<Buffer>> = {
  promotion: promotionLetter,
  indepth: inDepthLetter,
  card: completionCard,
  badge,
};

const FILE_LABEL: Record<string, string> = {
  promotion: "Promotion-Letter",
  indepth: "Letter",
  card: "Completion-Card",
  badge: "Badge",
};

const TRACK_LABEL: Record<string, string> = {
  SOC_ANALYSIS: "SOC Analysis",
  ETHICAL_HACKING: "Ethical Hacking",
  GRC: "GRC",
};

// Cyber Core Associate package pieces (Stage 4 graduation only). HMAC-signed
// URL, gated on PASSED. Mirrors the certificate / pass-letter routes.
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ reportId: string; piece: string }> }
) {
  try {
    const { reportId, piece } = await ctx.params;
    const gen = GENERATORS[piece];
    if (!gen) {
      return Response.json({ error: `Unknown piece "${piece}".` }, { status: 404 });
    }

    const sig = new URL(request.url).searchParams.get("sig");
    const report = await prisma.stageReport.findUnique({
      where: { id: reportId },
      include: { intern: { include: { user: true } } },
    });
    if (!report) return Response.json({ error: "Not found" }, { status: 404 });
    if (report.stage !== "STAGE_4") {
      return Response.json({ error: "The Cyber Core package is Stage 4 only." }, { status: 403 });
    }
    if (report.status !== "PASSED") {
      return Response.json({ error: "Available once the credential is issued." }, { status: 403 });
    }
    if (!isValidCyberCoreShareSig(report.id, report.intern.id, sig)) {
      return Response.json({ error: "Invalid or missing signature" }, { status: 403 });
    }

    const win = await prisma.stageWindow.findUnique({
      where: { stage: "STAGE_4" },
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

    const pdf = await gen(data);
    const safe = fullName.replace(/[^A-Za-z0-9\s-]/g, "").replace(/\s+/g, "-");
    const filename = `UBI-CyberCore-${FILE_LABEL[piece]}-${safe}.pdf`;

    return new Response(pdf as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    logger.error("cyber_core_piece_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
