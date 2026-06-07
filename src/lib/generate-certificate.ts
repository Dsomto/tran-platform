// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require("pdfkit");

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
    "Playbooks for tired analysts",
    "Timelines from messy logs",
    "Containment without outage",
    "Post-mortems that change things",
  ],
  STAGE_4: [
    "Policy people actually read",
    "Talking risk to a board",
    "ISO 27001 mapping, honestly",
    "Measuring real improvement",
  ],
};

// Colour system — blue and white, gold only for the star. Pushed for higher
// contrast so the page reads clearly on screen and print. Solid hex only.
const COLORS = {
  bg: "#FFFFFF",         // pure white paper
  bgTint: "#EEF2FA",     // faint blue wash for the side strip
  navy: "#061732",       // deeper, near-black navy for max contrast
  navyDeep: "#020B1F",   // signature ink, darkest tone
  blue: "#1538A6",       // accent blue — stage label
  blueLight: "#2563EB",  // subtitle accents and rule
  gold: "#D4AF37",       // the single gold accent — star ONLY
  goldDeep: "#8C6E12",
  ink: "#061732",
  inkSoft: "#1B2545",
  muted: "#4A5775",
  rule: "#9DB2D6",       // visible enough to register, not garish
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

  // Derive stage key from the label if not given. The label is the
  // canonical "Stage N — Foundation" string used everywhere else.
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

    // ── 1. Paper + blue double border ─────────────────────
    doc.rect(0, 0, pageW, pageH).fill(COLORS.bg);

    // Outer thick navy frame
    doc
      .lineWidth(3)
      .strokeColor(COLORS.navy)
      .rect(24, 24, pageW - 48, pageH - 48)
      .stroke();
    // Inner thin blue rule
    doc
      .lineWidth(0.6)
      .strokeColor(COLORS.blueLight)
      .rect(38, 38, pageW - 76, pageH - 76)
      .stroke();

    // ── 2. Corner accents — short blue brackets (no filigree) ──
    drawCornerBracket(doc, 38, 38, "tl");
    drawCornerBracket(doc, pageW - 38, 38, "tr");
    drawCornerBracket(doc, 38, pageH - 38, "bl");
    drawCornerBracket(doc, pageW - 38, pageH - 38, "br");

    // ── 3. Gold star on the right side — seal of achievement ──
    // Positioned in the upper-right area, like a wax seal on a document.
    drawGoldStar(doc, pageW - 110, 175, 28);

    // ── 4. Organisation mark at the top, left-of-centre ───
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor(COLORS.navy)
      .text("UBUNTU BRIDGE INITIATIVE", 0, 88, {
        align: "center",
        width: pageW,
        characterSpacing: 4,
      });
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor(COLORS.muted)
      .text("Cybersecurity Internship · The Root Access Network", 0, 105, {
        align: "center",
        width: pageW,
        characterSpacing: 2,
      });

    // ── 5. Title — bigger, bolder, deep navy ──────────────
    doc
      .fontSize(46)
      .font("Times-Bold")
      .fillColor(COLORS.navy)
      .text("Certificate of Achievement", 0, 144, {
        align: "center",
        width: pageW,
      });

    // Thicker blue rule under the title
    doc
      .moveTo(pageW / 2 - 80, 198)
      .lineTo(pageW / 2 + 80, 198)
      .lineWidth(2)
      .strokeColor(COLORS.blue)
      .stroke();

    // ── 6. "Awarded to" caption ───────────────────────────
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(COLORS.blue)
      .text("AWARDED TO", 0, 220, {
        align: "center",
        width: pageW,
        characterSpacing: 5,
      });

    // ── 7. Recipient name — large serif italic, deep navy ──
    doc
      .fontSize(42)
      .font("Times-BoldItalic")
      .fillColor(COLORS.navy)
      .text(fullName, 0, 240, {
        align: "center",
        width: pageW,
      });

    // Stronger navy rules either side of a blue diamond
    const nameRuleY = 298;
    const ruleHalf = 230;
    doc
      .moveTo(pageW / 2 - ruleHalf, nameRuleY)
      .lineTo(pageW / 2 - 16, nameRuleY)
      .lineWidth(0.8)
      .strokeColor(COLORS.navy)
      .stroke();
    doc
      .moveTo(pageW / 2 + 16, nameRuleY)
      .lineTo(pageW / 2 + ruleHalf, nameRuleY)
      .stroke();
    drawDiamond(doc, pageW / 2, nameRuleY, 5, COLORS.blue);

    // ── 8. Stage line — heavier accent, no italic preamble ──
    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor(COLORS.muted)
      .text("FOR THE WORK COMPLETED IN", 0, 314, {
        align: "center",
        width: pageW,
        characterSpacing: 3,
      });
    doc
      .fontSize(24)
      .font("Times-Bold")
      .fillColor(COLORS.navy)
      .text(stageLabel, 0, 334, { align: "center", width: pageW });

    // ── 9. Score line — bolder, more contrast ─────────────
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(COLORS.blue)
      .text(
        `FINAL SCORE  ${score} / 100        PASSING MARK  ${passingScore}`,
        0,
        372,
        { align: "center", width: pageW, characterSpacing: 1.5 }
      );

    // ── 10. Competencies — italic serif row with blue dot dividers ──
    const compLine = competencies.join("    •    ");
    doc
      .fontSize(10)
      .font("Times-Italic")
      .fillColor(COLORS.inkSoft)
      .text(compLine, 0, 402, {
        align: "center",
        width: pageW,
        characterSpacing: 0.4,
      });
    const compEndsAt = 402 + 12;

    // ── 10. Issued date — its own row, below competencies ──
    const issuedY = compEndsAt + 18;
    const dateStr = issuedAt.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    doc
      .fontSize(9)
      .font("Helvetica-Oblique")
      .fillColor(COLORS.muted)
      .text(`Issued on ${dateStr}`, 0, issuedY, {
        align: "center",
        width: pageW,
        characterSpacing: 1.2,
      });

    // ── 11. Signatures — serif, restrained ────────────────
    const sigBaselineY = pageH - 86;
    const signers = [
      { x: 90, sig: "Okoma Somto", name: "Okoma Somtochukwu", title: "Head of Programme · TRAN" },
      { x: pageW - 290, sig: "Quadri O.", name: "Quadri Omoloju", title: "Founder · TRAN" },
    ];
    for (const s of signers) {
      doc
        .fontSize(18)
        .font("Times-BoldItalic")
        .fillColor(COLORS.navy)
        .text(s.sig, s.x, sigBaselineY - 26, { width: 200 });
      doc
        .moveTo(s.x, sigBaselineY + 2)
        .lineTo(s.x + 200, sigBaselineY + 2)
        .lineWidth(0.5)
        .strokeColor(COLORS.navy)
        .stroke();
      doc
        .fontSize(9.5)
        .font("Times-Bold")
        .fillColor(COLORS.ink)
        .text(s.name, s.x, sigBaselineY + 8, { width: 200 });
      doc
        .fontSize(7.5)
        .font("Helvetica")
        .fillColor(COLORS.muted)
        .text(s.title.toUpperCase(), s.x, sigBaselineY + 22, {
          width: 200,
          characterSpacing: 1.4,
        });
    }

    // ── 12. Footer — certificate ID only. No public /verify endpoint yet,
    //        so we don't promise one we haven't built.
    doc
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor(COLORS.muted)
      .text(
        `Certificate ID  ${certId}`,
        0,
        pageH - 32,
        {
          align: "center",
          width: pageW,
          characterSpacing: 1.2,
          lineBreak: false,
          height: 14,
        }
      );

    doc.end();
  });
}

// Short blue right-angle bracket at each inner-frame corner. Crisp, modern,
// no filigree — fits the blue-and-white scheme.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawCornerBracket(
  doc: any,
  cx: number,
  cy: number,
  corner: "tl" | "tr" | "bl" | "br"
): void {
  const len = 22;
  const dx = corner === "tl" || corner === "bl" ? 1 : -1;
  const dy = corner === "tl" || corner === "tr" ? 1 : -1;
  doc
    .moveTo(cx, cy + dy * len)
    .lineTo(cx, cy)
    .lineTo(cx + dx * len, cy)
    .lineWidth(1.4)
    .strokeColor(COLORS.navy)
    .stroke();
}

// Five-pointed gold star — the single ornamental element on the page.
// Two concentric blue rings frame it so it reads as the focal point.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawGoldStar(doc: any, cx: number, cy: number, r: number): void {
  // Halo rings — very faint, give the star weight
  doc.circle(cx, cy, r + 14).lineWidth(0.5).strokeColor(COLORS.rule).stroke();
  doc.circle(cx, cy, r + 22).lineWidth(0.3).strokeColor(COLORS.rule).stroke();

  // Star points
  const points: Array<[number, number]> = [];
  const outer = r;
  const inner = r * 0.42;
  // Start at top and rotate around — 5 outer + 5 inner = 10 vertices
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? outer : inner;
    points.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
  }
  doc.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    doc.lineTo(points[i][0], points[i][1]);
  }
  doc.closePath().fillAndStroke(COLORS.gold, COLORS.goldDeep);

  // Subtle highlight: a smaller inner star in lighter gold to suggest shine
  const points2: Array<[number, number]> = [];
  const outer2 = r * 0.55;
  const inner2 = r * 0.22;
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? outer2 : inner2;
    points2.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
  }
  doc.moveTo(points2[0][0], points2[0][1]);
  for (let i = 1; i < points2.length; i++) {
    doc.lineTo(points2[i][0], points2[i][1]);
  }
  doc.closePath().fill("#F2D979");
}

// Small filled diamond — used between hairline rules under the recipient name.
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
