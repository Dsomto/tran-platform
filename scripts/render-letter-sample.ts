import { writeFileSync } from "node:fs";
import { generatePassLetter } from "../src/lib/generate-pass-letter";

async function main() {
  const pdf = await generatePassLetter({
    fullName: "Adaeze Elizabeth Adeteye",
    stageLabel: "Stage 1 — Applied Cryptography",
    score: 88,
    passingScore: 70,
    issuedAt: new Date("2026-06-14"),
    letterId: "L1B2C3D4E5F6",
    nextStageLabel: "Stage 2 — Web Application Security",
  });
  writeFileSync("/tmp/letter-sample.pdf", pdf);
  console.log("wrote /tmp/letter-sample.pdf", pdf.length, "bytes");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
