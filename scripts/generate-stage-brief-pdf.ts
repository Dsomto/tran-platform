import "dotenv/config";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require("pdfkit");

/**
 * Render a stage's mission-brief markdown into a styled PDF.
 *
 *   STAGE=stage-0 npx tsx scripts/generate-stage-brief-pdf.ts
 *
 * Reads:   capstone-resources/<stage>/00-mission-brief.md
 * Writes:  public/capstone/<stage>/00-mission-brief.pdf
 */

const STAGE = (process.env.STAGE ?? "").trim();
const VALID = new Set(["stage-0", "stage-1", "stage-2", "stage-3", "stage-4"]);
if (!STAGE || !VALID.has(STAGE)) {
  console.error(`ERROR: STAGE must be one of: ${[...VALID].join(", ")}.`);
  process.exit(2);
}

const repoRoot = path.resolve(__dirname, "..");
const mdPath = path.join(repoRoot, "capstone-resources", STAGE, "00-mission-brief.md");
const pdfPath = path.join(repoRoot, "public", "capstone", STAGE, "00-mission-brief.pdf");
if (!existsSync(mdPath)) {
  console.error(`ERROR: source markdown not found: ${mdPath}`);
  process.exit(2);
}

const md = readFileSync(mdPath, "utf-8");

const COLOR = {
  brand: "#2563EB",
  text: "#0F172A",
  muted: "#475569",
  rule: "#CBD5E1",
  tableHead: "#F1F5F9",
  tableBorder: "#CBD5E1",
};
const FONT = {
  body: "Helvetica",
  bold: "Helvetica-Bold",
  italic: "Helvetica-Oblique",
  boldItalic: "Helvetica-BoldOblique",
  mono: "Courier",
};
const SIZE = { h1: 17, h2: 11.5, h3: 9.5, body: 9, small: 8 };
const MARGINS = { top: 52, bottom: 54, left: 50, right: 50 };
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - MARGINS.left - MARGINS.right;

const doc = new PDFDocument({
  size: "A4",
  margins: MARGINS,
  bufferPages: true,
  autoFirstPage: false,
});
const chunks: Buffer[] = [];
doc.on("data", (c: Buffer) => chunks.push(c));
doc.on("end", () => {
  const buf = Buffer.concat(chunks);
  writeFileSync(pdfPath, buf);
  console.log(`✓ Wrote ${pdfPath} (${(buf.length / 1024).toFixed(1)} KB)`);
});

function letterhead() {
  doc
    .save()
    .font(FONT.bold)
    .fontSize(14)
    .fillColor(COLOR.brand)
    .text("UBI", MARGINS.left, 26, { lineBreak: false });
  doc
    .font(FONT.body)
    .fontSize(7)
    .fillColor(COLOR.muted)
    .text("UBUNTU BRIDGE INITIATIVE", MARGINS.left, 44, { lineBreak: false });
  doc
    .fontSize(7.5)
    .fillColor(COLOR.muted)
    .text("Cybersecurity Internship · Cohort 1", MARGINS.left, 26, {
      width: CONTENT_W,
      align: "right",
    });
  doc
    .moveTo(MARGINS.left, 58)
    .lineTo(MARGINS.left + CONTENT_W, 58)
    .strokeColor(COLOR.rule)
    .lineWidth(0.5)
    .stroke()
    .restore();
  doc.x = MARGINS.left;
  doc.y = 70;
}

function newPage() {
  doc.addPage();
  letterhead();
}
newPage();

function spaceLeft(): number {
  return PAGE_H - MARGINS.bottom - doc.y;
}
function ensureSpace(needed: number) {
  if (spaceLeft() < needed) newPage();
}

// ─── Inline run parsing ─────────────────────────────────────────
// Each run is a contiguous string with one font.

type Run = { text: string; font: string; size: number };

function runsForLine(line: string, baseSize: number, baseFont = FONT.body): Run[] {
  const runs: Run[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) runs.push({ text: line.slice(last, m.index), font: baseFont, size: baseSize });
    const t = m[0];
    if (t.startsWith("**")) runs.push({ text: t.slice(2, -2), font: baseFont === FONT.bold ? FONT.boldItalic : FONT.bold, size: baseSize });
    else if (t.startsWith("`")) runs.push({ text: t.slice(1, -1), font: FONT.mono, size: baseSize });
    else runs.push({ text: t.slice(1, -1), font: FONT.italic, size: baseSize });
    last = m.index + t.length;
  }
  if (last < line.length) runs.push({ text: line.slice(last), font: baseFont, size: baseSize });
  return runs;
}

function renderRuns(runs: Run[], opts: { width: number; color?: string; xStart?: number } = { width: CONTENT_W }) {
  const color = opts.color ?? COLOR.text;
  doc.fillColor(color);
  const xStart = opts.xStart ?? MARGINS.left;
  doc.x = xStart;
  // First call sets the width + position; subsequent continued calls inherit.
  runs.forEach((run, i) => {
    doc.font(run.font).fontSize(run.size);
    const isLast = i === runs.length - 1;
    const o: Record<string, unknown> = { continued: !isLast };
    if (i === 0) {
      o.width = opts.width;
    }
    doc.text(run.text, o);
  });
}

// ─── Table renderer ─────────────────────────────────────────────

function renderTable(rows: string[][]) {
  if (rows.length === 0) return;
  const cleaned = rows.filter((r) => !r.every((c) => /^:?-+:?$/.test(c.trim())));
  if (cleaned.length === 0) return;
  const numCols = cleaned[0].length;
  const cellPad = 5;
  const colW = CONTENT_W / numCols;
  doc.moveDown(0.2);
  for (let rIdx = 0; rIdx < cleaned.length; rIdx++) {
    const row = cleaned[rIdx];
    const isHead = rIdx === 0;
    const cellHs = row.map((cell) => {
      doc.font(isHead ? FONT.bold : FONT.body).fontSize(SIZE.small);
      const h = doc.heightOfString(cell.trim(), { width: colW - 2 * cellPad });
      return Math.max(14, h + 2 * cellPad);
    });
    const rowH = Math.max(...cellHs);
    ensureSpace(rowH + 4);
    const y = doc.y;
    if (isHead) doc.rect(MARGINS.left, y, CONTENT_W, rowH).fillColor(COLOR.tableHead).fill();
    doc.rect(MARGINS.left, y, CONTENT_W, rowH).strokeColor(COLOR.tableBorder).lineWidth(0.5).stroke();
    for (let c = 1; c < numCols; c++) {
      doc
        .moveTo(MARGINS.left + c * colW, y)
        .lineTo(MARGINS.left + c * colW, y + rowH)
        .strokeColor(COLOR.tableBorder)
        .stroke();
    }
    for (let cIdx = 0; cIdx < row.length; cIdx++) {
      const x = MARGINS.left + cIdx * colW + cellPad;
      doc
        .font(isHead ? FONT.bold : FONT.body)
        .fontSize(SIZE.small)
        .fillColor(COLOR.text)
        .text(row[cIdx].trim(), x, y + cellPad, { width: colW - 2 * cellPad });
    }
    doc.y = y + rowH;
  }
  doc.x = MARGINS.left;
  doc.moveDown(0.3);
}

// ─── Walk the markdown ──────────────────────────────────────────

const lines = md.split("\n");
let para: string[] = [];
let tableRows: string[][] = [];
let firstHeading = true;

function flushPara() {
  if (para.length === 0) return;
  const text = para.join(" ").trim();
  para = [];
  if (!text) return;
  ensureSpace(SIZE.body * 1.4);
  doc.x = MARGINS.left;
  const runs = runsForLine(text, SIZE.body);
  renderRuns(runs, { width: CONTENT_W });
  doc.moveDown(0.25);
}

function flushTable() {
  if (tableRows.length === 0) return;
  renderTable(tableRows);
  tableRows = [];
}

for (const raw of lines) {
  const line = raw.replace(/\s+$/, "");
  if (line.startsWith("|") && line.endsWith("|") && line.includes("|", 1)) {
    flushPara();
    tableRows.push(
      line
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim())
    );
    continue;
  } else {
    flushTable();
  }
  if (line.trim() === "") {
    flushPara();
    continue;
  }
  if (line.startsWith("# ")) {
    flushPara();
    if (!firstHeading) doc.moveDown(0.3);
    firstHeading = false;
    ensureSpace(SIZE.h1 * 1.5);
    doc.font(FONT.bold).fontSize(SIZE.h1).fillColor(COLOR.text).text(line.slice(2), { width: CONTENT_W });
    doc.moveDown(0.15);
    continue;
  }
  if (line.startsWith("## ")) {
    flushPara();
    doc.moveDown(0.2);
    ensureSpace(SIZE.h2 * 1.8);
    doc.font(FONT.bold).fontSize(SIZE.h2).fillColor(COLOR.brand).text(line.slice(3), { width: CONTENT_W });
    doc.moveDown(0.05);
    continue;
  }
  if (line.startsWith("### ")) {
    flushPara();
    doc.moveDown(0.12);
    ensureSpace(SIZE.h3 * 1.8);
    doc.font(FONT.bold).fontSize(SIZE.h3).fillColor(COLOR.text).text(line.slice(4), { width: CONTENT_W });
    doc.moveDown(0.04);
    continue;
  }
  if (line.trim() === "---") {
    flushPara();
    doc.moveDown(0.25);
    ensureSpace(8);
    doc.moveTo(MARGINS.left, doc.y).lineTo(MARGINS.left + CONTENT_W, doc.y).strokeColor(COLOR.rule).lineWidth(0.4).stroke();
    doc.moveDown(0.4);
    continue;
  }
  // Italic-only standalone line *...*
  const italicLine = /^\*([^*].*[^*])\*$/.exec(line.trim());
  if (italicLine) {
    flushPara();
    ensureSpace(SIZE.small * 1.6);
    doc.font(FONT.italic).fontSize(SIZE.small).fillColor(COLOR.muted).text(italicLine[1], { width: CONTENT_W });
    doc.moveDown(0.4);
    continue;
  }
  // Bullet — prepend the marker, let pdfkit wrap normally with hanging indent
  const bullet = /^[-*]\s+(.*)$/.exec(line);
  if (bullet) {
    flushPara();
    ensureSpace(SIZE.body * 1.4);
    doc.x = MARGINS.left;
    const runs = runsForLine(bullet[1], SIZE.body);
    runs.unshift({ text: "•  ", font: FONT.body, size: SIZE.body });
    renderRuns(runs, { width: CONTENT_W });
    doc.moveDown(0.08);
    continue;
  }
  const numbered = /^(\d+)\.\s+(.*)$/.exec(line);
  if (numbered) {
    flushPara();
    ensureSpace(SIZE.body * 1.4);
    doc.x = MARGINS.left;
    const runs = runsForLine(numbered[2], SIZE.body);
    runs.unshift({ text: `${numbered[1]}.  `, font: FONT.bold, size: SIZE.body });
    renderRuns(runs, { width: CONTENT_W });
    doc.moveDown(0.08);
    continue;
  }
  para.push(line);
}
flushPara();
flushTable();

// ─── Page footers ───────────────────────────────────────────────

const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  doc
    .font(FONT.body)
    .fontSize(7.5)
    .fillColor(COLOR.muted)
    .text(`Page ${i + 1} of ${range.count}`, MARGINS.left, PAGE_H - 38, {
      width: CONTENT_W,
      align: "center",
    });
  doc
    .fontSize(7)
    .fillColor(COLOR.muted)
    .text(
      `ubuntubridgeinitiatives.org · ${STAGE.replace("stage-", "Stage ")} · Capstone Mission Brief`,
      MARGINS.left,
      PAGE_H - 26,
      { width: CONTENT_W, align: "center" }
    );
}

doc.end();
