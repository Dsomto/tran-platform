// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const pdfkitMod: any = require("pdfkit");
const PDFDocument = pdfkitMod.default || pdfkitMod;

import {
  A, OKOMA, QUADRI, CLOSING_BLOCK_HEIGHT, ensureRoom, formatDate, letterFooter, letterhead,
  paletteFor, paragrapher, rosette, signatures, type Doc,
} from "./pdf-primitives";
import {
  ADVANCED_CREDENTIALS, TRACK_LABEL, TRACK_PROFILE, credentialFor, standingFor,
  type AdvancedStageKey,
} from "./advanced-credential";
import { ADVANCED_TRACK_OUTCOMES, type AdvancedTrack } from "./advanced-stage";

/**
 * Employer-facing reference letter — "To whom it may concern".
 *
 * Written in the third person so it can be forwarded verbatim to a recruiter.
 * Issued to advanced-programme interns whether or not they advanced past the
 * project they reached: the attestation describes work that was actually
 * performed and assessed, which is true either way. `completed` only changes
 * whether we can also state that the work met the advancement standard — we
 * never imply a credential that was not earned.
 */
export function generateReferenceLetter(opts: {
  fullName: string;
  stage: AdvancedStageKey;
  track: AdvancedTrack;
  issuedAt: Date;
  letterId: string;
  /** True when the intern passed this project; false when they reached it only. */
  completed: boolean;
  applicantPool?: number | null;
  cohortAtStage?: number | null;
}): Promise<Buffer> {
  const {
    fullName, stage, track, issuedAt, letterId, completed,
    applicantPool, cohortAtStage,
  } = opts;
  const cred = ADVANCED_CREDENTIALS[stage];
  const tc = credentialFor(stage, track);
  const P = paletteFor(track);
  const profile = TRACK_PROFILE[track];
  const outcome = ADVANCED_TRACK_OUTCOMES[track];
  const surname = lastName(fullName);

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
    const top = letterhead(doc, x, w, "Letter of Reference", P);

    doc.fontSize(9.5).font("Helvetica").fillColor(A.ink)
      .text(formatDate(issuedAt), x, top, { width: w });
    doc.fontSize(8).font("Helvetica").fillColor(A.faint)
      .text(`Ref ${letterId}`, x, top, { width: w, align: "right" });

    const y = top + 26;
    doc.fontSize(12).font("Times-Bold").fillColor(P.head)
      .text("TO WHOM IT MAY CONCERN", x, y, { width: w, characterSpacing: 1.4 });
    doc.moveTo(x, y + 20).lineTo(x + 96, y + 20).lineWidth(2).strokeColor(P.metal).stroke();

    const p = paragrapher(doc, x, w, y + 38);

    p.para(
      `I am writing in support of ${fullName}, who participated in Cohort 1 of the Ubuntu Bridge ` +
        `Initiative Cybersecurity Internship, specialising in ${TRACK_LABEL[track]} — the ` +
        `programme's ${profile.discipline} track. I led that programme and reviewed ` +
        `${surname}'s work personally.`
    );

    if (applicantPool) {
      p.para(
        `On selectivity: the cohort drew ${applicantPool.toLocaleString("en-GB")} applications. ` +
          `${surname} was selected, completed the five core stages, and entered the Advanced ` +
          `Programme` +
          (cohortAtStage
            ? `, where only ${cohortAtStage.toLocaleString("en-GB")} candidates remained.`
            : `, which most participants do not reach.`)
      );
    }

    p.para(
      `The Advanced Programme is assessed on submitted evidence, not attendance: candidates ` +
        `trace every material claim to a raw artefact they produced, reproduce builds from a ` +
        `clean state, and defend findings under questioning. The ${TRACK_LABEL[track]} track ` +
        `covers ${profile.summary}. On the ${cred.title} brief “${tc.project}”, ` +
        `${surname} ${tc.attestation}.`
    );

    // ── Capabilities, as a scannable block ────────────────
    const capY = p.y + 2;
    doc.fontSize(7).font("Helvetica-Bold").fillColor(P.metal)
      .text("ASSESSED CAPABILITIES", x, capY, { width: w, characterSpacing: 2.2 });
    // Two columns: six capabilities stacked single-file cost more vertical
    // room than the letter can spare and still hold its signature on page one.
    const colW = (w - 18) / 2;
    const rows = Math.ceil(tc.competencies.length / 2);
    tc.competencies.forEach((c, i) => {
      const col = Math.floor(i / rows);
      const cyRow = capY + 14 + (i % rows) * 13.5;
      const cxCol = x + col * (colW + 18);
      doc.circle(cxCol + 3, cyRow + 4, 1.7).fill(P.metal);
      doc.fontSize(9).font("Times-Roman").fillColor(A.ink)
        .text(c, cxCol + 13, cyRow, { width: colW - 13, lineBreak: false });
    });
    doc.fontSize(8.5).font("Helvetica").fillColor(A.muted)
      .text(`Working toolkit: ${outcome.toolkit}`, x, capY + 18 + rows * 13.5, {
        width: w, lineGap: 1.5,
      });
    p.y = doc.y + 16;

    if (completed) {
      p.para(
        `${surname}'s work at this project met the programme's advancement standard, and the ` +
          `standing of ${standingFor(stage, track)} was conferred. A separate certificate ` +
          `records this and can be verified independently.`
      );
    } else {
      p.para(
        `${surname} did not advance beyond this project. I want to be plain about why, because ` +
          `it is relevant to anyone reading this: advancement is capped by cohort capacity and ` +
          `decided by within-track ranking, so competent work is turned away at every project. ` +
          `The assessment above describes work that was performed and reviewed, and it stands ` +
          `on its own.`
      );
    }

    p.para(
      `I would encourage any employer to weigh what ${surname} produced under these conditions: ` +
        `live briefs, enforced evidence rules, fixed deadlines, and findings defended out loud. ` +
        `That is closer to the job than most junior credentials get. I am glad to answer ` +
        `questions about this reference; it can be verified at the address below.`
    );

    let closeY = ensureRoom(doc, p.y, CLOSING_BLOCK_HEIGHT, pageH);
    doc.fontSize(10.5).font("Times-Italic").fillColor(P.head)
      .text("Yours faithfully,", x, closeY, { width: w });
    closeY = doc.y + 42;
    // Co-signed by the founder. A reference carrying two signatures from the
    // issuing organisation is harder for a recruiter to discount than one.
    signatures(doc, x, w, closeY, [OKOMA, QUADRI], P);

    letterFooter(doc, x, w, pageH, letterId);

    doc.end();
  });
}

function lastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : (parts[0] ?? "The candidate");
}
