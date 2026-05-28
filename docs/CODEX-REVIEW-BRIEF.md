# Codex review brief — issues observed during the assignment upgrade

Run: 2026-05-28. Author context: Claude. Each item names the files to look at, what I saw, what I'm uncertain about, and what a code reviewer should verify.

I made **no `src/` code changes** in this session — JSON-only. So none of these bugs are *caused by* my edits. Some are pre-existing weaknesses I noticed while writing 44 task files; some are risks I introduced into JSON content that depend on widget behaviour I never read.

Grouped by severity.

---

## 🔴 HIGH — could break the live cohort if not verified

### 1. `{FLAG}` substitution in `LOG_VIEWER` — does my new Stage 3 task 4 actually work?

**Files to look at:**
- [prisma/seed-rooms-scenarios/stage-3/task-4.json](prisma/seed-rooms-scenarios/stage-3/task-4.json) (my new lab)
- [prisma/seed-rooms-scenarios/stage-1/task-2.json](prisma/seed-rooms-scenarios/stage-1/task-2.json) (pre-existing, uses `{FLAG}` inline)
- [prisma/seed-rooms-scenarios/stage-2/task-2.json](prisma/seed-rooms-scenarios/stage-2/task-2.json) (pre-existing, `marker={FLAG}`)
- The LOG_VIEWER React component (location unknown — `src/components/.../log-viewer*` likely)
- The FLAG answer-check endpoint — `src/app/api/stage/[slug]/tasks/[taskId]/answer/route.ts`

**What I observed:** Two pre-existing tasks (stage-1 task-2, stage-2 task-2) plant the literal string `{FLAG}` inside a `LOG_VIEWER` tab's content. My new stage-3 task-4 follows the same pattern. The expectation is that the widget substitutes `{FLAG}` with the per-intern HMAC-derived value at render time, and the answer-check compares against the same HMAC.

**What I'm uncertain about:** I never read the widget code. If `LOG_VIEWER` does NOT substitute `{FLAG}`, then my stage-3 task-4 will display the literal characters `{FLAG}` to interns, and no submission will ever match. The two pre-existing tasks would have the same bug — but they're in production, so presumably someone tested them.

**Codex should verify:** open the LOG_VIEWER component, confirm it substitutes `{FLAG}` with `computeFlagBrowser(salt, internId)` at render time, and confirm the answer-check on the server compares HMAC. Specifically test stage-3 task-4 against a seeded intern after `npm run db:seed`.

---

### 2. Inconsistent flag substitution — `{flag}` vs `{FLAG}` vs `flagSubstitution` config

**Files to look at:**
- [prisma/seed-rooms-scenarios/stage-2/task-4.json](prisma/seed-rooms-scenarios/stage-2/task-4.json) — `VULN_APP_SIM` uses lowercase `Flag: {flag}` in response template
- [prisma/seed-rooms-scenarios/stage-2/task-5.json](prisma/seed-rooms-scenarios/stage-2/task-5.json) — same lowercase pattern
- [prisma/seed-rooms-scenarios/stage-2/task-6.json](prisma/seed-rooms-scenarios/stage-2/task-6.json) — same
- [prisma/seed-rooms-scenarios/stage-0/task-4.json](prisma/seed-rooms-scenarios/stage-0/task-4.json) — has explicit `widgetConfig.flagSubstitution: { placeholder: "{FLAG}", source: "flag" }`
- [prisma/seed-rooms-scenarios/stage-1/task-5.json](prisma/seed-rooms-scenarios/stage-1/task-5.json) — `STEGO_VIEWER` uses `stegoMessage: "{FLAG}"` with NO explicit substitution config

**What I observed:** Three different patterns for inserting the per-intern flag into widget content. Some widgets have explicit `flagSubstitution` config; others rely on implicit substitution; one uses lowercase `{flag}` instead of uppercase.

**What I'm uncertain about:** Is the substitution case-sensitive? Is `flagSubstitution` config required, or just decorative? If implicit, what's the matched pattern (regex)?

**Codex should verify:** find every widget renderer that performs flag substitution, document the case-sensitivity and config requirements, and either normalise the JSON or fix the widget to accept both.

---

### 3. Hardcoded `TRAN{...}` answer in stage-0 task-6 and task-7 — flagSalt may be dead code

**Files to look at:**
- [prisma/seed-rooms-scenarios/stage-0/task-6.json](prisma/seed-rooms-scenarios/stage-0/task-6.json) — log line contains `session=TRAN{spot-the-bruteforce}`; `flagSalt: "stage-0-task-6-salt"`
- [prisma/seed-rooms-scenarios/stage-0/task-7.json](prisma/seed-rooms-scenarios/stage-0/task-7.json) — log line contains `session=TRAN{g1rl0t-was-here}`; `flagSalt: "stage-0-task-7-salt"`
- The FLAG answer-check endpoint

**What I observed:** The task description in both files says "Submit it exactly as written." The log content has a literal hardcoded TRAN token (same string for every intern). The task is `kind: FLAG` with a `flagSalt`. If the answer-check expects HMAC-derived flag, every intern's submission of the hardcoded token would fail. If the check accepts the literal string, the salt is decorative.

**What I'm uncertain about:** which is it? I preserved the existing behaviour rather than risk changing answer semantics on a live cohort.

**Codex should verify:** trace the FLAG answer-check logic — does it accept a literal match against widget content, or strictly HMAC-derive against (salt, internId)? If the latter, these two tasks have been broken in production.

---

### 4. `seed-rooms.ts` blind-overwrite of Assignment rows with submissions

**Files to look at:**
- [prisma/seed-rooms.ts:200-225](prisma/seed-rooms.ts#L200-L225)

**What I observed:** The seed loader does `prisma.assignment.update({ where: { id: existing.id }, data: payload })` unconditionally — it does not check `Assignment._count.submissions`. Running `npm run db:seed` after a JSON change silently overwrites the task description (and `maxPoints`, `widget`, `kind`, etc.) under existing intern submissions.

**What I'm uncertain about:** is there any operational safeguard preventing accidental `db:seed` against prod? I assume `DATABASE_URL` is the only gate.

**Codex should verify:** add a safety check to `seed-rooms.ts` that refuses to update an Assignment with submissions unless an explicit `FORCE_RESEED=1` env var is set. I wrote a safer migrator at `scripts/migrate-stage-content.ts` that does this, but `seed-rooms.ts` is the one that runs on `npm run db:seed` and is the actual operational risk.

---

## 🟡 MEDIUM — design weaknesses, not immediate breakage

### 5. `Room.totalPoints` may drift from sum of `Assignment.maxPoints` over time

**Files to look at:**
- [prisma/schema.prisma:312-313](prisma/schema.prisma#L312-L313) — `totalPoints Int @default(100)` and `passThreshold Int @default(70) // % required to advance`
- `src/app/admin/assignments/[id]/...` — admin UI for editing individual assignments
- `prisma/seed-rooms.ts:163-164` — recomputes `totalPoints` from task sum at seed time

**What I observed:** `Room.totalPoints` is recomputed at seed time from the sum of `Assignment.maxPoints`. But if admins edit an individual assignment's `maxPoints` later via the admin UI, `Room.totalPoints` is not re-derived. `passThreshold` is a percentage of `totalPoints`. So a stale `totalPoints` moves the pass/fail boundary silently.

**What I'm uncertain about:** does the admin UI re-derive `Room.totalPoints` on assignment-edit?

**Codex should verify:** find the assignment-edit endpoint, confirm whether `Room.totalPoints` is recomputed. If not, add a trigger.

---

### 6. flagSalt is shipped to the browser (known weakness, came up earlier in our session)

**Files to look at:**
- `src/lib/flag.ts` or similar (`computeFlagBrowser` function)
- Every widget component that renders `{FLAG}` substitution

**What I observed:** Widget components that perform `{FLAG}` substitution at the client need to compute the HMAC client-side, which means they receive the flag salt. With the salt + their own intern ID, the intern can compute their flag without solving the puzzle.

**What I'm uncertain about:** I don't know which widgets do client-side substitution vs server-side. Some (like CIPHER_TOOLS base64 decode) are inherently client-only.

**Codex should verify:** audit every widget. For widgets that can do substitution server-side (LOG_VIEWER, STEGO_VIEWER), move it server-side. For widgets that must be client-only (CIPHER_TOOLS), accept the leak as-is or redesign with server-rendered HTML.

This is a redesign, not a one-line fix — flagged for a future cohort, not for this one.

---

### 7. `MCQ_QUIZ` widgetConfig duplicates `choices` and `correctIndex`

**Files to look at:**
- [prisma/seed-rooms-scenarios/stage-0/task-8.json](prisma/seed-rooms-scenarios/stage-0/task-8.json) (BEFORE my conversion — see git history)
- [prisma/seed-rooms-scenarios/stage-1/task-4.json](prisma/seed-rooms-scenarios/stage-1/task-4.json), task-6.json, task-7.json, task-9.json (still MCQ)
- [prisma/seed-rooms-scenarios/stage-2/task-7.json](prisma/seed-rooms-scenarios/stage-2/task-7.json), task-8.json
- [prisma/schema.prisma:276-277](prisma/schema.prisma#L276-L277)

**What I observed:** MCQ tasks have `widgetConfig.choices` AND top-level `choices` (duplicated arrays), AND top-level `correctIndex`. The schema has top-level `choices Json?` and `correctIndex Int?`. The MCQ_QUIZ widget probably reads one or the other.

**What I'm uncertain about:** which is authoritative? If both are read and they drift, what happens?

**Codex should verify:** which array the widget reads, which the grader reads, and either deduplicate the JSON or normalise the seed-rooms.ts loader.

---

### 8. `Assignment.dueDate` indexed but never set

**Files to look at:**
- [prisma/schema.prisma:293](prisma/schema.prisma#L293) — `@@index([dueDate])`
- `prisma/seed-rooms.ts:218` — sets `dueDate: null` on every assignment

**What I observed:** Every seeded assignment gets `dueDate: null`. The index exists. Nothing else I can see sets it.

**What I'm uncertain about:** is dueDate set elsewhere (admin UI? a cron? StageWindow rollover)?

**Codex should verify:** grep for any code that writes to `Assignment.dueDate`. If nothing does, drop the index. If admin UI was supposed to set it but doesn't, surface as a bug.

---

### 9. `Assignment.isClosed` vs `StageWindow.isClosed` — does stage closure cascade?

**Files to look at:**
- [prisma/schema.prisma](prisma/schema.prisma) — Assignment model has `isClosed Boolean @default(false)`
- StageWindow model
- The intern-facing routes that gate visibility — `src/app/api/stage/[slug]/rooms/route.ts`, `src/lib/stage-board.ts`, `src/app/api/stage/[slug]/tasks/[taskId]/answer/route.ts` (the user fixed `isClosed` filtering across these earlier in our session — see `docs/BUG-AUDIT.md`)

**What I observed:** Closing a stage (via StageWindow.status = CLOSED) might or might not flip `Assignment.isClosed` on every assignment inside that stage. The earlier `isClosed` lockdown work assumed per-assignment gating.

**What I'm uncertain about:** when a stage closes, do individual assignment rows also flip? Or does the closure check need to be a join on `StageWindow.status`?

**Codex should verify:** trace the stage-close flow. If individual assignments are not flipped, the `isClosed: false` filter in the intern routes misses stage-level closure.

---

## 🟢 LOW — code smells, dead enum values, doc inconsistencies

### 10. `TaskWidget` enum has `PORT_SCANNER` and `DIAGRAM_UPLOAD` — are they implemented?

**Files to look at:**
- [prisma/schema.prisma](prisma/schema.prisma) — `enum TaskWidget`
- `src/components/widgets/` (or wherever widgets live)

**What I observed:** Enum has 11 widgets. The user's brief listed 10. Specifically `PORT_SCANNER` was missing from the brief.

**What I'm uncertain about:** is `PORT_SCANNER` a planned widget without a renderer? Or a real widget the user just forgot to list?

**Codex should verify:** count actual widget React components. Drop unused enum values; or implement the missing widgets.

---

### 11. Google-link tasks have `minWords: 50` — schema doesn't validate it's a URL

**Files to look at:**
- [prisma/seed-rooms-scenarios/stage-2/task-9.json](prisma/seed-rooms-scenarios/stage-2/task-9.json)
- [prisma/seed-rooms-scenarios/stage-3/task-6.json](prisma/seed-rooms-scenarios/stage-3/task-6.json), task-7.json
- [prisma/seed-rooms-scenarios/stage-4/task-1.json](prisma/seed-rooms-scenarios/stage-4/task-1.json) through task-5.json
- The Submission.content write path

**What I observed:** My new Google-link tasks have `minWords: 50-100` on the in-platform pad (intern pastes URL + abstract). Schema enforces minWords as text length only — an intern could submit 50 words of nonsense and pass the gate. Grading falls entirely on the human.

**What I'm uncertain about:** is this an acceptable trade-off (graders read the abstracts anyway)? Or should there be a URL-pattern check before submission?

**Codex should verify:** decide. If we want URL validation, add a regex check on Submission.content for tasks where `widget == WRITEUP_PAD && minWords < 150` (heuristic: short-pad = link task). Or add a `requiresLink: boolean` field.

---

### 12. Stage 0 seeds with `kind: WRITEUP` default but `widget: NONE`

**Files to look at:**
- [prisma/schema.prisma:272-273](prisma/schema.prisma#L272-L273) — `kind TaskKind @default(WRITEUP)`, `widget TaskWidget @default(NONE)`

**What I observed:** Schema defaults to `WRITEUP` kind + `NONE` widget. If anyone creates an Assignment without explicit values (e.g. admin UI creates a blank task), the intern sees no widget and a generic writeup pad. Probably fine but worth noting — combined with `dueDate: null` default, a quick-create flow could ship a half-configured task.

**What I'm uncertain about:** is admin task-create even a feature? Or is the seed the only path to creating assignments?

**Codex should verify:** if admin UI can create tasks, ensure all required fields are validated before insert.

---

### 13. `Submission.score Int?` — graders can grade above maxPoints with no clamp

**Files to look at:**
- [prisma/schema.prisma:328-348](prisma/schema.prisma#L328-L348)
- The grader-submit endpoint

**What I observed:** `Submission.score Int?` has no upper-bound. A grader could put `score: 999` on a task with `maxPoints: 25`. The intern's total would inflate.

**What I'm uncertain about:** does the grader UI clamp? Does the PointLog write clamp?

**Codex should verify:** add server-side validation: `score <= maxPoints AND score >= 0`.

---

### 14. `Assignment` schema has `passingScore Int?` per task — set anywhere?

**Files to look at:**
- [prisma/schema.prisma:282](prisma/schema.prisma#L282) — `passingScore Int? // set after submissions close; null = not published yet`

**What I observed:** schema comment suggests this is set after submissions close. I see no place in the seed where it's set. Worth checking if it's used in grading logic.

**What I'm uncertain about:** is this a per-task pass bar separate from Room.passThreshold?

**Codex should verify:** find where Assignment.passingScore is read. If never read, drop it. If read, ensure it's populated by the grading flow.

---

## Process / operational notes (not bugs, but worth Codex knowing)

- **Migrator script** at `scripts/migrate-stage-content.ts` — dry-run default, refuses to overwrite tasks with submissions unless `FORCE=1`. Safer than `seed-rooms.ts` blind upsert. Codex could pattern future migrators on this.
- **44 JSON edits** are uncommitted on disk. Codex won't see them in git history yet. Read from `prisma/seed-rooms-scenarios/stage-*/*.json` directly.
- **Full decision log** at `docs/ASSIGNMENT-UPGRADE-DECISIONS.md`.
- **Prior bug audit** at `docs/BUG-AUDIT.md` may have overlapping items — diff before adding new ones.
- **DB rule:** netforge prod is live. Read-only queries only unless explicit human authorisation. Codex should not run `npm run db:seed` or any write script against any DATABASE_URL.
