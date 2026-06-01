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

## D4 — Required reading and personal reflections (exactly 2 pages)

**Purpose.** Stage 0 assumes background knowledge a junior SOC analyst needs to operate. This deliverable proves you did the reading and that you understood what the artefacts in front of you meant — in your own words, anchored to your specific findings. It is the part of the capstone that an AI tool cannot write for you.

**What to study (a syllabus, not a checklist).** The exact sources you cite are your choice; these are the topic areas to cover so your D1–D3 work is grounded.
- SSH publickey vs password auth: how publickey acceptance works, how keys are added or stolen, why the SD-40812 acceptance signature matters.
- TOR exit nodes and ASN reputation: what `185.220.101.x` represents, how analysts triage traffic from anonymising infrastructure.
- Exfiltration over legitimate tools: scp, rsync, archive-then-transfer patterns; why "expected protocol, unexpected destination" is the harder detection.
- Tier-1 SOC operating model: ticket triage, dispositions, escalation criteria, single-analyst-coverage failure modes.
- One framework chosen by you (NIST CSF function names, MITRE ATT&CK tactic IDs, ISO 27001 control area, NDPA section, ISC2 CBK domain). Read the actual document, not a summary.

**Structure.**

*Page 1 — Required reading log.* Five sources you actually read. One row each: title · author or publisher · what specifically you got from it (one sentence) · where it shows up in D1, D2, or D3 (cite the deliverable page or finding). No bare URLs — every entry needs the title and what you took from it.

*Page 2 — Five things you learned.* Numbered list. Each item is one short paragraph. The pattern for every item:
1. State the thing in one sentence.
2. Cite the moment in your own analysis where it changed how you thought (file path, line number, ticket ID, or a row from your D1 table).
3. Name what you will do differently next time because of it.

Examples of what counts: a misconception you held when you started Stage 0; a heuristic you now apply because of one specific row in your evidence table; a process habit you adopted because of how SD-40812 was originally closed. Examples of what does NOT count: "Cybersecurity is important", "I learned about NIST", or anything that could apply to any cohort or any case.

**Citation bar.** Every reading-log row names the source. Every reflection cites a specific file, line, ticket, or finding from YOUR own D1–D3 work. A reflection a grader cannot trace to your analysis is treated as missing.

**Honesty rule.** Generic summaries that read like a chatbot produced them are marked as failing this deliverable. Two graders read every D4 independently; if both flag it as generic or untraceable, it earns nothing regardless of the technical work. The reflections are the part of this capstone that must be yours, in your voice, tied to evidence only you handled.

---

## Submission

Four documents in one Drive folder, sharing set to "Anyone with the link → Viewer". Paste the folder URL on `/dashboard/reports/STAGE_0` with a 75-word executive summary. Submit before **Friday 18:00 WAT**. Drafts autosave every 30 seconds. Two graders read independently; if they disagree materially, a super-admin tiebreaks. Results publish Sunday 18:00 WAT.

## Universal grading rule

Generic answers fail. Every claim ties to specific evidence: an artefact from the pack (file path, line number, ticket ID, log entry, payload) **and** at least one external citation where research is relevant (NIST SP section number, MITRE technique ID, CVE, vendor advisory, ISO control ID, NDPA section, ISC2 canon). Lab-only or external-only answers earn partial credit. Full credit requires both.

A grader who finds a paragraph they cannot trace to your evidence pack will mark it and move on. Underline every sentence in your draft that does not name a file, line, ticket, or external reference. Those are the sentences to fix.

— *Programme team, UBI Cybersecurity Internship*
