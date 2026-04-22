// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require("pdfkit");

export function generateStageCertificate(opts: {
  fullName: string;
  stageLabel: string;    // e.g. "Stage 2 — Web Application Security"
  score: number;
  passingScore: number;
  issuedAt: Date;
  certId: string;        // short code printed at the bottom for verification
}): Promise<Buffer> {
  const { fullName, stageLabel, score, passingScore, issuedAt, certId } = opts;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 60, bottom: 60, left: 60, right: 60 },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // ── Background ──────────────────────────────────────
    doc.rect(0, 0, pageWidth, pageHeight).fill("#FAFAFA");

    // Outer border
    doc
      .lineWidth(3)
      .strokeColor("#2563EB")
      .rect(28, 28, pageWidth - 56, pageHeight - 56)
      .stroke();

    // Inner thin border
    doc
      .lineWidth(0.5)
      .strokeColor("#2563EB")
      .rect(40, 40, pageWidth - 80, pageHeight - 80)
      .stroke();

    // ── Monogram / organisation ─────────────────────────
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#2563EB")
      .text("THE ROOT ACCESS NETWORK · TRAN", 0, 72, {
        align: "center",
        width: pageWidth,
      });

    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#6B7280")
      .text("Cybersecurity Internship Programme", 0, 90, {
        align: "center",
        width: pageWidth,
      });

    // ── Title ───────────────────────────────────────────
    doc
      .fontSize(36)
      .font("Helvetica-Bold")
      .fillColor("#111827")
      .text("Certificate of Completion", 0, 130, {
        align: "center",
        width: pageWidth,
      });

    // Underline accent
    const titleLineY = 180;
    doc
      .moveTo(pageWidth / 2 - 60, titleLineY)
      .lineTo(pageWidth / 2 + 60, titleLineY)
      .lineWidth(2)
      .strokeColor("#2563EB")
      .stroke();

    // ── Body ────────────────────────────────────────────
    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#4B5563")
      .text("This certifies that", 0, 210, {
        align: "center",
        width: pageWidth,
      });

    // ── Name ────────────────────────────────────────────
    doc
      .fontSize(32)
      .font("Helvetica-BoldOblique")
      .fillColor("#111827")
      .text(fullName, 0, 240, {
        align: "center",
        width: pageWidth,
      });

    // ── Achievement ─────────────────────────────────────
    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#4B5563")
      .text(
        `has successfully completed and passed the requirements of`,
        0,
        295,
        { align: "center", width: pageWidth }
      );

    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .fillColor("#2563EB")
      .text(stageLabel, 0, 320, {
        align: "center",
        width: pageWidth,
      });

    // Score line
    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#4B5563")
      .text(
        `Final score: ${score} / 100  ·  Passing threshold: ${passingScore}`,
        0,
        360,
        { align: "center", width: pageWidth }
      );

    // ── Signature + date ────────────────────────────────
    const baselineY = 440;

    // Signature (left)
    doc
      .fontSize(14)
      .font("Helvetica-BoldOblique")
      .fillColor("#111827")
      .text("Okoma Somto", 120, baselineY - 30);

    doc
      .moveTo(120, baselineY + 2)
      .lineTo(280, baselineY + 2)
      .lineWidth(0.5)
      .strokeColor("#9CA3AF")
      .stroke();

    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor("#374151")
      .text("Okoma Somtochukwu", 120, baselineY + 8);
    doc.font("Helvetica").text("Head of Programme · TRAN");

    // Date (right)
    const dateStr = issuedAt.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#111827")
      .text(dateStr, pageWidth - 280, baselineY - 30, {
        width: 160,
        align: "center",
      });

    doc
      .moveTo(pageWidth - 280, baselineY + 2)
      .lineTo(pageWidth - 120, baselineY + 2)
      .lineWidth(0.5)
      .strokeColor("#9CA3AF")
      .stroke();

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#374151")
      .text("Date of issue", pageWidth - 280, baselineY + 8, {
        width: 160,
        align: "center",
      });

    // ── Verification footer ─────────────────────────────
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#9CA3AF")
      .text(
        `Certificate ID: ${certId}  ·  Verify at ubuntubridgeinitiatives.org/verify/${certId}`,
        0,
        pageHeight - 80,
        { align: "center", width: pageWidth }
      );

    doc.end();
  });
}
