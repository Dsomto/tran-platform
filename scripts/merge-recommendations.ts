import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";

// Merges the 20 agent score files into one ranked snapshot, validating that
// every application was scored. Any application an agent missed is written
// to /tmp/app-review/chunk-missing.json so a follow-up agent can score it.
//
// Reads:  /tmp/app-review/chunk-NN.json   (the dumped applications)
//         /tmp/app-review/scored-NN.json  (agent output: [{id,score,reasons}])
// Writes: src/data/recommended-snapshot.json   (ranked {id,score,reasons})
//         /tmp/app-review/chunk-missing.json   (only if any were missed)

const DIR = "/tmp/app-review";
const CHUNKS = 20;

type App = { id: string; [k: string]: unknown };
type Scored = { id: string; score: number; reasons: string };

function safeRead(path: string): unknown[] {
  if (!existsSync(path)) return [];
  try {
    const v = JSON.parse(readFileSync(path, "utf8"));
    return Array.isArray(v) ? v : [];
  } catch {
    console.log(`  ! could not parse ${path}`);
    return [];
  }
}

const expected = new Map<string, App>();
for (let i = 0; i < CHUNKS; i++) {
  for (const a of safeRead(`${DIR}/chunk-${String(i).padStart(2, "0")}.json`) as App[]) {
    if (a && typeof a.id === "string") expected.set(a.id, a);
  }
}

const scoredById = new Map<string, Scored>();
const scoredFiles = readdirSync(DIR)
  .filter((f) => f.startsWith("scored-") && f.endsWith(".json"))
  .sort();
for (const f of scoredFiles) {
  const file = `${DIR}/${f}`;
  let kept = 0;
  for (const row of safeRead(file) as Record<string, unknown>[]) {
    const id = row?.id;
    const score = Number(row?.score);
    if (typeof id !== "string" || !expected.has(id) || !Number.isFinite(score)) continue;
    scoredById.set(id, {
      id,
      score: Math.max(0, Math.min(100, Math.round(score))),
      reasons: typeof row?.reasons === "string" ? row.reasons : "",
    });
    kept++;
  }
  console.log(`  ${f} -> ${kept} valid`);
}

const missing = [...expected.keys()].filter((id) => !scoredById.has(id));
console.log(`\nExpected: ${expected.size}  Scored: ${scoredById.size}  Missing: ${missing.length}`);

if (missing.length > 0) {
  const missingApps = missing.map((id) => expected.get(id)!);
  writeFileSync(`${DIR}/chunk-missing.json`, JSON.stringify(missingApps, null, 1));
  console.log(`Wrote ${DIR}/chunk-missing.json (${missingApps.length} applications to re-score)`);
}

const ranked = [...scoredById.values()].sort((a, b) => b.score - a.score);
const outDir = "src/data";
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(
  `${outDir}/recommended-snapshot.json`,
  JSON.stringify(
    { generatedAt: new Date().toISOString(), count: ranked.length, ranked },
    null,
    1
  )
);
console.log(`Wrote ${outDir}/recommended-snapshot.json (${ranked.length} ranked)`);

const top = ranked.slice(0, 500);
console.log(
  `\nTop 500 score range: ${top[top.length - 1]?.score ?? "-"} – ${top[0]?.score ?? "-"}`
);
