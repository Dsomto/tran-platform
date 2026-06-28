// pdfkit ships CommonJS — Next.js's production bundler wraps it as
// { default: PDFDocument }. Without this normalisation `new PDFDocument()`
// throws "C is not a constructor" on Vercel.
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const pdfkitMod: any = require("pdfkit");
const PDFDocument = pdfkitMod.default || pdfkitMod;

// Formal letter shipped to interns who did not meet the passing threshold at
// the end of a stage. Same single-page A4 portrait shape every internship
// programme uses for end-of-contract notices: programme letterhead at the top,
// salutation, three short paragraphs explaining the decision and what stays
// open to them, two signatures at the bottom.
export function generateDiscontinuationLetter(opts: {
  fullName: string;
  stageLabel: string;
  score: number;
  passingScore: number;
  issuedAt: Date;
  effectiveDate: Date;
  letterId: string;
}): Promise<Buffer> {
  const { fullName, stageLabel, score, passingScore, issuedAt, effectiveDate, letterId } = opts;
  const issuedStr = issuedAt.toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
  const effectiveStr = effectiveDate.toLocaleDateString("en-GB", {
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
      .fillColor("#2563EB")
      .text("UBUNTU BRIDGE INITIATIVE", contentX, 72, { width: contentWidth });
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#6B7280")
      .text("Cybersecurity Internship Programme · TRAN (The Root Access Network)", contentX, 88, {
        width: contentWidth,
      });
    doc
      .moveTo(contentX, 112)
      .lineTo(contentX + contentWidth, 112)
      .lineWidth(0.5)
      .strokeColor("#E5E7EB")
      .stroke();

    // ── Date + reference ───────────────────────────────
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#374151")
      .text(issuedStr, contentX, 132, { width: contentWidth });
    doc
      .fontSize(8)
      .fillColor("#9CA3AF")
      .text(`Ref: ${letterId}`, contentX, 148, { width: contentWidth });

    // ── Salutation + body ──────────────────────────────
    let y = 180;
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#111827")
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
      `Following the assessment of your ${stageLabel} capstone submission for Cohort 1 of the ` +
        `Ubuntu Bridge Initiative Cybersecurity Internship, we are writing to inform you that you ` +
        `did not meet the passing threshold for this stage. Your recorded score was ${score} out ` +
        `of 100, against a passing mark of ${passingScore}.`
    );

    para(
      `On the basis of that result, your active credentials for the Cohort 1 internship dashboard ` +
        `will be discontinued effective ${effectiveStr}. From that date you will no longer have ` +
        `access to internship-only resources, the grading queue, or the assignment submission ` +
        `pages. You may still log in to download a copy of this letter and your reviewer's ` +
        `feedback for your own records.`
    );

    para(
      `This is not the end of your relationship with the programme. You remain part of the wider ` +
        `UBI community. Our public town hall meetings, alumni events, and device-pitch ` +
        `opportunities remain open to you. You will continue to receive invitations to those ` +
        `through your email of record.`
    );

    para(
      `If you apply again for the next cohort, the fact that you stayed with the programme up to ` +
        `${stageLabel} will count in your favour. We will treat that progress as meaningful ` +
        `evidence of your persistence and practical commitment when reviewing your next application.`
    );

    para(
      `Thank you for the work and effort you put in over the course of this stage. We wish you ` +
        `every success in your next endeavour.`
    );

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
        .fillColor("#111827")
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
        .fillColor("#6B7280")
        .text(`${s.title} · TRAN (The Root Access Network)`, s.x, sigY + 21, { width: 200 });
    }

    // ── Footer — single line, no auto-pagination ───────
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#9CA3AF")
      .text(
        `Letter reference: ${letterId}  ·  ubuntubridgeinitiatives.org`,
        contentX,
        pageHeight - 60,
        { width: contentWidth, align: "center", lineBreak: false, height: 14 }
      );

    doc.end();
  });
}
