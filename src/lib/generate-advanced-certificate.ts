// pdfkit ships CommonJS — Next.js's production bundler wraps it as
// { default: PDFDocument }. Without this normalisation `new PDFDocument()`
// throws "C is not a constructor" on Vercel.
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const pdfkitMod: any = require("pdfkit");
const PDFDocument = pdfkitMod.default || pdfkitMod;

import {
  A, advancedSeal, cornerWedges, diamond, formatDate, guillocheField, guillocheRun,
  laurelWreath, layoutName, logoLockup, ornateFrame, paletteFor, ribbonBanner,
  rosette, type Doc,
} from "./pdf-primitives";
import {
  ADVANCED_CREDENTIALS, TRACK_LABEL, TRACK_SHORT, credentialFor, standingFor,
  type AdvancedStageKey,
} from "./advanced-credential";
import type { AdvancedTrack } from "./advanced-stage";

/**
 * The advanced-programme certificate (Stages 5-9).
 *
 * A tier above the core certificate in construction, not just in wording:
 * engine-turned guilloche in the border channel, a rosette watermark, corner
 * filigree, and the conferred standing carried on a folded ribbon rather than
 * set as plain text. Structure and metal come from the intern's track, so the
 * three disciplines are distinguishable across a room while the layout stays
 * identical.
 *
 * Substantively it does two things a completion certificate does not: it
 * confers a named standing, and it names the actual project brief the holder
 * was assessed on, which differs by track.
 */
export function generateAdvancedCertificate(opts: {
  fullName: string;
  stage: AdvancedStageKey;
  track: AdvancedTrack;
  issuedAt: Date;
  certId: string;
}): Promise<Buffer> {
  const { fullName, stage, track, issuedAt, certId } = opts;
  const cred = ADVANCED_CREDENTIALS[stage];
  const tc = credentialFor(stage, track);
  const P = paletteFor(track);

  return new Promise((resolve, reject) => {
    const doc: Doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 24, bottom: 24, left: 24, right: 24 },
      autoFirstPage: true,
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const cx = pageW / 2;

    // ── Paper, wedges, ornate frame, rosette ──────────────
    doc.rect(0, 0, pageW, pageH).fill(A.paper);
    guillocheField(doc, 58, 58, pageW - 116, pageH - 116, P.structure, 0.05);
    cornerWedges(doc, pageW, pageH, P);
    ornateFrame(doc, pageW, pageH, P);
    rosette(doc, cx, 300, 128, P.structure, 0.038);

    // ── Masthead ──────────────────────────────────────────
    const logoBottom = logoLockup(doc, cx, 68, 84);
    doc.fontSize(7).font("Helvetica").fillColor(A.muted)
      .text(
        "ADVANCED PROGRAMME  ·  CYBERSECURITY INTERNSHIP  ·  THE ROOT ACCESS NETWORK",
        0, logoBottom + 6,
        { align: "center", width: pageW, characterSpacing: 1.8, lineBreak: false }
      );

    // ── Title ─────────────────────────────────────────────
    doc.fontSize(40).font("Times-Bold").fillColor(P.head)
      .text("CERTIFICATE", 0, 143, { align: "center", width: pageW, characterSpacing: 9 });
    doc.fontSize(11).font("Helvetica").fillColor(P.metal)
      .text("OF ACHIEVEMENT", 0, 190, { align: "center", width: pageW, characterSpacing: 7.5 });

    // guilloche flourish beneath the subtitle, terminated with lozenges
    guillocheRun(doc, cx - 148, 210, 296, 2.8, 9, P.metalLight);
    diamond(doc, cx - 156, 210, 2.8, P.metal);
    diamond(doc, cx + 156, 210, 2.8, P.metal);

    // ── Recipient ─────────────────────────────────────────
    doc.fontSize(10.5).font("Times-Italic").fillColor(A.muted)
      .text("This certificate is proudly presented to", 0, 222, {
        align: "center", width: pageW,
      });

    const nameLayout = layoutName(doc, fullName, 520, 33, 21);
    const lineH = nameLayout.size * 1.1;
    const nameTop = nameLayout.lines.length === 1 ? 243 : 237;
    doc.fontSize(nameLayout.size).font("Times-BoldItalic").fillColor(P.head);
    nameLayout.lines.forEach((line, i) => {
      doc.text(line, 0, nameTop + i * lineH, { align: "center", width: pageW, lineBreak: false });
    });

    const ruleY = nameTop + nameLayout.lines.length * lineH + 8;
    for (const dir of [-1, 1] as const) {
      doc.moveTo(cx + dir * 13, ruleY).lineTo(cx + dir * 195, ruleY)
        .lineWidth(0.9).strokeColor(P.structure).stroke();
    }
    diamond(doc, cx, ruleY, 4.2, P.metal);

    // ── Citation, naming the real project brief ───────────
    const citeY = ruleY + 13;
    doc.fontSize(10).font("Times-Roman").fillColor(A.inkSoft)
      .text(
        `for completing ${cred.name}, project ${cred.number} of 5 of the Advanced Programme, ` +
          `and for ${cred.premise} on the brief “${tc.project}”, in the ` +
          `${TRACK_LABEL[track]} track of the Ubuntu Bridge Cybersecurity Internship.`,
        cx - 265, citeY,
        { align: "center", width: 530, lineGap: 2.2 }
      );

    // ── Standing conferred, carried on a ribbon ───────────
    const standing = standingFor(stage, track);
    const ribbonY = doc.y + 42;
    const standingW = doc.fontSize(13.5).font("Times-Bold").widthOfString(standing);
    doc.fontSize(6.5).font("Helvetica-Bold").fillColor(P.metal)
      .text("CONFERRING THE STANDING OF", 0, ribbonY - 27, {
        align: "center", width: pageW, characterSpacing: 3,
      });
    ribbonBanner(doc, cx, ribbonY, standingW + 46, 27, P, standing, 13.5);

    // ── Competencies, two balanced rows ───────────────────
    const compY = ribbonY + 32;
    doc.fontSize(6.5).font("Helvetica-Bold").fillColor(A.muted)
      .text("ASSESSED COMPETENCIES", 0, compY, {
        align: "center", width: pageW, characterSpacing: 2.6,
      });
    const half = Math.ceil(tc.competencies.length / 2);
    [tc.competencies.slice(0, half), tc.competencies.slice(half)].forEach((row, i) => {
      doc.fontSize(8.4).font("Times-Italic").fillColor(A.inkSoft)
        .text(row.join("   ·   "), cx - 350, compY + 12 + i * 13, {
          align: "center", width: 700, characterSpacing: 0.2, lineBreak: false,
        });
    });

    // ── Seal, clear of the name row ───────────────────────
    laurelWreath(doc, pageW - 104, 106, 46, P.metal);
    advancedSeal(doc, pageW - 104, 106, 35, P, {
      numeral: String(cred.number),
      ring: TRACK_SHORT[track],
    });

    // ── Signatures, date, credential id ───────────────────
    const footY = pageH - 112;
    const sigW = 196;
    const signers = [
      { x: 100, sig: "Okoma Somto", name: "Okoma Somtochukwu", title: "Head of Programme, TRAN" },
      { x: pageW - 100 - sigW, sig: "Quadri O.", name: "Quadri Omoloju", title: "Founder, TRAN" },
    ];
    for (const s of signers) {
      doc.fontSize(16.5).font("Times-BoldItalic").fillColor(P.deep)
        .text(s.sig, s.x, footY - 8, { width: sigW, align: "center" });
      doc.moveTo(s.x, footY + 17).lineTo(s.x + sigW, footY + 17)
        .lineWidth(0.6).strokeColor(P.structure).stroke();
      doc.fontSize(8.5).font("Helvetica-Bold").fillColor(A.ink)
        .text(s.name, s.x, footY + 23, { width: sigW, align: "center" });
      doc.fontSize(7).font("Helvetica").fillColor(A.muted)
        .text(s.title.toUpperCase(), s.x, footY + 34, {
          width: sigW, align: "center", characterSpacing: 1.2,
        });
    }

    doc.fontSize(10.5).font("Times-Italic").fillColor(P.head)
      .text(`Issued ${formatDate(issuedAt)}`, 0, footY + 3, { width: pageW, align: "center" });
    doc.fontSize(7).font("Helvetica").fillColor(A.muted)
      .text(`CREDENTIAL ID  ${certId}`, 0, footY + 23, {
        width: pageW, align: "center", characterSpacing: 1.2, lineBreak: false,
      });
    doc.fontSize(6.5).font("Helvetica").fillColor(A.faint)
      .text("Verify at ubuntubridgeinitiatives.org/verify", 0, footY + 33, {
        width: pageW, align: "center", characterSpacing: 0.6, lineBreak: false,
      });

    doc.end();
  });
}
