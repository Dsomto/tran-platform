// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const pdfkitMod: any = require("pdfkit");
const PDFDocument = pdfkitMod.default || pdfkitMod;

import {
  A, OKOMA, QUADRI, CLOSING_BLOCK_HEIGHT, ensureRoom, formatDate, letterFooter, letterhead,
  paletteFor, paragrapher, rosette, signatures, type Doc,
} from "./pdf-primitives";
import {
  ADVANCED_CREDENTIALS, TRACK_LABEL, credentialFor, type AdvancedStageKey,
} from "./advanced-credential";
import type { AdvancedTrack } from "./advanced-stage";

export type PersonalAssessmentHighlight = {
  label: string;
  score: number;
  maximum: number;
  reason: string;
};

const STAGE9_FINALIST_PLACES: Record<AdvancedTrack, number> = {
  SOC_ANALYSIS: 4,
  ETHICAL_HACKING: 3,
  GRC: 3,
};

/**
 * The letter sent to an intern whose cohort ends at an advanced project.
 *
 * generate-discontinuation-letter.ts remains the core-stage (0-4) notice and
 * is untouched. This is the advanced-tier version and it is written
 * differently on purpose: it leads with what the person did rather than with
 * the decision, states the decision plainly and once, and ends with a
 * concrete way back — their returning-candidate code, printed in the letter
 * rather than buried in an email they may lose.
 */
export function generateHonourableCloseLetter(opts: {
  fullName: string;
  stage: AdvancedStageKey;
  track: AdvancedTrack;
  issuedAt: Date;
  effectiveDate: Date;
  letterId: string;
  /** NF-XXXX-XXXX returning-candidate code, when one was minted. */
  returningCode?: string | null;
  /** Total applicants to the cohort, for the selectivity sentence. */
  applicantPool?: number | null;
  cohortAtStage?: number | null;
  technicalScore90?: number | null;
  trackRank?: number | null;
  strongest?: PersonalAssessmentHighlight | null;
  priority?: PersonalAssessmentHighlight | null;
}): Promise<Buffer> {
  const {
    fullName, stage, track, issuedAt, effectiveDate, letterId,
    returningCode, applicantPool, cohortAtStage, technicalScore90, trackRank,
    strongest, priority,
  } = opts;
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

    rosette(doc, pageW / 2, pageH / 2, 150, P.structure, 0.03);
    const top = letterhead(doc, x, w, "Cohort 1 · Advanced Programme", P);

    doc.fontSize(9.5).font("Helvetica").fillColor(A.ink)
      .text(formatDate(issuedAt), x, top, { width: w });
    doc.fontSize(8).font("Helvetica").fillColor(A.faint)
      .text(`Ref ${letterId}`, x, top, { width: w, align: "right" });

    const isStage9 = stage === "STAGE_9";
    const p = paragrapher(doc, x, w, top + 30, {
      gap: isStage9 ? 6.5 : 8,
      size: isStage9 ? 9.25 : 9.9,
      lineGap: isStage9 ? 1.7 : 2.1,
    });

    doc.fontSize(11).font("Times-Bold").fillColor(P.deep)
      .text(`Dear ${firstName},`, x, p.y, { width: w });
    p.y = doc.y + 16;

    // Lead with the work, not the verdict.
    p.para(
      `Before anything else: you reached the Advanced Programme of this internship, and you ` +
        `submitted work at ${cred.title} on the ${TRACK_LABEL[track]} brief “${tc.project}”, ` +
        `and we assessed it seriously. On that brief ${tc.narrative}. Whatever else this ` +
        `letter says, that happened, and it is yours.`
    );

    if (applicantPool || cohortAtStage) {
      const bits: string[] = [];
      if (applicantPool) bits.push(`${applicantPool.toLocaleString("en-GB")} people applied to Cohort 1`);
      if (cohortAtStage) bits.push(`${cohortAtStage.toLocaleString("en-GB")} were still in the programme when this project began`);
      p.para(
        `For context: ${bits.join(", and ")}. Reaching the point you reached put you in a very ` +
          `small group, and nothing that follows changes that arithmetic.`
      );
    }

    if (isStage9 && technicalScore90 !== null && technicalScore90 !== undefined) {
      p.para(
        `Your frozen Stage 9A submission earned ${technicalScore90}/90. That number came from six ` +
          `evidence-based rubric decisions; prerecorded video was optional and contributed no points.`
      );
    }

    if (isStage9 && strongest) {
      p.para(
        `What stood out in your own work was ${strongest.label.toLowerCase()} ` +
          `(${strongest.score}/${strongest.maximum}). ${strongest.reason}`
      );
    }

    // The decision, plainly, once.
    p.para(isStage9
      ? `After the full review and cumulative within-track ranking, your record did not fall inside ` +
        `the ${STAGE9_FINALIST_PLACES[track]} available ${TRACK_LABEL[track]} finalist places` +
        (trackRank ? `; your audited track position was ${trackRank}.` : `.`) +
        ` Your active Cohort 1 assessment concludes here, and your dashboard credentials will be ` +
        `discontinued on ${formatDate(effectiveDate)} after you have had time to download your records.`
      : `After the full review and within-track ranking for ${cred.title}, your result did not fall ` +
        `inside this project's advance boundary. Your place in Cohort 1 concludes here, and your ` +
        `dashboard credentials will be discontinued on ${formatDate(effectiveDate)}. You keep ` +
        `access until that date to download your documents and your reviewer's notes.`
    );

    p.para(isStage9
      ? `This was an exceptionally hard boundary: ten places across a 34-person room whose members ` +
        `had already survived eight stages. Strong scores still missed the final because selection ` +
        `considered the complete weighted record from Stages 5 through 9A. This is not a polite way ` +
        `of calling your work weak. It is the honest description of a very narrow competition.`
      : `Please be clear about what that decision is not. The advance boundary is a capacity limit, ` +
        `not a verdict on your ability — the Advanced Programme runs small cohorts so that every ` +
        `submission gets read properly, and that ceiling is why strong work is turned away at ` +
        `every project. Read your reviewer's notes. They were written by someone who wanted you ` +
        `to pass.`
    );

    if (isStage9 && priority && priority.label !== strongest?.label) {
      p.para(
        `The most valuable next investment is ${priority.label.toLowerCase()} ` +
          `(${priority.score}/${priority.maximum}). ${priority.reason}`
      );
    }

    // ── Returning code — the concrete way back ────────────
    if (returningCode) {
      const boxY = p.y + 2;
      const boxH = 72;
      doc.rect(x, boxY, w, boxH).fill(P.wash);
      doc.moveTo(x, boxY).lineTo(x, boxY + boxH).lineWidth(2.6).strokeColor(P.metal).stroke();
      doc.fontSize(7).font("Helvetica-Bold").fillColor(P.metal)
        .text("YOUR RETURNING-CANDIDATE CODE", x + 16, boxY + 11, {
          width: w - 32, characterSpacing: 2.2,
        });
      doc.fontSize(19).font("Courier-Bold").fillColor(P.head)
        .text(returningCode, x + 16, boxY + 25, { width: w - 32, characterSpacing: 1.5, lineBreak: false });
      doc.fontSize(8.5).font("Helvetica").fillColor(A.inkSoft)
        .text(
          `Enter this code when applications open for the next cohort and your application is ` +
            `approved automatically — no queue, no second screening. It is bound to this email ` +
            `address and can be used once.`,
          x + 16, boxY + 50, { width: w - 32, lineGap: 1.5 }
        );
      p.y = boxY + boxH + 13;

      p.para(
        `That code is not a courtesy — it is issued only to people who submitted work at an ` +
          `advanced project. Keep it somewhere you will find it again.`
      );
    }

    p.para(
      `You also remain part of the wider Ubuntu Bridge community. Town halls, alumni sessions ` +
        `and device-pitch opportunities stay open to you, and invitations will keep reaching you ` +
        `at this address. Thank you for the work, ${firstName}, and for the seriousness you ` +
        `brought to it — in the ${TRACK_LABEL[track]} track that seriousness is most of the job.`
    );

    // printing over the last paragraph if this letter has run long.
    let closeY = ensureRoom(doc, p.y, CLOSING_BLOCK_HEIGHT, pageH);
    doc.fontSize(10.5).font("Times-Italic").fillColor(P.head)
      .text("With respect and every good wish,", x, closeY, { width: w });
    closeY = doc.y + 42;
    signatures(doc, x, w, closeY, [OKOMA, QUADRI], P);

    letterFooter(doc, x, w, pageH, letterId);

    doc.end();
  });
}
