import { writeFileSync } from "node:fs";
import { generateStageCertificate } from "../src/lib/generate-certificate";

async function main() {
  const pdf = await generateStageCertificate({
    fullName: "Adaeze Elizabeth Adeteye",
    stageLabel: "Stage 1 — Applied Cryptography",
    score: 88,
    passingScore: 70,
    issuedAt: new Date("2026-06-14"),
    certId: "A1B2C3D4E5F6",
    stageKey: "STAGE_1",
  });
  writeFileSync("/tmp/cert-sample.pdf", pdf);
  console.log("wrote /tmp/cert-sample.pdf", pdf.length, "bytes");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
