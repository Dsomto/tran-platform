# Applicant Sieving & Grading Plan

**Goal:** reduce ~5,000–6,000 applications down to **500 accepted interns**.
Those 500 are the cohort that enters **Stage 0** when the internship begins.
**Window:** applications opened ~15 May 2026, close ~22 May 2026 (5 days from now).

---

## Snapshot (as of 17 May 2026)

| Metric | Count |
|---|---|
| Total applications | 2,452 |
| Received in last 24h | 880 |
| Unreviewed (pending) | 2,450 |
| SOC Analysis / Ethical Hacking / GRC / Not sure | 985 / 901 / 288 / 278 |

Projection at current intake (~700–880/day): **~5,500 by close.**

---

## What this plan must do

Pick the **best 500** out of ~5,500, using **only the application data** —
there is no Stage 0 qualifier round to fall back on. Stage 0 is the first
chapter of the internship itself; the 500 we accept walk straight into it.

That makes the application rubric **the decisive cut** (an ~11:1 selection),
so it has to be rigorous, consistent, and finishable inside the window.

```
~5,500 applications
   │  Gate 0 — automated eligibility filter   (instant, rules-based)
   ▼
~3,800 eligible
   │  Gate 1 — application rubric score        (the decisive cut)
   ▼
500 accepted  +  ~100 waitlist
   ▼
Stage 0 — internship begins
```

A **waitlist of ~100** below the cut line is essential: some of the 500 will
never log in to start Stage 0. The waitlist backfills those no-shows so the
cohort still starts at full strength.

---

## Gate 0 — Automated eligibility filter

Runs continuously as applications arrive. Pure rules, no judgement. Removes
roughly 25–35% of the raw pool so reviewers never waste time on dead entries.

Reject / hold if **any** of:

- `whyPickYou` is empty, under ~15 words, or gibberish ("asdf", "good", "...").
- `experience`, `goals`, or `dedication` left blank.
- Duplicate human: same `fullName` + near-identical essay text on a second
  email (mass re-submission).
- `dedication` below the minimum weekly commitment (decide the floor — see
  Open Decisions).
- `ageRange` outside the programme's eligible range (decide — see Open Decisions).

Everything that survives Gate 0 is "eligible" and goes to Gate 1.

---

## Gate 1 — Application rubric (100 points) — the decisive cut

Score the free-text answers. **Beginners are welcome** — Stage 0 assumes zero
knowledge and teaches each command in the brief — so this rubric rewards
*learning behaviour and commitment*, not certificates. A motivated beginner who
shows self-study should outscore a credentialed applicant who wrote two lines.

| Criterion | Pts | What earns the points |
|---|---|---|
| **Commitment** (`dedication`) | 25 | Realistic, specific weekly hours; understands it is demanding |
| **"Why pick you"** (`whyPickYou`) | 30 | Genuine, specific, self-aware. Generic/AI-template answers capped at ~12 |
| **Learning evidence** (`experience`) | 20 | TryHackMe / HTB / labs / CTFs / coursework / self-study. Beginners score here for *direction*, not depth |
| **Goal clarity & fit** (`goals`) | 15 | Goals map to SOC / Ethical Hacking / GRC and to what the programme offers |
| **Communication** | 10 | Coherent, follows instructions, own words |

**Auto-caps (not auto-rejects):**
- Obvious AI-generated copy with no personalisation → essay criteria capped.
- Identical essay reused across two applications → both capped pending review.

### Scoring at scale — how to actually finish this in time

3,800 essays cannot be hand-read line-by-line in 5 days. Process:

1. **LLM-assisted first pass** scores every eligible applicant against this
   exact rubric and outputs a number per criterion plus a one-line rationale.
2. **Calibration:** humans fully re-score a random ~5% and compare — adjust the
   scoring prompt until human and machine agree closely.
3. **Borderline review (the part that matters):** humans hand-review the
   **band around the cut line** — roughly ranks **400–650**. This is where the
   500 line falls, so every applicant whose acceptance is genuinely in doubt
   gets a real human read. Clear accepts and clear rejects do not.

Because the rubric is now the final word, **tie-breakers** decide the cut line:

1. `whyPickYou` score (the headline differentiator question).
2. `dedication` / commitment score.
3. Learning-evidence score.
4. Earlier submission timestamp.

### The cut

- **Ranks 1–500** → accepted, enter Stage 0.
- **Ranks ~501–600** → waitlist, backfill no-shows.
- Remainder → declined.

---

## Track balance

Current interest is lopsided: SOC 985 / Ethical Hacking 901 / GRC 288. If pure
ranking decides, GRC could be squeezed to almost nothing. Choose one:

- **A — Pure merit:** one combined ranking, tracks land where they land.
- **B — Track quotas:** reserve a minimum per track (e.g. SOC 200 / EH 180 /
  GRC 120, "Not sure" re-assigned), rank within each.

Recommendation: **B** — a healthy GRC group is worth protecting, and the gap is
applicant interest, not applicant ability.

---

## 5-day timeline

| Day | Action |
|---|---|
| Now → close | Keep intake open. Run **Gate 0** automatically on every new row. Run **Gate 1** LLM scoring in **rolling daily batches** — never leave 5,000 to score in one night. |
| Close day (~22 May) | Final Gate 0 + Gate 1 pass on the last arrivals. Freeze the full ranked list. |
| Close +1 | Human calibration pass + borderline review of ranks ~400–650. |
| Close +2 | Lock the final 500 + 100 waitlist. Apply track quotas if Option B. |
| Close +3 | Set statuses (accepted / waitlist / declined). Begin sending acceptance emails in controlled batches. |
| Stage 0 opens | Monitor logins; promote waitlist entries to fill no-shows. |

Do not batch all email at once — the platform separates the *decision* from the
*notification* (`welcomeEmailSentAt` / `rejectionEmailSentAt`). Set statuses
first, then fan emails out in controlled batches.

---

## Tooling already in the platform — use it, don't rebuild it

- `admin/applicants` + `api/public-applications/bulk-stage` — review and bulk
  status changes.
- `admin/insights` / `admin/reports` — pool-level breakdowns.
- `admin/bulk-promote` — advance the accepted cohort in one action.
- Decision vs notification split — set statuses now, send email later.

No schema or database changes are needed for any of this.

---

## Open decisions (need your call)

1. **Minimum weekly commitment** floor for Gate 0 (reject under X hrs/week)?
2. **Eligible age range** — is any `ageRange` excluded?
3. **Track balance:** Option A (pure merit) or B (quotas)? If B, confirm the
   per-track numbers.
4. **"Not sure yet" (278 applicants):** auto-assign a track from their
   experience/goals text, or send a follow-up asking them to pick?
5. **Waitlist size** — is ~100 right, or do you want more/less buffer?

---

*This document is planning only. No applicant data and no database records were
modified in producing it — the counts above came from read-only queries.*
