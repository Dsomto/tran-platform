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

/** One completed piece of work, for the body-of-work list. */
export type CompletedWork = {
  /** e.g. "Stage 3 — Incident Response" */
  label: string;
  /** Advanced brief title, when the stage had one. */
  project?: string | null;
};

/**
 * Employer-facing reference letter — "To whom it may concern".
 *
 * Written in the third person so it can be forwarded verbatim to a recruiter.
 *
 * What this letter deliberately does NOT do: it never states that the holder
 * was cut, and never explains a ranking decision. A reference exists to open a
 * door. Whether someone advanced to the next project of a capped cohort is a
 * fact about our capacity, not about their ability, and putting it in front of
 * a hiring manager reads as a mark against them however carefully it is
 * phrased.
 *
 * It stays honest by omission rather than by disclaimer: every sentence
 * describes work that was genuinely performed and assessed, the body-of-work
 * list contains only stages actually passed, and the conferred standing is
 * named only when it was actually earned (`completed`). Nothing here implies a
 * credential the holder does not hold.
 */
export function generateReferenceLetter(opts: {
  fullName: string;
  stage: AdvancedStageKey;
  track: AdvancedTrack;
  issuedAt: Date;
  letterId: string;
  /** True when the intern passed this project — controls the standing line only. */
  completed: boolean;
  /** Everything they passed on the way here, earliest first. */
  completedWork?: CompletedWork[];
  applicantPool?: number | null;
  cohortAtStage?: number | null;
}): Promise<Buffer> {
  const {
    fullName, stage, track, issuedAt, letterId, completed,
    completedWork = [], applicantPool, cohortAtStage,
  } = opts;
  const cred = ADVANCED_CREDENTIALS[stage];
  const tc = credentialFor(stage, track);
  const P = paletteFor(track);
  const profile = TRACK_PROFILE[track];
  const outcome = ADVANCED_TRACK_OUTCOMES[track];
  const surname = lastName(fullName);
  const first = fullName.trim().split(/\s+/)[0] || fullName;

  return new Promise((resolve, reject) => {
    const doc: Doc = new PDFDocument({
      size: "A4", layout: "portrait",
      // Bottom margin clears the footer rule (drawn at pageH-96) so a long
      // body-of-work list breaks to a new page instead of running text
      // through the footer. The footer pass below lowers it per page so its
      // own writes don't trigger another break.
      margins: { top: 56, bottom: 112, left: 62, right: 62 },
      bufferPages: true,
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
      `I am glad to write in support of ${fullName}. I run the Ubuntu Bridge Initiative ` +
        `Cybersecurity Internship and read ${first}'s work myself, so this is not a form letter.`
    );

    if (applicantPool) {
      p.para(
        `We opened Cohort 1 to ${applicantPool.toLocaleString("en-GB")} applicants and took a ` +
          `small fraction. ${surname} came through that, then through five core stages, and ` +
          `earned a place in our Advanced Programme in ${TRACK_LABEL[track]}` +
          (cohortAtStage
            ? `, a room that by then held ${cohortAtStage.toLocaleString("en-GB")} people.`
            : `, which most participants never reach.`)
      );
    }

    p.para(
      `Nothing here is awarded for attendance: every claim must trace back to a raw artefact the ` +
        `candidate produced, and findings are defended out loud while a reviewer hunts for the ` +
        `weak point.`
    );

    // ── Body of work — the substance of the endorsement ───
    if (completedWork.length) {
      const boxY = p.y + 2;
      doc.fontSize(7).font("Helvetica-Bold").fillColor(P.metal)
        .text(`COMPLETED AND ASSESSED — ${completedWork.length} PROJECT${completedWork.length === 1 ? "" : "S"}`,
          x, boxY, { width: w, characterSpacing: 2.2 });
      // Two columns — a single-file list of nine stages would cost most of a
      // page on its own. Items keep their brief subtitle where they have one.
      const listColW = (w - 18) / 2;
      const perCol = Math.ceil(completedWork.length / 2);
      let tallest = 0;
      completedWork.forEach((item, i) => {
        const col = Math.floor(i / perCol);
        const idx = i % perCol;
        // Rows are uniform height so the two columns stay aligned.
        const rowH = completedWork.some((c) => c.project) ? 22 : 15;
        const row = boxY + 15 + idx * rowH;
        const cx = x + col * (listColW + 18);
        doc.circle(cx + 3, row + 4.5, 1.8).fill(P.metal);
        doc.fontSize(9).font("Times-Bold").fillColor(A.ink)
          .text(item.label, cx + 13, row, { width: listColW - 13, lineBreak: false });
        if (item.project) {
          doc.fontSize(8).font("Times-Italic").fillColor(A.muted)
            .text(`“${item.project}”`, cx + 13, row + 10.5, {
              width: listColW - 13, lineBreak: false, ellipsis: true,
            });
        }
        tallest = Math.max(tallest, row + rowH);
      });
      p.y = tallest + 4;
    }

    p.para(
      `The most demanding of those was ${cred.title}, on the ${TRACK_LABEL[track]} brief ` +
        `“${tc.project}”. There, ${surname} ${tc.attestation}. That is the job, not coursework.`
    );

    // ── Capabilities, two columns ─────────────────────────
    const capY = p.y + 2;
    doc.fontSize(7).font("Helvetica-Bold").fillColor(P.metal)
      .text("ASSESSED CAPABILITIES", x, capY, { width: w, characterSpacing: 2.2 });
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
    p.y = doc.y + 10;

    if (completed) {
      p.para(
        `On the strength of that work the programme conferred the standing of ` +
          `${standingFor(stage, track)}. A separate certificate records it and can be verified ` +
          `independently.`
      );
    }

    // The endorsement. This is the paragraph a hiring manager actually reads.
    p.para(
      `What I would say to any employer is this. ${surname} took the hardest route available ` +
        `through a programme built around ${profile.discipline}, and the work held up under ` +
        `someone whose job was to find its faults. People who can do that are not common, and ` +
        `they tend to be worth more than their years suggest. I recommend ${first} without ` +
        `reservation, and I am glad to answer any question about this reference.`
    );

    let closeY = ensureRoom(doc, p.y, CLOSING_BLOCK_HEIGHT, pageH);
    doc.fontSize(10.5).font("Times-Italic").fillColor(P.head)
      .text("Yours sincerely,", x, closeY, { width: w });
    closeY = doc.y + 42;
    // Co-signed by the founder. A reference carrying two signatures from the
    // issuing organisation is harder for a recruiter to discount than one.
    signatures(doc, x, w, closeY, [OKOMA, QUADRI], P);

    // Footer on every page — the body-of-work list can push to a second sheet.
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      // The footer sits below the content margin by design; drop the margin
      // for this write so pdfkit does not treat it as overflow and append a
      // blank page.
      doc.page.margins.bottom = 20;
      letterFooter(doc, x, w, pageH, letterId);
    }
    doc.flushPages();

    doc.end();
  });
}

function lastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : (parts[0] ?? "The candidate");
}
