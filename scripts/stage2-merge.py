#!/usr/bin/env python3
# Read-only. Merges all Stage 2 grade sources into one view:
#   - marking-guides/stage2-grades-claude.jsonl        (reports 1-13, seeded + Akinkoye)
#   - marking-guides/stage2-results/*.json             (Claude 14-103, save-as-you-go)
#   - marking-guides/stage2-results-codex/*.json       (Codex 104-205)
# Dedupes by reportId, lines them up against stage2-all-batch.json, and writes:
#   - marking-guides/stage2-cannot-assess.csv          (for the user to mail)
#   - marking-guides/stage2-apply.json                 ([{reportId,score,feedback}] gradeable only)
# Prints coverage + score distribution. Writes nothing to the DB.
import json, glob, os, csv, statistics

ROOT = os.path.join(os.path.dirname(__file__), "..", "marking-guides")

def load_jsonl(p):
    out = []
    if os.path.exists(p):
        for line in open(p):
            line = line.strip()
            if line:
                try: out.append(json.loads(line))
                except: pass
    return out

def load_dir(d):
    out = []
    for f in glob.glob(os.path.join(d, "*.json")):
        try: out.append(json.load(open(f)))
        except: pass
    return out

by_id = {}
for r in load_jsonl(os.path.join(ROOT, "stage2-grades-claude.jsonl")):
    by_id[r["reportId"]] = r
for r in load_dir(os.path.join(ROOT, "stage2-results")):
    by_id[r["reportId"]] = r
for r in load_dir(os.path.join(ROOT, "stage2-results-codex")):
    by_id[r["reportId"]] = r
for r in load_jsonl(os.path.join(ROOT, "stage2-grades-codex.jsonl")):
    by_id[r["reportId"]] = r
for r in load_jsonl(os.path.join(ROOT, "stage2-grades-partial.jsonl")):
    by_id[r["reportId"]] = r

batch = json.load(open(os.path.join(ROOT, "stage2-all-batch.json")))
total = len(batch)
graded_ids = set(by_id.keys())
missing = [b for b in batch if b["reportId"] not in graded_ids]

rows = list(by_id.values())
cannot = [r for r in rows if r.get("cannotAssess")]
gradeable = [r for r in rows if not r.get("cannotAssess")]
fab = [r for r in rows if r.get("fabricationPenalty")]
scores = sorted(r.get("reportScore", 0) for r in gradeable)

print(f"Batch total: {total}")
print(f"Have results for: {len(rows)}   Missing (not yet graded): {len(missing)}")
print(f"Gradeable: {len(gradeable)}   Cannot-assess: {len(cannot)}   Fab penalties: {len(fab)}")
if scores:
    print(f"Scores: avg={statistics.mean(scores):.1f}  median={statistics.median(scores)}  min={min(scores)}  max={max(scores)}")
    bands = {"80+":0,"70-79":0,"60-69":0,"50-59":0,"40-49":0,"<40":0}
    for s in scores:
        if s>=80: bands["80+"]+=1
        elif s>=70: bands["70-79"]+=1
        elif s>=60: bands["60-69"]+=1
        elif s>=50: bands["50-59"]+=1
        elif s>=40: bands["40-49"]+=1
        else: bands["<40"]+=1
    print("Bands:", bands)

# Cannot-assess CSV
email_by_id = {b["reportId"]: (b.get("email",""), b.get("name","")) for b in batch}
with open(os.path.join(ROOT, "stage2-cannot-assess.csv"), "w", newline="") as f:
    w = csv.writer(f); w.writerow(["name","email","reportId","reason"])
    for r in cannot:
        em, nm = email_by_id.get(r["reportId"], ("", r.get("name","")))
        w.writerow([nm or r.get("name",""), em, r["reportId"], (r.get("missingPieces") or r.get("flagReason") or "")[:300]])
print(f"\nWrote stage2-cannot-assess.csv ({len(cannot)} rows)")

# Apply JSON (gradeable only)
apply = [{"reportId": r["reportId"], "score": r.get("reportScore",0), "feedback": r.get("feedback","")} for r in gradeable]
json.dump(apply, open(os.path.join(ROOT, "stage2-apply.json"), "w"), ensure_ascii=False, indent=1)
print(f"Wrote stage2-apply.json ({len(apply)} gradeable grades, ready to apply after QA)")

if missing:
    print(f"\nStill missing {len(missing)} (first few): " + ", ".join(b['name'] for b in missing[:8]))
