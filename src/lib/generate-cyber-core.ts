// PDFKit generators for the Cyber Core Associate package pieces that accompany
// the certificate: the promotion letter, the in-depth letter, the completion
// card, and the badge. All match the approved designs (navy / website-blue /
// gold) and are served, signed, from /api/cyber-core/[reportId]/[piece].
//
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const pdfkitMod: any = require("pdfkit");
const PDFDocument = pdfkitMod.default || pdfkitMod;

const C = {
  navy: "#0A1F44", navyDeep: "#06152F", navyMid: "#12305f",
  blueMid: "#1E40AF", blue: "#2563EB", blueSky: "#7FA8FF", blueFaint: "#8FB4FF",
  ink: "#0A1F44", inkSoft: "#33405C", muted: "#5A6682", line: "#E5E5E5",
  gold: "#C9A227", goldLight: "#EBCB63", goldDeep: "#7A5E12", cream: "#FFF7DD",
  paper: "#FFFFFF", wash: "#FAFAFA", eaf: "#EAF1FF", slate: "#94A3B8",
};

export type CyberCoreData = {
  fullName: string;
  firstName: string;
  uid: string;
  track: string;
  score: number;
  cohort: string;      // e.g. "01"
  issuedAt: Date;
};

// ── shared drawing primitives ───────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function orgLogo(doc: any, cx: number, topY: number, size: number, dark = false) {
  const f = size / 100;
  const cradle = dark ? C.blueSky : C.blue;
  const person = dark ? C.eaf : C.navy;
  doc.save().translate(cx - size / 2, topY).scale(f);
  doc.lineCap("round").lineWidth(13).strokeColor(cradle).path("M16 44 A34 34 0 0 0 84 44").stroke();
  doc.fillColor(person).circle(50, 33, 11.5).fill();
  doc.path("M33 60 a17 17 0 0 1 34 0 q-17 6 -34 0 z").fill();
  doc.restore();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function coreEmblem(doc: any, cx: number, cy: number, R: number, color: string, w: number) {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90);
    pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
  }
  doc.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < 6; i++) doc.lineTo(pts[i][0], pts[i][1]);
  doc.closePath().lineWidth(w).strokeColor(color).stroke();
  doc.circle(cx, cy, R * 0.2).fill(color);
  doc.lineWidth(w).strokeColor(color);
  doc.moveTo(cx, cy - R * 0.32).lineTo(cx, cy - R * 0.66).stroke();
  doc.moveTo(cx, cy + R * 0.32).lineTo(cx, cy + R * 0.7).stroke();
  doc.moveTo(cx + R * 0.32, cy).lineTo(cx + R * 0.7, cy).stroke();
  doc.moveTo(cx - R * 0.32, cy).lineTo(cx - R * 0.7, cy).stroke();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function goldMedallion(doc: any, cx: number, cy: number, R: number) {
  doc.circle(cx, cy, R).fill(C.gold);
  doc.circle(cx, cy, R * 0.97).lineWidth(2.4).strokeColor(C.goldLight).stroke();
  const g = doc.radialGradient(cx - R * 0.2, cy - R * 0.26, 0, cx, cy, R * 0.62);
  g.stop(0, C.goldLight).stop(0.55, C.gold).stop(1, C.goldDeep);
  doc.circle(cx, cy, R * 0.56).fill(g);
  doc.circle(cx, cy, R * 0.56).lineWidth(1).strokeColor(C.goldDeep).stroke();
  coreEmblem(doc, cx, cy, R * 0.34, C.cream, R * 0.055);
}

// Text laid out around a circle, auto-centred on `centerDeg`. `flip` puts the
// text along the bottom of the ring reading upright (outward-facing).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function textRing(doc: any, cx: number, cy: number, radius: number, text: string,
  opts: { centerDeg: number; fontSize: number; color: string; font: string; letter?: number; flip?: boolean }) {
  doc.font(opts.font).fontSize(opts.fontSize).fillColor(opts.color);
  const letter = opts.letter ?? 0;
  const chars = [...text];
  const degs = chars.map((c) => ((doc.widthOfString(c) + letter) / radius) * (180 / Math.PI));
  const total = degs.reduce((a, b) => a + b, 0);
  let ang = opts.flip ? opts.centerDeg + total / 2 : opts.centerDeg - total / 2;
  for (let i = 0; i < chars.length; i++) {
    const a = opts.flip ? ang - degs[i] / 2 : ang + degs[i] / 2;
    const rad = (a * Math.PI) / 180;
    doc.save().translate(cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)).rotate(a + (opts.flip ? -90 : 90));
    doc.text(chars[i], -doc.widthOfString(chars[i]) / 2, -opts.fontSize / 2, { lineBreak: false });
    doc.restore();
    ang += opts.flip ? -degs[i] : degs[i];
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function bufferize(doc: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

const dateLong = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

// ════════════════════════════════════════════════════════
// 1) PROMOTION LETTER — editorial split card (landscape)
// ════════════════════════════════════════════════════════
export function promotionLetter(data: CyberCoreData): Promise<Buffer> {
  const W = 680, H = 460;
  const doc = new PDFDocument({ size: [W, H], margin: 0 });
  const leftW = 266;

  // left navy panel
  const bg = doc.linearGradient(0, 0, leftW, H);
  bg.stop(0, C.navyMid).stop(1, C.navy);
  doc.rect(0, 0, leftW, H).fill(bg);
  goldMedallion(doc, leftW / 2, 150, 62);
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#FFFFFF")
    .text("CYBER CORE", 0, 230, { width: leftW, align: "center", characterSpacing: 3 });
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(C.blueFaint)
    .text("ASSOCIATE", 0, 248, { width: leftW, align: "center", characterSpacing: 5 });
  doc.font("Helvetica").fontSize(7).fillColor(C.blueFaint)
    .text(`VERIFIED  ·  ${data.uid}`, 0, H - 34, { width: leftW, align: "center", characterSpacing: 0.6 });

  // right white panel
  const rx = leftW + 34;
  const rw = W - leftW - 68;
  orgLogo(doc, rx + 11, 34, 22);
  doc.font("Helvetica-Bold").fontSize(12).fillColor(C.navy)
    .text("Ubuntu Bridge Initiative", rx + 28, 40, { lineBreak: false });
  doc.font("Helvetica").fontSize(8).fillColor(C.muted)
    .text(`Cohort ${data.cohort}  ·  ${data.issuedAt.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`,
      rx, 42, { width: rw, align: "right" });
  doc.moveTo(rx, 66).lineTo(rx + rw, 66).lineWidth(1.5).strokeColor(C.navy).stroke();

  doc.font("Helvetica-Bold").fontSize(10).fillColor(C.blue)
    .text("PROMOTION", rx, 96, { characterSpacing: 3 });
  doc.font("Times-Bold").fontSize(38).fillColor(C.navy)
    .text(data.fullName, rx, 112, { width: rw, lineBreak: true });
  const afterName = doc.y + 6;
  doc.font("Helvetica").fontSize(15).fillColor(C.inkSoft)
    .text("is promoted from Intern to ", rx, afterName, { continued: true, width: rw })
    .font("Helvetica-Bold").fillColor(C.blue).text("Cyber Core Associate.");
  doc.font("Helvetica").fontSize(11).fillColor(C.muted)
    .text("Four weeks. A live breach carried from the first dismissed alert to a board-ready close. Earned, not given.",
      rx, doc.y + 12, { width: rw - 30, lineGap: 2 });

  // signatures pinned near the bottom
  const sy = H - 70;
  const sig = (x: number, name: string, title: string) => {
    doc.font("Times-Italic").fontSize(16).fillColor(C.navy).text(name, x, sy, { lineBreak: false });
    doc.moveTo(x, sy + 22).lineTo(x + 150, sy + 22).lineWidth(0.7).strokeColor(C.navy).stroke();
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(C.muted)
      .text(title.toUpperCase(), x, sy + 27, { characterSpacing: 1, lineBreak: false });
  };
  sig(rx, "Okoma Somtochukwu", "Head of Programme");
  sig(rx + 180, "Quadri Omoloju", "Founder");

  return bufferize(doc);
}

// ════════════════════════════════════════════════════════
// 2) IN-DEPTH LETTER — A4 portrait narrative
// ════════════════════════════════════════════════════════
export function inDepthLetter(data: CyberCoreData): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margins: { top: 56, bottom: 56, left: 62, right: 62 } });
  const W = doc.page.width;
  const L = 62, R = W - 62, cw = R - L;

  orgLogo(doc, L + 21, 52, 40);
  doc.font("Helvetica-Bold").fontSize(15).fillColor(C.navy)
    .text("Ubuntu Bridge Initiative", L + 48, 60, { lineBreak: false });
  doc.font("Helvetica").fontSize(9).fillColor(C.muted)
    .text(`Cybersecurity Internship\n${dateLong(data.issuedAt)}`, L, 58, { width: cw, align: "right" });
  doc.moveTo(L, 104).lineTo(R, 104).lineWidth(2).strokeColor(C.navy).stroke();

  doc.font("Helvetica-Bold").fontSize(10).fillColor(C.blue)
    .text("A LETTER TO A CYBER CORE ASSOCIATE", L, 124, { characterSpacing: 2 });
  doc.font("Times-Bold").fontSize(21).fillColor(C.navy)
    .text("What you did, and why it mattered", L, 140);

  const paras = [
    `Dear ${data.firstName},`,
    `Four weeks ago you were handed a mess that was not yours to make. A fintech called Sankofa Digital had been breached, and at the start all anyone had was a bad feeling: odd log lines, a ticket someone had closed too quickly, and a customer-data index that should never have been reachable from the open internet.`,
    `You started at the bottom of it. You learned to read auth logs, to tell real signal from noise, and to make your first ethics call when the right answer was not the comfortable one. Then it deepened. You broke the legacy admin application the way the attacker had, from the SQL injection in the login form to the server-side request that stole cloud credentials, and you rebuilt the kill chain from the evidence itself: the Tor exit at 185.220.101.9, the sudoers grant that turned a foothold into root, the persistence hidden in a shell profile, and the command-and-control beacon buried in ordinary traffic.`,
    `Then the story turned. What looked like an outsider was revealed to be one of their own. The company's Head of Security, after years of being told to put growth ahead of safety, had engineered the breach herself, reopening dead tickets, granting the access, and shaping what the board was allowed to see. You had to hold two truths at once, the technical chain and the human betrayal behind it, and still file the honest report.`,
    `Stage 4 asked the hardest thing: to stop being the investigator and become the adult in the room. You wrote the risk register, the breach notification to the regulator, the board memo, the 30/60/90 roadmap, and the control mapping. You were careful to separate what was exposed from what was confirmed exfiltrated, because a regulator and a board read those two words very differently. You finished all of it.`,
    `On behalf of the Ubuntu Bridge Initiative, it is my privilege to confirm that you have completed Cyber Core and are promoted from Intern to Associate. Take two weeks and rest properly. When you return you step into your specialisation track and pick the work back up, and we will be in touch for your feedback on how Cyber Core went and a photo for your records.`,
    `You did not just pass a stage. You carried a real investigation from confusion to a defensible, board-ready conclusion, and you did it with integrity. That is the whole point of this programme. Welcome to the Associate cohort.`,
  ];
  doc.moveDown(1.4);
  for (const p of paras) {
    doc.font("Times-Roman").fontSize(11.5).fillColor(C.inkSoft).text(p, L, doc.y, { width: cw, align: "left", lineGap: 2.5 });
    doc.moveDown(0.7);
  }

  doc.moveDown(0.4);
  doc.font("Times-Italic").fontSize(19).fillColor(C.navy).text("Okoma Somtochukwu", L, doc.y);
  doc.font("Helvetica").fontSize(10.5).fillColor(C.muted).text("Head of Programme, Ubuntu Bridge Initiative", L, doc.y + 2);
  doc.font("Times-Italic").fontSize(12).fillColor(C.blueMid).text("Ubuntu. I am because we are.", L, doc.y + 12);

  const vy = doc.page.height - 66;
  doc.moveTo(L, vy).lineTo(R, vy).lineWidth(0.5).strokeColor(C.line).stroke();
  doc.font("Helvetica").fontSize(8.5).fillColor(C.muted)
    .text(`Verified credential  ·  ${data.uid}  ·  ubuntubridgeinitiatives.org/verify`, L, vy + 8, { width: cw });

  return bufferize(doc);
}

// ════════════════════════════════════════════════════════
// 3) COMPLETION CARD — keepsake, front + back (two pages)
// ════════════════════════════════════════════════════════
export function completionCard(data: CyberCoreData): Promise<Buffer> {
  const W = 430, H = 271;
  const doc = new PDFDocument({ size: [W, H], margin: 0 });

  // FRONT
  const bg = doc.linearGradient(0, 0, W, H);
  bg.stop(0, C.navy).stop(0.5, C.navyMid).stop(1, C.blueMid);
  doc.rect(0, 0, W, H).fill(bg);
  orgLogo(doc, 34, 20, 26, true);
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#CFE0FF")
    .text("UBUNTU BRIDGE\nINITIATIVE", 52, 18, { characterSpacing: 1, lineGap: 1 });
  doc.roundedRect(W - 96, 20, 76, 20, 4).fill(C.goldLight);
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(C.navyDeep)
    .text("ASSOCIATE", W - 96, 26, { width: 76, align: "center", characterSpacing: 1.5 });

  doc.font("Helvetica-Bold").fontSize(9).fillColor(C.blueFaint)
    .text("CYBER CORE  ·  COMPLETED", 22, 74, { characterSpacing: 2 });
  doc.font("Helvetica-Bold").fontSize(26).fillColor("#FFFFFF").text(data.fullName, 22, 88, { width: W - 44 });

  const ry = 148;
  const cell = (x: number, label: string, val: string) => {
    doc.font("Helvetica").fontSize(7).fillColor(C.blueFaint).text(label.toUpperCase(), x, ry, { characterSpacing: 1 });
    doc.font("Helvetica-Bold").fontSize(11).fillColor(C.eaf).text(val, x, ry + 10, { lineBreak: false });
  };
  cell(22, "UID", data.uid);
  cell(200, "Track", data.track);
  cell(340, "Cohort", data.cohort);

  doc.lineWidth(2.4).strokeColor("#7ee0a0").lineCap("round")
    .path("M22 240 l6 6 l12 -13").stroke();
  doc.font("Helvetica").fontSize(9.5).fillColor("#BFE3C8")
    .text(`Cyber Core completed  ·  ${data.issuedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`,
      48, 236, { lineBreak: false });
  coreEmblem(doc, W - 42, 236, 18, C.blueSky, 2.4);

  // BACK
  doc.addPage({ size: [W, H], margin: 0 });
  const bg2 = doc.linearGradient(0, 0, W, H);
  bg2.stop(0, C.navyDeep).stop(1, C.navy);
  doc.rect(0, 0, W, H).fill(bg2);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(C.blueFaint)
    .text("A NOTE TO REMEMBER IT BY", 26, 30, { characterSpacing: 2 });
  doc.font("Times-Roman").fontSize(12).fillColor("#D6E2F6")
    .text(`You were here at the beginning. Cohort ${data.cohort}. You took a real breach from a single dismissed alert all the way to a board-ready close, and you did it with integrity. Whatever you build next, you built the habit here first.`,
      26, 52, { width: W - 52, lineGap: 3 });
  doc.font("Times-Italic").fontSize(14).fillColor(C.eaf)
    .text("Ubuntu. I am because we are.", 26, 190);
  doc.font("Helvetica").fontSize(8).fillColor("#7f9bce")
    .text(`Verify at ubuntubridgeinitiatives.org/verify  ·  UID ${data.uid}`, 26, H - 30, { width: W - 52 });

  return bufferize(doc);
}

// ════════════════════════════════════════════════════════
// 4) BADGE — circular achievement medallion
// ════════════════════════════════════════════════════════
export function badge(data: CyberCoreData): Promise<Buffer> {
  const W = 256, H = 288;
  const doc = new PDFDocument({ size: [W, H], margin: 0 });
  doc.rect(0, 0, W, H).fill(C.paper);
  const cx = W / 2, cy = 128, R = 116;

  // ribbon behind the medallion
  doc.path(`M${cx - 30} ${cy + R - 6} l16 36 l14 -15 l14 15 l16 -36 z`).fill(C.blueMid);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(C.eaf)
    .text(data.issuedAt.getUTCFullYear().toString(), cx - 40, cy + R + 8, { width: 80, align: "center" });

  doc.circle(cx, cy, R).fill(C.gold);
  const disc = doc.linearGradient(cx, cy - R, cx, cy + R);
  disc.stop(0, "#2f56c9").stop(1, C.navy);
  doc.circle(cx, cy, R * 0.94).fill(disc);
  doc.circle(cx, cy, R * 0.94).lineWidth(2.4).strokeColor(C.goldLight).stroke();

  textRing(doc, cx, cy, R * 0.79, "CYBER CORE ASSOCIATE",
    { centerDeg: -90, fontSize: 12, color: C.eaf, font: "Helvetica-Bold", letter: 2.4 });
  textRing(doc, cx, cy, R * 0.79, "UBUNTU BRIDGE INITIATIVE",
    { centerDeg: 90, fontSize: 8, color: C.slate, font: "Helvetica-Bold", letter: 1.2, flip: true });

  goldMedallion(doc, cx, cy, R * 0.5);

  return bufferize(doc);
}
