import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { generateStageCertificate } from "@/lib/generate-certificate";
import { certificateShareSig, certificateIdFor } from "@/lib/certificate-link";

const STAGE_LABEL: Record<string, string> = {
  STAGE_0: "Stage 0 — Foundations",
  STAGE_1: "Stage 1 — Applied Cryptography",
  STAGE_2: "Stage 2 — Web Application Security",
  STAGE_3: "Stage 3 — Incident Response",
  STAGE_4: "Stage 4 — Governance & Risk",
  STAGE_5: "Stage 5 — Track Specialisation",
};

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
      include: {
        intern: { include: { user: true } },
      },
    });
    if (!report) {
      return Response.json({ error: "Certificate not found" }, { status: 404 });
    }
    if (report.status !== "PASSED") {
      return Response.json(
        { error: "Certificate is only available for passed reports" },
        { status: 403 }
      );
    }

    const expectedSig = certificateShareSig(report.id, report.intern.id);
    if (sig !== expectedSig) {
      return Response.json({ error: "Invalid or missing signature" }, { status: 403 });
    }

    const fullName =
      `${report.intern.user.firstName} ${report.intern.user.lastName}`.trim() ||
      report.intern.user.email;
    const stageLabel = STAGE_LABEL[report.stage] ?? report.stage;

    const pdf = await generateStageCertificate({
      fullName,
      stageLabel,
      score: report.score ?? 0,
      passingScore: 0, // looked up if needed; not essential on the cert
      issuedAt: report.gradedAt ?? new Date(),
      certId: certificateIdFor(report.id),
    });

    const safeName = fullName.replace(/[^A-Za-z0-9\s-]/g, "").replace(/\s+/g, "-");
    const filename = `TRAN-Certificate-${safeName}-${report.stage}.pdf`;

    return new Response(pdf as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    logger.error("certificate_generate_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
