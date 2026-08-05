// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const pdfkitMod: any = require("pdfkit");
const PDFDocument = pdfkitMod.default || pdfkitMod;

import {
  A, OKOMA, QUADRI, CLOSING_BLOCK_HEIGHT, ensureRoom, formatDate, letterFooter, letterhead,
  paletteFor, paragrapher, rosette, signatures, type Doc,
} from "./pdf-primitives";
import {
  ADVANCED_CREDENTIALS, TRACK_LABEL, credentialFor, standingFor, type AdvancedStageKey,
} from "./advanced-credential";
import type { AdvancedTrack } from "./advanced-stage";

/**
 * Letter of Achievement — the companion piece to the advanced certificate.
 *
 * The certificate is the credential; this is the record of what the credential
 * was earned for. It is written on programme letterhead (not in the Sankofa
 * case voice, which is what generate-pass-letter.ts does) because interns
 * forward this one to employers and universities.
 */
export function generateAchievementLetter(opts: {
  fullName: string;
  stage: AdvancedStageKey;
  track: AdvancedTrack;
  issuedAt: Date;
  letterId: string;
  /** Standing at the end of this stage, when it is known and worth stating. */
  rank?: number | null;
  cohortSize?: number | null;
  /** Named next stage, if the intern is advancing. */
  nextStageLabel?: string | null;
}): Promise<Buffer> {
  const { fullName, stage, track, issuedAt, letterId, rank, cohortSize, nextStageLabel } = opts;
  const cred = ADVANCED_CREDENTIALS[stage];
  const tc = credentialFor(stage, track);
  const P = paletteFor(track);
  const firstName = fullName.trim().split(/\s+/)[0] || fullName;

  return new Promise((resolve, reject) => {
    const doc: Doc = new PDFDocument({
      size: "A4", layout: "portrait",
      margins: { top: 56, bottom: 56, left: 62, right: 62 },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const x = 62;
    const w = pageW - 124;

    rosette(doc, pageW / 2, pageH / 2, 150, P.structure, 0.035);
    const top = letterhead(doc, x, w, "Cohort 1 · Advanced Programme", P);

    // ── Date + reference ──────────────────────────────────
    doc.fontSize(9.5).font("Helvetica").fillColor(A.ink)
      .text(formatDate(issuedAt), x, top, { width: w });
    doc.fontSize(8).font("Helvetica").fillColor(A.faint)
      .text(`Ref ${letterId}`, x, top, { width: w, align: "right" });

    // ── Title ─────────────────────────────────────────────
    const y = top + 26;
    doc.fontSize(8).font("Helvetica-Bold").fillColor(P.metal)
      .text("LETTER OF ACHIEVEMENT", x, y, { width: w, characterSpacing: 2.4 });
    doc.fontSize(15).font("Times-Bold").fillColor(P.head)
      .text(cred.title, x, y + 14, { width: w });
    doc.fontSize(9).font("Times-Italic").fillColor(A.muted)
      .text(`${TRACK_LABEL[track]} track  ·  “${tc.project}”`, x, y + 33, { width: w });
    doc.moveTo(x, y + 52).lineTo(x + 96, y + 52).lineWidth(2).strokeColor(P.metal).stroke();

    const p = paragrapher(doc, x, w, y + 68);

    doc.fontSize(11).font("Times-Bold").fillColor(P.deep)
      .text(`Dear ${firstName},`, x, p.y, { width: w });
    p.y = doc.y + 14;

    p.para(
      `It is my privilege to confirm that you have completed ${cred.title} of the Ubuntu Bridge ` +
        `Initiative Cybersecurity Internship, working the ${TRACK_LABEL[track]} brief ` +
        `“${tc.project}”, and that your work met the standard the programme sets for this project.`
    );

    p.para(
      `That standard is not a formality. The Advanced Programme is the part of this internship ` +
        `where the training wheels come off: the briefs are live, the evidence rules are ` +
        `enforced, and every material claim you make has to be traceable to something you ` +
        `produced yourself. On this brief ${tc.narrative}.`
    );

    // ── Standing conferred — set apart in a ruled block ───
    const boxY = p.y + 2;
    const boxH = 54;
    doc.rect(x, boxY, w, boxH).fill(P.wash);
    doc.moveTo(x, boxY).lineTo(x, boxY + boxH).lineWidth(2.6).strokeColor(P.metal).stroke();
    doc.fontSize(7).font("Helvetica-Bold").fillColor(P.metal)
      .text("STANDING CONFERRED", x + 16, boxY + 12, { width: w - 32, characterSpacing: 2.2 });
    doc.fontSize(13.5).font("Times-Bold").fillColor(P.head)
      .text(standingFor(stage, track), x + 16, boxY + 26, { width: w - 32, lineBreak: false });
    p.y = boxY + boxH + 14;

    if (rank && cohortSize) {
      p.para(
        `Within the ${TRACK_LABEL[track]} track for this project, your work placed ${ordinal(rank)} ` +
          `of ${cohortSize}. I mention the number not to rank you against your colleagues, but ` +
          `because you should know where you stood in a field this strong.`
      );
    }

    p.para(
      `The certificate accompanying this letter carries a credential identifier and can be ` +
        `verified independently by any employer or institution at ` +
        `ubuntubridgeinitiatives.org/verify. It is yours permanently, and it is a record of ` +
        `work you actually did rather than a course you attended.`
    );

    if (nextStageLabel) {
      p.para(
        `On the strength of this result you continue to ${nextStageLabel}. The problems get ` +
          `harder from here and the margin for unexamined assumptions gets thinner. You have ` +
          `earned the right to find that out.`
      );
    } else {
      p.para(
        `You have reached the end of the Advanced Programme, and you reached it on merit. What ` +
          `you built here is a portfolio, not a transcript — use it as one.`
      );
    }

    p.para(
      `Congratulations, ${firstName}. This was hard, and you did it.`
    );

    let closeY = ensureRoom(doc, p.y, CLOSING_BLOCK_HEIGHT, pageH);
    doc.fontSize(10.5).font("Times-Italic").fillColor(P.head)
      .text("With warm regards and genuine respect,", x, closeY, { width: w });
    closeY = doc.y + 42;
    signatures(doc, x, w, closeY, [OKOMA, QUADRI], P);

    letterFooter(
      doc, x, w, pageH, letterId,
      "Issued by the Ubuntu Bridge Initiative Cybersecurity Internship, Cohort 1."
    );

    doc.end();
  });
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
