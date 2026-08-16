/**
 * Render one sample of every advanced-programme document to /tmp/adv so the
 * design can be reviewed as PDFs before anything is issued. No database
 * access — every value here is fictional.
 *
 *   npx tsx scripts/render-advanced-samples.ts
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { generateAdvancedCertificate } from "../src/lib/generate-advanced-certificate";
import { generateAchievementLetter } from "../src/lib/generate-achievement-letter";
import { generateHonourableCloseLetter } from "../src/lib/generate-honourable-close-letter";
import { generateReferenceLetter } from "../src/lib/generate-reference-letter";
import { generatePerformanceRecord } from "../src/lib/generate-performance-record";
import { generatePortfolioDossier } from "../src/lib/generate-portfolio-dossier";

const OUT = "/tmp/adv";
const NAME = "Adaeze Elizabeth Adeteye";
const ISSUED = new Date("2026-08-16");
const POOL = 5500;
const AT_STAGE = 167;

// What the reference letter lists as the candidate's body of work: only
// stages actually passed, mirroring what the route queries.
const COMPLETED_WORK = [
  { label: "Stage 0 — Foundations" },
  { label: "Stage 1 — Applied Cryptography" },
  { label: "Stage 2 — Web Application Security" },
  { label: "Stage 3 — Incident Response" },
  { label: "Stage 4 — Governance & Risk" },
  { label: "Advanced Stage 5 — Signal", project: "Build a Production Hunt Engine" },
];

const STAGES = [
  { label: "Stage 0 — Foundations", score: 82, passingScore: 70, status: "PASSED",
    feedback: "Clean separation of the real intrusion from the noise. The executive brief was written for the reader rather than for the marker, which is rarer than it should be." },
  { label: "Stage 1 — Applied Cryptography", score: 88, passingScore: 70, status: "PASSED",
    feedback: "Correct scheme selection with the trade-offs argued rather than asserted. Key handling would survive a real review." },
  { label: "Stage 2 — Web Application Security", score: 79, passingScore: 70, status: "PASSED",
    feedback: "Found the IDOR chain and did not take the decoy. Severity scoring was honest where it would have been easy to inflate." },
  { label: "Stage 3 — Incident Response", score: 84, passingScore: 70, status: "PASSED",
    feedback: "Timeline reconstruction was the strongest part. Containment respected the business, which most submissions did not." },
  { label: "Stage 4 — Governance & Risk", score: 81, passingScore: 70, status: "PASSED",
    feedback: "ISO 27001 mapping was honest about partial coverage instead of claiming full alignment. Board framing landed." },
  { label: "Stage 5 — Signal", score: 76, passingScore: 70, status: "PASSED",
    feedback: "Evidence index was complete and every locator resolved. Reproduction from clean state worked first time." },
  { label: "Stage 6 — Exposure", score: 68, passingScore: 70, status: "FAILED",
    feedback: "Strong discovery work and a well-run system, but prioritisation leaned on scanner severity rather than on the exposure's actual reachability. The remediation plan was sound; the ranking that fed it was not." },
];

async function main() {
  mkdirSync(OUT, { recursive: true });

  const write = (n: string, buf: Buffer) => {
    writeFileSync(`${OUT}/${n}.pdf`, buf);
    console.log(`  ${n}.pdf  ${(buf.length / 1024).toFixed(0)}kb`);
  };

  console.log("PASSED —");
  write("1-advanced-certificate", await generateAdvancedCertificate({
    fullName: NAME, stage: "STAGE_6", track: "SOC_ANALYSIS",
    issuedAt: ISSUED, certId: "A1B2C3D4E5F6",
  }));
  write("2-letter-of-achievement", await generateAchievementLetter({
    fullName: NAME, stage: "STAGE_6", track: "SOC_ANALYSIS",
    issuedAt: ISSUED, letterId: "LOA-A1B2C3D4",
    rank: 12, cohortSize: 58, nextStageLabel: "Advanced Stage 7 — Architecture",
  }));

  console.log("NOT ADVANCED —");
  write("3-honourable-close-letter", await generateHonourableCloseLetter({
    fullName: NAME, stage: "STAGE_6", track: "SOC_ANALYSIS",
    issuedAt: ISSUED, effectiveDate: new Date("2026-08-21"), letterId: "HC-A1B2C3D4",
    returningCode: "NF-K7RM-92XQ", applicantPool: POOL, cohortAtStage: AT_STAGE,
  }));
  write("4-reference-letter", await generateReferenceLetter({
    fullName: NAME, stage: "STAGE_6", track: "SOC_ANALYSIS",
    issuedAt: ISSUED, letterId: "REF-A1B2C3D4", completed: false,
    completedWork: COMPLETED_WORK, applicantPool: POOL, cohortAtStage: AT_STAGE,
  }));
  write("5-performance-record", await generatePerformanceRecord({
    fullName: NAME, internCode: "UBI-2025-0412", track: "SOC_ANALYSIS",
    issuedAt: ISSUED, recordId: "PR-A1B2C3D4", stages: STAGES,
  }));

  write("6-portfolio-dossier", await generatePortfolioDossier({
    fullName: NAME, internCode: "UBI-2025-0412", track: "SOC_ANALYSIS",
    completed: [
      { stage: "STAGE_0", label: "Stage 0 — Foundations" },
      { stage: "STAGE_1", label: "Stage 1 — Applied Cryptography" },
      { stage: "STAGE_2", label: "Stage 2 — Web Application Security" },
      { stage: "STAGE_3", label: "Stage 3 — Incident Response" },
      { stage: "STAGE_4", label: "Stage 4 — Governance & Risk" },
      { stage: "STAGE_5", label: "Advanced Stage 5 — Signal" },
      { stage: "STAGE_6", label: "Advanced Stage 6 — Exposure" },
    ],
    earnedStanding: "Exposure Operator — SOC Analysis",
    issuedAt: ISSUED, dossierId: "PD-A1B2C3D4", applicantPool: POOL,
  }));

  console.log("STAGE 7 TIER — elevated certificate");
  for (const t of ["SOC_ANALYSIS", "ETHICAL_HACKING", "GRC"] as const) {
    write(`stage7-${t}-certificate`, await generateAdvancedCertificate({
      fullName: NAME, stage: "STAGE_7", track: t, issuedAt: ISSUED, certId: "S7CERT001122",
    }));
  }

  console.log("TRACK SWEEP — certificate + achievement letter per track");
  const TRACKS = ["SOC_ANALYSIS", "ETHICAL_HACKING", "GRC"] as const;
  for (const t of TRACKS) {
    write(`track-${t}-certificate`, await generateAdvancedCertificate({
      fullName: NAME, stage: "STAGE_6", track: t,
      issuedAt: ISSUED, certId: "A1B2C3D4E5F6",
    }));
    write(`track-${t}-reference`, await generateReferenceLetter({
      fullName: NAME, stage: "STAGE_6", track: t,
      issuedAt: ISSUED, letterId: "REF-A1B2C3D4", completed: false,
      completedWork: COMPLETED_WORK, applicantPool: POOL, cohortAtStage: AT_STAGE,
    }));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
