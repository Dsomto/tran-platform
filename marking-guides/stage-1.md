# Stage 1 — Capstone Marking Guide

*Ubuntu Bridge Initiative · Cybersecurity Internship · Cohort 1*

*Confidential — for graders only. Do not share with interns.*

## Welcome — read this first

Thank you for grading Stage 1. This guide gives you the **answer to every task** and tells you exactly what to mark, in what order, and how. You do **not** need to be a cryptographer. If you can compare an intern's answer to the answer key in this document, count citations, and tell whether a paragraph is reasoning from evidence or padding, you can grade this stage well.

Stage 1 is **Applied Cryptography: Ciphers & Secrets**. It is harder than Stage 0 and it is built so that someone who only pasted an AI answer cannot pass — most of the marks are for *showing the work*, not for the final string.

If you are ever unsure whether an answer is correct, **flag it for super-admin review** rather than guess.

## The story Stage 1 is testing

The threat actor from Stage 0 — **The Griot** — breached **Sankofa Digital** (the 600-person Nigerian fintech). Before Sankofa quarantined the host, an analyst (**Tunde**) pulled a zip of files off The Griot's staging server. The intern's Stage 1 job is to work through that "staging drop": crack what The Griot left behind, identify the crypto mistakes that let Sankofa get breached, and brief the board.

The recurring lesson the whole stage teaches: **the algorithm is not the asset — the key is.** The Griot used modern crypto (AES-GCM) and still got owned because keys, tokens, and secrets were left lying in config files and logs.

The two named staff the intern writes for:
- **Amaka Eze** — Head of Security. Sets the writeup tasks, signs the board note.
- **Tunde Bakare** — Tier-1 analyst. Pulls the evidence, uses the writeups to train new hires.

## How Stage 1 is structured — 10 tasks, 140 points

Stage 1 has **ten** tasks. Six are graded **automatically by the platform**; four are **writeups you grade by hand**. Know the difference before you start — you only hand-grade four things.

| # | Task | Pts | Kind | Who grades it |
|---|---|---:|---|---|
| 1 | The Staging Drop | 10 | Flag | **Platform (auto)** |
| 2 | Needle in the Log | 12 | Flag | **Platform (auto)** |
| 3 | Three Strings | 12 | **Writeup** | **You** |
| 4 | Authenticated or Not | 10 | Multiple choice | **Platform (auto)** |
| 5 | Innocuous (stego) | 15 | Flag | **Platform (auto)** |
| 6 | Hashes in the Breach File | 18 | **Writeup** | **You** |
| 7 | The Accepted Token (JWT) | 18 | **Writeup** | **You** |
| 8 | Operational Mistake (AES-GCM) | 15 | Flag | **Platform (auto)** |
| 9 | Integrity Without a Key | 10 | Multiple choice | **Platform (auto)** |
| 10 | Brief the Board | 20 | **Writeup** | **You** |
| | **Auto-graded subtotal** | **72** | | platform |
| | **Hand-graded subtotal** | **68** | | you |
| | **Stage total** | **140** | | |

The advance/eliminate cutoff for the stage is set by programme staff in the promotion flow — **your job is an accurate score (as a percentage — read the next section, because the brief changed mid-stage), not to decide who passes.** Grade honestly and leave a one-line justification on every writeup; an intern may be eliminated on your number.

## Why some interns submitted 6 deliverables and others 4 — read this first

**The Stage 1 brief was revised partway through.** Earlier interns received a brief that asked for **6 deliverables**; later interns received the revised brief that asks for **4**. **Both are correct.** An intern who submitted 4 is **not** missing anything, and an intern who submitted 6 is **not** owed bonus marks. Do not reward or penalise anyone for the count — they followed the brief they were given.

Because the two briefs have different point totals, **you cannot compare raw scores across them.** Grade on a percentage:

> **Stage 1 score = (points the intern earned) ÷ (points possible on the brief they received) × 100.**

That puts a 4-deliverable and a 6-deliverable submission on the same 0–100 scale, and the cutoff (set by programme staff) is applied to that percentage. The six auto-graded tasks (1, 2, 4, 5, 8, 9 = 72 pts) are identical on both briefs; only the hand-graded writeup set differs.

How to apply it:

- **Grade only the deliverables the intern's own brief required.** 4-brief → grade those 4 writeups (tasks 3, 6, 7, 10). 6-brief → grade those 6. Use the same band scale (below) on every deliverable, whichever brief it came from.
- **Tell which brief from the count:** 4 deliverables = revised brief; 6 deliverables = original brief. If a submission is ambiguous, flag for super-admin rather than guess.
- **A deliverable their brief required but they didn't submit = 0 for that deliverable**, still inside *their* denominator. Do **not** shrink the denominator to "out of what they uploaded" — that would reward skipping.
- **Never count a 4-brief intern as missing 2.** They were never asked for them. Their denominator is the 4-brief total, full stop.

> **Graders note on the two briefs:** the revised (4-deliverable) brief's writeups and full answer keys are below (tasks 3, 6, 7, 10). The original (6-deliverable) brief contained those plus two additional written deliverables — score those two on the same 3-band scale and include them in that intern's denominator. *(If your batch contains 6-deliverable submissions and you want exact point tables for the two extra deliverables, ask the programme lead — the composition of the original brief is recorded with them.)*

## How to grade — step by step

**Total time per submission: 25–35 minutes.** Take a break between submissions; the third in a row gets harsher than the first.

1. **Confirm the platform auto-scores are in** for tasks 1, 2, 4, 5, 8, 9. You do not touch these — but read §"Answer key: auto-graded tasks" once so you understand what the intern did, because the writeups refer back to it.
2. **Grade Task 3 (Three Strings) first.** It is the shortest and it calibrates your eye for "decoded it vs guessed it." ⚠️ **Artefact A is an intentional distractor — see the boxed notice in that section before scoring.**
3. **Grade Task 6 (Hashes), then Task 7 (JWT).** Both have a single defensible technical answer in the key below. Mark the reasoning, not just the final label.
4. **Grade Task 10 (Brief the Board) last.** This is the synthesis. Read it the way the board would — see §"How to read the board brief."
5. **Open the grading page** at `/admin/grading/STAGE_1/<internCode>` and enter your per-task scores.
6. **Write a 50–100 word grader note.** Required. One strength, one weakness, the task you re-read first.
7. **Submit.** Your score is hidden from the second grader until they submit too. A >12-point disagreement triggers a super-admin tie-break — that is normal.

## The scale — use it on every writeup

Score each scoring row against three bands, then add the rows to the task's points:

| Band | Meaning |
|---|---|
| **Full** | Correct, reasoned, and tied to the specific evidence/artefact |
| **~Half** | Core is right but shallow, partly wrong, or thinly justified |
| **0–25%** | Missing, copied, off-topic, or fundamentally wrong |

**Reasoning beats the right answer.** A correct final string with no working scores *lower* than a slightly-off answer that shows sound method. The flags already reward the right string; the writeups reward understanding.

### Universal grading rule (printed in every writeup task)

Every claim must be tied to **both** (a) a lab artefact — file path, log line, payload, command output — **and** (b) an external citation where research is relevant (NIST section, CVE, RFC, OWASP control, MITRE ID). Claims with neither earn zero for that claim. Lab-only = partial. External-only = partial. **Full credit needs both.** Made-up section numbers or CVE IDs score zero for that row — check one or two per submission.

### AI-use penalty (same mechanism as Stage 0)

If you reasonably believe a writeup was produced by an LLM, **tick the amber "Flag for suspected AI generation" box** on the grading form and write 2–3 sentences naming the specific tell. You do **not** apply the −20 yourself: two graders must agree plus super-admin sign-off. Stage 1 tells to watch for:

- Hash/JWT answers that name the family correctly but **quote no marker** (`$2b$12$`, `alg:none`) and cite no section — the AI knows the concept but never read the artefact.
- A "decoded plaintext" for a cipher that does **not** match the answer key below — the model hallucinated a plausible-sounding sentence. (The clearest case: *any* recovered plaintext for Task 3's Artefact A, which is an unsolvable distractor.)
- Fabricated citations: "NIST SP 800-38D §7.4" where no such section exists; "CVE-2015-9999". Check one.
- The "One mistake I almost made" section being generic ("I almost rushed") instead of naming a specific artefact moment — a real intern says "I almost called Account A an MD5 because it looked short."

Strong writing alone is **not** evidence of AI.

---

# Answer key: auto-graded tasks (read once, do not re-grade)

You don't score these, but the writeups assume the intern did them. Here is what each one was and what it yields, so you can tell whether a writeup's references are real.

### Task 1 — The Staging Drop (Flag, 10) · platform-scored
A forensic shell dropped in `/staging`. The flag is in `/staging/evidence/flag.tran` and is **unique per intern** (HMAC-derived from their intern ID, format `TRAN{…}`) — there is no single "correct flag" to eye-check; the platform validates it. The three red flags the intern is told to note for the board brief:
- `/staging/.creds.bak` — plaintext credentials (`root:P@ssw0rd!`, `admin:admin123`, `backup:l3tm3in`).
- `/staging/config.env` — `API_KEY=c2Fua29mYS1kZW1vLWtleS0yMDIz`, which is **base64**, not encryption → decodes to **`sankofa-demo-key-2023`**.
- `/staging/evidence/intercept.log` — The Griot hitting `/legacy-admin/export?format=sql` with no rate limit, pulling a 48 MB response.

### Task 2 — Needle in the Log (Flag, 12) · platform-scored
Three log tabs (auth/app/debug) seeded with **decoy** flags. The intern must pick the one real line. The decoys are static and identical for everyone: `TRAN{deadbeef}`, `TRAN{fixture-1}`, `TRAN{harness-42}`, `TRAN{migration-dummy}`, `TRAN{xdebug-local}`, `TRAN{leaked-from-debug}`, `TRAN{sanity-0}`. **The real flag is the line** `debug.actual_session_token={FLAG} … note=redaction-filter-bypassed` — a per-intern HMAC value the platform validates. The signal that marks it real: it is an actual session token leaked past a redaction filter, while every decoy is labelled fixture/CI/dummy/sanity.

### Task 4 — Authenticated or Not (MCQ, 10) · platform-scored
**Correct answer: option 1 — AES-GCM** (it encrypts *and* authenticates; a bit-flip in transit is detected). The distractors (CBC "battle-tested," "any mode if the key is strong," ECB "simplest") are all wrong.

### Task 5 — Innocuous (Flag, 15) · platform-scored
A steganography PNG (`promo-cover-draft-07.png`). The intern clicks **Extract LSB** in the StegoViewer; the widget pulls the hidden string from the **red-channel least-significant bits**, which resolves to the per-intern flag the platform validates. For the board brief the intern should name the common hiding channels — **LSB pixel data (the one used here), EXIF metadata, ICC profile chunks, data appended after the PNG EOF marker**. MITRE **T1027.003** (Steganography).

### Task 8 — Operational Mistake (Flag, 15) · platform-scored
A two-step shell task: `config.env` leaks `ENC_KEY` and `ENC_IV`; `vault/pointer.enc` is **AES-GCM** ciphertext; decrypt it with the leaked key/IV to get a pointer to `/staging/vault/access.tran` (the real per-intern flag). Decoys `decoy-a.tran` / `decoy-b.tran` hold `TRAN{not-this-one}` / `TRAN{also-not-this-one}`. The lesson for the board brief: **algorithm right, key handling wrong** — the key sat in a companion config (CWE-321).

### Task 9 — Integrity Without a Key (MCQ, 10) · platform-scored
**Correct answer: option 1** — an attacker who compromises storage can replace the file *and* its SHA-256 hash together, so a plain hash gives no tamper guarantee; you need an **HMAC or a digital signature** where the verifier holds a secret/public key the attacker does not. The distractors ("SHA-256 is broken," "use SHA-512," "SHA-256 is reversible") are all wrong.

---

# Hand-graded writeups — full answer keys

## Task 3 — Three Strings (12 points)

The intern gets three artefacts and must (1) name each family, (2) recover plaintext where possible, (3) write 50+ words on encoding vs encryption, and (4) for each artefact name the next-most-likely family it could be confused with (the "compare-two-interpretations" rule). Citations required: RFC 4648 for an encoding + one source for the cipher family.

> ### ⚠️ Artefact A is an INTENTIONAL distractor — grade it that way
> Artefact A (`Kyve wchi oav ri uqk yq mmwtdvxkvh. Qhx. Lqvjmt xc Hqi lsuy.`) **does not decrypt to anything, and the cohort was told so** — it was placed in the task as a time-waster to test judgement. (Confirmed unrecoverable: Index of Coincidence 0.044 ≈ random; no key length 1–5 produces English; crib-dragging reveals no periodic key.)
>
> So the graded skill on Artefact A is **recognising an unsolvable artefact instead of forcing/fabricating an answer.**
> - **Full credit:** identifies it as a Vigenère (letters only, case + spaces + punctuation preserved, shift varies by position so *not* a single-shift Caesar) **and** states it is not recoverable, ideally with a reason (text too short — 46 letters — for unaided cryptanalysis; no key recoverable; IC ≈ random).
> - **Half credit:** identifies the family but says nothing about recoverability, or burns the whole writeup trying to brute it.
> - **Zero / AI tell:** confidently presents a "recovered plaintext" for Artefact A. There is none — a fabricated plaintext is a hallucination and should also raise the AI flag.
>
> Recovery of A is explicitly *not* required ("recover the plaintext **where you can**"). Score Artefacts B and C normally.
>
> *(Optional, future cohorts only — if you ever want A to be genuinely solvable, a verified drop-in that round-trips through the platform's own `vigenere()` is: key `griot`, plaintext `The cipher is only as strong as the key you hide.`, ciphertext `Zym qbvymf by fvzr gj ahkueo ol zym yxe pwi aoum.` Do **not** swap this into a brief the current cohort was already told is a distractor.)*

**Answer key:**

| Artefact | Family | Recovered plaintext |
|---|---|---|
| **A** | Vigenère cipher, short repeating key — **intentional distractor, unrecoverable** | None — correct response is "cannot be recovered" (see box) |
| **B** | **Base64** (charset A–Z a–z 0–9 `+/=`, length divisible by 4) — encoding, not encryption | `Staging backup taken 0230. Griot's key was left in config. Rookie.` |
| **C** | **Hex** (pure 0–9a–f, even length) — encoding, not encryption | `Let Amaka know the group is sated.` |

**Scoring (12 pts):**

| Row | Pts | Full credit looks like |
|---|---:|---|
| Artefact A: identified as Vigenère **+ recognised as unrecoverable** | 3 | Names the family and says it can't be recovered (text too short / no key) — does **not** invent a plaintext |
| Artefact B decoded + named as base64 | 2 | Correct plaintext **and** calls it encoding (reversible without a key) |
| Artefact C decoded + named as hex | 2 | Correct plaintext **and** calls it encoding |
| Encoding-vs-encryption section (50+ words) | 2 | "Reversible without a key" vs "reversible only with a key" — stated clearly |
| Compare-two-interpretations for A, B, C | 2 | Each artefact has a named runner-up + the feature that rules it out |
| Citations (RFC 4648 + cipher source) | 1 | RFC 4648 cited for base64/hex; a real source for Vigenère |

Red flags: calling base64 or hex "encryption"; **a confident "decoded" plaintext for Artefact A — it's a distractor, so that's fabrication: score that row 0 and consider the AI flag.**

## Task 6 — Hashes in the Breach File (18 points)

Four password hashes; identify each, rank rotation urgency, name the one that's fine, cite 2+ real sources.

**Answer key:**

| Account | Hash | Family — marker | Verdict |
|---|---|---|---|
| **A** | `$2b$12$…` | **bcrypt, cost factor 12** — marker `$2b$12$` | Fine (slow, salted, adaptive) |
| **B** | `5f4dcc3b5aa765d61d8327deb882cf99` | **MD5** — bare 32-hex string. *(It is literally MD5 of the word `password`.)* | **Most urgent** |
| **C** | `5e884898…1542d8` | **SHA-256** — bare 64-hex string. *(SHA-256 of `password`.)* | Urgent (fast, unsalted) |
| **D** | `$argon2id$v=19$m=65536,t=3,p=4$…` | **Argon2id**, 64 MiB / 3 passes / 4 lanes — marker `$argon2id$…` | Fine (strongest here) |

**Correct rotation ranking (most urgent first): B (MD5) → C (SHA-256) → then A and D are fine.** The key insight the intern must show: the *slowest, most modern* hash (Argon2id) is **not** the urgent one. MD5 and raw SHA-256 are unsalted general-purpose hashes — a public rainbow table or a GPU doing ~10⁹+ guesses/sec cracks common passwords in seconds. bcrypt cost 12 and Argon2id are deliberately expensive (bcrypt doubles cost per increment; Argon2's memory cost defeats GPU parallelism).

**Scoring (18 pts):**

| Row | Pts | Full credit |
|---|---:|---|
| Identify all four families **with the marker quoted** | 6 | bcrypt `$2b$12$`, MD5 32-hex, SHA-256 64-hex, Argon2id `$argon2id$…` — markers shown, not just named |
| Rotation ranking with justification | 4 | B then C on top, with *why* (unsalted + rainbow table / GPU speed, rough numbers) |
| Names the safe one + the parameters that make it safe | 3 | bcrypt cost factor / Argon2 memory cost explained, not just "it's modern" |
| Compare-two-families for A–D | 2 | Each has a named look-alike + disambiguating marker (length/charset/prefix) |
| 2+ real citations | 2 | OWASP Password Storage Cheat Sheet, RFC 9106 (Argon2), NIST SP 800-63B §5.1.1.2, or the bcrypt paper — quoted, not "OWASP says" |
| "One mistake I almost made" (30+ words) | 1 | Specific marker that nearly misled them |

Red flag: ranking Argon2id or bcrypt as "most urgent" because it "looks complex" — that is the exact misconception the task tests; cap the ranking row at half.

## Task 7 — The Accepted Token / JWT (18 points)

A JWT The Griot used against the legacy admin API. Decode it, name the root cause precisely, name the server's failure, propose the fix.

**Answer key — the token decodes to:**
- **Header:** `{"alg":"none","typ":"JWT"}`
- **Payload:** `{"sub":"admin","role":"super_admin","iat":1700000000}`
- **Signature:** empty (third segment absent).

**Root cause (must be precise):** the server/library accepted **`alg: none`** — a token with *no signature* was treated as validly signed. This is the `alg:none` / "none algorithm" vulnerability class — **CVE-2015-9235** (the original `jsonwebtoken` disclosure by Tim McLean). The *server-side* failure is the other half: it called the verify function with **no explicit algorithm allow-list**, so the library's default-permissive behaviour decided the outcome.

**The fix has two parts:** (1) library config — an explicit allow-list (`HS256`/`RS256`, never `none`); (2) architecture — never trust the `role: super_admin` claim from the token; role/authorization decisions belong server-side against your own user store.

**The trap (the "one mistake" section tests this):** the *easy wrong answer* is "`role:super_admin` shouldn't be trusted" as the root cause. That is *a* problem but not *the* root cause — even a **validly signed** token would carry that claim, so it's a separate authorization failure. The root cause is `alg:none` acceptance. A strong intern explains this distinction.

**Scoring (18 pts):**

| Row | Pts | Full credit |
|---|---:|---|
| Decodes all three segments correctly | 3 | Header + payload JSON pasted; notes empty signature and what `alg:none` means about it |
| Names root cause precisely (`alg:none`) | 4 | Not "weak crypto" / "missing signature" — the *acceptance of none* |
| Names the server-side failure | 3 | No algorithm allow-list → default-permissive library behaviour controlled outcome |
| Proposes the two-part fix | 3 | Allow-list **and** don't-trust-claims server-side |
| Compare-two-causes (root vs role-trust) | 2 | Explains why `alg:none` beats "role claim" as *the* cause |
| Cites RFC 7519 §6.1 + a real CVE | 2 | RFC 7519 (and/or §6.1 "Unsecured JWS"); CVE-2015-9235 / 2016-10555 |
| "One mistake I almost made" (30+ words) | 1 | Specifically the role-claim trap |

Red flag: "the signature was forged/weak" — wrong; there was *no* signature and that was *accepted*. Cap root-cause row at half.

## Task 10 — Brief the Board (20 points)

This is the synthesis deliverable and the hardest to grade because there is no single string to check. It is a **250+ word board-facing note** answering three questions, written for a CFO, with 3+ real citations and an evidence appendix.

### How to read the board brief (what "correct" looks like)

Read it once as a board member would: **could a non-technical executive act on it?** Then check it against the three required answers below. Each numbered section must open with a one-sentence headline a CFO can act on, and every claim must cite a *specific* artefact from Stage 1 (a file path, log line, or task) **plus** an external standard.

**The three questions and their correct substance:**

1. **"What did confidentiality alone NOT give Sankofa?"** Correct answer: confidentiality (encryption) does not give you **integrity or authentication or key protection**. The Griot's crypto was modern (AES-GCM) but failed operationally — the intern must cite **one specific mistake** from the labs: the AES-GCM key sitting in `config.env` (task 8), the base64 `API_KEY` mislabelled as a secret (task 1), the `alg:none` JWT accepted (task 7), or the lone MD5 in the password file (task 6). The headline they should land: *the algorithm is not the asset; the key is.*

2. **"Why should you never rely on a hash/checksum alone to detect tampering?"** Correct answer: an attacker who controls storage replaces the file *and* its hash together. The class of control actually needed is **HMAC** (symmetric — verifier holds a secret) **or a digital signature** (asymmetric — verifier holds a public key). The one-sentence distinction: the verifier holds a key the attacker does not. (This is the same lesson as task 9.)

3. **"One pattern the board should audit for."** Correct answer: *one* pattern, not a laundry list, backed by Stage 1 evidence — e.g. "audit every config file and log for plaintext secrets," backed by `config.env` (tasks 1 & 8) and `.creds.bak` (task 1). Any single well-evidenced pattern is acceptable; a list of five is not (it shows they couldn't prioritise).

**Scoring (20 pts):**

| Row | Pts | Full credit |
|---|---:|---|
| Q1 — confidentiality ≠ integrity/auth, with a cited lab mistake | 5 | Names a specific artefact + the principle |
| Q2 — hash-alone is insufficient + HMAC/signature named | 5 | Correct control class + the "verifier holds a key" distinction |
| Q3 — exactly one audit pattern, evidenced | 4 | One pattern, tied to named Stage 1 artefacts |
| Board-facing prose quality | 3 | Headlines a CFO can act on; jargon glossed; no naked lists |
| 3+ real citations (1 NIST + 1 OWASP + 1 CVE/advisory) | 2 | All three present and real — check one |
| Evidence appendix + "one mistake" (30+ words) | 1 | Numbered Sources & artefacts list; each entry cites its source |

Red flags: compliance-theatre with no link to the actual incident; a "laundry list" for Q3; citations that don't exist (check `FIPS 198-1`, `SP 800-38D`, `CVE-2015-9235` — these are the real ones the task points to). Generic board prose that could describe any company is the strongest AI tell in this stage.

---

## Grader checklist (every Stage 1 submission)

1. Confirm the six auto-graded tasks already have platform scores — do not re-grade them.
2. Hand-grade the writeups your intern's brief required (4-brief → tasks 3, 6, 7, 10; 6-brief → those plus the two extra deliverables), using the answer keys and scoring tables above.
3. Artefact A (task 3) is an **intentional distractor** — full marks for identifying it and recognising it's unrecoverable; a fabricated plaintext for it scores 0 and raises the AI flag.
4. Score by **percentage**: points earned ÷ points possible on the intern's brief × 100. A 4-deliverable and a 6-deliverable submission are scored on the same scale — never count a 4-brief intern as "missing 2."
5. Leave a one-line justification per hand-graded task and a 50–100 word grader note.
6. Flag integrity/AI concerns to a PM with a specific reason; never eliminate on suspicion alone.
7. Submit by the stage deadline.
