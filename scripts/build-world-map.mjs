#!/usr/bin/env node
/**
 * Converts the world-atlas countries TopoJSON into the outlines drawn by the
 * home-page reach globe (public/data/world-countries.json, fetched by the
 * browser).
 *
 *   curl -sLo countries.json https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json
 *   node scripts/build-world-map.mjs countries.json
 *
 * Output: { names: string[], shapes: number[][][] } where shapes[i] is a list
 * of rings for names[i], each ring a flat [lon, lat, lon, lat, ...] array.
 */
import fs from "node:fs";
import path from "node:path";

const topo = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const { scale, translate } = topo.transform;

// Decode delta-encoded, quantised arcs into [lon, lat] points.
const arcs = topo.arcs.map((arc) => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => {
    x += dx; y += dy;
    return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
  });
});
const ring = (ids) =>
  ids.flatMap((i, n) => {
    const a = i < 0 ? [...arcs[~i]].reverse() : arcs[i];
    return n ? a.slice(1) : a;
  });
const round = (v) => Math.round(v * 10) / 10;

const names = [];
const shapes = [];
for (const g of topo.objects.countries.geometries) {
  const polys = g.type === "Polygon" ? [g.arcs] : g.type === "MultiPolygon" ? g.arcs : [];
  if (!polys.length || g.properties.name === "Antarctica") continue;
  names.push(g.properties.name);
  shapes.push(polys.flatMap((p) => p.map((r) => ring(r).flatMap(([lon, lat]) => [round(lon), round(lat)]))));
}

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const dest = path.join(ROOT, "public/data/world-countries.json");
fs.writeFileSync(dest, JSON.stringify({ names, shapes }));
console.log(`${names.length} countries -> ${path.relative(ROOT, dest)} (${fs.statSync(dest).size} bytes)`);
