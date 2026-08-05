// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const pdfkitMod: any = require("pdfkit");
const PDFDocument = pdfkitMod.default || pdfkitMod;

import {
  A, OKOMA, formatDate, letterFooter, letterhead, paletteFor, signatures, type Doc,
} from "./pdf-primitives";
import { TRACK_LABEL, TRACK_PROFILE } from "./advanced-credential";
import type { AdvancedTrack } from "./advanced-stage";

export type StageRow = {
  /** Display label, e.g. "Stage 6 — Advanced Exposure". */
  label: string;
  /** Final combined score, 0-100. Null when the stage was never graded. */
  score: number | null;
  passingScore: number;
  /** PASSED / FAILED / anything else renders as "Not assessed". */
  status: string;
  /** Reviewer feedback, printed verbatim under the row when present. */
  feedback?: string | null;
};

/**
 * Personal Performance Record — a one-document account of everything the
 * intern did across the whole programme: every stage, the score, the
 * threshold it was measured against, and the reviewer's own words.
 *
 * The point of this document is that the intern keeps the substance of their
 * assessment after their dashboard access ends. It paginates rather than
 * truncating: reviewer notes are the most useful part and must not be cut.
 */
export function generatePerformanceRecord(opts: {
  fullName: string;
  internCode?: string | null;
  track: AdvancedTrack;
  issuedAt: Date;
  recordId: string;
  stages: StageRow[];
}): Promise<Buffer> {
  const { fullName, internCode, track, issuedAt, recordId, stages } = opts;
  const P = paletteFor(track);
  const profile = TRACK_PROFILE[track];

  return new Promise((resolve, reject) => {
    const doc: Doc = new PDFDocument({
      size: "A4", layout: "portrait",
      // Bottom margin stays shallow so the footer, which prints at pageH-96,
      // does not trip pdfkit's auto-pagination and emit blank trailing pages.
      // Content pagination is controlled by `bottomLimit` below instead.
      margins: { top: 56, bottom: 40, left: 62, right: 62 },
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
    const bottomLimit = pageH - 120;

    const top = letterhead(doc, x, w, "Personal Performance Record", P);

    doc.fontSize(9.5).font("Helvetica").fillColor(A.ink)
      .text(formatDate(issuedAt), x, top, { width: w });
    doc.fontSize(8).font("Helvetica").fillColor(A.faint)
      .text(`Ref ${recordId}`, x, top, { width: w, align: "right" });

    // ── Header block ──────────────────────────────────────
    let y = top + 26;
    doc.fontSize(8).font("Helvetica-Bold").fillColor(P.metal)
      .text("PERSONAL PERFORMANCE RECORD", x, y, { width: w, characterSpacing: 2.4 });
    doc.fontSize(17).font("Times-Bold").fillColor(P.head)
      .text(fullName, x, y + 15, { width: w });
    doc.fontSize(9).font("Helvetica").fillColor(A.muted)
      .text(
        [
          `${TRACK_LABEL[track]} track`,
          "Cohort 1",
          internCode ? `Intern ID ${internCode}` : null,
        ].filter(Boolean).join("   ·   "),
        x, y + 38, { width: w }
      );
    doc.moveTo(x, y + 56).lineTo(x + w, y + 56).lineWidth(0.7).strokeColor(P.metalPale).stroke();
    y += 68;

    // ── What this track demanded ──────────────────────────
    // The core stages are common to everyone; the advanced stages are not.
    // Without this, a reader cannot tell what the scores below were measured
    // against, and the three tracks are not measured against the same thing.
    doc.fontSize(6.5).font("Helvetica-Bold").fillColor(P.metal)
      .text("TRACK ASSESSED ON", x, y, { width: w, characterSpacing: 1.6 });
    doc.fontSize(9).font("Times-Italic").fillColor(A.inkSoft)
      .text(`${profile.summary}.`, x, y + 11, { width: w, lineGap: 1.6 });
    y = doc.y + 16;

    // ── Summary strip ─────────────────────────────────────
    const assessed = stages.filter((s) => typeof s.score === "number");
    const passed = stages.filter((s) => s.status === "PASSED").length;
    const avg = assessed.length
      ? Math.round(assessed.reduce((t, s) => t + (s.score as number), 0) / assessed.length)
      : null;

    const tiles: Array<[string, string]> = [
      ["STAGES ASSESSED", String(assessed.length)],
      ["STAGES PASSED", String(passed)],
      ["AVERAGE SCORE", avg === null ? "—" : `${avg}%`],
      ["FURTHEST STAGE", stages.length ? shortLabel(stages[stages.length - 1].label) : "—"],
    ];
    const tileW = (w - 3 * 8) / 4;
    tiles.forEach(([label, value], i) => {
      const tx = x + i * (tileW + 8);
      doc.rect(tx, y, tileW, 46).fill("#F7F9FD");
      doc.moveTo(tx, y).lineTo(tx, y + 46).lineWidth(2).strokeColor(P.metal).stroke();
      doc.fontSize(6.5).font("Helvetica-Bold").fillColor(A.muted)
        .text(label, tx + 9, y + 9, { width: tileW - 14, characterSpacing: 1.1 });
      doc.fontSize(15).font("Times-Bold").fillColor(P.head)
        .text(value, tx + 9, y + 21, { width: tileW - 14, lineBreak: false });
    });
    y += 62;

    // ── Stage-by-stage ────────────────────────────────────
    doc.fontSize(7.5).font("Helvetica-Bold").fillColor(P.metal)
      .text("STAGE BY STAGE", x, y, { width: w, characterSpacing: 2.2 });
    y += 16;

    const newPage = () => {
      doc.addPage();
      y = 64;
    };

    for (const s of stages) {
      // Measure the block before committing to a page, so a stage and its
      // reviewer note never split across the page break.
      const noteText = (s.feedback ?? "").trim();
      const noteH = noteText
        ? doc.fontSize(8.5).font("Times-Roman").heightOfString(noteText, { width: w - 26, lineGap: 1.8 }) + 16
        : 0;
      const blockH = 30 + noteH + 10;
      if (y + blockH > bottomLimit) newPage();

      const verdict = verdictOf(s);
      doc.rect(x, y, w, 26).fill("#F7F9FD");
      doc.moveTo(x, y).lineTo(x, y + 26).lineWidth(2.4).strokeColor(verdict.color).stroke();

      doc.fontSize(10).font("Times-Bold").fillColor(P.head)
        .text(s.label, x + 12, y + 8, { width: w - 190, lineBreak: false });

      doc.fontSize(7).font("Helvetica-Bold").fillColor(verdict.color)
        .text(verdict.label.toUpperCase(), x + w - 178, y + 10, {
          width: 92, align: "right", characterSpacing: 1.1, lineBreak: false,
        });
      doc.fontSize(11).font("Times-Bold").fillColor(P.head)
        .text(s.score === null ? "—" : `${s.score}%`, x + w - 78, y + 7, {
          width: 42, align: "right", lineBreak: false,
        });
      doc.fontSize(7).font("Helvetica").fillColor(A.faint)
        .text(`/ ${s.passingScore}`, x + w - 32, y + 11, {
          width: 32, align: "right", lineBreak: false,
        });
      y += 30;

      if (noteText) {
        doc.fontSize(6.5).font("Helvetica-Bold").fillColor(A.muted)
          .text("REVIEWER'S NOTES", x + 12, y, { width: w - 24, characterSpacing: 1.2 });
        doc.fontSize(8.5).font("Times-Roman").fillColor(A.inkSoft)
          .text(noteText, x + 12, y + 11, { width: w - 26, lineGap: 1.8 });
        y = doc.y + 10;
      }
      y += 6;
    }

    // ── Closing note + signature ──────────────────────────
    if (y + 130 > bottomLimit) newPage();
    y += 6;
    doc.moveTo(x, y).lineTo(x + w, y).lineWidth(0.7).strokeColor(P.metalPale).stroke();
    doc.fontSize(9).font("Times-Italic").fillColor(A.inkSoft)
      .text(
        "This record is issued so that the substance of your assessment stays with you after " +
          "your dashboard access ends. The scores are the ones the programme's decisions were " +
          "made on, and the reviewer's notes are reproduced exactly as they were written.",
        x, y + 12, { width: w, lineGap: 2 }
      );

    signatures(doc, x, w, doc.y + 46, [OKOMA], P);

    // ── Footer + page numbers on every page ───────────────
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      letterFooter(doc, x, w, pageH, recordId);
      doc.fontSize(7).font("Helvetica").fillColor(A.faint)
        .text(`Page ${i + 1} of ${range.count}`, x, pageH - 60, {
          width: w, align: "center", lineBreak: false,
        });
    }
    doc.flushPages();

    doc.end();
  });
}

function verdictOf(s: StageRow): { label: string; color: string } {
  if (s.status === "PASSED") return { label: "Passed", color: "#15803D" };
  if (s.status === "FAILED") return { label: "Not advanced", color: "#B45309" };
  return { label: "Not assessed", color: A.faint };
}

/** "Stage 6 — Advanced Exposure" -> "Stage 6", for the summary tile. */
function shortLabel(label: string): string {
  const m = label.match(/^(Stage\s+\d+)/i);
  return m ? m[1] : label.slice(0, 12);
}
