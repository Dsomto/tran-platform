// pdfkit ships CommonJS; normalise the default export (see generate-advanced-certificate.ts).
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const pdfkitMod: any = require("pdfkit");
const PDFDocument = pdfkitMod.default || pdfkitMod;

import {
  A, advancedSeal, cornerWedges, diamond, formatDate, guillocheField, guillocheRun,
  laurelWreath, layoutName, ornateFrame, paletteFor, ribbonBanner, rosette,
  type Doc, type Palette,
} from "./pdf-primitives";
import { TRACK_LABEL } from "./advanced-credential";
import type { AdvancedTrack } from "./advanced-stage";

/**
 * Cohort One end-of-programme honours, a tier above the stage certificates.
 *
 *  - "finalist": the ten who reached the final. Track colours, like the
 *    advanced certificates, so the three disciplines stay distinguishable.
 *  - "top3": the three named Top 3 of the cohort (one per track). One shared
 *    gold-on-obsidian palette, so all three read as the same highest honour
 *    whatever their track.
 *
 * Both name the project the holder built and presented at the showcase, and
 * carry the cohort's numbers so the selectivity is stated, not implied.
 */
export type FinalistHonour = "finalist" | "top3";

const GOLD: Palette = {
  deep: "#080D1A", structure: "#0A1F44", head: "#0A1F44",
  metal: "#B8901F", metalLight: "#EBCB63", metalPale: "#F3E3B0",
  metalDeep: "#7A5E12", wash: "#FFF7DD",
};

export const COHORT_ONE = { applicants: "2,825", stages: 10, finalists: 10, year: 2026 } as const;

export function generateFinalistCertificate(opts: {
  fullName: string;
  track: AdvancedTrack;
  projectTitle: string;
  honour: FinalistHonour;
  issuedAt: Date;
  certId: string;
  /** Official UBI lockup (PNG) and its width / height. */
  logo: Buffer;
  logoRatio: number;
}): Promise<Buffer> {
  const { fullName, track, honour, issuedAt, certId, logo, logoRatio } = opts;
  const top3 = honour === "top3";
  const P = top3 ? GOLD : paletteFor(track);
  const trackName = TRACK_LABEL[track];
  const project = opts.projectTitle.trim().replace(/[.\s]+$/, "");

  return new Promise((resolve, reject) => {
    const doc: Doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 24, bottom: 24, left: 24, right: 24 },
      info: {
        Title: `${top3 ? "Top 3" : "Finalist"} certificate: ${fullName}`,
        Author: "Ubuntu Bridge Initiative",
        Subject: `UBI Cohort One ${top3 ? "Top 3" : "Finalist"}, ${trackName}`,
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const cx = pageW / 2;

    // ── Ground and frame ──────────────────────────────────
    doc.rect(0, 0, pageW, pageH).fill(top3 ? "#FFFDF6" : A.paper);
    guillocheField(doc, 58, 58, pageW - 116, pageH - 116, P.structure, top3 ? 0.06 : 0.05);
    cornerWedges(doc, pageW, pageH, P);
    ornateFrame(doc, pageW, pageH, P);
    rosette(doc, cx, 300, 132, top3 ? P.metal : P.structure, top3 ? 0.07 : 0.038);

    // ── Masthead: the official lockup ─────────────────────
    const logoW = 76;
    doc.image(logo, cx - logoW / 2, 62, { width: logoW });
    const kickerY = 62 + logoW / logoRatio + 5;
    doc.fontSize(7).font("Helvetica").fillColor(A.muted)
      .text(
        `COHORT ONE  ·  ${COHORT_ONE.year}  ·  CYBERSECURITY INTERNSHIP`,
        0, kickerY, { align: "center", width: pageW, characterSpacing: 1.8, lineBreak: false }
      );

    // ── Title ─────────────────────────────────────────────
    const titleY = kickerY + 14;
    doc.fontSize(38).font("Times-Bold").fillColor(P.head)
      .text("CERTIFICATE", 0, titleY, { align: "center", width: pageW, characterSpacing: 9 });
    doc.fontSize(10.5).font("Helvetica").fillColor(P.metal)
      .text(top3 ? "OF HIGHEST DISTINCTION" : "OF FINALIST HONOURS", 0, titleY + 45, {
        align: "center", width: pageW, characterSpacing: 6.5,
      });
    const flourishY = titleY + 64;
    guillocheRun(doc, cx - 148, flourishY, 296, 2.8, 9, P.metalLight);
    diamond(doc, cx - 156, flourishY, 2.8, P.metal);
    diamond(doc, cx + 156, flourishY, 2.8, P.metal);

    // ── Recipient ─────────────────────────────────────────
    doc.fontSize(10.5).font("Times-Italic").fillColor(A.muted)
      .text("This certificate is proudly presented to", 0, flourishY + 11, { align: "center", width: pageW });
    const nameLayout = layoutName(doc, fullName, 520, 33, 21);
    const lineH = nameLayout.size * 1.1;
    const nameTop = flourishY + (nameLayout.lines.length === 1 ? 31 : 26);
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

    // ── Citation: what they did ───────────────────────────
    const citation = top3
      ? `for finishing in the Top 3 of Cohort One of the Ubuntu Bridge Cybersecurity Internship, ` +
        `first among the finalists of the ${trackName} track. Selected from ${COHORT_ONE.applicants} ` +
        `applicants, the holder completed all ${COHORT_ONE.stages} stages, reached the final ten, and ` +
        `built and presented “${project}” at the Cohort One Finalist Showcase.`
      : `for completing all ${COHORT_ONE.stages} stages of the Ubuntu Bridge Cybersecurity Internship ` +
        `and being selected as one of ${COHORT_ONE.finalists} finalists from ${COHORT_ONE.applicants} ` +
        `applicants in Cohort One, and for building and presenting “${project}” at the Cohort One ` +
        `Finalist Showcase, in the ${trackName} track.`;
    doc.fontSize(10).font("Times-Roman").fillColor(A.inkSoft)
      .text(citation, cx - 270, ruleY + 13, { align: "center", width: 540, lineGap: 2.2 });

    // ── Honour on a ribbon ────────────────────────────────
    const standing = top3
      ? `TOP 3  ·  ${trackName.toUpperCase()}`
      : `COHORT ONE FINALIST  ·  ${trackName.toUpperCase()}`;
    const ribbonY = doc.y + 50;
    const standingW = doc.fontSize(13).font("Times-Bold").widthOfString(standing);
    doc.fontSize(6.5).font("Helvetica-Bold").fillColor(P.metal)
      .text(top3 ? "NAMED AMONG THE COHORT'S TOP THREE" : "CONFERRING THE HONOUR OF", 0, ribbonY - 26, {
        align: "center", width: pageW, characterSpacing: 3,
      });
    ribbonBanner(doc, cx, ribbonY, standingW + 46, 26, P, standing, 13);

    // ── The record, as four figures ───────────────────────
    const facts: [string, string][] = [
      [COHORT_ONE.applicants, "APPLICANTS"],
      [String(COHORT_ONE.stages), "STAGES COMPLETED"],
      ["Top 10", "FINALIST"],
      top3 ? ["Top 3", "OF THE COHORT"] : ["1", "PROJECT SHIPPED"],
    ];
    const factY = ribbonY + 36;
    const cellW = 112;
    const startX = cx - (cellW * facts.length) / 2;
    facts.forEach(([value, label], i) => {
      const x = startX + i * cellW;
      if (i > 0) {
        doc.moveTo(x, factY + 2).lineTo(x, factY + 26).lineWidth(0.5).strokeColor(P.metalLight).stroke();
      }
      const highlight = top3 && i === facts.length - 1;
      doc.fontSize(14).font("Times-Bold").fillColor(highlight ? P.metal : P.head)
        .text(value, x, factY, { width: cellW, align: "center", lineBreak: false });
      doc.fontSize(5.8).font("Helvetica-Bold").fillColor(A.muted)
        .text(label, x, factY + 18, { width: cellW, align: "center", characterSpacing: 1.6, lineBreak: false });
    });

    // ── Seal ──────────────────────────────────────────────
    laurelWreath(doc, pageW - 104, 106, 46, P.metal);
    advancedSeal(doc, pageW - 104, 106, 35, P, {
      numeral: top3 ? "3" : "10",
      ring: top3 ? "TOP THREE" : "FINALIST",
    });
    if (top3) {
      // A second wreath on the left so the highest honour is visibly symmetrical.
      laurelWreath(doc, 104, 106, 46, P.metal);
      doc.circle(104, 106, 30).lineWidth(0.9).strokeColor(P.metal).stroke();
      doc.fontSize(8).font("Times-Bold").fillColor(P.head)
        .text("COHORT", 74, 96, { width: 60, align: "center", characterSpacing: 1.2, lineBreak: false });
      doc.fontSize(12).font("Times-Bold").fillColor(P.metal)
        .text("ONE", 74, 106, { width: 60, align: "center", characterSpacing: 2, lineBreak: false });
    }

    // ── Signatures, date, credential id ───────────────────
    const footY = pageH - 108;
    const sigW = 196;
    const signers = [
      { x: 100, sig: "Okoma Somto", name: "Okoma Somtochukwu", title: "Head of Programme, UBI" },
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
        .text(s.title.toUpperCase(), s.x, footY + 34, { width: sigW, align: "center", characterSpacing: 1.2 });
    }
    doc.fontSize(10.5).font("Times-Italic").fillColor(P.head)
      .text(`Awarded ${formatDate(issuedAt)}`, 0, footY + 3, { width: pageW, align: "center" });
    doc.fontSize(7).font("Helvetica").fillColor(A.muted)
      .text(`CREDENTIAL ID  ${certId}`, 0, footY + 23, {
        width: pageW, align: "center", characterSpacing: 1.2, lineBreak: false,
      });
    doc.fontSize(6.5).font("Helvetica").fillColor(A.faint)
      .text("See the finalists at ubuntubridgeinitiatives.org/showcase/cohort-one", 0, footY + 33, {
        width: pageW, align: "center", characterSpacing: 0.6, lineBreak: false,
      });

    doc.end();
  });
}
