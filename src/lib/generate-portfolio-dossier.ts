// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const pdfkitMod: any = require("pdfkit");
const PDFDocument = pdfkitMod.default || pdfkitMod;

import {
  A, OKOMA, QUADRI, diamond, formatDate, guillocheRun, letterFooter,
  paletteFor, rosette, signatures, type Doc, type Palette,
} from "./pdf-primitives";
import {
  ADVANCED_CREDENTIALS, TRACK_LABEL, TRACK_PROFILE, credentialFor, isAdvancedStage,
  standingFor, type AdvancedStageKey,
} from "./advanced-credential";
import { ADVANCED_TRACK_OUTCOMES, getAdvancedProject, type AdvancedTrack } from "./advanced-stage";
import { UBI_LOGO_BUFFER } from "./ubi-logo-data";

/**
 * Portfolio Dossier — the fullest account of what someone actually built.
 *
 * The certificate is a credential and the reference is an endorsement; this is
 * the evidence behind both. It walks an employer through every project the
 * holder completed and assessed, in their own track's terms: the brief they
 * were given, what they built against it, and the specific capabilities that
 * work demonstrated.
 *
 * It is issued on the same terms as the reference letter — to anyone who
 * reached an advanced project, whether or not they advanced past it — and it
 * never mentions advancement status. Every entry is a stage genuinely PASSED,
 * so the document is honest without needing a disclaimer.
 */

/**
 * The five core stages, common to every track. Each carries what the candidate
 * built and — the part an employer actually needs — why that is worth
 * anything. A one-line label would make the first half of someone's programme
 * look like filler, which it is not.
 */
const CORE_STAGE_DETAIL: Record<string, { what: string; why: string }> = {
  STAGE_0: {
    what:
      "Worked a real authentication log to separate a genuine intrusion from the routine noise " +
      "around it, then briefed the finding to a non-technical decision-maker and made an " +
      "explicit call on the ethics of the disclosure.",
    why:
      "The first thing that fails in a young analyst is not tooling, it is judgment about what " +
      "deserves attention and how to say so to someone who cannot read a log. This stage tests " +
      "both before anything technical is taught.",
  },
  STAGE_1: {
    what:
      "Selected cryptographic schemes for stated constraints, argued the symmetric and " +
      "asymmetric trade-offs rather than asserting them, identified where each construction " +
      "breaks, and designed key handling that survives review.",
    why:
      "Cryptography is where confident guessing does the most damage. Being able to say why a " +
      "scheme is wrong for a job — and where it fails — is far rarer, and far more useful, than " +
      "knowing which library call to make.",
  },
  STAGE_2: {
    what:
      "Found and proved web vulnerabilities including cross-site scripting, SQL injection and " +
      "insecure direct object references, threat-modelled the application before release, " +
      "reviewed authentication and session handling, and wrote remediation a developer can act on.",
    why:
      "Finding a bug is half the job. The half that gets ignored is writing the fix so the " +
      "engineering team will actually ship it, and scoring severity honestly when inflating it " +
      "would be easier.",
  },
  STAGE_3: {
    what:
      "Triaged live process activity, reconstructed a multi-step incident timeline from primary " +
      "evidence, validated indicators of compromise rather than accepting them, and reported the " +
      "incident to an executive audience.",
    why:
      "Incident response is judged on the reconstruction, not the alert. This is where a " +
      "candidate shows they can order events correctly under uncertainty and contain a problem " +
      "without breaking the business they are protecting.",
  },
  STAGE_4: {
    what:
      "Wrote policy intended to be read rather than filed, mapped controls to ISO 27001 and the " +
      "NIST Cybersecurity Framework honestly including partial coverage, communicated risk to a " +
      "board, and defined how improvement would be measured.",
    why:
      "Technical work that cannot be explained to the people who fund it does not get funded. " +
      "This stage is the bridge between the console and the boardroom, and it closes the core " +
      "programme with the standing of Cyber Core Associate.",
  },
};

export type DossierEntry = {
  /** Stage key, e.g. "STAGE_6". */
  stage: string;
  /** Display label, e.g. "Advanced Stage 6 — Exposure". */
  label: string;
};

export function generatePortfolioDossier(opts: {
  fullName: string;
  internCode?: string | null;
  track: AdvancedTrack;
  /** Every stage genuinely PASSED, earliest first. */
  completed: DossierEntry[];
  /** Highest standing actually earned, when there is one. */
  earnedStanding?: string | null;
  issuedAt: Date;
  dossierId: string;
  applicantPool?: number | null;
}): Promise<Buffer> {
  const {
    fullName, internCode, track, completed,
    earnedStanding, issuedAt, dossierId, applicantPool,
  } = opts;
  const P = paletteFor(track);
  const profile = TRACK_PROFILE[track];
  const outcome = ADVANCED_TRACK_OUTCOMES[track];

  return new Promise((resolve, reject) => {
    const doc: Doc = new PDFDocument({
      size: "A4", layout: "portrait",
      margins: { top: 56, bottom: 40, left: 58, right: 58 },
      bufferPages: true,
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const x = 58;
    const w = pageW - 116;
    const cx = pageW / 2;
    const bottomLimit = pageH - 120;

    // ══ COVER ═════════════════════════════════════════════
    doc.rect(0, 0, pageW, pageH).fill(A.paper);
    // Structural header band, the dossier's signature element.
    doc.rect(0, 0, pageW, 172).fill(P.deep);
    doc.rect(0, 172, pageW, 5).fill(P.metal);
    guillocheRun(doc, 0, 150, pageW, 7, 34, P.metalDeep);
    rosette(doc, cx, 470, 175, P.structure, 0.05);

    // The lockup carries dark navy type, which vanishes on the deep band, so
    // it sits on a light plate rather than directly on the ground.
    doc.roundedRect(cx - 62, 30, 124, 74, 5).fill("#FFFFFF");
    doc.image(UBI_LOGO_BUFFER, cx - 46, 40, { width: 92 });
    doc.fontSize(7).font("Helvetica").fillColor(P.metalPale)
      .text("ADVANCED PROGRAMME  ·  CYBERSECURITY INTERNSHIP  ·  THE ROOT ACCESS NETWORK",
        0, 112, { align: "center", width: pageW, characterSpacing: 1.6, lineBreak: false });
    doc.fontSize(19).font("Times-Bold").fillColor("#FFFFFF")
      .text("PORTFOLIO DOSSIER", 0, 128, {
        align: "center", width: pageW, characterSpacing: 5, lineBreak: false,
      });

    let y = 214;
    doc.fontSize(8).font("Helvetica-Bold").fillColor(P.metal)
      .text("PREPARED FOR", 0, y, { align: "center", width: pageW, characterSpacing: 2.6 });
    doc.fontSize(27).font("Times-BoldItalic").fillColor(P.head)
      .text(fullName, 0, y + 16, { align: "center", width: pageW });
    y = doc.y + 8;
    for (const dir of [-1, 1] as const) {
      doc.moveTo(cx + dir * 12, y).lineTo(cx + dir * 150, y)
        .lineWidth(0.8).strokeColor(P.structure).stroke();
    }
    diamond(doc, cx, y, 3.6, P.metal);

    doc.fontSize(11).font("Times-Italic").fillColor(A.inkSoft)
      .text(`${TRACK_LABEL[track]} · Cohort 1${internCode ? ` · ${internCode}` : ""}`,
        0, y + 12, { align: "center", width: pageW });

    // Summary tiles.
    y = doc.y + 22;
    const advancedDone = completed.filter((c) => isAdvancedStage(c.stage)).length;
    const tiles: Array<[string, string]> = [
      ["PROJECTS COMPLETED", String(completed.length)],
      ["ADVANCED PROJECTS", String(advancedDone)],
      ["DISCIPLINE", TRACK_LABEL[track].split(",")[0]],
    ];
    const tw = (w - 2 * 10) / 3;
    tiles.forEach(([label, value], i) => {
      const tx = x + i * (tw + 10);
      doc.rect(tx, y, tw, 54).fill(P.wash);
      doc.moveTo(tx, y).lineTo(tx, y + 54).lineWidth(2.4).strokeColor(P.metal).stroke();
      doc.fontSize(6.5).font("Helvetica-Bold").fillColor(A.muted)
        .text(label, tx + 10, y + 11, { width: tw - 16, characterSpacing: 1.1 });
      doc.fontSize(14).font("Times-Bold").fillColor(P.head)
        .text(value, tx + 10, y + 25, { width: tw - 16, lineBreak: false });
    });
    y += 70;

    if (earnedStanding) {
      doc.rect(x, y, w, 50).fill(P.wash);
      doc.moveTo(x, y).lineTo(x, y + 50).lineWidth(2.6).strokeColor(P.metal).stroke();
      doc.fontSize(7).font("Helvetica-Bold").fillColor(P.metal)
        .text("STANDING EARNED", x + 16, y + 11, { width: w - 32, characterSpacing: 2.2 });
      doc.fontSize(13).font("Times-Bold").fillColor(P.head)
        .text(earnedStanding, x + 16, y + 25, { width: w - 32, lineBreak: false });
      y += 66;
    }

    doc.fontSize(10.5).font("Times-Roman").fillColor(A.inkSoft)
      .text(
        `This dossier records the work ${firstNameOf(fullName)} completed in the ` +
          `${TRACK_LABEL[track]} track of the Ubuntu Bridge Initiative Cybersecurity ` +
          `Internship. The track is assessed on ${profile.summary}. Every project listed here ` +
          `was submitted, reviewed against the programme's evidence rules, and scored.`,
        x, y, { width: w, lineGap: 3, align: "left" }
      );

    doc.fontSize(8).font("Helvetica").fillColor(A.faint)
      .text(`Issued ${formatDate(issuedAt)}  ·  Dossier ${dossierId}  ·  Verify at ubuntubridgeinitiatives.org/verify`,
        x, pageH - 84, { width: w, align: "center", lineBreak: false });

    // ══ HOW THIS WORK WAS ASSESSED ════════════════════════
    doc.addPage();
    y = sectionHead(doc, x, w, 62, P, "01", "How this work was assessed",
      "Read this first: it is what the projects on the following pages had to survive.");

    const rules: Array<[string, string]> = [
      ["Evidence, not assertion",
        "Every material claim must point to a raw artefact the candidate produced, with an exact locator. A claim without evidence is not scored."],
      ["Reproducible from clean state",
        "Builds and analyses must run from a clean machine using the submitted commands. Work that only runs on the author's laptop does not count."],
      ["Defended under challenge",
        "Findings are questioned by a reviewer looking for the weakest point. The candidate has to hold the position or correct it on the spot."],
      ["Integrity attested",
        "Each submission carries a signed integrity attestation and a hash manifest, so the evidence chain can be checked after the fact."],
    ];
    for (const [title, body] of rules) {
      if (y + 52 > bottomLimit) { doc.addPage(); y = 62; }
      doc.circle(x + 3, y + 5, 2.2).fill(P.metal);
      doc.fontSize(10.5).font("Times-Bold").fillColor(P.head)
        .text(title, x + 14, y, { width: w - 14 });
      doc.fontSize(9.5).font("Times-Roman").fillColor(A.inkSoft)
        .text(body, x + 14, doc.y + 2, { width: w - 14, lineGap: 2 });
      y = doc.y + 14;
    }

    if (applicantPool) {
      y += 2;
      doc.rect(x, y, w, 44).fill(P.wash);
      doc.moveTo(x, y).lineTo(x, y + 44).lineWidth(2.4).strokeColor(P.metal).stroke();
      doc.fontSize(9.5).font("Times-Italic").fillColor(A.inkSoft)
        .text(
          `Cohort 1 drew ${applicantPool.toLocaleString("en-GB")} applications. Reaching the ` +
            `Advanced Programme at all placed this candidate in a small minority of them.`,
          x + 16, y + 12, { width: w - 32, lineGap: 2 }
        );
      y += 60;
    }

    // ══ THE WORK ══════════════════════════════════════════
    doc.addPage();
    y = sectionHead(doc, x, w, 62, P, "02", "The work",
      "Each project below was completed, submitted and assessed.");

    let n = 0;
    for (const entry of completed) {
      n++;
      const advanced = isAdvancedStage(entry.stage);
      const tc = advanced ? credentialFor(entry.stage as AdvancedStageKey, track) : null;
      const brief = advanced ? getAdvancedProject(entry.stage, track) : null;
      const core = CORE_STAGE_DETAIL[entry.stage];

      // Advanced projects carry a full technical breakdown and are given a
      // fresh page each; core stages are compact and flow.
      if (advanced && y + 300 > bottomLimit) { doc.addPage(); y = 62; }
      else if (y + 110 > bottomLimit) { doc.addPage(); y = 62; }

      // ── Header ────────────────────────────────────────
      const headH = tc ? 40 : 28;
      doc.rect(x, y, w, headH).fill(advanced ? P.deep : P.structure);
      doc.rect(x, y, 3.5, headH).fill(P.metal);
      doc.circle(x + 26, y + headH / 2, 11).fill(P.metal);
      doc.fontSize(9).font("Times-Bold").fillColor(P.deep)
        .text(String(n).padStart(2, "0"), x + 15, y + headH / 2 - 4.5, {
          width: 22, align: "center", lineBreak: false,
        });
      doc.fontSize(tc ? 11.5 : 10.5).font("Times-Bold").fillColor("#FFFFFF")
        .text(entry.label, x + 46, y + (tc ? 9 : 8), { width: w - 58, lineBreak: false });
      if (tc) {
        doc.fontSize(8.5).font("Times-Italic").fillColor(P.metalPale)
          .text(`Brief — “${tc.project}”`, x + 46, y + 24, { width: w - 58, lineBreak: false });
      }
      y += headH + 10;

      // ── Assessment metadata chips ─────────────────────
      if (brief) {
        const chips = [
          `Difficulty ${brief.difficulty}/5`,
          brief.revision,
          brief.defense,
        ];
        let chipX = x + 14;
        for (const c of chips) {
          const cw = doc.fontSize(7).font("Helvetica-Bold").widthOfString(c) + 14;
          if (chipX + cw > x + w - 14) break;
          doc.roundedRect(chipX, y, cw, 15, 2.5).fill(P.metalPale);
          doc.fontSize(7).font("Helvetica-Bold").fillColor(P.metalDeep)
            .text(c, chipX + 7, y + 4.5, { width: cw - 14, lineBreak: false });
          chipX += cw + 6;
        }
        y += 22;
      }

      y = block(doc, x, w, y, P, "WHAT THEY BUILT",
        tc ? `${capitalise(tc.attestation)}.` : core?.what ?? "", bottomLimit);

      if (brief) {
        y = block(doc, x, w, y, P, "THE OBJECTIVE SET", brief.objective, bottomLimit);
        y = bullets(doc, x, w, y, P, "THE TECHNICAL PROBLEM", brief.technicalChallenges, bottomLimit);
        y = bullets(doc, x, w, y, P, "HOW IT WAS PROVEN", brief.verificationTests, bottomLimit);
        y = wrapList(doc, x, w, y, P, "WHAT THEY SHIPPED", brief.deliverables, bottomLimit);
      }

      const whyText = tc
        ? ADVANCED_CREDENTIALS[entry.stage as AdvancedStageKey].matters
        : core?.why ?? "";
      if (whyText) {
        if (y + 60 > bottomLimit) { doc.addPage(); y = 62; }
        const wy = y;
        doc.fontSize(6.5).font("Helvetica-Bold").fillColor(P.metal)
          .text("WHY IT MATTERS", x + 20, wy, { width: w - 36, characterSpacing: 1.4 });
        doc.fontSize(9.5).font("Times-Italic").fillColor(A.muted)
          .text(whyText, x + 20, wy + 11, { width: w - 36, lineGap: 2.2 });
        doc.moveTo(x + 14, wy - 2).lineTo(x + 14, doc.y + 2)
          .lineWidth(1.6).strokeColor(P.metalPale).stroke();
        y = doc.y + 9;
      }

      if (tc) {
        if (y + 60 > bottomLimit) { doc.addPage(); y = 62; }
        doc.fontSize(6.5).font("Helvetica-Bold").fillColor(A.muted)
          .text("CAPABILITIES DEMONSTRATED", x + 14, y, { width: w - 30, characterSpacing: 1.4 });
        const colW = (w - 44) / 2;
        const perCol = Math.ceil(tc.competencies.length / 2);
        tc.competencies.forEach((c, i) => {
          const col = Math.floor(i / perCol);
          const ry = y + 12 + (i % perCol) * 12.5;
          const rx = x + 14 + col * (colW + 16);
          doc.circle(rx + 2.5, ry + 4, 1.5).fill(P.metalLight);
          doc.fontSize(8.5).font("Times-Roman").fillColor(A.inkSoft)
            .text(c, rx + 11, ry, { width: colW - 11, lineBreak: false });
        });
        y += 12 + perCol * 12.5 + 6;
      }
      y += 10;
    }

    // ══ TOOLKIT + CLOSE ═══════════════════════════════════
    if (y + 150 > bottomLimit) { doc.addPage(); y = 62; }
    y = sectionHead(doc, x, w, y + 10, P, "03", "Working toolkit",
      "Tools used in anger across the projects above, not merely studied.");
    doc.fontSize(10).font("Times-Roman").fillColor(A.inkSoft)
      .text(outcome.toolkit, x, y, { width: w, lineGap: 2.5 });
    y = doc.y + 14;
    doc.fontSize(9.5).font("Times-Italic").fillColor(A.muted)
      .text(`Destination of the track: ${outcome.destination}`, x, y, { width: w, lineGap: 2 });
    y = doc.y + 22;

    if (y + 120 > bottomLimit) { doc.addPage(); y = 62; }
    doc.moveTo(x, y).lineTo(x + w, y).lineWidth(0.7).strokeColor(P.metalPale).stroke();
    doc.fontSize(9.5).font("Times-Italic").fillColor(A.inkSoft)
      .text(
        "This dossier is issued by the programme that set and marked the work. Its contents can " +
          "be verified independently using the reference below, and we are glad to answer " +
          "questions from any employer or institution.",
        x, y + 12, { width: w, lineGap: 2.2 }
      );
    signatures(doc, x, w, doc.y + 46, [OKOMA, QUADRI], P);

    // Footer + page numbers on every page except the cover.
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      if (i === 0) continue;
      doc.rect(0, 0, pageW, 26).fill(P.wash);
      doc.rect(0, 26, pageW, 1.6).fill(P.metal);
      doc.fontSize(7.5).font("Helvetica-Bold").fillColor(P.head)
        .text(fullName.toUpperCase(), x, 9, { width: w / 2, characterSpacing: 1.2, lineBreak: false });
      doc.fontSize(7.5).font("Helvetica").fillColor(A.muted)
        .text(`${TRACK_LABEL[track]}  ·  Portfolio Dossier`, x + w / 2, 9, {
          width: w / 2, align: "right", lineBreak: false,
        });
      letterFooter(doc, x, w, pageH, dossierId);
      doc.fontSize(7).font("Helvetica").fillColor(A.faint)
        .text(`Page ${i + 1} of ${range.count}`, x, pageH - 60, {
          width: w, align: "center", lineBreak: false,
        });
    }
    doc.flushPages();

    doc.end();
  });
}

/** Small-caps section label with a metal tick, used throughout the dossier. */
function sectionLabel(
  doc: Doc, x: number, w: number, y: number, P: Palette, label: string
): void {
  doc.rect(x + 14, y + 2, 8, 2).fill(P.metal);
  doc.fontSize(6.5).font("Helvetica-Bold").fillColor(P.metalDeep)
    .text(label, x + 27, y, { width: w - 43, characterSpacing: 1.5 });
}

/** A labelled prose block that starts a new page rather than overflowing. */
function block(
  doc: Doc, x: number, w: number, y: number, P: Palette,
  label: string, body: string, bottomLimit: number
): number {
  if (!body) return y;
  const h = doc.fontSize(9.5).font("Times-Roman").heightOfString(body, { width: w - 30, lineGap: 2.2 });
  if (y + h + 22 > bottomLimit) { doc.addPage(); y = 62; }
  sectionLabel(doc, x, w, y, P, label);
  doc.fontSize(9.5).font("Times-Roman").fillColor(A.inkSoft)
    .text(body, x + 14, y + 14, { width: w - 30, lineGap: 2.2 });
  return doc.y + 11;
}

/** A labelled bullet list, breaking pages between items rather than inside one. */
function bullets(
  doc: Doc, x: number, w: number, y: number, P: Palette,
  label: string, items: string[], bottomLimit: number
): number {
  if (!items?.length) return y;
  if (y + 44 > bottomLimit) { doc.addPage(); y = 62; }
  sectionLabel(doc, x, w, y, P, label);
  y += 14;
  for (const item of items) {
    const h = doc.fontSize(9).font("Times-Roman").heightOfString(item, { width: w - 52, lineGap: 2 });
    if (y + h + 10 > bottomLimit) { doc.addPage(); y = 62; }
    doc.rect(x + 14, y - 4, w - 28, h + 9).fill(P.wash);
    doc.rect(x + 14, y - 4, 2, h + 9).fill(P.metalLight);
    doc.fontSize(9).font("Times-Roman").fillColor(A.inkSoft)
      .text(item, x + 25, y, { width: w - 52, lineGap: 2 });
    y = doc.y + 10;
  }
  return y + 4;
}

/** Deliverables as a dense wrapped run of monospaced filenames. */
function wrapList(
  doc: Doc, x: number, w: number, y: number, P: Palette,
  label: string, items: string[], bottomLimit: number
): number {
  if (!items?.length) return y;
  const text = items.join("   ·   ");
  const h = doc.fontSize(8).font("Courier").heightOfString(text, { width: w - 30, lineGap: 2.5 });
  if (y + h + 20 > bottomLimit) { doc.addPage(); y = 62; }
  sectionLabel(doc, x, w, y, P, label);
  doc.fontSize(8).font("Courier").fillColor(P.metalDeep)
    .text(text, x + 14, y + 14, { width: w - 30, lineGap: 2.5 });
  return doc.y + 11;
}

/** Numbered section heading with a metal rule. Returns the y below it. */
function sectionHead(
  doc: Doc, x: number, w: number, y: number, P: Palette,
  num: string, title: string, sub: string
): number {
  doc.fontSize(7).font("Helvetica-Bold").fillColor(P.metal)
    .text(num, x, y + 2, { width: 20, characterSpacing: 1.4, lineBreak: false });
  doc.fontSize(15).font("Times-Bold").fillColor(P.head)
    .text(title, x + 22, y, { width: w - 22 });
  doc.fontSize(9).font("Times-Italic").fillColor(A.muted)
    .text(sub, x + 22, doc.y + 1, { width: w - 22 });
  const ruleY = doc.y + 8;
  doc.moveTo(x, ruleY).lineTo(x + 54, ruleY).lineWidth(2).strokeColor(P.metal).stroke();
  doc.moveTo(x + 54, ruleY).lineTo(x + w, ruleY).lineWidth(0.5).strokeColor(P.metalPale).stroke();
  return ruleY + 16;
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

/** Re-exported so callers can build the standing line without importing twice. */
export { standingFor };
export type { AdvancedStageKey };
