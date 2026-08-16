import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { credentialFor, standingFor } from "../src/lib/advanced-credential.js";
import { generateAdvancedCertificate } from "../src/lib/generate-advanced-certificate.js";
import { generatePortfolioDossier, type DossierEntry } from "../src/lib/generate-portfolio-dossier.js";
import { generateReferenceLetter } from "../src/lib/generate-reference-letter.js";
import type { AdvancedTrack } from "../src/lib/advanced-stage.js";

const outputDir = path.join(process.cwd(), ".tmp", "stage7-document-qa");
const tracks: AdvancedTrack[] = ["SOC_ANALYSIS", "ETHICAL_HACKING", "GRC"];
const labels: Record<string, string> = {
  STAGE_0: "Stage 0 - Foundations",
  STAGE_1: "Stage 1 - Applied Cryptography",
  STAGE_2: "Stage 2 - Web Application Security",
  STAGE_3: "Stage 3 - Incident Response",
  STAGE_4: "Stage 4 - Governance & Risk",
  STAGE_5: "Advanced Stage 5 - Signal",
  STAGE_6: "Advanced Stage 6 - Exposure",
  STAGE_7: "Advanced Stage 7 - Architecture",
};
const completed: DossierEntry[] = Object.entries(labels).map(([stage, label]) => ({ stage, label }));

async function main(): Promise<void> {
  mkdirSync(outputDir, { recursive: true });
  for (const track of tracks) {
    const slug = track.toLowerCase().replaceAll("_", "-");
    const fullName = track === "ETHICAL_HACKING"
      ? "Nathalie Chinyere Oluwaseun Tchoumi-Mbiami"
      : "Francisca Umejesi Nkeiruka";
    const completedWork = completed.map((entry) => ({
      label: entry.label,
      project: entry.stage.startsWith("STAGE_") && Number(entry.stage.replace("STAGE_", "")) >= 5
        ? credentialFor(entry.stage as "STAGE_5" | "STAGE_6" | "STAGE_7", track).project
        : null,
    }));
    const certificate = await generateAdvancedCertificate({
      fullName,
      stage: "STAGE_7",
      track,
      issuedAt: new Date("2026-08-16T17:00:00+01:00"),
      certId: `STAGE7${slug.toUpperCase().replaceAll("-", "").slice(0, 6)}`,
    });
    const reference = await generateReferenceLetter({
      fullName,
      stage: "STAGE_7",
      track,
      issuedAt: new Date("2026-08-16T17:00:00+01:00"),
      letterId: `REF7${slug.toUpperCase().replaceAll("-", "").slice(0, 8)}`,
      completed: true,
      completedWork,
      applicantPool: 3_000,
      cohortAtStage: 99,
    });
    const dossier = await generatePortfolioDossier({
      fullName,
      internCode: "UBI-2026-0039",
      track,
      completed,
      earnedStanding: standingFor("STAGE_7", track),
      issuedAt: new Date("2026-08-16T17:00:00+01:00"),
      dossierId: `DOS7${slug.toUpperCase().replaceAll("-", "").slice(0, 8)}`,
      applicantPool: 3_000,
    });

    writeFileSync(path.join(outputDir, `${slug}-certificate.pdf`), certificate);
    writeFileSync(path.join(outputDir, `${slug}-reference.pdf`), reference);
    writeFileSync(path.join(outputDir, `${slug}-dossier.pdf`), dossier);
  }
  console.log(`Rendered nine Stage 7 document samples in ${outputDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
