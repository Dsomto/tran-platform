#!/usr/bin/env node
/**
 * Converts the publishable-testimonials export (markdown, consented entries
 * only) into src/content/testimonials.json for the public site.
 *
 *   node scripts/import-testimonials.mjs <ubi-publishable-testimonials.md>
 */
import fs from "node:fs";
import path from "node:path";

const src = process.argv[2];
if (!src) {
  console.error("usage: node scripts/import-testimonials.mjs <publishable.md>");
  process.exit(1);
}
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

const tidyWord = (w) =>
  w === w.toUpperCase() || w === w.toLowerCase() ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w;

// Consented but not used on the site: too short or generic to be a testimonial.
const EXCLUDE = new Set(["Oluwatosin Deborah Ajinomisan"]);

const out = [];
for (const block of fs.readFileSync(src, "utf8").split(/^## \d+\.\s*/m).slice(1)) {
  const [head, ...lines] = block.split("\n");
  const quote = lines
    .filter((l) => l.startsWith(">"))
    .map((l) => l.replace(/^>\s?/, "").trim())
    .join("\n")
    .split(/\n{2,}|\n(?=\S)/)
    .map((p) => p.trim().replace(/^["“]+|["”]+$/g, ""))
    .filter(Boolean);
  // "SOC ANALYST | NONE" -> "Soc Analyst"; quotes themselves are left exactly as written.
  const role = (lines.find((l) => l.trim() && !l.startsWith(">")) ?? "")
    .split("|")
    .map((part) => part.trim())
    .filter((part) => part && !/^(n\/?a|none|nil)$/i.test(part))
    // Shout-case phrases are softened, but acronyms (SOC, IT, ACOMIN) stay.
    .map((part) =>
      part === part.toUpperCase() && /\s/.test(part)
        ? part.split(/\s+/).map((w) => (w.length > 4 ? tidyWord(w) : w)).join(" ")
        : part
    )
    .join(" · ");
  const name = head.trim().split(/\s+/).map(tidyWord).join(" ");
  if (!quote.length || EXCLUDE.has(name)) continue;
  out.push({ name, role, quote });
}

const dest = path.join(ROOT, "src/content/testimonials.json");
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + "\n");
console.log(`${out.length} testimonials -> ${path.relative(ROOT, dest)}`);
