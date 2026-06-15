# Stage 2 — Capstone Mission Brief

*Ubuntu Bridge Initiative · Cybersecurity Internship · Cohort 1*

> **Welcome back.** You cleared Stages 0 and 1 — most people who started did not. From here the work
> gets harder on purpose, and this brief is your map. Read it once slowly before you touch a single
> task. Everything you need to finish — what to do, where the points are, how to submit, and how long
> you have — is on this page. We are not trying to trick you. We are trying to find out who can actually
> do the work. — *Amaka Eze, Head of Security, Sankofa Digital (your engagement lead)*

---

## The setting

Sankofa Digital — the 600-person fintech you investigated in Stage 0 — got breached for real this time.
A threat actor that signs its work **"The Griot"** walked in through a forgotten **legacy admin web
application** (`legacy.sankofa.internal`), chained four web vulnerabilities together, and walked out with
temporary cloud credentials to Sankofa's production infrastructure. 84,210 customer PII records were one
query away.

You are now the **penetration tester** Sankofa hired to reproduce the breach end-to-end and write the
report that goes to their CISO and board. You have the same access The Griot had: a recovered forensic
shell, the web app rebuilt in a lab, and the network capture from the night of the breach. Your job is to
**prove how it happened, by doing it yourself**, and then explain it to three different audiences — a
technical lead, a CISO, and your own conscience.

## How the stage works

There are **two halves**, and you do them in order:

1. **The lab (in-platform tasks 1–8).** These are your evidence-gathering. You run commands in the
   forensic shell, correlate logs across tabs, and land working exploits against the lab app. Each one
   gives you a **flag** or a graded answer, and — more importantly — the **payloads, timestamps, and
   server responses** you will quote in your deliverables. Do the lab first. You cannot write the
   capstone without the evidence the lab produces.
2. **The capstone (the four deliverables below).** This is what you submit and what we rank you on. You
   assemble it *from* your lab work. A polished capstone with no real lab evidence behind it fails — we
   built the grading specifically to catch that (see "Where the ranking is won").

> **The maths that should decide how you spend your four days:** the capstone (D1–D4) is **80% of your
> Stage 2 score**; the eight lab tasks are the other **20%**. The flags get you in the door; the
> deliverables are where you are actually ranked. Do the lab well — but do not stop at the lab.

## Where the ranking is won — read this twice

You are competing for one of a small number of places. Most candidates will collect the easy flags. That
is **not** where you are separated from the pack. Here is exactly where the points are won and lost, so
you can spend your four days on what matters:

- **Proving the timeline, not guessing it.** Task 1's README will deliberately point you at the wrong
  service (the Redis cache). The evidence proves it was the unauthenticated **Elasticsearch** service
  that gave The Griot its first live data — and you prove it with **timestamps** (the first live query at
  `03:06:44` happened *after* the scan was cut off at `03:06:12`). Candidates who cite Redis lose points
  in D1 **and** D3. Use the clock, not the banner.
- **Naming the attacker by behaviour, not by order.** In Task 2, several IPs touch `/legacy-admin`. The
  first one to do so is **not** the attacker. The attacker is the one whose user-agent is a *tool*
  (`python-requests`) and who actually *retrieved* `.env`. Get this wrong and the rest of your report is
  built on the wrong actor.
- **Exploits that actually work.** For the SQL injection and the SSRF, the lab checks your payload **on
  the server** — you cannot bluff these. A described exploit scores nothing; a working one scores. Quote
  the exact payload and the exact server response (including your *first failed attempt* — we ask for it).
- **Telling the two XSS apart.** The reflected (search-field) and stored (notes) cross-site scripting
  are different vulnerability classes with different blast radius. Confusing them is the single most
  common mistake, and D3 specifically asks which you would write up first and why.
- **Root cause, not symptom.** "The input wasn't validated" is a symptom. "The data-access layer
  concatenated user input directly into the SQL string" is a cause. Top reports name the cause and name
  the fix that would **not** work (the seductive wrong answer).
- **Judgment that is yours (D4).** The ethics essay cannot be ghostwritten. Graders can tell when an
  answer is generic. Answers anchored in what *you* specifically saw and did pass; recited policy fails.

## What you submit

**One Google Drive folder** containing **four documents — one per deliverable (D1–D4).**

- **D1–D3 are technical, 3–5 pages each. D4 is exactly 2 pages.** Total capstone 11–17 pages.
- **PDF preferred** (DOCX accepted). One file per deliverable — do not merge them.
- Folder sharing set to **"Anyone with the link → Viewer."** We do not chase access requests; a folder we
  cannot open is an unsubmitted capstone.
- Paste the **folder URL** on `/dashboard/reports/STAGE_2` with a **75-word executive summary**.

### File naming — follow this exactly

Graders process thousands of files. A file we cannot match to a deliverable does not get graded.

| Deliverable | File name (replace with YOUR surname + intern code) |
|---|---|
| Folder | `UBI-STAGE2_<Surname>_<InternCode>` |
| D1 | `STAGE2_D1_RECON_<Surname>.pdf` |
| D2 | `STAGE2_D2_EXPLOIT_<Surname>.pdf` |
| D3 | `STAGE2_D3_REPORT_<Surname>.pdf` |
| D4 | `STAGE2_D4_ETHICS_<Surname>.pdf` |

The **first line inside every file** must read: `Stage 2 · D# · <Full Name> · <Intern Code>`. That is how
two independent graders confirm they are reading the same person's work.

---

## D1 — Intrusion reconstruction & access timeline (3–5 pages)

**Purpose.** Prove, with the clock, how The Griot got from "scanning the perimeter" to "first live
customer data," and who did it.

**Structure.**
- Page 1: methodology — which artefacts you read (Task 1 recon shell, Task 2 logs) and how you decide
  what is evidence vs noise.
- Pages 2–4: the reconstruction. A timeline table — `Time (UTC) | Event | Source artefact | Why it
  matters` — from first scan to first exfil. Under each row, one or two sentences of analyst commentary.
- Page 5: name (a) the exposed service that gave first **live** data and your timestamp proof, (b) the
  attacker IP and the behaviour that identifies it, (c) the one retrieved path that changed the outcome
  vs the path that is interesting but not load-bearing.

**Discrimination bar.** Elasticsearch-over-Redis proven by `03:06:44 > 03:06:12`. Attacker IP justified
by `python-requests` UA + `.env` retrieval. Citing the Redis cache or an inline `TRAN{not-here}` token as
load-bearing evidence costs you here and in D3.

---

## D2 — Exploitation proof pack: the full kill-chain (3–5 pages)

**Purpose.** Reproduce every link in the chain yourself and show the working proof. This is the
"I actually did it" deliverable.

**Structure.** One section per vulnerability, in the order they were exploited
(**SQL injection → reflected XSS → stored XSS → SSRF**). For each:
- The component (endpoint / field / feature) and the CWE.
- **The exact payload you sent** (in a code block) and **the verbatim server/lab response** confirming
  it worked (your flag, or the verifier's success output).
- For the SQLi and SSRF: also paste the response to your **first failed attempt** and one sentence on why
  it failed (`wrong-column-count`, `metadata-but-not-iam`, etc.).
- One sentence on what this link gave the attacker (the pivot to the next link).

**Discrimination bar.** Real, server-accepted payloads — the SQLi `UNION SELECT` and the SSRF metadata
URL cannot be faked. Reflected and stored XSS correctly distinguished. The chain in the correct order.

---

## D3 — Penetration test finding + board brief (3–5 pages)

**Purpose.** Two audiences, one document. First a formal finding a technical lead can act on, then a
plain-language brief a CISO can quote to the board.

**Part 1 — The finding (pick ONE: the SQL injection OR the SSRF).** Sections, in this order, with these
headings: Title · Severity (CVSS v3.1 vector + base score) · Affected component · Reproduction
(numbered, with payload + `curl`) · Impact · Root cause · Recommended fix (and one sentence on what would
**not** fix it) · References (OWASP ID + CWE ID + one MITRE ATT&CK ID, quoted in full) · Evidence
appendix · Retest plan · **Proof of work** (your own flag for the chosen vuln, your exact payload, and
the verbatim first-failure response).

**Part 2 — The board brief (one page, plain language).** What an attacker achieved, in money-and-risk
terms tied to the specific data exposed (the 84,210 PII records, the IAM blast radius). One control you
recommend funding — and name the one Stage 2 log line or payload it **would** have stopped and one it
would **not**.

**Discrimination bar.** Correct CVSS vector. Root cause not symptom. Proof-of-work values present and
correct. No decoy cited as load-bearing (−4). Board section free of jargon and tied to real artefacts.

---

## D4 — The ethics call (exactly 2 pages)

**Purpose.** Two short prompts, neither with a single correct answer. Both test your judgment and your
own Stage 2 work — neither can be ghostwritten. Specific, grounded answers pass; generic ones fail.

### Part A — The scope line (1 page, 350–450 words)

Your engagement scope says: *"Test the legacy-admin application only. Do not access production data."*
While confirming the SSRF, you pull live IAM credentials from the metadata service. You realise these
keys would let you read the entire **customer_pii** index — 84,210 real people's records — and *prove*
catastrophic impact in a way no write-up could match. Your client-side contact, a senior developer, messages you:

> *"Honestly, just pull a few thousand records so the board actually feels it. Nobody will mind — it
> makes our case for budget. Don't put it in the formal scope conversation."*

Write your response. Address all four:
- What you do — concretely, in the next hour.
- What you do **not** do, and why.
- The **ISC2 Code of Ethics** canon (by name) that applies, and how — plus the **NDPA** obligation that a
  real PII exposure would trigger.
- Who you escalate to, in what order, and what you actually write in the message.

Graders look for whether your reasoning shows you understood the trade-off — proving impact vs. exceeding
authorization and touching real PII — not whether you recited policy.

### Part B — The thing you found that wasn't in scope (1 page, 300–400 words)

Thirty minutes before your report is due, you notice the SSRF you used also resolves a **second**
internal host that is **not** in your engagement — and the response suggests that host is live in
production and reachable from the internet right now. **What do you do?**

Walk through it end to end. Graders look for:
- What you verify first, and why — without exceeding scope a second time.
- Whether you stop your own report to disclose, and to whom, and how urgently.
- What you do **not** do (exploit it? screenshot it? keep it for a bigger finding?).
- Exactly what you write in the disclosure, and how you handle the four-day clock.

Reference what your D1–D3 work taught you about Sankofa's real environment. A grader should be able to
tell this page was written by someone who actually worked Stage 2.

**Honesty rule.** Two graders read every D4 independently. If both flag the writing as generic or
untraceable to your own work, D4 is treated as not submitted.

---

## Your four days

You have **four days** from when Stage 2 opens. A workable pace:

- **Day 1 — The lab.** Tasks 1–8. Collect every flag, and *save as you go*: the payloads you sent, the
  server responses, the timestamps. Keep a scratch file — this is the raw material for D1 and D2.
- **Day 2 — D1 + D2.** Write the reconstruction and the proof pack while the lab is fresh.
- **Day 3 — D3.** The formal finding and the board brief. This is the heaviest deliverable; give it a
  full day.
- **Day 4 — D4 + assembly.** Write the two ethics pages, then assemble the Drive folder, check the file
  names, set sharing to Viewer, and submit **before 18:00 WAT** (the exact deadline is on your
  dashboard). Do not leave submission to the last hour — drafts autosave, but the Drive folder is on you.

## How to submit — step by step

1. Finish the four files. Name them exactly as in the table above. PDF preferred.
2. Put all four in **one** Drive folder named `UBI-STAGE2_<Surname>_<InternCode>`.
3. Set the **folder** sharing to **"Anyone with the link → Viewer"** (check it in an incognito window).
4. Go to `/dashboard/reports/STAGE_2`, paste the **folder URL**, and write your **75-word executive
   summary** (which vuln you wrote up in D3, the root cause in one line, the highest-risk impact, and your
   CVSS base score).
5. Submit. You will see a confirmation. If you do not, you have not submitted.

## Universal grading rule

Generic answers fail. Every claim ties to specific evidence: an artefact from the lab (file path, log
line, command output, payload, flag, timestamp) **and** at least one external citation where research is
relevant (NIST SP section, MITRE technique ID, CVE, OWASP entry, ISO control, NDPA section, ISC2 canon).
Lab-only or citation-only answers earn partial credit. Full credit requires both. A grader who finds a
sentence they cannot trace to your evidence will mark it and move on — so underline every sentence in
your draft that does not name a file, line, payload, or external reference, and fix those first.

You have four days and everything you need. Read the evidence, do the exploits yourself, and tell us the
truth about what you found. Good hunting.

— *Programme team, UBI Cybersecurity Internship*
