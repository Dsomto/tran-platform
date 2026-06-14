// pdfkit ships CommonJS — Next.js's production bundler wraps it as
// { default: PDFDocument }. Without this normalisation `new PDFDocument()`
// throws "C is not a constructor" on Vercel.
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const pdfkitMod: any = require("pdfkit");
const PDFDocument = pdfkitMod.default || pdfkitMod;

const C = {
  navy: "#0A1F44",
  navyDeep: "#06152F",
  blue: "#1D4ED8",
  ink: "#1A2233",
  muted: "#5A6682",
  rule: "#C3D0E6",
  gold: "#C9A227",
  paper: "#FFFFFF",
};

// In-world promotion letter from Sankofa Digital — the case company the intern
// has been working inside all stage. The certificate is the real UBI credential;
// this letter is the story reward, a "well done, you are promoted" from the
// company, co-signed by the programme office so it still reads as a real record.
export function generatePassLetter(opts: {
  fullName: string;
  stageLabel: string;
  score: number;
  passingScore: number;
  issuedAt: Date;
  letterId: string;
  nextStageLabel?: string;
}): Promise<Buffer> {
  const { fullName, stageLabel, score, passingScore, issuedAt, letterId, nextStageLabel } = opts;
  const firstName = (fullName.trim().split(/\s+/)[0] || fullName).trim();
  const issuedStr = issuedAt.toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "portrait",
      margins: { top: 64, bottom: 64, left: 64, right: 64 },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const x = 64;
    const w = pageW - 128;

    // ── Letterhead ─────────────────────────────────────────
    drawEmblem(doc, x + 13, 78, 15);
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .fillColor(C.navy)
      .text("SANKOFA DIGITAL", x + 40, 66, { characterSpacing: 1.5 });
    doc
      .fontSize(8.5)
      .font("Helvetica")
      .fillColor(C.muted)
      .text("Office of the Head of Security  ·  Lagos, Nigeria", x + 40, 87, {
        characterSpacing: 0.8,
      });
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor(C.muted)
      .text("Cohort 1 · Internship", x, 70, { width: w, align: "right" });

    // Navy rule with a gold lead segment
    const ruleY = 108;
    doc.moveTo(x, ruleY).lineTo(x + 70, ruleY).lineWidth(2.2).strokeColor(C.gold).stroke();
    doc.moveTo(x + 70, ruleY).lineTo(x + w, ruleY).lineWidth(0.8).strokeColor(C.navy).stroke();

    // ── Date + reference ───────────────────────────────────
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(C.ink)
      .text(issuedStr, x, 126, { width: w });
    doc
      .fontSize(8)
      .fillColor(C.muted)
      .text(`Ref ${letterId}`, x, 126, { width: w, align: "right" });

    // ── Salutation ─────────────────────────────────────────
    let y = 160;
    doc
      .fontSize(11.5)
      .font("Times-Bold")
      .fillColor(C.navyDeep)
      .text(`Dear ${firstName},`, x, y, { width: w });
    y += 26;

    const para = (text: string, gap = 13) => {
      doc
        .fontSize(11)
        .font("Times-Roman")
        .fillColor(C.ink)
        .text(text, x, y, { width: w, align: "left", lineGap: 3.5 });
      y = doc.y + gap;
    };

    para(
      `On behalf of everyone at Sankofa Digital, congratulations. You have completed ` +
        `${stageLabel}, and your work was held to the same standard we hold our own ` +
        `analysts to. It cleared that bar, and it did so honestly.`
    );

    para(
      `Your capstone and write-ups were assessed against the programme rubric and scored ` +
        `${score} out of 100, against a pass mark of ${passingScore}. Your reviewer's notes ` +
        `are on your dashboard. Read them closely, because the next desk assumes you already have.`
    );

    if (nextStageLabel) {
      para(
        `On the strength of that result, you are promoted to ${nextStageLabel}. A new desk, ` +
          `a new brief, and a harder problem are waiting for you. The chapter opens to you shortly, ` +
          `and the team you are about to meet has read your file.`
      );
    } else {
      para(
        `On the strength of that result, you have reached the end of the foundation track, ` +
          `and you reached it on merit. What comes next is the specialist work you chose.`
      );
    }

    para(
      `Keep the standard you set here. The work gets harder from this point, and so does ` +
        `the company you keep. We are glad you are still in the room.`
    );

    doc
      .fontSize(11)
      .font("Times-Italic")
      .fillColor(C.navy)
      .text("Welcome to the next chapter.", x, y, { width: w });
    y += 30;

    // ── Signatures ─────────────────────────────────────────
    const sigY = Math.min(y + 24, pageH - 168);
    const signers = [
      { x: x, sig: "Amaka Eze", name: "Amaka Eze", title: "Head of Security · Sankofa Digital" },
      {
        x: x + w - 210,
        sig: "Okoma S.",
        name: "Okoma Somtochukwu",
        title: "Programme Lead · Ubuntu Bridge Initiative",
      },
    ];
    for (const s of signers) {
      doc
        .fontSize(17)
        .font("Times-BoldItalic")
        .fillColor(C.navyDeep)
        .text(s.sig, s.x, sigY - 26, { width: 210 });
      doc
        .moveTo(s.x, sigY + 2)
        .lineTo(s.x + 200, sigY + 2)
        .lineWidth(0.6)
        .strokeColor(C.navy)
        .stroke();
      doc
        .fontSize(9.5)
        .font("Helvetica-Bold")
        .fillColor(C.ink)
        .text(s.name, s.x, sigY + 8, { width: 210 });
      doc
        .fontSize(7.5)
        .font("Helvetica")
        .fillColor(C.muted)
        .text(s.title, s.x, sigY + 21, { width: 210 });
    }

    // ── Footer ─────────────────────────────────────────────
    doc
      .moveTo(x, pageH - 104)
      .lineTo(x + w, pageH - 104)
      .lineWidth(0.5)
      .strokeColor(C.rule)
      .stroke();
    doc
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor(C.muted)
      .text(
        "Sankofa Digital is the live case environment of the Ubuntu Bridge Initiative Cybersecurity Internship.",
        x,
        pageH - 94,
        { width: w, align: "center", lineBreak: false }
      );
    doc
      .fontSize(7.5)
      .fillColor(C.muted)
      .text(`Letter reference ${letterId}  ·  ubuntubridgeinitiatives.org`, x, pageH - 82, {
        width: w,
        align: "center",
        lineBreak: false,
      });

    doc.end();
  });
}

// Small hexagon emblem with a gold core — a quiet brand mark for the letterhead.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawEmblem(doc: any, cx: number, cy: number, r: number): void {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  doc.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < 6; i++) doc.lineTo(pts[i][0], pts[i][1]);
  doc.closePath().lineWidth(1.6).fillAndStroke(C.navy, C.navy);
  doc.circle(cx, cy, r * 0.34).fill(C.gold);
}
