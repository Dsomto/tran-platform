// pdfkit ships CommonJS — Next.js's production bundler wraps it as
// { default: PDFDocument }. Without this normalisation `new PDFDocument()`
// throws "C is not a constructor" on Vercel.
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const pdfkitMod: any = require("pdfkit");
const PDFDocument = pdfkitMod.default || pdfkitMod;
import { UBI_LOGO_BUFFER } from "./ubi-logo-data";

// Same brand palette as the certificate/pass-letter generators — navy
// structure, website-blue accent — so this reads as the same document
// family, not a separate utilitarian export.
const C = {
  navy: "#0A1F44",
  navyDeep: "#06152F",
  blue: "#2563EB",
  ink: "#0A1F44",
  inkSoft: "#33405C",
  muted: "#5A6682",
  rule: "#D7DEEC",
  soft: "#F2F5FB",
  accent: "#1E40AF",
};

const MARGIN = 56;
const PAGE_WIDTH = 612; // US Letter, points
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

type Run = { text: string; bold?: boolean; code?: boolean };

/** Split "plain **bold** and `code`" into typed runs for inline rendering. */
function inlineRuns(text: string): Run[] {
  const runs: Run[] = [];
  const re = /\*\*(.+?)\*\*|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) runs.push({ text: text.slice(last, m.index) });
    if (m[1] !== undefined) runs.push({ text: m[1], bold: true });
    else if (m[2] !== undefined) runs.push({ text: m[2], code: true });
    last = re.lastIndex;
  }
  if (last < text.length) runs.push({ text: text.slice(last) });
  return runs.length ? runs : [{ text }];
}

type Block =
  | { kind: "h1" | "h2" | "h3"; text: string }
  | { kind: "p"; text: string }
  | { kind: "ul" | "ol"; items: string[] }
  | { kind: "table"; header: string[]; rows: string[][] };

function isTableSeparator(line: string): boolean {
  return /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?$/.test(line.trim());
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

/** Parse the small, known markdown surface these docs use: headings,
 * paragraphs, ordered/unordered lists, and GFM-style pipe tables. */
function parseMarkdown(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    if (line.startsWith("### ")) { blocks.push({ kind: "h3", text: line.slice(4).trim() }); i++; continue; }
    if (line.startsWith("## ")) { blocks.push({ kind: "h2", text: line.slice(3).trim() }); i++; continue; }
    if (line.startsWith("# ")) { blocks.push({ kind: "h1", text: line.slice(2).trim() }); i++; continue; }

    if (line.trim().startsWith("|") && lines[i + 1] && isTableSeparator(lines[i + 1])) {
      const header = splitTableRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      blocks.push({ kind: "table", header, rows });
      continue;
    }

    if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      const ordered = /^\d+\.\s+/.test(line);
      const marker = ordered ? /^\d+\.\s+/ : /^[-*]\s+/;
      const items: string[] = [];
      while (i < lines.length && marker.test(lines[i])) {
        let item = lines[i].replace(marker, "").trim();
        i++;
        // A markdown list item that wraps onto following lines without its
        // own marker (soft-wrapped, often indented) is a CONTINUATION of
        // this same item, not a new paragraph and not the end of the list.
        // Missing this previously broke every multi-line item into an
        // orphan paragraph and reset the numbering on the next real item.
        while (
          i < lines.length &&
          lines[i].trim() &&
          !marker.test(lines[i]) &&
          !/^#{1,3}\s/.test(lines[i]) &&
          !(lines[i].trim().startsWith("|") && lines[i + 1] && isTableSeparator(lines[i + 1]))
        ) {
          item += ` ${lines[i].trim()}`;
          i++;
        }
        items.push(item);
      }
      blocks.push({ kind: ordered ? "ol" : "ul", items });
      continue;
    }

    // Paragraph: consume until a blank line or the start of another block type.
    const para: string[] = [line.trim()];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{1,3}\s/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !(lines[i].trim().startsWith("|") && lines[i + 1] && isTableSeparator(lines[i + 1]))
    ) {
      para.push(lines[i].trim());
      i++;
    }
    blocks.push({ kind: "p", text: para.join(" ") });
  }

  return blocks;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function writeRuns(doc: any, runs: Run[], opts: { size: number; color: string }) {
  runs.forEach((run, idx) => {
    doc
      .font(run.code ? "Courier" : run.bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(run.code ? opts.size - 1 : opts.size)
      .fillColor(run.code ? C.accent : opts.color)
      .text(run.text, { continued: idx < runs.length - 1 });
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ensureSpace(doc: any, needed: number) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + needed > bottom) doc.addPage();
}

/**
 * Render one of the programme's markdown briefs/contracts/templates as a
 * clean, branded, read-only PDF. Content and meaning are unchanged — this
 * only changes the file format so interns get something designed to read,
 * not raw markdown.
 */
export function renderMarkdownPdf(opts: {
  eyebrow: string;
  title: string;
  markdown: string;
}): Promise<Buffer> {
  const { eyebrow, title, markdown } = opts;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      bufferPages: true,
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ── Cover band — same brand family as the certificate/pass-letter ──
    doc.rect(0, 0, PAGE_WIDTH, 132).fill(C.navy);
    doc.rect(0, 128, PAGE_WIDTH, 4).fill(C.blue);

    const logoW = 30;
    doc.image(UBI_LOGO_BUFFER, MARGIN, 30, { width: logoW });
    doc
      .fillColor("#BFD3FF")
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .text("UBI · THE ROOT ACCESS NETWORK", MARGIN + logoW + 12, 34, { characterSpacing: 1 });
    doc
      .fillColor("#8FB3FF")
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .text(eyebrow.toUpperCase(), MARGIN, 62, { characterSpacing: 1.2 });
    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(21)
      .text(title, MARGIN, 80, { width: CONTENT_WIDTH });
    doc.y = 160;

    const blocks = parseMarkdown(markdown);

    for (const block of blocks) {
      switch (block.kind) {
        case "h1": {
          ensureSpace(doc, 46);
          doc.moveDown(0.6);
          doc.font("Helvetica-Bold").fontSize(17).fillColor(C.navy).text(block.text);
          doc.moveTo(MARGIN, doc.y + 4).lineTo(PAGE_WIDTH - MARGIN, doc.y + 4).strokeColor(C.rule).lineWidth(1).stroke();
          doc.moveDown(0.7);
          break;
        }
        case "h2": {
          ensureSpace(doc, 36);
          doc.moveDown(0.5);
          doc.font("Helvetica-Bold").fontSize(13.5).fillColor(C.accent).text(block.text);
          doc.moveDown(0.35);
          break;
        }
        case "h3": {
          ensureSpace(doc, 28);
          doc.moveDown(0.3);
          doc.font("Helvetica-Bold").fontSize(11.5).fillColor(C.ink).text(block.text);
          doc.moveDown(0.25);
          break;
        }
        case "p": {
          ensureSpace(doc, 20);
          writeRuns(doc, inlineRuns(block.text), { size: 10.5, color: C.ink });
          doc.moveDown(0.55);
          break;
        }
        case "ul":
        case "ol": {
          const indent = 22;
          block.items.forEach((item, idx) => {
            ensureSpace(doc, 18);
            const bulletX = MARGIN;
            const textX = MARGIN + indent;
            const topY = doc.y;
            const bullet = block.kind === "ol" ? `${idx + 1}.` : "•";

            // Bullet glyph: fixed position, not part of the text-wrapping
            // chain below (that was the bug — a shared `width` on a
            // continued chain constrains every run in it, not just the
            // bullet, which wrapped every list item one character per line).
            doc.font("Helvetica-Bold").fontSize(10.5).fillColor(C.accent)
              .text(bullet, bulletX, topY, { width: indent - 4, continued: false, lineBreak: false });

            const runs = inlineRuns(item);
            runs.forEach((run, i) => {
              doc.font(run.code ? "Courier" : run.bold ? "Helvetica-Bold" : "Helvetica")
                .fontSize(run.code ? 9.5 : 10.5)
                .fillColor(run.code ? C.accent : C.ink);
              if (i === 0) {
                doc.text(run.text, textX, topY, { continued: i < runs.length - 1 });
              } else {
                doc.text(run.text, { continued: i < runs.length - 1 });
              }
            });
            doc.x = bulletX;
            doc.moveDown(0.3);
          });
          doc.moveDown(0.35);
          break;
        }
        case "table": {
          const cols = block.header.length;
          const colWidth = CONTENT_WIDTH / cols;
          const rowPad = 6;

          const rowHeight = (cells: string[]) => {
            doc.font("Helvetica").fontSize(9.5);
            return Math.max(...cells.map((cell) => doc.heightOfString(cell, { width: colWidth - rowPad * 2 }))) + rowPad * 2;
          };

          const drawRow = (cells: string[], bold: boolean, shaded: boolean) => {
            const h = rowHeight(cells);
            ensureSpace(doc, h + 4);
            const top = doc.y;
            if (shaded) doc.rect(MARGIN, top, CONTENT_WIDTH, h).fill(C.soft);
            cells.forEach((cell, c) => {
              doc
                .font(bold ? "Helvetica-Bold" : "Helvetica")
                .fontSize(9.5)
                .fillColor(bold ? C.navy : C.ink)
                .text(cell, MARGIN + c * colWidth + rowPad, top + rowPad, { width: colWidth - rowPad * 2 });
            });
            doc.y = top + h;
            doc.moveTo(MARGIN, doc.y).lineTo(PAGE_WIDTH - MARGIN, doc.y).strokeColor(C.rule).lineWidth(0.5).stroke();
          };

          ensureSpace(doc, 30);
          drawRow(block.header, true, true);
          block.rows.forEach((row, idx) => drawRow(row, false, idx % 2 === 1));
          doc.moveDown(0.6);
          break;
        }
      }
    }

    // ── Footer: page numbers on every page ──
    // Drawing this close to the bottom edge sits inside the page's own
    // bottom margin band; pdfkit's auto-pagination treats that as "doesn't
    // fit" and silently inserts a *new* blank page to hold the footer
    // instead of drawing it on the current one. Zeroing the margin for
    // this one call (standard pdfkit footer pattern) disables that check.
    const range = doc.bufferedPageRange();
    for (let p = 0; p < range.count; p++) {
      doc.switchToPage(p);
      const savedBottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor(C.muted)
        .text(
          `UBI · The Root Access Network · Page ${p + 1} of ${range.count}`,
          MARGIN,
          doc.page.height - 36,
          { width: CONTENT_WIDTH, align: "center" }
        );
      doc.page.margins.bottom = savedBottom;
    }

    doc.end();
  });
}
