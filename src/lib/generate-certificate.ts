// pdfkit ships CommonJS — Next.js's production bundler wraps it as
// { default: PDFDocument } even though Node CJS interop hands back the class
// directly. Without this normalisation `new PDFDocument()` throws "C is not
// a constructor" on Vercel (works locally because tsx + Node's native CJS
// loader skips the wrap). Resolve once at module load.
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const pdfkitMod: any = require("pdfkit");
const PDFDocument = pdfkitMod.default || pdfkitMod;

// What the intern actually did, in plain language. Short labels so the
// list reads like a teacher wrote it on the back of a marking sheet, not
// like a job-description bullet list.
const STAGE_COMPETENCIES: Record<string, string[]> = {
  STAGE_0: [
    "Reading auth logs",
    "Spotting dismissal patterns",
    "Briefing non-technical leaders",
    "Making the ethics call",
  ],
  STAGE_1: [
    "Picking the right crypto",
    "Catching where it breaks",
    "Symmetric vs asymmetric trade-offs",
    "Key handling that holds up",
  ],
  STAGE_2: [
    "Finding XSS, SQLi, IDOR",
    "Threat modelling before ship",
    "Auth and session review",
    "Writing fixes devs will use",
  ],
  STAGE_3: [
    "Process triage",
    "Incident timeline reconstruction",
    "IOC validation",
    "Executive incident reporting",
  ],
  STAGE_4: [
    "Policy people actually read",
    "Talking risk to a board",
    "ISO 27001 mapping, honestly",
    "Measuring real improvement",
  ],
};

// Blue / white / gold. Navy structure, blue accents, a real gold seal.
const COLORS = {
  bg: "#FFFFFF",
  navy: "#0A1F44",       // deep navy — waves, title, name
  navyDeep: "#06152F",   // darkest tone, signature ink
  blue: "#1D4ED8",       // accent blue — front wave, labels
  blueLight: "#3B82F6",  // lighter blue highlight
  ink: "#0A1F44",
  inkSoft: "#33405C",
  muted: "#5A6682",      // muted secondary text
  rule: "#A9BCDE",
  gold: "#C9A227",       // seal gold
  goldLight: "#EBCB63",  // seal highlight
  goldDeep: "#7A5E12",   // seal outline
};

export function generateStageCertificate(opts: {
  fullName: string;
  stageLabel: string;
  score: number;
  passingScore: number;
  issuedAt: Date;
  certId: string;
  stageKey?: string; // optional, used to look up competencies. Falls back if missing.
}): Promise<Buffer> {
  const { fullName, stageLabel, score, passingScore, issuedAt, certId, stageKey } = opts;
  const certificateStageLabel = stageLabel
    .replace(/[—–]/g, ":")
    .replace(/\s+:\s+/g, ": ")
    .replace(/\s+/g, " ")
    .trim();

  const resolvedKey =
    stageKey ??
    (() => {
      const m = stageLabel.match(/^Stage (\d+)/i);
      return m ? `STAGE_${m[1]}` : "STAGE_0";
    })();
  const competencies = STAGE_COMPETENCIES[resolvedKey] ?? STAGE_COMPETENCIES.STAGE_0;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 24, bottom: 24, left: 24, right: 24 },
      autoFirstPage: true,
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const cx = pageW / 2;

    // ── 1. Paper ──────────────────────────────────────────
    doc.rect(0, 0, pageW, pageH).fill(COLORS.bg);

    // ── 2. Decorative wave bands, top and bottom ──────────
    // Two-tone navy + blue sweeps in opposite corners, like the reference.
    drawTopWaves(doc, pageW);
    drawBottomWaves(doc, pageW, pageH);

    // ── 3. Fine gold frame, hairline companion, corner diamonds ──
    doc
      .lineWidth(1.1)
      .strokeColor(COLORS.gold)
      .rect(38, 38, pageW - 76, pageH - 76)
      .stroke();
    doc
      .lineWidth(0.4)
      .strokeColor(COLORS.rule)
      .rect(45, 45, pageW - 90, pageH - 90)
      .stroke();
    // small gold lozenges at the inner-frame corners — a quiet premium touch
    for (const [dx, dy] of [
      [45, 45], [pageW - 45, 45], [45, pageH - 45], [pageW - 45, pageH - 45],
    ] as const) {
      drawDiamond(doc, dx, dy, 3, COLORS.gold);
    }

    // ── 4. Organisation mark ──────────────────────────────
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(COLORS.navy)
      .text("UBUNTU BRIDGE INITIATIVE", 0, 84, {
        align: "center",
        width: pageW,
        characterSpacing: 4,
      });
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor(COLORS.muted)
      .text("Cybersecurity Internship | The Root Access Network", 0, 100, {
        align: "center",
        width: pageW,
        characterSpacing: 2,
      });

    // ── 5. Title — serif, letter-spaced ───────────────────
    doc
      .fontSize(52)
      .font("Times-Bold")
      .fillColor(COLORS.navy)
      .text("CERTIFICATE", 0, 132, {
        align: "center",
        width: pageW,
        characterSpacing: 8,
      });
    doc
      .fontSize(15)
      .font("Helvetica")
      .fillColor(COLORS.blue)
      .text("OF ACHIEVEMENT", 0, 196, {
        align: "center",
        width: pageW,
        characterSpacing: 9,
      });
    // Thin gold rules flanking the subtitle, each ending in a small diamond
    const subY = 204;
    for (const dir of [-1, 1] as const) {
      const inner = cx + dir * 150;
      const outer = cx + dir * 215;
      doc
        .moveTo(inner, subY)
        .lineTo(outer, subY)
        .lineWidth(0.8)
        .strokeColor(COLORS.gold)
        .stroke();
      drawDiamond(doc, outer, subY, 2.5, COLORS.gold);
    }

    // ── 6. Presented-to caption ───────────────────────────
    doc
      .fontSize(12.5)
      .font("Times-Italic")
      .fillColor(COLORS.muted)
      .text("This certificate is proudly presented to", 0, 230, {
        align: "center",
        width: pageW,
      });

    const nameLayout = layoutRecipientName(doc, fullName, 560);
    const nameLineHeight = nameLayout.size * 1.12;
    const nameBlockHeight = nameLayout.lines.length * nameLineHeight;
    const nameTop = nameLayout.lines.length === 1 ? 258 : 244;
    doc.fontSize(nameLayout.size).font("Times-BoldItalic").fillColor(COLORS.navy);
    nameLayout.lines.forEach((line, i) => {
      doc.text(line, 0, nameTop + i * nameLineHeight, {
        align: "center",
        width: pageW,
        lineBreak: false,
      });
    });

    // Underline rule with a small gold diamond at the centre
    const nameRuleY = Math.max(312, nameTop + nameBlockHeight + 12);
    const ruleHalf = 210;
    doc
      .moveTo(cx - ruleHalf, nameRuleY)
      .lineTo(cx - 14, nameRuleY)
      .lineWidth(0.9)
      .strokeColor(COLORS.navy)
      .stroke();
    doc
      .moveTo(cx + 14, nameRuleY)
      .lineTo(cx + ruleHalf, nameRuleY)
      .stroke();
    drawDiamond(doc, cx, nameRuleY, 4.5, COLORS.gold);

    // ── 8. Citation line ──────────────────────────────────
    const bodyW = 500;
    const bodyY = nameRuleY + 20;
    doc
      .fontSize(12)
      .font("Times-Roman")
      .fillColor(COLORS.inkSoft)
      .text(
        `for successfully completing ${certificateStageLabel} in the Ubuntu Bridge Cybersecurity Internship, ` +
          `with a final score of ${score} out of 100 against a ${passingScore} pass mark.`,
        cx - bodyW / 2,
        bodyY,
        { align: "center", width: bodyW, lineGap: 3 }
      );

    // ── 9. Competencies — tracked label, then italic with gold dividers ──
    const competencyLabelY = bodyY + 46;
    doc
      .fontSize(7.5)
      .font("Helvetica-Bold")
      .fillColor(COLORS.gold)
      .text("COMPETENCIES DEMONSTRATED", 0, competencyLabelY, {
        align: "center",
        width: pageW,
        characterSpacing: 3,
      });
    doc
      .fontSize(9.5)
      .font("Times-Italic")
      .fillColor(COLORS.muted)
      .text(competencies.join("  |  "), 0, competencyLabelY + 16, {
        align: "center",
        width: pageW,
        characterSpacing: 0.3,
      });

    // ── 10. The gold seal, top-right corner — clear of the name ──
    // Kept out of the name's row so long names are never covered.
    drawSeal(doc, pageW - 92, 92, 30);

    // ── 11. Two signatures, with date + id centred between ──
    const footY = pageH - 128;
    const dateStr = issuedAt.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const sigW = 200;
    const signers = [
      { x: 104, sig: "Okoma Somto", name: "Okoma Somtochukwu", title: "Head of Programme, TRAN" },
      { x: pageW - 104 - sigW, sig: "Quadri O.", name: "Quadri Omoloju", title: "Founder, TRAN" },
    ];
    for (const s of signers) {
      doc
        .fontSize(17)
        .font("Times-BoldItalic")
        .fillColor(COLORS.navyDeep)
        .text(s.sig, s.x, footY - 8, { width: sigW, align: "center" });
      doc
        .moveTo(s.x, footY + 18)
        .lineTo(s.x + sigW, footY + 18)
        .lineWidth(0.6)
        .strokeColor(COLORS.navy)
        .stroke();
      doc
        .fontSize(8.5)
        .font("Helvetica-Bold")
        .fillColor(COLORS.ink)
        .text(s.name, s.x, footY + 24, { width: sigW, align: "center" });
      doc
        .fontSize(7)
        .font("Helvetica")
        .fillColor(COLORS.muted)
        .text(s.title.toUpperCase(), s.x, footY + 35, {
          width: sigW,
          align: "center",
          characterSpacing: 1.2,
        });
}

    // ── 12. Issue date + certificate id, centred in the gap ──
    doc
      .fontSize(11)
      .font("Times-Italic")
      .fillColor(COLORS.navy)
      .text(`Issued ${dateStr}`, 0, footY + 2, { width: pageW, align: "center" });
    doc
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor(COLORS.muted)
      .text(`Certificate ID  ${certId}`, 0, footY + 24, {
        width: pageW,
        align: "center",
        characterSpacing: 1.2,
        lineBreak: false,
      });

    doc.end();
  });
	}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function layoutRecipientName(doc: any, fullName: string, maxWidth: number): { lines: string[]; size: number } {
  const name = fullName.trim().replace(/\s+/g, " ") || "Ubuntu Bridge Intern";
  doc.font("Times-BoldItalic");

  const canUseSingleLine = name.length <= 34 || wordsCount(name) <= 3;
  if (canUseSingleLine) {
    for (let size = 36; size >= 25; size--) {
      if (doc.fontSize(size).widthOfString(name) <= maxWidth) {
        return { lines: [name], size };
      }
    }
  }

  for (let size = 32; size >= 25; size--) {
    if (name.length <= 38 && doc.fontSize(size).widthOfString(name) <= maxWidth) {
      return { lines: [name], size };
    }
  }

  const words = name.split(" ");
  if (words.length === 1) {
    for (let size = 25; size >= 18; size--) {
      if (doc.fontSize(size).widthOfString(name) <= maxWidth) {
        return { lines: [name], size };
      }
    }
    return { lines: [name], size: 18 };
  }

  let bestLines: [string, string] = [words[0], words.slice(1).join(" ")];
  let bestWidth = Number.POSITIVE_INFINITY;
  for (let i = 1; i < words.length; i++) {
    const first = words.slice(0, i).join(" ");
    const second = words.slice(i).join(" ");
    const widest = Math.max(doc.fontSize(30).widthOfString(first), doc.fontSize(30).widthOfString(second));
    if (widest < bestWidth) {
      bestLines = [first, second];
      bestWidth = widest;
    }
  }

  for (let size = 32; size >= 21; size--) {
    const fits = bestLines.every((line) => doc.fontSize(size).widthOfString(line) <= maxWidth);
    if (fits) return { lines: bestLines, size };
  }

  return { lines: bestLines, size: 21 };
}

function wordsCount(value: string): number {
  return value.split(" ").filter(Boolean).length;
}

// ── Wave bands ──────────────────────────────────────────
// A back (navy) and front (blue) sweep. Top waves anchor top-left,
// bottom waves anchor bottom-right, mirrored, like the reference.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawTopWaves(doc: any, pageW: number): void {
  // back navy
  doc
    .moveTo(0, 0)
    .lineTo(pageW, 0)
    .lineTo(pageW, 30)
    .bezierCurveTo(pageW * 0.72, 78, pageW * 0.5, 8, pageW * 0.28, 56)
    .bezierCurveTo(pageW * 0.14, 86, 0, 44, 0, 44)
    .closePath()
    .fill(COLORS.navy);
  // front blue, slightly higher and shorter
  doc
    .moveTo(0, 0)
    .lineTo(pageW, 0)
    .lineTo(pageW, 14)
    .bezierCurveTo(pageW * 0.74, 56, pageW * 0.52, -8, pageW * 0.3, 36)
    .bezierCurveTo(pageW * 0.16, 62, 0, 22, 0, 22)
    .closePath()
    .fill(COLORS.blue);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawBottomWaves(doc: any, pageW: number, pageH: number): void {
  // back navy (mirror of top, anchored bottom)
  doc
    .moveTo(pageW, pageH)
    .lineTo(0, pageH)
    .lineTo(0, pageH - 30)
    .bezierCurveTo(pageW * 0.28, pageH - 78, pageW * 0.5, pageH - 8, pageW * 0.72, pageH - 56)
    .bezierCurveTo(pageW * 0.86, pageH - 86, pageW, pageH - 44, pageW, pageH - 44)
    .closePath()
    .fill(COLORS.navy);
  // front blue
  doc
    .moveTo(pageW, pageH)
    .lineTo(0, pageH)
    .lineTo(0, pageH - 14)
    .bezierCurveTo(pageW * 0.26, pageH - 56, pageW * 0.48, pageH + 8, pageW * 0.7, pageH - 36)
    .bezierCurveTo(pageW * 0.84, pageH - 62, pageW, pageH - 22, pageW, pageH - 22)
    .closePath()
    .fill(COLORS.blue);
}

// ── Gold seal of achievement ────────────────────────────
// A scalloped gold medallion with two ribbon tails, a navy centre disc,
// a gold star, and small lettering. The focal ornament of the page.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawSeal(doc: any, cx: number, cy: number, R: number): void {
  // Ribbon tails (drawn first, behind the medal)
  const ribY = cy + R * 0.55;
  for (const dir of [-1, 1]) {
    const x = cx + dir * R * 0.42;
    doc
      .moveTo(x, ribY)
      .lineTo(x + dir * R * 0.5, ribY + R * 1.15)
      .lineTo(x + dir * R * 0.16, ribY + R * 0.95)
      .lineTo(x - dir * R * 0.18, ribY + R * 1.2)
      .closePath()
      .fillAndStroke(COLORS.blue, COLORS.navyDeep);
  }

  // Scalloped starburst outer edge (24 points)
  const burst: Array<[number, number]> = [];
  const n = 24;
  for (let i = 0; i < n * 2; i++) {
    const a = (Math.PI / n) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? R * 1.18 : R * 1.0;
    burst.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]);
  }
  doc.moveTo(burst[0][0], burst[0][1]);
  for (let i = 1; i < burst.length; i++) doc.lineTo(burst[i][0], burst[i][1]);
  doc.closePath().fillAndStroke(COLORS.gold, COLORS.goldDeep);

  // Gold disc + highlight ring
  doc.circle(cx, cy, R).fill(COLORS.goldLight);
  doc.circle(cx, cy, R).lineWidth(1).strokeColor(COLORS.goldDeep).stroke();
  doc.circle(cx, cy, R * 0.9).lineWidth(0.8).strokeColor(COLORS.gold).stroke();

  // Navy centre
  doc.circle(cx, cy, R * 0.74).fill(COLORS.navy);
  doc.circle(cx, cy, R * 0.74).lineWidth(1).strokeColor(COLORS.gold).stroke();

  // Gold star in the centre
  drawStar(doc, cx, cy - R * 0.06, R * 0.42, COLORS.goldLight, COLORS.gold);

  // Tiny lettering
  doc
    .fontSize(8)
    .font("Helvetica-Bold")
    .fillColor(COLORS.goldLight)
    .text("UBI", cx - R * 0.74, cy + R * 0.36, {
      width: R * 1.48,
      align: "center",
      characterSpacing: 2,
    });
}

// Five-pointed star, filled with a highlight + outline.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawStar(doc: any, cx: number, cy: number, r: number, fill: string, stroke: string): void {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.42;
    pts.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]);
  }
  doc.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) doc.lineTo(pts[i][0], pts[i][1]);
  doc.closePath().fillAndStroke(fill, stroke);
}

// Small filled diamond — the gold centre on the name rule.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawDiamond(doc: any, cx: number, cy: number, r: number, color: string): void {
  doc
    .moveTo(cx, cy - r)
    .lineTo(cx + r, cy)
    .lineTo(cx, cy + r)
    .lineTo(cx - r, cy)
    .closePath()
    .fill(color);
}
