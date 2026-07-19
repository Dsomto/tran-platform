import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { generatePassLetter } from "@/lib/generate-pass-letter";
import { isValidPassLetterShareSig, passLetterIdFor } from "@/lib/certificate-link";

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

// Pass / achievement letter download. Mirrors the certificate route — HMAC
// signed URL, gated on PASSED status.
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
    if (report.status !== "PASSED") {
      return Response.json(
        { error: "Achievement letter is only available for passed reports." },
        { status: 403 }
      );
    }

    if (!isValidPassLetterShareSig(report.id, report.intern.id, sig)) {
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

    const stageNum = Number(report.stage.replace("STAGE_", ""));
    const nextKey = `STAGE_${stageNum + 1}`;
    const nextStageLabel = STAGE_LABEL[nextKey];

    const pdf = await generatePassLetter({
      fullName,
      stageLabel,
      score: report.finalScore ?? report.score ?? 0,
      passingScore: win?.passingScore ?? 70,
      issuedAt: report.gradedAt ?? new Date(),
      letterId: passLetterIdFor(report.id),
      nextStageLabel,
      stageKey: report.stage,
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
    logger.error("pass_letter_generate_failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
