/**
 * Renders the Cohort One finalist and Top 3 certificates to
 * output/certificates/cohort-one/. Reads the finalists from the database
 * (read-only); writes nothing back.
 *
 *   npx tsx --env-file=.env scripts/render-cohort-one-honours.mts
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { generateFinalistCertificate, type FinalistHonour } from "../src/lib/generate-finalist-certificate";
import { displayName } from "../src/lib/showcase-public";
import { isAdvancedTrack } from "../src/lib/advanced-stage";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "output/certificates/cohort-one");
const ISSUED = new Date("2026-11-14T12:00:00Z");

// Top 3 as confirmed by the programme (docs/records/cohort-one-top-3-confirmation.jpg),
// keyed by registered name, mapped to the name exactly as the programme wrote it.
const TOP3_NAMES: Record<string, string> = {
  "Egwu Victor Uche": "Victor Uche Egwu",
  "Balqees Hamzat": "Balqees Temitope Hamzat",
  "Etigbue Adaeze Claret": "Adaeze Claret Etigbue",
};

const prisma = new PrismaClient();
const logo = fs.readFileSync(path.join(ROOT, "public/brand/ubi-lockup.png"));
const logoRatio = 568 / 360;

const finalists = await prisma.intern.findMany({
  where: { finalist: true },
  select: { id: true, track: true, user: { select: { firstName: true, lastName: true } }, finalistProject: { select: { projectTitle: true } } },
});
await prisma.$disconnect();
if (finalists.length !== 10) throw new Error(`Expected 10 finalists, found ${finalists.length}`);

fs.mkdirSync(OUT, { recursive: true });
const certId = (internId: string, honour: FinalistHonour) =>
  `UBI-C1-${honour === "top3" ? "T3" : "F10"}-` + createHash("sha256").update(`${internId}:${honour}`).digest("hex").slice(0, 8).toUpperCase();

let top3Found = 0;
const rows: string[] = [];
for (const f of finalists) {
  if (!isAdvancedTrack(f.track) || !f.finalistProject) throw new Error(`Finalist ${f.id} missing track or project`);
  const registered = displayName(f.user.firstName, f.user.lastName);
  const top3Name = TOP3_NAMES[registered];
  const fullName = top3Name ?? registered;
  const honours: FinalistHonour[] = top3Name ? ["finalist", "top3"] : ["finalist"];
  if (top3Name) top3Found++;
  for (const honour of honours) {
    const id = certId(f.id, honour);
    const pdf = await generateFinalistCertificate({
      fullName, track: f.track, projectTitle: f.finalistProject.projectTitle, honour,
      issuedAt: ISSUED, certId: id, logo, logoRatio,
    });
    const file = `${honour === "top3" ? "TOP3" : "FINALIST"} - ${fullName}.pdf`;
    fs.writeFileSync(path.join(OUT, file), pdf);
    rows.push(`${honour === "top3" ? "Top 3   " : "Finalist"}  ${f.track.padEnd(15)}  ${fullName.padEnd(28)}  ${id}`);
  }
}
if (top3Found !== 3) throw new Error(`Expected to match 3 Top 3 names, matched ${top3Found}`);
rows.sort();
fs.writeFileSync(path.join(OUT, "register.txt"), rows.join("\n") + "\n");
console.log(rows.join("\n"));
console.log(`\n${rows.length} certificates -> ${path.relative(ROOT, OUT)}`);
