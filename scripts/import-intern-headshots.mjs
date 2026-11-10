#!/usr/bin/env node
/**
 * Builds src/content/interns.json and public/images/interns/* from the
 * "UBI internship" headshot form export.
 *
 *   node scripts/import-intern-headshots.mjs <form.csv> [photos-folder]
 *
 * Photos are taken, in order of preference, from:
 *   1. Google Drive, by the file id in the CSV (only works once the uploads
 *      folder is shared as "Anyone with the link").
 *   2. A local folder (e.g. the unzipped Drive download). Files are matched
 *      to people when the filename contains at least two of their names.
 *
 * Re-running is safe: existing photos are kept unless a new one is found, and
 * people added by hand stay in the list.
 *
 * To add or replace one person's photo (they are added if not listed yet):
 *
 *   node scripts/import-intern-headshots.mjs --photo "<Full Name>" <image>
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const single = args[0] === "--photo";
const [csvPath, folder] = single ? [] : args;
if (single ? args.length !== 3 : !csvPath) {
  console.error("usage: node scripts/import-intern-headshots.mjs <form.csv> [photos-folder]");
  console.error('       node scripts/import-intern-headshots.mjs --photo "<Full Name>" <image>');
  process.exit(1);
}

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT_DIR = path.join(ROOT, "public/images/interns");
const OUT_JSON = path.join(ROOT, "src/content/interns.json");
// Photos where the smart crop misses the face: a fixed vertical position
// (y: 0 = top of the photo, 1 = bottom), optionally zoomed in for full-length shots.
const CROP = {
  "richard-uwumwonse": { y: 0.12 },
  "alex-mulinge": { y: 0.12 },
  "tamera-obiageri-okafor": { y: 0.4 },
  "sanni-oluwanifemi": { y: 0.36, zoom: 1.6 },
};
const IMAGE_EXT = /\.(jpe?g|png|webp|heic|heif|avif|gif|tiff?)$/i;

function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}

// "ADEBAYO AISHAT" / "kyrian" -> "Adebayo Aishat" / "Kyrian"; mixed case is left alone.
const tidyWord = (w) =>
  w === w.toUpperCase() || w === w.toLowerCase() ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w;
const tidyName = (n) => n.trim().split(/\s+/).map(tidyWord).join(" ");
const tokens = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z\s]/g, " ").split(/\s+/).filter((t) => t.length > 1);
const slugify = (s) => tokens(s).join("-");

// Square 640px JPEG. Smart crop suits most photos; CROP pins the rest.
async function saveSquare(buf, slug) {
  const img = sharp(await sharp(buf).rotate().toBuffer());
  const { width: w, height: h } = await img.metadata();
  const fix = CROP[slug];
  const side = Math.round(Math.min(w, h) / (fix?.zoom ?? 1));
  const square = fix
    ? img.extract({ left: Math.round((w - side) / 2), top: Math.round((h - side) * fix.y), width: side, height: side }).resize(640, 640)
    : img.resize(640, 640, { fit: "cover", position: sharp.strategy.attention });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await square.jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(OUT_DIR, `${slug}.jpg`));
  return `/images/interns/${slug}.jpg`;
}

const previous = fs.existsSync(OUT_JSON) ? JSON.parse(fs.readFileSync(OUT_JSON, "utf8")) : [];

if (single) {
  const name = tidyName(args[1]);
  const slug = slugify(name);
  const photo = await saveSquare(fs.readFileSync(args[2]), slug);
  const entry = previous.find((x) => x.slug === slug);
  if (entry) entry.photo = photo;
  else previous.push({ name, slug, photo, manual: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(previous, null, 2) + "\n");
  console.log(`${entry ? "Updated" : "Added"} ${name} -> ${photo}`);
  process.exit(0);
}

// One person per entry. Repeat submissions ("Salman Butt" after "Salman Khalil
// Butt") merge when one name's words are all inside the other's.
const [, ...rows] = parseCsv(fs.readFileSync(csvPath, "utf8"));
const people = [];
for (const [, rawName, link] of rows) {
  const name = tidyName(rawName ?? "");
  if (!name) continue;
  const id = /[?&]id=([\w-]+)/.exec(link ?? "")?.[1];
  const t = new Set(tokens(name));
  const same = people.find((p) => {
    const pt = new Set(tokens(p.name));
    const [a, b] = t.size <= pt.size ? [t, pt] : [pt, t];
    return a.size >= 2 && [...a].every((x) => b.has(x));
  });
  if (same) {
    if (name.length > same.name.length) same.name = name;
    if (id) same.ids.unshift(id); // latest upload first
  } else {
    people.push({ name, ids: id ? [id] : [] });
  }
}

const localFiles = folder
  ? fs.readdirSync(folder, { recursive: true }).map(String).filter((f) => IMAGE_EXT.test(f))
  : [];

async function fromDrive(id) {
  const res = await fetch(`https://drive.google.com/uc?export=download&id=${id}`);
  if (!res.ok || (res.headers.get("content-type") ?? "").startsWith("text/html")) return null;
  return Buffer.from(await res.arrayBuffer());
}

function fromFolder(name) {
  const want = tokens(name);
  let best = null, bestScore = 1;
  for (const f of localFiles) {
    const have = new Set(tokens(path.basename(f).replace(IMAGE_EXT, "")));
    const score = want.filter((t) => have.has(t)).length;
    if (score > bestScore) { best = f; bestScore = score; }
  }
  return best ? fs.readFileSync(path.join(folder, best)) : null;
}

const out = [];
const missing = [];
for (const p of people) {
  const slug = slugify(p.name);
  let buf = null;
  for (const id of p.ids) if (!buf) buf = await fromDrive(id).catch(() => null);
  if (!buf && folder) buf = fromFolder(p.name);

  let photo = previous.find((x) => x.slug === slug)?.photo ?? null;
  if (buf) {
    try {
      photo = await saveSquare(buf, slug);
    } catch (e) {
      console.warn(`  could not read image for ${p.name}: ${e.message}`);
    }
  }
  if (!photo) missing.push(p.name);
  out.push({ name: p.name, slug, photo });
}

// Keep people who were added by hand rather than through the form.
out.push(...previous.filter((x) => x.manual && !out.some((o) => o.slug === x.slug)));

fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 2) + "\n");
console.log(`${out.length} interns, ${out.length - missing.length} with photos -> ${path.relative(ROOT, OUT_JSON)}`);
if (missing.length) console.log(`No photo yet (${missing.length}): ${missing.join(", ")}`);
