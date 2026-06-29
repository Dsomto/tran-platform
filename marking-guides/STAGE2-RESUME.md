# Stage 2 grading — SESSION HANDOFF / RESUME HERE

STATUS: COMPLETE AND APPLIED. All 205 graded; 192 applied to the live DB as GRADED via grader6 (`scripts/apply-stage2-grades.ts`, COMMIT=1). Live DB now STAGE_2 GRADED 201, SUBMITTED 10. The 10 SUBMITTED are the held cannot-assess reports awaiting manual review / re-share emails (`stage2-cannot-assess.csv`). Akinkoye corrected 82 -> 68 (raw was left unconverted). Open items: mail the cannot-assess interns; reconcile the D1-only rule (Treasure Ikpea scored 25 vs Ibrahim Sulaiman held cannot-assess).

## Where things stand (205 / 205 graded — COMPLETE)

Run `python3 scripts/stage2-merge.py` for live numbers. FINAL: 205 graded, 0 missing, 194 gradeable, 11 cannot-assess, 48 fab penalties, avg 71.2, median 74. Remaining work is QA + the gated DB apply.

- **Total Stage 2 ungraded capstones: 205.** Ordered list: `marking-guides/stage2-all-batch.json` (index 0 = report 1).
- **Split:** Claude grades reports 1 to 103, Codex grades 104 to 205.
- **Reports 1 to 13 (Claude):** done, in `marking-guides/stage2-grades-claude.jsonl` (one JSON line each).
- **Reports 14 to 103 (Claude):** save-as-you-go workflow writes one result file per report to `marking-guides/stage2-results/<reportId>.json`. **32 of 103 of my half are done** (13 seeded + 19 from the run). The run stopped at the session limit, so ~71 remain. Resumable: each grader skips a report whose result file already exists.
- **Reports 104 to 205 (Codex):** Codex writes to `marking-guides/stage2-grades-codex.jsonl` (one line per report). **100 of 102 done.** 2 remain.
- **THE BLOCKER:** account session limit, resets **2pm Africa/Lagos**. Relaunch the grader after that. No work was lost; everything finished is on disk.
- **Cannot-assess: 8** (in `stage2-cannot-assess.csv`). Includes Esther Okon-Paul (D4 would not open) and Faridi hant iddy (OneDrive link). Held out, NOT scored, need the intern to re-share or be mailed.

## Rubric / answer key

`marking-guides/stage2-grading-coordination.md` (full answer key, scoring rows, fabrication rule, humane-but-honest rule) and `marking-guides/stage2.md` (the official guide). Capstone = D1 30 + D2 35 + D3 40 + D4 15 = 120; recorded mark `reportScore = round(rawPoints/120*100)` minus a flat 5 fabrication penalty. Decoy is the safe `hash_equals` branch; `alg:none` is a REAL finding, not the decoy.

## How to RESUME Claude's half (14-103)

The grader workflow script is at:
`/Users/dsomto891/.claude/projects/-Users-dsomto891-hng-netforge/48f3b5c9-55e3-4eab-9d82-9d458fc8cdb8/workflows/scripts/stage2-grade-missing-wf_eb249b01-d7d.js`

Re-invoke it with the Workflow tool (`scriptPath` = that path). Every report that already has a result file in `marking-guides/stage2-results/` is skipped (STEP 0 resume check in the agent prompt), so it only grades the remainder. It reads `/tmp/s2-missing.json` (the not-yet-graded reports of my half). If that file is gone, regenerate it: `python3 -c "import json,glob;b=json.load(open('marking-guides/stage2-all-batch.json'));d=set();[d.add(json.loads(l)['reportId']) for l in open('marking-guides/stage2-grades-claude.jsonl') if l.strip()];[d.add(json.load(open(f))['reportId']) for f in glob.glob('marking-guides/stage2-results/*.json')];import json as J;J.dump([x for x in b[:103] if x['reportId'] not in d],open('/tmp/s2-missing.json','w'))"`.

Reading method per report: Google folder -> embeddedfolderview for file ids -> PDFs via `curl -sL "https://drive.usercontent.google.com/download?id=<ID>&export=download"` then Read the PDF; .docx / native Doc via `/mobilebasic`; OneDrive -> cannotAssess.

## When BOTH halves are done

1. `python3 scripts/stage2-merge.py` — merges `stage2-grades-claude.jsonl` + `stage2-results/*.json` + `stage2-results-codex/*.json` + `stage2-grades-codex.jsonl`, dedupes by reportId, prints coverage + score distribution, and writes:
   - `marking-guides/stage2-cannot-assess.csv` (name, email, reportId, reason — the list to mail)
   - `marking-guides/stage2-apply.json` (`[{reportId, score, feedback}]`, gradeable only)
2. Review / QA the spread. Re-grade any report still missing (relaunch the workflow; Codex re-runs its missing ones).
3. APPLY (DB write, gated, needs the user's go-ahead): write `StageReport.score = reportScore`, `feedback`, `status = "GRADED"` for each STAGE_2 report in `stage2-apply.json`, as Grader Six. Cannot-assess reports are held out and the interns mailed to re-share. NOTE the hard rule: the netforge DB is live and read-only by default; applying grades is the one gated write and must be explicitly authorised, same as Stage 1.

## Watch progress any time

`ls marking-guides/stage2-results/ | wc -l` (mine, of 90) and `ls marking-guides/stage2-results-codex/ | wc -l` (Codex, of 102).
