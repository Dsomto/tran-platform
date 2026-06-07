import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { generateStageCertificate } from "@/lib/generate-certificate";
import { certificateIdFor, isValidCertificateShareSig } from "@/lib/certificate-link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    if (!isValidCertificateShareSig(report.id, report.intern.id, sig)) {
      return Response.json({ error: "Invalid or missing signature" }, { status: 403 });
    }

    const fullName =
      `${report.intern.user.firstName} ${report.intern.user.lastName}`.trim() ||
      report.intern.user.email;
    const stageLabel = STAGE_LABEL[report.stage] ?? report.stage;

    const win = await prisma.stageWindow.findUnique({
      where: { stage: report.stage },
      select: { passingScore: true },
    });
    const pdf = await generateStageCertificate({
      fullName,
      stageLabel,
      stageKey: report.stage,
      score: report.finalScore ?? report.score ?? 0,
      passingScore: win?.passingScore ?? 70,
      issuedAt: report.finalizedAt ?? report.gradedAt ?? new Date(),
      certId: certificateIdFor(report.id),
    });

    const safeName = fullName.replace(/[^A-Za-z0-9\s-]/g, "").replace(/\s+/g, "-");
    const filename = `UBI-Certificate-${safeName}-${report.stage}.pdf`;

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
    // TEMPORARY DEBUG: surface error message so we can see what's failing
    // on Vercel. Revert after we've fixed the underlying issue.
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    return Response.json(
      { error: "Internal server error", detail: msg, stack: stack?.split("\n").slice(0, 6) },
      { status: 500 }
    );
  }
}
