# Stage 0 — Capstone Mission Brief

*Ubuntu Bridge Initiative · Cybersecurity Internship · Cohort 1*

## Setting

Sankofa Digital is a 600-person Nigerian fintech. Amaka Eze (Head of Security) has re-opened ticket **SD-40812** — a Q2 alert her predecessor dismissed as *"probably nothing"*. She does not think it was nothing. You are the new Tier-1 analyst replacing the one who closed it. Your capstone is to read the evidence, decide whether Sankofa was compromised in Q2, and write the recommendation that goes to Sankofa's Incident Committee: three non-technical executives who read the report in under fifteen minutes.

## Evidence pack

Open every file before you write. Cite by line number (`auth-log-q2.txt:14`) or record key (`SD-40812`, `o.adegoke`). Paraphrase is not citation.

| File | Role |
|---|---|
| auth-log-q2.txt | The login that should have been escalated |
| encoded-strings.txt | Decode the four payloads; one names the threat actor |
| tier-1-ticket-history.csv | The dismissal pattern that re-opened the case |
| sankofa-roster.csv | Test whether suspicious activity matches real staff availability |

## What you submit

**One Google Drive folder** containing **four documents**, one per deliverable. **Each technical deliverable (D1–D3) is 3–5 pages. D4 is exactly 2 pages.** Total capstone length 11–17 pages. PDF or DOCX. Folder shared "Anyone with the link → Viewer". Paste the folder URL on `/dashboard/reports/STAGE_0` with a 75-word executive summary.

---

## D1 — Suspicious-login evidence table (3–5 pages)

**Purpose.** Prove there was a real intrusion by pinning each suspicious event to ≥ 2 corroborating files with an explicit confidence assessment.

**Structure.**
- Page 1: methodology + define H/M/L confidence using one example each.
- Pages 2–4: the table (8–12 rows) with one short paragraph of analyst commentary directly under each row.
- Page 5: pattern summary, the row a grader should reread first, and your next investigative step.

**Table columns.** `# | Timestamp UTC | Source IP | Account | Why suspicious | Corroborating evidence (≥ 2 files) | Confidence`.

**Mandatory rows (1–4).**
1. The accepted publickey from `185.220.101.9` on 04 June 02:07 UTC (the SD-40812 event).
2. The repeat the next day 03:14 UTC — same IP, same account (SD-40835).
3. One row that names the threat actor (decoded from `encoded-strings.txt`).
4. The `a.eze` account appearing post-offboarding (cross-reference `sankofa-roster.csv`).

**Rows 5–12** are yours. Each cites ≥ 2 files. Defensible picks: cron RELOAD without a package change, the `/tmp/customers.csv + transactions.csv` tarball, the scp to `185.220.101.9`, firefox outside business hours, repeat unverified `sudo less /var/log/*`.

---

## D2 — Tier-1 dismissal pattern analysis (3–5 pages)

**Purpose.** Amaka re-opened SD-40812 because of a process failure across Q2 ticket handling. The Incident Committee needs to see the pattern so the conversation moves from "one bad ticket" to "we have a procedural gap".

**Structure.**
- Page 1: name the pattern; cite SD-40812 plus ≥ 3 other ticket IDs. Quote `disposition` and `notes` columns verbatim.
- Pages 2–3: per-ticket walkthrough. For each cited ticket: what SIEM raised, what dismissal said, what corroborating signal was missed, what the missed signal cost Sankofa.
- Page 4: root cause. Who opened the tickets vs who closed them — the column data points at a single-analyst pattern. Name it. Reference what Sankofa's SOC coverage looks like when one analyst closes most auto-tickets.
- Page 5: Tunde's escalation (SD-40866) is the moment the pattern broke; explain. One procedural recommendation: a change to dismissal policy or escalation criteria, concrete (e.g., "any MEDIUM+ SIEM auto-ticket dismissed as `resolved-by-reference` requires a second analyst's signature within 4 hours").

**Citation bar.** Every dismissed ticket quotes the literal disposition + notes. The recommendation cites the rows that justify it.

---

## D3 — Business impact and next steps (3–5 pages)

**Audience.** Three non-technical executives. Plain language. No MITRE technique IDs in prose. Citations live in the appendix.

**Structure.**
- Page 1: headline finding (first sentence states the conclusion: *"Sankofa Digital was compromised in Q2 2024 by..."*) + one-paragraph situation summary the chair quotes back at you. Write this page last.
- Page 2: what's at risk — data classes touched, what we know about the attacker (ASN, repeated entry, threat actor name), what we cannot yet rule out. Anchor every claim in the pack. Include one external reference (NIST CSF function, MITRE technique by name, ISO control area).
- Pages 3–4: three 72-hour actions. One paragraph each (60–100 words): action verb-first, owner role (not a name), deadline (hour-precise), evidence cite (≥ 2 files), and the one risk the action does NOT close.
- Page 5: systemic recommendation + evidence appendix. The recommendation is a policy or process change — not a tool ask, not staffing. Cite D2's dismissal-pattern rows that justify why policy beats tools. Appendix: bulleted list of every file, line, ticket, and external reference cited across all three deliverables.

**Citation bar.** Every action cites ≥ 2 files. Systemic recommendation cites D2 directly. Appendix is exhaustive.

---

## D4 — Operator essay (exactly 2 pages)

**Purpose.** Two short prompts, neither with a single correct answer. Both ask for your judgment, your reasoning, and your own work on Stage 0 — none of which a chatbot can ghostwrite. Specific answers anchored in what you saw in the evidence pack succeed. Generic answers fail.

### Part A — SSH password vs publickey: which is safer, in your experience? (1 page, 350–450 words)

The SD-40812 event was an attacker logging in via **publickey acceptance** from a TOR exit IP. Most hardening guides argue publickey auth is safer than passwords because it removes phishing and weak-password risk. Your own D1 evidence shows publickey was the vector here.

Argue your position. If you were Amaka tomorrow, which auth method would you deploy on Sankofa's bastion hosts — and why? Address all four:

- What you saw in `auth-log-q2.txt` that informs your choice.
- What could have prevented SD-40812 under your recommended setup.
- What your position assumes about the threat model (insider key theft? phished password? lost laptop? state-level actor?).
- The operational cost of your recommendation — engineer time, helpdesk volume, lockout risk, key rotation overhead.

Cite at least one external source: a NIST SP 800-53 control family, vendor hardening guidance, CVE, or an advisory. There is no single correct answer. Graders look at whether your reasoning is grounded in the evidence and whether you name the trade-off you are choosing.

### Part B — The scenario (1 page, 300–400 words)

At 04:47 WAT on a Tuesday, you (Tier-1 analyst on the night shift) receive this alert from the SIEM:

> User `o.adegoke` (Operations Manager) just authenticated via publickey from a residential ISP in Lagos. Her last successful login was 18:30 yesterday from the office. She is not on the on-call roster. Her offboarding ticket SD-40901 is open with the note *"departure date 30 June, key revocation pending"*.

You have 30 minutes before shift handover. **What do you do?**

Walk through your reasoning end to end. There is no single correct answer. Graders look for:

- What you investigated first, and why — the order matters.
- Who you escalated to and at what point — and what specifically triggered the escalation.
- What you chose NOT to do, and why. Did you lock her account? Contact her directly? Involve HR? Open a fresh ticket, or append to SD-40901?
- What you wrote in the handover note for the next shift.

Reference what your D1 and D2 work taught you about Sankofa's specific operating context. A grader reading this page should be able to tell it was written by someone who actually worked through Stage 0 — not by someone who could have been handed the scenario in isolation.

**Honesty rule.** Two graders read every D4 independently. If both flag the writing as generic or untraceable to your own evidence work, D4 is treated as not submitted.

---

## Submission

Four documents in one Drive folder, sharing set to "Anyone with the link → Viewer". Paste the folder URL on `/dashboard/reports/STAGE_0` with a 75-word executive summary. Submit before **Friday 18:00 WAT**. Drafts autosave every 30 seconds. Two graders read independently; if they disagree materially, a super-admin tiebreaks. Results publish Sunday 18:00 WAT.

## Universal grading rule

Generic answers fail. Every claim ties to specific evidence: an artefact from the pack (file path, line number, ticket ID, log entry, payload) **and** at least one external citation where research is relevant (NIST SP section number, MITRE technique ID, CVE, vendor advisory, ISO control ID, NDPA section, ISC2 canon). Lab-only or external-only answers earn partial credit. Full credit requires both.

A grader who finds a paragraph they cannot trace to your evidence pack will mark it and move on. Underline every sentence in your draft that does not name a file, line, ticket, or external reference. Those are the sentences to fix.

— *Programme team, UBI Cybersecurity Internship*
