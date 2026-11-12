#!/usr/bin/env node
/**
 * Builds the site's logo files from the official logo (public/brand/ubi-logo-official.jpg,
 * on white). White is unmixed to transparency so edges stay smooth, then:
 *   ubi-mark.png / ubi-mark-dark.png       the UBI symbol (dark = navy turned light)
 *   ubi-lockup.png / ubi-lockup-dark.png   symbol + "Ubuntu Bridge Initiatives"
 *   favicon.png (public/ and src/app/), public/favicon-512.png, public/apple-touch-icon.png
 *
 *   node scripts/build-brand-assets.mjs
 */
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SRC = path.join(ROOT, "public/brand/ubi-logo-official.jpg");
const out = (p) => path.join(ROOT, p);
const LIGHT = [244, 246, 251]; // --foreground in dark mode

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;

// White → alpha: alpha grows with distance from white; the colour
// is then un-blended from white so anti-aliased edges don't keep a white halo.
function rgba(dark) {
  const px = Buffer.alloc(W * H * 4);
  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    // Solid brand colours (even the light sky blue) sit well past 150 from
    // white, so they stay fully opaque; only white and the anti-aliased
    // fringe between colour and white become transparent.
    let a = Math.min(1, (255 - Math.min(r, g, b)) / 150);
    if (a < 0.04) a = 0;
    const un = (c) => (a ? Math.max(0, Math.min(255, Math.round((c - 255 * (1 - a)) / a))) : 0);
    let rgb = [un(r), un(g), un(b)];
    // The navy (dark, blue-leaning, low red) reads as nothing on the dark site.
    if (dark && rgb[0] < 60 && rgb[1] < 90 && rgb[2] < 140) rgb = LIGHT;
    px[j] = rgb[0];
    px[j + 1] = rgb[1];
    px[j + 2] = rgb[2];
    px[j + 3] = Math.round(a * 255);
  }
  return sharp(px, { raw: { width: W, height: H, channels: 4 } });
}

// The symbol ends above the wordmark; the wordmark ends above the bottom margin.
const MARK = { left: 0, top: 0, width: W, height: Math.round(H * 0.6) };

async function save(img, region, file, height) {
  const buf = await img.clone().extract(region).png().toBuffer();
  await sharp(buf).trim({ threshold: 1 }).resize({ height }).png({ compressionLevel: 9 }).toFile(out(file));
}

for (const dark of [false, true]) {
  const img = rgba(dark);
  const sfx = dark ? "-dark" : "";
  await save(img, MARK, `public/brand/ubi-mark${sfx}.png`, 160);
  await save(img, { left: 0, top: 0, width: W, height: H }, `public/brand/ubi-lockup${sfx}.png`, 360);
}

// Icons: the symbol centred on a square.
const mark = await sharp(out("public/brand/ubi-mark.png")).toBuffer();
async function icon(file, size, bg) {
  const inner = Math.round(size * 0.8);
  const m = await sharp(mark).resize({ width: inner, height: inner, fit: "inside" }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: m, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toFile(out(file));
}
await icon("src/app/favicon.png", 64, { r: 0, g: 0, b: 0, alpha: 0 });
await icon("public/favicon.png", 64, { r: 0, g: 0, b: 0, alpha: 0 });
await icon("public/favicon-512.png", 512, { r: 0, g: 0, b: 0, alpha: 0 });
await icon("public/apple-touch-icon.png", 180, { r: 255, g: 255, b: 255, alpha: 1 });
console.log("brand assets written");
