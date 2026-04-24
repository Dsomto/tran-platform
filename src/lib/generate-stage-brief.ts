// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require("pdfkit");

import type { StageBrief } from "./stage-briefs";

// UBI brand palette — matches the blue used across the product.
const BRAND_BLUE = "#2563EB";
const INK = "#0F172A";
const BODY = "#334155";
const MUTED = "#64748B";
const FAINT = "#CBD5E1";
const PAPER = "#FFFFFF";
const PANEL = "#F8FAFC";

type Opts = {
  brief: StageBrief;
  internCode?: string;      // shown in the issued-to strip if the intern is authed
  downloadedAt: Date;
};

export function generateStageBriefPdf(opts: Opts): Promise<Buffer> {
  const { brief, internCode, downloadedAt } = opts;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "portrait",
      margins: { top: 56, bottom: 56, left: 56, right: 56 },
      bufferPages: true,
      info: {
        Title: `${brief.label} — Capstone Brief`,
        Author: "Ubuntu Bridge Initiative",
        Subject: brief.subtitle,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const leftX = doc.page.margins.left;
    const rightX = pageWidth - doc.page.margins.right;
    const contentWidth = rightX - leftX;

    // ── Masthead ─────────────────────────────────────────
    // Blue bar across the top.
    doc.rect(0, 0, pageWidth, 6).fill(BRAND_BLUE);

    // Logo mark (hex + ">_" glyph) rendered in vectors so no external assets.
    const logoX = leftX;
    const logoY = 32;
    drawLogoMark(doc, logoX, logoY, 26);

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor(INK)
      .text("UBI", logoX + 36, logoY + 4);
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(MUTED)
      .text("UBUNTU BRIDGE INITIATIVE", logoX + 36, logoY + 22, {
        characterSpacing: 1.2,
      });

    // Right-side "Capstone Brief" stamp
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(BRAND_BLUE)
      .text("CAPSTONE BRIEF", rightX - 120, logoY + 4, {
        width: 120,
        align: "right",
        characterSpacing: 1.4,
      });
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(MUTED)
      .text(
        downloadedAt.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        rightX - 120,
        logoY + 22,
        { width: 120, align: "right" }
      );

    doc.moveTo(leftX, 78).lineTo(rightX, 78).lineWidth(0.5).strokeColor(FAINT).stroke();

    let y = 100;

    // ── Stage label + subtitle ─────────────────────────
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(BRAND_BLUE)
      .text(brief.label.toUpperCase(), leftX, y, { characterSpacing: 2 });
    y += 20;

    doc
      .font("Helvetica-Bold")
      .fontSize(24)
      .fillColor(INK)
      .text(brief.subtitle, leftX, y, { width: contentWidth });
    y = doc.y + 16;

    if (internCode) {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(MUTED)
        .text(`Issued to ${internCode}`, leftX, y, { characterSpacing: 0.6 });
      y = doc.y + 20;
    } else {
      y += 4;
    }

    // Accent rule
    doc.rect(leftX, y, 36, 3).fill(BRAND_BLUE);
    y += 24;

    // ── Section: The scenario ────────────────────────────
    y = drawSectionHeading(doc, "THE SCENARIO", leftX, y, contentWidth);
    for (const para of brief.missionBrief) {
      y = drawBody(doc, para, leftX, y, contentWidth);
      y += 8;
    }
    y += 10;

    y = ensureSpace(doc, y, 120);

    // ── Section: Grading criteria (the old "sections") ──
    y = drawSectionHeading(doc, "YOU WILL BE GRADED ON", leftX, y, contentWidth);
    for (const section of brief.sections) {
      y = drawBullet(doc, section, leftX, y, contentWidth);
    }
    y += 14;

    y = ensureSpace(doc, y, 160);

    // ── Section: Practical activities ────────────────────
    y = drawSectionHeading(doc, "PRACTICAL ACTIVITIES", leftX, y, contentWidth);
    doc
      .font("Helvetica-Oblique")
      .fontSize(9)
      .fillColor(MUTED)
      .text(
        "Complete these off-platform. Put every deliverable into one shared folder and paste the link on the submission page when you are ready.",
        leftX,
        y,
        { width: contentWidth, lineGap: 2 }
      );
    y = doc.y + 12;

    brief.practicalTasks.forEach((task, idx) => {
      y = ensureSpace(doc, y, 90);
      y = drawTaskCard(doc, idx + 1, task, leftX, y, contentWidth);
      y += 10;
    });

    y += 6;
    y = ensureSpace(doc, y, 140);

    // ── Section: Resources ───────────────────────────────
    y = drawSectionHeading(doc, "RESOURCES", leftX, y, contentWidth);
    for (const r of brief.resources) {
      y = ensureSpace(doc, y, 44);
      y = drawResourceRow(doc, r.kind, r.label, r.description, r.href, leftX, y, contentWidth);
    }

    y += 14;
    y = ensureSpace(doc, y, 70);

    // ── Footer card: how to submit ───────────────────────
    doc.roundedRect(leftX, y, contentWidth, 56, 6).fillColor(PANEL).fill();
    doc.roundedRect(leftX, y, contentWidth, 56, 6).lineWidth(0.5).strokeColor(FAINT).stroke();
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(BRAND_BLUE)
      .text("SUBMISSION", leftX + 14, y + 11, { characterSpacing: 1.4 });
    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor(BODY)
      .text(
        "Every deliverable lives in one Google Drive / OneDrive folder. On the stage's submission page, paste the folder link, add a short executive summary, and submit.",
        leftX + 14,
        y + 26,
        { width: contentWidth - 28, lineGap: 2 }
      );
    y += 64;

    // ── Page-bottom footer on every page ─────────────────
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const footerY = pageHeight - 40;
      doc.moveTo(leftX, footerY).lineTo(rightX, footerY).lineWidth(0.5).strokeColor(FAINT).stroke();
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(MUTED)
        .text(
          `Ubuntu Bridge Initiative · ${brief.label} capstone brief · Confidential to the participant`,
          leftX,
          footerY + 8,
          { width: contentWidth, align: "left" }
        );
      doc.text(
        `Page ${i - range.start + 1} of ${range.count}`,
        leftX,
        footerY + 8,
        { width: contentWidth, align: "right" }
      );
    }

    doc.end();
  });
}

// ── Helpers ─────────────────────────────────────────────

type PDFDoc = InstanceType<typeof PDFDocument>;

function ensureSpace(doc: PDFDoc, y: number, needed: number): number {
  const bottomLimit = doc.page.height - doc.page.margins.bottom - 30;
  if (y + needed > bottomLimit) {
    doc.addPage();
    return doc.page.margins.top;
  }
  return y;
}

function drawSectionHeading(
  doc: PDFDoc,
  title: string,
  x: number,
  y: number,
  width: number
): number {
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(BRAND_BLUE)
    .text(title, x, y, { characterSpacing: 1.6 });
  const after = doc.y + 4;
  doc.rect(x, after, 16, 2).fill(BRAND_BLUE);
  void width;
  return after + 12;
}

function drawBody(
  doc: PDFDoc,
  text: string,
  x: number,
  y: number,
  width: number
): number {
  doc
    .font("Helvetica")
    .fontSize(10.5)
    .fillColor(BODY)
    .text(text, x, y, { width, lineGap: 2.5, align: "left" });
  return doc.y;
}

function drawBullet(
  doc: PDFDoc,
  text: string,
  x: number,
  y: number,
  width: number
): number {
  doc.circle(x + 3, y + 6, 1.6).fill(BRAND_BLUE);
  doc
    .font("Helvetica")
    .fontSize(10.5)
    .fillColor(BODY)
    .text(text, x + 14, y, { width: width - 14, lineGap: 2 });
  return doc.y + 4;
}

function drawTaskCard(
  doc: PDFDoc,
  num: number,
  task: { title: string; description: string; deliverable: string; alternate?: string },
  x: number,
  y: number,
  width: number
): number {
  const padding = 14;
  const innerWidth = width - padding * 2;

  // Dry-run layout to size the card
  let cursor = y + padding;
  cursor += 16; // number circle row height

  // Title
  doc.font("Helvetica-Bold").fontSize(11.5);
  const titleH = doc.heightOfString(task.title, { width: innerWidth - 28, lineGap: 1 });
  // Description
  doc.font("Helvetica").fontSize(10);
  const descH = doc.heightOfString(task.description, { width: innerWidth, lineGap: 2 });
  // Deliverable
  doc.font("Helvetica-Bold").fontSize(9);
  const delH = doc.heightOfString(`Deliverable: ${task.deliverable}`, {
    width: innerWidth,
    lineGap: 1,
  });
  // Alternate
  let altH = 0;
  if (task.alternate) {
    doc.font("Helvetica-Oblique").fontSize(9);
    altH = doc.heightOfString(`Alternate path: ${task.alternate}`, {
      width: innerWidth,
      lineGap: 1.5,
    });
  }

  const cardHeight =
    padding + titleH + 6 + descH + 10 + delH + (task.alternate ? 10 + altH : 0) + padding;

  // Draw card
  doc.roundedRect(x, y, width, cardHeight, 6).fillColor(PAPER).fill();
  doc.roundedRect(x, y, width, cardHeight, 6).lineWidth(0.7).strokeColor(FAINT).stroke();

  // Left accent strip
  doc.rect(x, y, 3, cardHeight).fill(BRAND_BLUE);

  // Number circle
  let yy = y + padding;
  doc.circle(x + padding + 9, yy + 9, 10).fillColor(BRAND_BLUE).fill();
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(PAPER)
    .text(String(num), x + padding, yy, { width: 18, align: "center" });
  // Title next to circle
  doc
    .font("Helvetica-Bold")
    .fontSize(11.5)
    .fillColor(INK)
    .text(task.title, x + padding + 28, yy - 1, {
      width: innerWidth - 28,
      lineGap: 1,
    });
  yy += Math.max(20, titleH) + 6;

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(BODY)
    .text(task.description, x + padding, yy, { width: innerWidth, lineGap: 2 });
  yy += descH + 10;

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(BRAND_BLUE)
    .text(`Deliverable: ${task.deliverable}`, x + padding, yy, {
      width: innerWidth,
      lineGap: 1,
    });
  yy += delH;

  if (task.alternate) {
    yy += 10;
    doc
      .font("Helvetica-Oblique")
      .fontSize(9)
      .fillColor(MUTED)
      .text(`Alternate path: ${task.alternate}`, x + padding, yy, {
        width: innerWidth,
        lineGap: 1.5,
      });
  }

  return y + cardHeight;
}

function drawResourceRow(
  doc: PDFDoc,
  kind: "download" | "reading" | "tool",
  label: string,
  description: string | undefined,
  href: string,
  x: number,
  y: number,
  width: number
): number {
  const kindLabel = kind === "download" ? "DOWNLOAD" : kind === "tool" ? "TOOL" : "READING";

  // Kind pill
  const pillWidth = 52;
  doc.roundedRect(x, y + 1, pillWidth, 14, 7).fillColor(BRAND_BLUE).fill();
  doc
    .font("Helvetica-Bold")
    .fontSize(7)
    .fillColor(PAPER)
    .text(kindLabel, x, y + 5, { width: pillWidth, align: "center", characterSpacing: 1.2 });

  const textX = x + pillWidth + 10;
  const textWidth = width - pillWidth - 10;

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(INK)
    .text(label, textX, y, { width: textWidth, lineGap: 1 });
  let yy = doc.y;
  if (description) {
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(MUTED)
      .text(description, textX, yy + 2, { width: textWidth, lineGap: 1.5 });
    yy = doc.y;
  }
  doc
    .font("Helvetica-Oblique")
    .fontSize(8)
    .fillColor(BRAND_BLUE)
    .text(href, textX, yy + 2, { width: textWidth, lineGap: 1 });
  return doc.y + 10;
}

// Minimal vector logo — blue rounded square with ">_" glyph inside.
function drawLogoMark(doc: PDFDoc, x: number, y: number, size: number) {
  doc.roundedRect(x, y, size, size, 5).fillColor(BRAND_BLUE).fill();
  doc
    .font("Helvetica-Bold")
    .fontSize(size * 0.55)
    .fillColor(PAPER)
    .text(">_", x, y + size * 0.22, { width: size, align: "center" });
}
