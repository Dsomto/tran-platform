/**
 * Shared drawing primitives for the advanced-programme document family.
 *
 * Six documents (advanced certificate, letter of achievement, participation
 * certificate, honourable-close letter, reference letter, performance record)
 * are issued off the back of one stage result. They have to look like one
 * set, so the palette, the emblem, the seal and the letterhead live here
 * rather than being redrawn slightly differently in each generator.
 *
 * The core-stage documents (generate-certificate.ts and friends) keep their
 * own navy/blue treatment. Advanced tier is deliberately darker and gold-led
 * so the two tiers are distinguishable across a room.
 */
import { UBI_LOGO_BUFFER, UBI_LOGO_RATIO } from "./ubi-logo-data";
import type { AdvancedTrack } from "./advanced-stage";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Doc = any;

/** Advanced tier: obsidian structure, gold as the primary accent. */
export const A = {
  paper: "#FFFFFF",
  obsidian: "#080D1A",   // near-black structural band
  navy: "#0A1F44",       // deep navy, headings
  navyDeep: "#06152F",   // signature ink
  blue: "#2563EB",       // brand blue, used sparingly at this tier
  ink: "#111A2E",
  inkSoft: "#33405C",
  muted: "#5A6682",
  faint: "#8C97AD",
  rule: "#C8B36A",       // gold hairline
  ruleSoft: "#D9DFEC",
  gold: "#C9A227",
  goldLight: "#EBCB63",
  goldPale: "#F6E9BE",
  goldDeep: "#7A5E12",
  cream: "#FFF7DD",
} as const;

/**
 * One palette per track.
 *
 * The layout, ornament and paper are identical across all three — the
 * programme's identity — while the structural hue and the precious metal
 * change. A wall of these reads as one family at a glance and as three
 * disciplines on a second look. Each metal was picked to hold a hairline on
 * white: teal-steel, copper and brass all carry a 0.4pt stroke, which a pale
 * silver would not.
 */
export type Palette = {
  /** Darkest structural tone — the back corner wedge and signature ink. */
  deep: string;
  /** Mid structural tone — the front corner wedge and headings. */
  structure: string;
  /** Body-heading tone, a touch lighter than `structure`. */
  head: string;
  metal: string;
  metalLight: string;
  metalPale: string;
  metalDeep: string;
  /** Very pale metal tint, for call-out block fills. */
  wash: string;
};

export const TRACK_PALETTE: Record<AdvancedTrack, Palette> = {
  SOC_ANALYSIS: {
    deep: "#04161D", structure: "#0A3A48", head: "#0C3E4D",
    metal: "#2E7D8C", metalLight: "#7FC4D0", metalPale: "#CDE7EC",
    metalDeep: "#12454F", wash: "#F0F8FA",
  },
  ETHICAL_HACKING: {
    deep: "#1C060A", structure: "#571220", head: "#5C1522",
    metal: "#B0662F", metalLight: "#E4A672", metalPale: "#F0D8C2",
    metalDeep: "#6E3A17", wash: "#FCF4EE",
  },
  GRC: {
    deep: "#05170D", structure: "#124A28", head: "#144E2B",
    metal: "#B08D2E", metalLight: "#E7CE7E", metalPale: "#F0E2B8",
    metalDeep: "#6B5316", wash: "#FBF7EA",
  },
};

export function paletteFor(track: AdvancedTrack): Palette {
  return TRACK_PALETTE[track];
}

// ── Small shapes ────────────────────────────────────────

export function diamond(doc: Doc, cx: number, cy: number, r: number, color: string): void {
  doc.moveTo(cx, cy - r).lineTo(cx + r, cy).lineTo(cx, cy + r).lineTo(cx - r, cy)
    .closePath().fill(color);
}


// ── Landscape certificate furniture ─────────────────────

/**
 * Corner wedges in the track's structural tones, with metal hairlines running
 * through them. Replaces the core tier's blue waves — flatter, heavier, more
 * formal.
 */
export function cornerWedges(doc: Doc, pageW: number, pageH: number, P: Palette): void {
  // top-left
  doc.moveTo(0, 0).lineTo(232, 0).lineTo(0, 138).closePath().fill(P.deep);
  doc.moveTo(0, 0).lineTo(150, 0).lineTo(0, 90).closePath().fill(P.structure);
  // bottom-right (mirrored)
  doc.moveTo(pageW, pageH).lineTo(pageW - 232, pageH).lineTo(pageW, pageH - 138)
    .closePath().fill(P.deep);
  doc.moveTo(pageW, pageH).lineTo(pageW - 150, pageH).lineTo(pageW, pageH - 90)
    .closePath().fill(P.structure);

  // metal hairlines skimming each wedge
  doc.lineWidth(0.9).strokeColor(P.metal);
  doc.moveTo(258, 0).lineTo(0, 154).stroke();
  doc.moveTo(276, 0).lineTo(0, 165).stroke();
  doc.moveTo(pageW - 258, pageH).lineTo(pageW, pageH - 154).stroke();
  doc.moveTo(pageW - 276, pageH).lineTo(pageW, pageH - 165).stroke();
}

/**
 * One run of guilloche — the interwoven engine-turned line found on banknotes
 * and share certificates. Three phase-shifted sine curves at hairline weight
 * read as a woven ribbon at print size and are effectively impossible to
 * redraw by hand, which is the point of the device.
 */
export function guillocheRun(
  doc: Doc, x: number, y: number, len: number, amp: number,
  cycles: number, color: string, rotate = 0
): void {
  doc.save().translate(x, y).rotate(rotate, { origin: [0, 0] });
  const steps = Math.max(96, Math.round(len / 1.6));
  for (const phase of [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3]) {
    doc.lineWidth(0.35).strokeColor(color);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = t * len;
      // Two frequencies beating against each other give the woven look; a
      // single sine reads as a plain wave.
      const py =
        Math.sin(t * cycles * 2 * Math.PI + phase) * amp +
        Math.sin(t * cycles * 2 * Math.PI * 2.5 + phase) * amp * 0.34;
      if (i === 0) doc.moveTo(px, py);
      else doc.lineTo(px, py);
    }
    doc.stroke();
  }
  doc.restore();
}

/**
 * Double metal frame, a guilloche band running inside it on all four sides,
 * and filigree at the inner corners.
 */
export function ornateFrame(doc: Doc, pageW: number, pageH: number, P: Palette): void {
  doc.lineWidth(1.5).strokeColor(P.metal).rect(30, 30, pageW - 60, pageH - 60).stroke();
  doc.lineWidth(0.4).strokeColor(P.metalLight).rect(36, 36, pageW - 72, pageH - 72).stroke();
  doc.lineWidth(0.9).strokeColor(P.metalDeep).rect(56, 56, pageW - 112, pageH - 112).stroke();

  // Guilloche band centred in the 20pt channel between the outer pair and the
  // inner rule. The runs stop short of the corners so the band does not
  // collide with the filigree sitting on the inner rule's corners.
  const c = 46;
  const stop = 34;
  guillocheRun(doc, c + stop, c, pageW - (c + stop) * 2, 4.4, 24, P.metalPale);
  guillocheRun(doc, c + stop, pageH - c, pageW - (c + stop) * 2, 4.4, 24, P.metalPale);
  guillocheRun(doc, c, pageH - c - stop, pageH - (c + stop) * 2, 4.4, 15, P.metalPale, -90);
  guillocheRun(doc, pageW - c, pageH - c - stop, pageH - (c + stop) * 2, 4.4, 15, P.metalPale, -90);

  for (const [dx, dy, sx, sy] of [
    [56, 56, 1, 1], [pageW - 56, 56, -1, 1],
    [56, pageH - 56, 1, -1], [pageW - 56, pageH - 56, -1, -1],
  ] as const) {
    filigree(doc, dx, dy, sx, sy, P);
  }
}

/** A small corner flourish: quarter-arc, spur and a metal lozenge. */
function filigree(doc: Doc, x: number, y: number, sx: number, sy: number, P: Palette): void {
  doc.save().translate(x, y).scale(sx, sy);
  doc.lineWidth(0.8).strokeColor(P.metal);
  doc.moveTo(0, 26).bezierCurveTo(0, 8, 8, 0, 26, 0).stroke();
  doc.lineWidth(0.5).strokeColor(P.metalLight);
  doc.moveTo(0, 38).bezierCurveTo(0, 12, 12, 0, 38, 0).stroke();
  doc.moveTo(6, 15).bezierCurveTo(6, 8, 8, 6, 15, 6).stroke();
  doc.restore();
  diamond(doc, x, y, 2.8, P.metal);
}

/**
 * Guilloche rosette — a hypotrochoid spirograph, the pattern a rose engine
 * cuts. Used at very low opacity as the centred watermark, in place of the
 * plain hexagon. Ratios are chosen so each curve closes exactly and the
 * result is rotationally symmetric; an unclosed curve reads as a smudge.
 */
export function rosette(
  doc: Doc, cx: number, cy: number, R: number, color: string, opacity = 0.06
): void {
  doc.save().opacity(opacity).lineWidth(0.45).strokeColor(color);
  // [outer radius ratio, inner circle ratio, pen offset ratio]
  for (const [scale, k, d] of [[1, 7 / 24, 0.62], [0.74, 5 / 18, 0.7], [0.46, 3 / 11, 0.8]] as const) {
    const Ro = R * scale;
    const r = Ro * k;
    const pen = r * d * 3.4;
    const steps = 1440;
    for (let i = 0; i <= steps; i++) {
      // Full closure needs t to sweep the denominator of k times 2π.
      const t = (i / steps) * 2 * Math.PI * 24;
      const px = cx + (Ro - r) * Math.cos(t) + pen * Math.cos(((Ro - r) / r) * t);
      const py = cy + (Ro - r) * Math.sin(t) - pen * Math.sin(((Ro - r) / r) * t);
      if (i === 0) doc.moveTo(px, py);
      else doc.lineTo(px, py);
    }
    doc.stroke();
  }
  doc.restore();
}

/**
 * A field of fine guilloche covering a whole area, drawn as interleaved
 * horizontal runs. Used at very low opacity behind the whole certificate face
 * on the elevated tier — the same device a banknote uses to make its ground
 * impossible to reproduce flatly.
 */
export function guillocheField(
  doc: Doc, x: number, y: number, w: number, h: number,
  color: string, opacity = 0.055, spacing = 15
): void {
  doc.save().opacity(opacity);
  for (let row = 0; y + row * spacing < y + h; row++) {
    const ry = y + row * spacing;
    if (ry > y + h) break;
    // Alternate the beat frequency per row so the field never tiles visibly.
    guillocheRun(doc, x, ry, w, spacing * 0.42, row % 2 === 0 ? 30 : 34, color);
  }
  doc.restore();
}

/**
 * A laurel wreath — two mirrored arcs of leaves. Rings the seal on the
 * elevated tier, where the credential is worth the extra ceremony.
 */
export function laurelWreath(
  doc: Doc, cx: number, cy: number, r: number, color: string
): void {
  for (const side of [-1, 1] as const) {
    for (let i = 0; i < 9; i++) {
      // Sweep from the bottom of the circle up around to the top.
      const t = i / 8;
      const a = Math.PI / 2 + side * (0.28 + t * 2.05);
      const lx = cx + r * Math.cos(a);
      const ly = cy + r * Math.sin(a);
      const len = r * (0.3 - t * 0.12);
      const tilt = a + side * 1.15;
      doc.save().translate(lx, ly).rotate((tilt * 180) / Math.PI, { origin: [0, 0] });
      // One leaf: two opposed arcs meeting at a point.
      doc.moveTo(0, 0)
        .bezierCurveTo(len * 0.5, -len * 0.42, len * 1.1, -len * 0.2, len * 1.5, 0)
        .bezierCurveTo(len * 1.1, len * 0.2, len * 0.5, len * 0.42, 0, 0)
        .closePath().fill(color);
      doc.restore();
    }
  }
}

/**
 * A ribbon banner carrying a single line of text — swallow-tailed ends, a
 * folded return behind each side, and a darker underside so it reads as
 * folded cloth rather than a rectangle.
 */
export function ribbonBanner(
  doc: Doc, cx: number, cy: number, innerW: number, h: number, P: Palette,
  text: string, fontSize: number
): void {
  const half = innerW / 2;
  const tail = 30;
  const notch = 11;

  // folded returns behind the main band
  for (const dir of [-1, 1] as const) {
    doc.moveTo(cx + dir * half, cy - h / 2)
      .lineTo(cx + dir * (half + 13), cy - h / 2 - 8)
      .lineTo(cx + dir * (half + 13), cy + h / 2 - 8)
      .lineTo(cx + dir * half, cy + h / 2)
      .closePath().fill(P.deep);
  }

  // main band
  doc.moveTo(cx - half, cy - h / 2)
    .lineTo(cx + half, cy - h / 2)
    .lineTo(cx + half, cy + h / 2)
    .lineTo(cx - half, cy + h / 2)
    .closePath().fill(P.structure);

  // swallow-tailed ends
  for (const dir of [-1, 1] as const) {
    const base = cx + dir * half;
    doc.moveTo(base, cy - h / 2)
      .lineTo(base + dir * tail, cy - h / 2)
      .lineTo(base + dir * (tail - notch), cy)
      .lineTo(base + dir * tail, cy + h / 2)
      .lineTo(base, cy + h / 2)
      .closePath().fill(P.structure);
  }

  // metal keylines top and bottom
  doc.lineWidth(0.7).strokeColor(P.metalLight);
  doc.moveTo(cx - half - tail + notch * 0.4, cy - h / 2 + 2.4)
    .lineTo(cx + half + tail - notch * 0.4, cy - h / 2 + 2.4).stroke();
  doc.moveTo(cx - half - tail + notch * 0.4, cy + h / 2 - 2.4)
    .lineTo(cx + half + tail - notch * 0.4, cy + h / 2 - 2.4).stroke();

  doc.fontSize(fontSize).font("Times-Bold").fillColor("#FFFFFF")
    .text(text, cx - half - tail, cy - fontSize * 0.56, {
      width: innerW + tail * 2, align: "center",
      characterSpacing: 0.7, lineBreak: false,
    });
}

/** Centred UBI lockup at the given top edge. Returns the y below it. */
export function logoLockup(doc: Doc, cx: number, topY: number, width = 112): number {
  doc.image(UBI_LOGO_BUFFER, cx - width / 2, topY, { width });
  return topY + width / UBI_LOGO_RATIO;
}

/**
 * The advanced seal: a struck medallion in the track's metal, carrying the
 * project numeral over a guilloche ground and ringed with the track name.
 */
export function advancedSeal(
  doc: Doc, cx: number, cy: number, R: number, P: Palette,
  opts: { numeral: string; ring: string }
): void {
  // ribbon tails behind the medal
  const ribY = cy + R * 0.62;
  for (const dir of [-1, 1]) {
    const x = cx + dir * R * 0.4;
    doc.moveTo(x, ribY)
      .lineTo(x + dir * R * 0.5, ribY + R * 1.15)
      .lineTo(x + dir * R * 0.14, ribY + R * 0.95)
      .lineTo(x - dir * R * 0.18, ribY + R * 1.2)
      .closePath().fillAndStroke(P.structure, P.deep);
  }

  // fluted outer edge
  const n = 32;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (Math.PI / n) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? R * 1.15 : R * 1.0;
    pts.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]);
  }
  doc.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) doc.lineTo(pts[i][0], pts[i][1]);
  doc.closePath().fillAndStroke(P.metal, P.metalDeep);

  // struck metal face with a lit highlight
  const grad = doc.radialGradient(cx - R * 0.26, cy - R * 0.3, 0, cx, cy, R);
  grad.stop(0, P.metalLight).stop(0.58, P.metal).stop(1, P.metalDeep);
  doc.circle(cx, cy, R).fill(grad);
  doc.circle(cx, cy, R * 0.9).lineWidth(0.8).strokeColor(P.metalPale).stroke();

  // guilloche ring in the rim channel, then the dark centre
  doc.save().opacity(0.5);
  guillocheRun(doc, cx - R * 0.87, cy, R * 1.74, 2.1, 15, P.metalPale);
  doc.restore();
  doc.circle(cx, cy, R * 0.7).fill(P.deep);
  doc.circle(cx, cy, R * 0.7).lineWidth(1).strokeColor(P.metalLight).stroke();
  doc.circle(cx, cy, R * 0.62).lineWidth(0.4).strokeColor(P.metal).stroke();

  doc.fontSize(R * 0.6).font("Times-Bold").fillColor(P.metalLight)
    .text(opts.numeral, cx - R * 0.7, cy - R * 0.34, {
      width: R * 1.4, align: "center", lineBreak: false,
    });

  // track name on the metal rim
  doc.fontSize(R * 0.15).font("Helvetica-Bold").fillColor(P.metalDeep)
    .text(opts.ring.toUpperCase(), cx - R, cy + R * 0.74, {
      width: R * 2, align: "center", characterSpacing: 1.1, lineBreak: false,
    });
}

/**
 * Fit a recipient's name on one line if it can be done with dignity, two if
 * not. Long West African names are the norm here, so this is not a nicety.
 */
export function layoutName(
  doc: Doc, fullName: string, maxWidth: number, maxSize = 36, minSize = 21
): { lines: string[]; size: number } {
  const name = fullName.trim().replace(/\s+/g, " ") || "Ubuntu Bridge Intern";
  doc.font("Times-BoldItalic");

  for (let size = maxSize; size >= minSize + 4; size--) {
    if (doc.fontSize(size).widthOfString(name) <= maxWidth) return { lines: [name], size };
  }

  const words = name.split(" ");
  if (words.length === 1) {
    for (let size = minSize + 4; size >= minSize - 3; size--) {
      if (doc.fontSize(size).widthOfString(name) <= maxWidth) return { lines: [name], size };
    }
    return { lines: [name], size: minSize - 3 };
  }

  // Split at the point that makes the two lines most even.
  let best: [string, string] = [words[0], words.slice(1).join(" ")];
  let bestWidth = Number.POSITIVE_INFINITY;
  for (let i = 1; i < words.length; i++) {
    const first = words.slice(0, i).join(" ");
    const second = words.slice(i).join(" ");
    const widest = Math.max(
      doc.fontSize(30).widthOfString(first),
      doc.fontSize(30).widthOfString(second)
    );
    if (widest < bestWidth) { best = [first, second]; bestWidth = widest; }
  }
  for (let size = maxSize - 4; size >= minSize; size--) {
    if (best.every((l) => doc.fontSize(size).widthOfString(l) <= maxWidth)) {
      return { lines: best, size };
    }
  }
  return { lines: best, size: minSize };
}

// ── Portrait letter furniture ───────────────────────────

export type Signer = { sig: string; name: string; title: string };

export const OKOMA: Signer = {
  sig: "Okoma Somto",
  name: "Okoma Somtochukwu",
  title: "Head of Programme · Ubuntu Bridge Initiative",
};
export const QUADRI: Signer = {
  sig: "Quadri O.",
  name: "Quadri Omoloju",
  title: "Founder · The Root Access Network",
};

/**
 * Programme letterhead for A4 portrait letters: logo left, org name, a gold
 * lead rule. Returns the y coordinate the body may start at.
 */
export function letterhead(
  doc: Doc, x: number, w: number, kicker: string, P?: Palette
): number {
  const logoW = 74;
  doc.image(UBI_LOGO_BUFFER, x, 56, { width: logoW });

  doc.fontSize(7.5).font("Helvetica").fillColor(A.muted)
    .text(kicker.toUpperCase(), x, 64, { width: w, align: "right", characterSpacing: 1.4 });
  doc.fontSize(7.5).font("Helvetica").fillColor(A.faint)
    .text("ubuntubridgeinitiatives.org", x, 78, { width: w, align: "right" });

  const ruleY = 56 + logoW / UBI_LOGO_RATIO + 14;
  doc.moveTo(x, ruleY).lineTo(x + 64, ruleY)
    .lineWidth(2.4).strokeColor(P?.metal ?? A.gold).stroke();
  doc.moveTo(x + 64, ruleY).lineTo(x + w, ruleY)
    .lineWidth(0.7).strokeColor(P?.structure ?? A.navy).stroke();
  return ruleY + 18;
}

/**
 * Guarantee `needed` points of room below `y`, starting a new page if there
 * is not. Letter length varies with the recipient's name, stage label and
 * reviewer notes, so the closing block cannot rely on a fixed coordinate —
 * without this the signatures print on top of the last paragraph.
 */
export function ensureRoom(
  doc: Doc, y: number, needed: number, pageH: number, topY = 64
): number {
  // pageH - 104 is the first pixel the footer rule occupies; content must
  // finish above it.
  if (y + needed <= pageH - 104) return y;
  doc.addPage();
  return topY;
}

/** Points consumed by a closing line plus one row of signature blocks. */
export const CLOSING_BLOCK_HEIGHT = 90;

/** Two side-by-side signature blocks. Returns the y below them. */
export function signatures(
  doc: Doc, x: number, w: number, y: number, signers: Signer[], P?: Palette
): number {
  const blockW = Math.min(214, (w - 24) / signers.length);
  signers.forEach((s, i) => {
    const sx = signers.length === 1 ? x : x + i * (w - blockW);
    doc.fontSize(17).font("Times-BoldItalic").fillColor(P?.deep ?? A.navyDeep)
      .text(s.sig, sx, y - 26, { width: blockW, lineBreak: false });
    doc.moveTo(sx, y + 2).lineTo(sx + blockW, y + 2)
      .lineWidth(0.6).strokeColor(P?.structure ?? A.navy).stroke();
    doc.fontSize(9.5).font("Helvetica-Bold").fillColor(A.ink)
      .text(s.name, sx, y + 8, { width: blockW });
    doc.fontSize(7.5).font("Helvetica").fillColor(A.muted)
      .text(s.title, sx, y + 21, { width: blockW });
  });
  return y + 42;
}

/** Hairline footer with the document reference and verification pointer. */
export function letterFooter(doc: Doc, x: number, w: number, pageH: number, ref: string, note?: string): void {
  doc.moveTo(x, pageH - 96).lineTo(x + w, pageH - 96)
    .lineWidth(0.5).strokeColor(A.ruleSoft).stroke();
  if (note) {
    doc.fontSize(7.5).font("Helvetica").fillColor(A.muted)
      .text(note, x, pageH - 86, { width: w, align: "center", lineBreak: false });
  }
  doc.fontSize(7.5).font("Helvetica").fillColor(A.faint)
    .text(
      `Reference ${ref}  ·  Verify at ubuntubridgeinitiatives.org/verify`,
      x, pageH - (note ? 73 : 84),
      { width: w, align: "center", lineBreak: false }
    );
}

/** Build a paragraph writer bound to a cursor. */
export function paragrapher(
  doc: Doc,
  x: number,
  w: number,
  startY: number,
  defaults?: { gap?: number; size?: number; lineGap?: number }
) {
  let y = startY;
  return {
    // Body copy is tuned to keep a full-length letter — salutation, five or
    // six paragraphs, a call-out block and a signature row — on one page.
    // Loosening these pushes the signatures onto a second sheet.
    para(text: string, opts?: { gap?: number; font?: string; size?: number; color?: string }) {
      doc.fontSize(opts?.size ?? defaults?.size ?? 10.2)
        .font(opts?.font ?? "Times-Roman")
        .fillColor(opts?.color ?? A.ink)
        .text(text, x, y, { width: w, align: "left", lineGap: defaults?.lineGap ?? 2.6 });
      y = doc.y + (opts?.gap ?? defaults?.gap ?? 10);
    },
    get y() { return y; },
    set y(next: number) { y = next; },
  };
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
