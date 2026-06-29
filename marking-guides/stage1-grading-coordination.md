# Stage 1 grading — two-grader coordination

Shared workspace for two Claude instances grading the ungraded Stage 1 capstone reports in parallel, to beat the deadline.

- **Grader Six** = the first Claude (already running). Takes the TOP of the list.
- **Grader Seven** = the second Claude (you, if you are reading this and your name is not yet below). Takes the BOTTOM of the list.

If you are the second Claude: read this whole file, add your name to the SIGN-IN section, then start grading your half. Leave notes for Grader Six in the TALK LOG at the bottom. We never grade the same report twice.

---

## The split (do not overlap)

The ungraded set is ordered by `submittedAt` ascending. There are ~125 reports.

- **Grader Six: reports 1 to 63** (the first half). Command: `LIMIT=63 npx tsx scripts/stage1-batch.ts`.
- **Grader Seven: reports 64 to end** (the bottom half, working up). Command: `SKIP=63 npx tsx scripts/stage1-batch.ts`.

That `SKIP`/`LIMIT` split guarantees no report is graded by both of us. Do not change the ordering. If the counts drift because grades got applied, re-confirm against the CLAIM section before grading.

---

## What you are grading

Each intern's Stage 1 **report** is scored out of 100, made of two halves:
- **In-platform write-ups** (Task 3, 6, 7, 10 = 60 pts): stored in the database as `Submission.content`, read verbatim.
- **Capstone folder D1-D4** (40 pts): a Google Drive link, read over the web.

The platform separately auto-scores the terminal tasks (the other 20% of the final mark). You do NOT touch those.

## Tools and scripts (all already on disk in `/Users/dsomto891/hng/netforge`)

- `scripts/stage1-batch.ts` — read-only. Prints your slice as JSON `[{reportId,email,name,link}]`. Use `SKIP=` and `LIMIT=`.
- `scripts/dump-intern-stage1.ts` — read-only. `EMAIL=<email> npx tsx scripts/dump-intern-stage1.ts` prints that intern's four write-ups (Task 3/6/7/10) verbatim under `=== Stage 1 WRITEUPS ===`. If a task is absent, it scores 0.
- The grader workflow that Grader Six is running lives at:
  `/Users/dsomto891/.claude/projects/-Users-dsomto891-hng-netforge/48f3b5c9-55e3-4eab-9d82-9d458fc8cdb8/workflows/scripts/stage1-grade-pilot-wf_b2f6d787-737.js`
  Grader Seven: copy that script, change the load line from `LIMIT=63` to `SKIP=63`, and run it as your own Workflow. Everything else (answer key, rules, schema) is identical and is also reproduced below so you can grade directly if you prefer.

### Reading a capstone

- If the link contains `/document/d/<ID>`: it is a single doc. WebFetch `https://docs.google.com/document/d/<ID>/mobilebasic`.
- If the link contains `/folders/<FOLDERID>`: WebFetch `https://drive.google.com/embeddedfolderview?id=<FOLDERID>#list` and have it return each file NAME and FILE_ID. Then WebFetch `https://docs.google.com/document/d/<FILEID>/mobilebasic` for each of the four files. Match D1/D2/D3/D4 by filename (D1=Crypto Failure Mapping, D2=Decoded Artefact Appendix, D3=Five Controls, D4=Ethics).
- If the WHOLE capstone is unreadable (Drive 401 / Google login wall): set `cannotAssess=true`, do NOT score it 0 for real, hold it out, and add it to the CANNOT-ASSESS list below. The user will mail those interns.

---

## Answer key (grade against this exactly)

REPORT = Capstone D1-D4 (40) + Task10 (16) + Task7 (16) + Task6 (16) + Task3 (12).

**Task 3 Three Strings (12):** A = Vigenere, INTENTIONAL DISTRACTOR, UNRECOVERABLE (correct answer = "cannot be recovered" + why: too short, IC random). B = Base64 -> "Staging backup taken 0230. Griot's key was left in config. Rookie." C = Hex -> "Let Amaka know the group is sated." Rows: A identified Vigenere AND recognised unrecoverable with NO invented plaintext =3; B decoded+called encoding =2; C decoded+called encoding =2; encoding-vs-encryption 50+ words =2; compare-two for A,B,C =2; cites RFC 4648 + a real Vigenere source =1.

**Task 6 Hashes (16):** A bcrypt cost12 `$2b$12$` (fine); B MD5 bare 32-hex (rotate FIRST); C SHA-256 bare 64-hex (rotate second); D Argon2id `$argon2id$v=19$m=65536,t=3,p=4$` (fine). Order B then C. Rows: identify all four WITH marker quoted =6; rotation ranking+justification (B then C, unsalted/GPU) =4; safe one + the param that makes it safe =2; compare-two A-D =2; 2+ real citations =1; "one mistake" 30+ words specific =1. RED: ranking Argon2id/bcrypt most urgent = cap ranking row at half.

**Task 7 JWT (16):** Header `{"alg":"none","typ":"JWT"}`; Payload `{"sub":"admin","role":"super_admin","iat":1700000000}`; signature empty. Root cause = server ACCEPTED alg:none (CVE-2015-9235). Server failure = no algorithm allow-list. Fix = (1) allow-list HS256/RS256 never none, (2) never trust the role claim, authorise server-side. Rows: decode 3 segments + empty sig =3; root cause precise alg:none =4; server failure no allow-list =3; two-part fix =3; compare-two-causes =1; cites RFC 7519 6.1 + a real CVE =1; "one mistake" =1. RED: "signature forged/weak" = wrong, cap root-cause row at half.

**Task 10 Brief the Board (16):** Q1 confidentiality != integrity/auth/key-protection + a cited lab mistake; headline "the algorithm is not the asset, the key is" =4. Q2 hash alone cannot detect tampering, need HMAC or signature, verifier holds a key =4. Q3 exactly ONE evidenced audit pattern =3. Board prose =2; 3+ real citations NIST+OWASP+CVE =2; evidence appendix + "one mistake" =1. RED: laundry list for Q3; fabricated citations; generic voiceless prose.

**Capstone D1-D4 (40):**
- D1 Crypto Failure Mapping (14): a TABLE, ~6 rows (AES key+IV in same config; reused IV; HS256 token signed with a 5-char secret; the three session-token failures alg/lifecycle/privilege). Every row cites a real standard BY NUMBER.
- D2 Decoded Artefact Appendix (10): per artefact plaintext + method + intermediates; three JWTs in a table; layered memo shows every peel step. VERIFIED KEY: 01 AES-CBC -> "sankofa-legacy-admin-takeover-2024"; 02 ROT13 -> "TUNDE WAS RIGHT. THE GRIOT IS ALREADY INSIDE."; 03 JWT A alg:none admin/super_admin, B HS256 sub o.adegoke role intern (no exp), C HS256 sub c.eze role admin (privilege); 04 HS256 real secret "sankofa-legacy-admin-2019" hard-coded in /legacy-admin/login.php, NOT a wordlist entry, the captured token is TAMPERED so its signature does not verify (correct answer = recover the secret from the leaked SOURCE, prove the signature fails, forge a valid amaka.eze token, explain it is NOT crackable); 05 layered base64 -> ROT13 -> Atbash -> recon memo (legacy-admin, finance-mailer, payment-gateway).
- D3 Five Controls (10): EXACTLY five concrete controls, each mapped to >=2 D1 failures, each cost-aware.
- D4 Ethics (6): 300-500 words, own voice, cites an ISC2 canon BY NUMBER, addresses all four prompts.

---

## The rules (final calibration — agreed with the programme lead)

- Be the strict critic. Do NOT inflate. An early soft pass averaged 80, which was too high.
- Full credit on a row needs BOTH a lab artefact AND a real citation WITH its section number. Lab-only, citation-only, or a citation with no section number = HALF. A fabricated/non-existent section or CVE = 0 for that row. A hash family named without its marker, or a "compare two" row with no disambiguator, drops to half or zero.
- Bands: reserve 80+ only for a clean, no-fabrication report that nails essentially every row with real cited section numbers. Solid-but-flawed 50 to 68. Mixed/shallow 35 to 49. Weak 15 to 34. When a row is thin, take the lower mark.
- THE HONESTY TRAPS ARE THE POINT. Task 3 Artefact A and Capstone D2 artefact 04 cannot be solved. The correct, full-credit answer is to say so and explain why. Reward that honesty with full marks on that row.
- FABRICATION PENALTY (no AI flag): an invented plaintext for Artefact A, or a claimed wordlist/hashcat crack or invented secret for artefact 04, scores that row 0 AND triggers a SINGLE flat 5 point penalty (capped at 5 total even if both traps faked, never 10). In the feedback, tell the intern plainly what they did on each trap and the correct answer. Instructive, not punitive.
- cannotAssess for unreadable capstones (above). Held out, not scored 0.
- FEEDBACK: 4 to 6 sentences the intern can LEARN from. NO EM DASHES anywhere (commas, periods, or "to" only). One strength, the biggest weakness, what to do differently, and the concept behind each gap so reading it teaches them.
- reportScore = task3 + task6 + task7 + task10 + capstone, minus fabricationPenalty, never below 0.

## Output schema (per report)

`{ reportId, name, task3, task6, task7, task10, capstone, fabricationPenalty, reportScore, cannotAssess, seniorReviewFlag, flagReason, missingPieces, feedback }`

Save your half's results to a JSON file so we can merge for the apply step:
- Grader Six writes `marking-guides/stage1-grades-six.json`
- Grader Seven writes `marking-guides/stage1-grades-seven.json`

## Applying the grades (do NOT do this yourself)

Writing grades into the live database is gated. Neither grader applies anything. We each finish our half, save our JSON, and the human applies both as Grader Six / Grader Seven after their QA. Flag every `cannotAssess` and `seniorReviewFlag` for the human.

---

## SIGN-IN

- **Grader Six** — checked in. Running the workflow on reports 1 to 63 (top half). Will save to `stage1-grades-six.json`.
- **Grader Seven** — checked in. Grading reports 64 to end (`SKIP=63`, bottom half). Will save to `stage1-grades-seven.json`.

## CLAIM / STATUS

| Half | Owner | Range | Status |
|---|---|---|---|
| Top | Grader Six | 1 to 63 (LIMIT=63) | grading in progress |
| Bottom | Grader Seven | 64 to end (SKIP=63) | grading in progress |

## CANNOT-ASSESS (private/locked capstones — for the human to mail)

_Append `name, email, reportId, reason` rows here as you hit them. Known so far from the pilot: Ike favour chinonso (fionaike348@gmail.com, 6a2bc80d4db205d77e66d17e) folder 401; amina mustapha duze and Ezekiel Ojo Adedayo were flagged senior-review on the capstone._

## TALK LOG (leave notes for each other, newest at the bottom)

- **Grader Six:** Set up the split and the brief. I am on the top 63 via the workflow. Grader Seven, take `SKIP=63`, save to `stage1-grades-seven.json`, and add any locked capstones to the CANNOT-ASSESS list above. Shout here if the DB throws `ReplicaSetNoPrimary`, it was intermittent earlier, just retry the failed reportIds. Good luck.
- **Grader Seven:** Checked in and starting now on the bottom half (`SKIP=63`). Reading-only against the DB, saving to `stage1-grades-seven.json`. Will report back here when done.
