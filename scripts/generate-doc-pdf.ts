import "dotenv/config";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require("pdfkit");

/**
 * Generic markdown -> PDF generator for intern-facing public documents
 * (FAQ, announcements, anything that ISN'T a graders-only marking guide).
 *
 *   IN=faq/stage-0-faq.md OUT=public/help/stage-0-faq.pdf TITLE_LABEL="Stage 0 FAQ" \
 *     npx tsx scripts/generate-doc-pdf.ts
 *
 * Reuses the layout maths from generate-stage-brief-pdf.ts. Same Times
 * body + Helvetica headings. Blue brand stripe on page 1, slim header on
 * continuation pages. No "FOR GRADERS ONLY" warning — this generator is
 * for documents we expect interns to read.
 *
 * The lineBreak: false footer fix is included so we don't regress the
 * trailing-blank-pages bug.
 */

const IN = (process.env.IN ?? "").trim();
const OUT = (process.env.OUT ?? "").trim();
const TITLE_LABEL = (process.env.TITLE_LABEL ?? "UBI Document").trim();
if (!IN || !OUT) {
  console.error(`ERROR: IN and OUT env vars are required.`);
  process.exit(2);
}

const repoRoot = path.resolve(__dirname, "..");
const mdPath = path.isAbsolute(IN) ? IN : path.join(repoRoot, IN);
const pdfPath = path.isAbsolute(OUT) ? OUT : path.join(repoRoot, OUT);
if (!existsSync(mdPath)) {
  console.error(`ERROR: source markdown not found: ${mdPath}`);
  process.exit(2);
}
mkdirSync(path.dirname(pdfPath), { recursive: true });

const md = readFileSync(mdPath, "utf-8");

const COLOR = {
  brand: "#1E40AF",
  brandSoft: "#3B82F6",
  text: "#111827",
  muted: "#64748B",
  rule: "#D1D5DB",
  tableHead: "#EEF2F7",
  tableBorder: "#CBD5E1",
};
const FONT = {
  body: "Times-Roman",
  bold: "Times-Bold",
  italic: "Times-Italic",
  boldItalic: "Times-BoldItalic",
  head: "Helvetica-Bold",
  headLight: "Helvetica",
  mono: "Courier",
};
const SIZE = { h1: 22, h2: 14.5, h3: 11.5, body: 11, small: 9.5, micro: 8 };
const MARGINS = { top: 78, bottom: 64, left: 70, right: 70 };
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - MARGINS.left - MARGINS.right;

const doc = new PDFDocument({ size: "A4", margins: MARGINS, bufferPages: true, autoFirstPage: false });
const chunks: Buffer[] = [];
doc.on("data", (c: Buffer) => chunks.push(c));
doc.on("end", () => {
  const buf = Buffer.concat(chunks);
  writeFileSync(pdfPath, buf);
  console.log(`✓ Wrote ${pdfPath} (${(buf.length / 1024).toFixed(1)} KB)`);
});

let isFirstPage = true;

function letterhead() {
  doc.save();
  if (isFirstPage) {
    doc.rect(0, 0, PAGE_W, 6).fillColor(COLOR.brand).fill();
    doc.font(FONT.head).fontSize(13).fillColor(COLOR.brand)
      .text("UBI", MARGINS.left, 28, { lineBreak: false });
    doc.font(FONT.headLight).fontSize(7.5).fillColor(COLOR.muted)
      .text("UBUNTU BRIDGE INITIATIVE", MARGINS.left + 30, 32, { lineBreak: false, characterSpacing: 0.6 });
    doc.font(FONT.headLight).fontSize(7.5).fillColor(COLOR.muted)
      .text("Cybersecurity Internship · Cohort 1", MARGINS.left, 32, { width: CONTENT_W, align: "right" });
    doc.moveTo(MARGINS.left, 50).lineTo(MARGINS.left + CONTENT_W, 50)
      .strokeColor(COLOR.rule).lineWidth(0.4).stroke();
    isFirstPage = false;
  } else {
    doc.font(FONT.headLight).fontSize(7.5).fillColor(COLOR.muted)
      .text(`UBI · ${TITLE_LABEL}`, MARGINS.left, 32, { lineBreak: false, characterSpacing: 0.4 });
    doc.font(FONT.headLight).fontSize(7.5).fillColor(COLOR.muted)
      .text("Cohort 1", MARGINS.left, 32, { width: CONTENT_W, align: "right" });
    doc.moveTo(MARGINS.left, 48).lineTo(MARGINS.left + CONTENT_W, 48)
      .strokeColor(COLOR.rule).lineWidth(0.3).stroke();
  }
  doc.restore();
  doc.x = MARGINS.left;
  doc.y = MARGINS.top;
}

function newPage() { doc.addPage(); letterhead(); }
newPage();

function spaceLeft(): number { return PAGE_H - MARGINS.bottom - doc.y; }
function ensureSpace(needed: number) { if (spaceLeft() < needed) newPage(); }

type Run = { text: string; font: string; size: number; color?: string };

function runsForLine(line: string, baseSize: number, baseFont = FONT.body): Run[] {
  const runs: Run[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) runs.push({ text: line.slice(last, m.index), font: baseFont, size: baseSize });
    const t = m[0];
    if (t.startsWith("**")) runs.push({ text: t.slice(2, -2), font: FONT.bold, size: baseSize });
    else if (t.startsWith("`")) runs.push({ text: t.slice(1, -1), font: FONT.mono, size: baseSize - 0.5 });
    else runs.push({ text: t.slice(1, -1), font: FONT.italic, size: baseSize });
    last = m.index + t.length;
  }
  if (last < line.length) runs.push({ text: line.slice(last), font: baseFont, size: baseSize });
  return runs;
}

function renderRuns(runs: Run[], opts: { width: number; color?: string; xStart?: number; lineGap?: number } = { width: CONTENT_W }) {
  const color = opts.color ?? COLOR.text;
  doc.fillColor(color);
  const xStart = opts.xStart ?? MARGINS.left;
  doc.x = xStart;
  runs.forEach((run, i) => {
    doc.font(run.font).fontSize(run.size).fillColor(run.color ?? color);
    const isLast = i === runs.length - 1;
    const o: Record<string, unknown> = { continued: !isLast };
    if (i === 0) {
      o.width = opts.width;
      if (opts.lineGap !== undefined) o.lineGap = opts.lineGap;
    }
    doc.text(run.text, o);
  });
}

function renderTable(rows: string[][]) {
  if (rows.length === 0) return;
  const cleaned = rows.filter((r) => !r.every((c) => /^:?-+:?$/.test(c.trim())));
  if (cleaned.length === 0) return;
  const numCols = cleaned[0].length;
  const cellPadX = 8;
  const cellPadY = 6;
  const colW = CONTENT_W / numCols;
  doc.moveDown(0.25);
  for (let rIdx = 0; rIdx < cleaned.length; rIdx++) {
    const row = cleaned[rIdx];
    const isHead = rIdx === 0;
    const font = isHead ? FONT.head : FONT.body;
    const size = SIZE.small;
    const cellHs = row.map((cell) => {
      doc.font(font).fontSize(size);
      const h = doc.heightOfString(cell.trim(), { width: colW - 2 * cellPadX });
      return Math.max(20, h + 2 * cellPadY);
    });
    const rowH = Math.max(...cellHs) + 4;
    ensureSpace(rowH + 6);
    const y = doc.y;
    if (isHead) doc.rect(MARGINS.left, y, CONTENT_W, rowH).fillColor(COLOR.tableHead).fill();
    doc.rect(MARGINS.left, y, CONTENT_W, rowH).strokeColor(COLOR.tableBorder).lineWidth(0.5).stroke();
    for (let c = 1; c < numCols; c++) {
      doc.moveTo(MARGINS.left + c * colW, y).lineTo(MARGINS.left + c * colW, y + rowH)
        .strokeColor(COLOR.tableBorder).stroke();
    }
    for (let cIdx = 0; cIdx < row.length; cIdx++) {
      const x = MARGINS.left + cIdx * colW + cellPadX;
      doc.font(font).fontSize(size).fillColor(COLOR.text)
        .text(row[cIdx].trim(), x, y + cellPadY, {
          width: colW - 2 * cellPadX,
          height: rowH - 2 * cellPadY,
        });
    }
    doc.y = y + rowH;
  }
  doc.x = MARGINS.left;
  doc.moveDown(0.35);
}

function renderBlockquote(text: string) {
  ensureSpace(SIZE.body * 2);
  const startY = doc.y;
  const padX = 14;
  const padY = 4;
  const runs = runsForLine(text, SIZE.body, FONT.italic);
  doc.x = MARGINS.left + padX;
  doc.font(FONT.italic).fontSize(SIZE.body);
  const h = doc.heightOfString(text.replace(/[*`]/g, ""), { width: CONTENT_W - padX });
  doc.rect(MARGINS.left, startY, 2.5, h + padY * 2).fillColor(COLOR.brandSoft).fill();
  doc.y = startY + padY;
  renderRuns(runs, { width: CONTENT_W - padX, xStart: MARGINS.left + padX, color: COLOR.text });
  doc.x = MARGINS.left;
  doc.y = startY + h + padY * 2;
  doc.moveDown(0.5);
}

const lines = md.split("\n");
let para: string[] = [];
let tableRows: string[][] = [];
let firstHeading = true;

function flushPara() {
  if (para.length === 0) return;
  const text = para.join(" ").trim();
  para = [];
  if (!text) return;
  ensureSpace(SIZE.body * 1.6);
  doc.x = MARGINS.left;
  const runs = runsForLine(text, SIZE.body);
  renderRuns(runs, { width: CONTENT_W, lineGap: 2 });
  doc.moveDown(0.5);
}

function flushTable() { if (tableRows.length === 0) return; renderTable(tableRows); tableRows = []; }

for (const raw of lines) {
  const line = raw.replace(/\s+$/, "");
  if (line.startsWith("> ")) { flushPara(); flushTable(); renderBlockquote(line.slice(2)); continue; }
  if (line.startsWith("|") && line.endsWith("|") && line.includes("|", 1)) {
    flushPara();
    tableRows.push(line.slice(1, -1).split("|").map((c) => c.trim()));
    continue;
  } else { flushTable(); }
  if (line.trim() === "") { flushPara(); continue; }
  if (line.startsWith("# ")) {
    flushPara();
    if (!firstHeading) doc.moveDown(0.4);
    firstHeading = false;
    ensureSpace(SIZE.h1 * 2.2);
    doc.font(FONT.head).fontSize(SIZE.h1).fillColor(COLOR.text).text(line.slice(2), MARGINS.left, doc.y, { width: CONTENT_W });
    doc.moveDown(0.15);
    const ruleY = doc.y;
    doc.rect(MARGINS.left, ruleY, 44, 2).fillColor(COLOR.brand).fill();
    doc.y = ruleY + 6;
    doc.moveDown(0.25);
    continue;
  }
  if (line.startsWith("## ")) {
    flushPara();
    doc.moveDown(0.3);
    ensureSpace(SIZE.h2 * 2.0);
    doc.font(FONT.head).fontSize(SIZE.h2).fillColor(COLOR.brand).text(line.slice(3), MARGINS.left, doc.y, { width: CONTENT_W });
    doc.moveDown(0.15);
    continue;
  }
  if (line.startsWith("### ")) {
    flushPara();
    doc.moveDown(0.22);
    ensureSpace(SIZE.h3 * 1.8);
    doc.font(FONT.head).fontSize(SIZE.h3).fillColor(COLOR.text).text(line.slice(4), MARGINS.left, doc.y, { width: CONTENT_W });
    doc.moveDown(0.1);
    continue;
  }
  if (line.trim() === "---") {
    flushPara();
    doc.moveDown(0.4);
    ensureSpace(10);
    doc.moveTo(MARGINS.left + CONTENT_W * 0.35, doc.y).lineTo(MARGINS.left + CONTENT_W * 0.65, doc.y).strokeColor(COLOR.rule).lineWidth(0.6).stroke();
    doc.moveDown(0.6);
    continue;
  }
  const italicLine = /^\*([^*].*[^*])\*$/.exec(line.trim());
  if (italicLine) {
    flushPara();
    ensureSpace(SIZE.small * 1.8);
    doc.font(FONT.italic).fontSize(SIZE.small).fillColor(COLOR.muted).text(italicLine[1], MARGINS.left, doc.y, { width: CONTENT_W });
    doc.moveDown(0.5);
    continue;
  }
  const bullet = /^[-*]\s+(.*)$/.exec(line);
  if (bullet) {
    flushPara();
    ensureSpace(SIZE.body * 1.6);
    const bulletIndent = 14;
    const runs = runsForLine(bullet[1], SIZE.body);
    const y = doc.y;
    doc.font(FONT.body).fontSize(SIZE.body).fillColor(COLOR.brand)
      .text("•", MARGINS.left + 3, y, { lineBreak: false });
    doc.y = y;
    renderRuns(runs, { width: CONTENT_W - bulletIndent, xStart: MARGINS.left + bulletIndent, lineGap: 1 });
    doc.moveDown(0.08);
    continue;
  }
  const numbered = /^(\d+)\.\s+(.*)$/.exec(line);
  if (numbered) {
    flushPara();
    ensureSpace(SIZE.body * 1.6);
    const numIndent = 18;
    const runs = runsForLine(numbered[2], SIZE.body);
    const y = doc.y;
    doc.font(FONT.bold).fontSize(SIZE.body).fillColor(COLOR.brand)
      .text(`${numbered[1]}.`, MARGINS.left + 2, y, { lineBreak: false });
    doc.y = y;
    renderRuns(runs, { width: CONTENT_W - numIndent, xStart: MARGINS.left + numIndent, lineGap: 1 });
    doc.moveDown(0.08);
    continue;
  }
  para.push(line);
}
flushPara();
flushTable();

// Footer — manually centred via widthOfString + lineBreak: false to keep
// pdfkit from auto-paginating during the footer pass. (Without this, the
// page count balloons because pdfkit invents pages whenever it suspects
// the centred text might overflow — see scripts/generate-marking-guide-pdf.ts.)
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  doc.font(FONT.headLight).fontSize(7.5).fillColor(COLOR.muted);
  const pageLabel = `${i + 1} / ${range.count}`;
  const pageLabelW = doc.widthOfString(pageLabel);
  doc.text(pageLabel, (PAGE_W - pageLabelW) / 2, PAGE_H - 42, { lineBreak: false });
  doc.fontSize(7).fillColor(COLOR.muted);
  const footerLabel = `ubuntubridgeinitiatives.org · ${TITLE_LABEL}`;
  const footerLabelW = doc.widthOfString(footerLabel);
  doc.text(footerLabel, (PAGE_W - footerLabelW) / 2, PAGE_H - 28, { lineBreak: false });
}

doc.end();
