// pdfkit ships CommonJS — Next.js's production bundler wraps it as
// { default: PDFDocument }. Without this normalisation `new PDFDocument()`
// throws "C is not a constructor" on Vercel.
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const pdfkitMod: any = require("pdfkit");
const PDFDocument = pdfkitMod.default || pdfkitMod;

// Formal letter that complements the certificate. The certificate is the
// visual diploma; this is the text record. Useful for HR files, recruiters,
// or anywhere an intern needs a paragraph that says what they did.
//
// Same single-page A4 portrait shape as the discontinuation letter, so the
// two read like sibling documents from the same programme office.
export function generatePassLetter(opts: {
  fullName: string;
  stageLabel: string;
  score: number;
  passingScore: number;
  issuedAt: Date;
  letterId: string;
  nextStageLabel?: string; // e.g. "Stage 1 — Applied Cryptography". Optional.
}): Promise<Buffer> {
  const { fullName, stageLabel, score, passingScore, issuedAt, letterId, nextStageLabel } = opts;
  const issuedStr = issuedAt.toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "portrait",
      margins: { top: 72, bottom: 72, left: 72, right: 72 },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const contentX = 72;
    const contentWidth = pageWidth - 144;

    // ── Letterhead ─────────────────────────────────────
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#0B2447")
      .text("UBUNTU BRIDGE INITIATIVE", contentX, 72, { width: contentWidth });
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#4B5775")
      .text("Cybersecurity Internship Programme · TRAN (The Root Access Network)", contentX, 88, {
        width: contentWidth,
      });
    doc
      .moveTo(contentX, 112)
      .lineTo(contentX + contentWidth, 112)
      .lineWidth(0.5)
      .strokeColor("#9DB2D6")
      .stroke();

    // ── Date + reference ───────────────────────────────
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#1B2545")
      .text(issuedStr, contentX, 132, { width: contentWidth });
    doc
      .fontSize(8)
      .fillColor("#9DB2D6")
      .text(`Ref: ${letterId}`, contentX, 148, { width: contentWidth });

    // ── Salutation + body ──────────────────────────────
    let y = 180;
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#061732")
      .text(`Dear ${fullName},`, contentX, y, { width: contentWidth });
    y += 32;

    const para = (text: string) => {
      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("#1F2937")
        .text(text, contentX, y, { width: contentWidth, align: "left", lineGap: 4 });
      y = doc.y + 14;
    };

    para(
      `We are pleased to confirm that you have successfully completed ${stageLabel} ` +
        `of the Ubuntu Bridge Initiative Cybersecurity Internship, Cohort 1. Your ` +
        `final score was ${score} out of 100, against a passing mark of ${passingScore}.`
    );

    para(
      `Your capstone was assessed against the published rubric for this stage and ` +
        `met the standard required to progress. The certificate of achievement is ` +
        `attached separately and is available for download from your programme ` +
        `dashboard at any time.`
    );

    if (nextStageLabel) {
      para(
        `On the basis of this result you have been advanced to ${nextStageLabel}. ` +
          `The brief for the next stage, including the reading list and your first ` +
          `exercise, will be delivered to your inbox before that stage opens.`
      );
    }

    para(
      `This letter, alongside the certificate and your reviewer's detailed notes ` +
        `on the dashboard, forms the complete record of your work at this stage. ` +
        `It may be shared with employers, academic institutions, or anyone else ` +
        `who requires evidence of your participation and standing in the programme.`
    );

    para(`Congratulations on the work and please continue to put the same in.`);

    // ── Signatures ─────────────────────────────────────
    const sigY = Math.min(y + 30, pageHeight - 160);
    const signers = [
      {
        x: contentX,
        sig: "Okoma Somto",
        name: "Okoma Somtochukwu",
        title: "Head of Programme",
      },
      {
        x: contentX + contentWidth - 200,
        sig: "Quadri O.",
        name: "Quadri Omoloju",
        title: "Founder",
      },
    ];
    for (const s of signers) {
      doc
        .fontSize(14)
        .font("Helvetica-BoldOblique")
        .fillColor("#0B2447")
        .text(s.sig, s.x, sigY - 30, { width: 200 });
      doc
        .moveTo(s.x, sigY + 2)
        .lineTo(s.x + 200, sigY + 2)
        .lineWidth(0.5)
        .strokeColor("#9CA3AF")
        .stroke();
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#374151")
        .text(s.name, s.x, sigY + 8, { width: 200 });
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#4B5775")
        .text(`${s.title} · TRAN (The Root Access Network)`, s.x, sigY + 21, { width: 200 });
    }

    // ── Footer ─────────────────────────────────────────
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#9DB2D6")
      .text(
        `Letter reference: ${letterId}  ·  ubuntubridgeinitiatives.org`,
        contentX,
        pageHeight - 60,
        { width: contentWidth, align: "center", lineBreak: false, height: 14 }
      );

    doc.end();
  });
}
