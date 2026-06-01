# Stage 0 — Capstone Mission Brief

*Ubuntu Bridge Initiative · Cybersecurity Internship · Cohort 1*

---

## Setting

Sankofa Digital is a 600-person Nigerian fintech with a Security Operations Centre of four. Amaka Eze (Head of Security) has just re-opened ticket **SD-40812** — a Q2 alert that her predecessor Tier-1 analyst dismissed as *"probably nothing"*. She does not think it was nothing.

You are the new Tier-1 analyst replacing the one who closed the ticket. Your first capstone is to read the evidence, decide whether Sankofa was compromised in Q2, and write the recommendation that goes to Sankofa's **Incident Committee** — three non-technical executives: the CEO, the CFO, and the independent director.

The committee reads your report end-to-end in **under fifteen minutes**. They do not want acronyms. They do want **evidence**.

---

## Your evidence pack

Four files are downloadable from your evidence pack section in the report editor. Open every one before you start writing.

| # | File | What it is | What you use it for |
|---|---|---|---|
| 1 | `auth-log-q2.txt` | `/var/log/auth.log` excerpt from `gateway-01.sankofa.internal`, 3 → 5 June 2024 | Find the login that should have been escalated |
| 2 | `encoded-strings.txt` | Four encoded payloads pulled from a forwarded message | Decode each; one of them names the threat actor |
| 3 | `tier-1-ticket-history.csv` | Sixteen Q2 Sankofa SOC tickets — opened, closed, by whom, dispositions | Identify the dismissal **pattern** that re-opened the case |
| 4 | `sankofa-roster.csv` | Staff directory with leave + offboarding dates | Test whether suspicious activity matches real staff availability |

Each deliverable below names which files you must cite for it. **Cite by line number** (e.g. `auth-log-q2.txt:14`) or **by record key** (e.g. `SD-40812` for the ticket history, `o.adegoke` for the roster).

---

## What you submit

**One Google Doc** containing three deliverables, in this order. Total length **1,800–2,500 words**. Anything under 1,500 reads thin; anything over 3,000 reads padded. The Doc folder link goes in the **report folder URL** field on the submission form; a 75-word executive summary goes in the **executive summary** field.

---

## Deliverable 1 — Suspicious-login evidence table

### Purpose
Prove there was a real intrusion — not a Tier-1 misjudgement — by pinning the suspicious activity to corroborating evidence from multiple sources.

### Required structure
A markdown / Google Docs table with **exactly these columns**, **at least 5 rows**:

| # | Timestamp (UTC) | Source IP | Account | Why suspicious | Corroborating evidence (≥ 2 files) | Confidence (H / M / L) |
|---|---|---|---|---|---|---|

### Required content
- **Row 1 must cover SD-40812's underlying event** — the accepted publickey from `185.220.101.9`. The "Why suspicious" cell must answer: *is `o.adegoke` on leave at that time?* (cite `sankofa-roster.csv`) and *what ASN is `185.220.101.9` on?* (cite the auth log entry + external Tor exit list).
- **Row 2 must cover the repeat the next day** (SD-40835 in the ticket history) — same source IP, same account. The "Why suspicious" cell must call out the **repetition** as the signal Tier-1 missed.
- **Rows 3-5** are yours. Pick from: the cron RELOAD without package change, the large `/tmp/` tarball, the scp to `185.220.101.9`, the *"a.eze account showing in audit log this morning — she's been gone two months"* anomaly, the firefox-outside-business-hours alert, or anything else you can defend.

### Citation bar
- **Every row** cites **at least two files** — the auth log plus one of (roster, encoded strings, ticket history).
- Cite each file by its **line number** or **record key**, not by paraphrase.
- One row must reference a decoded payload from `encoded-strings.txt` (one of the four strings names the threat actor; you should know that name before you finish this deliverable).

### Confidence column
- **H** = direct evidence (the log line itself, the roster entry confirming leave, the SIEM rule firing).
- **M** = correlation (two artefacts that agree but neither alone is conclusive).
- **L** = inference from absence (e.g. "no cron entry exists for this RELOAD, so it cannot be a packaged job").

A table where everything is marked H is wrong. Real SOC work has uncertainty.

### Scoring
- 5+ defensible rows: 10 pts
- Every row has 2+ file citations: 5 pts
- SD-40812 corroborated with roster (o.adegoke on leave): 5 pts
- Confidence column used with rationale (not all H): 5 pts
- Threat actor name appears in at least one row description (decoded from `encoded-strings.txt`): 5 pts

**30 points total.**

---

## Deliverable 2 — Tier-1 dismissal pattern analysis

### Purpose
The reason Amaka re-opened SD-40812 is not just that the alert was real. It is that **she sees a pattern in how Q2 tickets were being closed**. The Incident Committee needs to understand that pattern — it changes the conversation from *"one bad ticket"* to *"a process failure"*.

### Required structure
Three short subsections, all in prose:

1. **The pattern** (~ 150 words). Identify which tickets in `tier-1-ticket-history.csv` were dismissed for the same reason as SD-40812. Cite SD-40812 + at least **two other ticket IDs** by their `SD-XXXXX` identifier. Name the dismissal reason in concrete terms (e.g. "closed by reference to an earlier ticket without independent verification" — not "Tier-1 was lazy").
2. **The root cause** (~ 100 words). Why did the pattern happen? Look at *who opened* the tickets (`siem-autocreate` vs `user-report:`) and *who closed* them (mostly one person — `o.adegoke`). What does that single-analyst pattern tell you about Sankofa's SOC coverage?
3. **Why SD-40812 specifically was the cliff** (~ 100 words). Out of the dismissed tickets, this one mattered most. Explain why — what does the failure to escalate THIS ONE specifically cost Sankofa?

### Citation bar
- Quote the literal `disposition` and `notes` columns from the ticket CSV when you discuss the dismissal language.
- One sentence must reference Tunde's escalation (SD-40866 in the ticket history) — that is the moment the pattern broke.

### Anti-examples
- ❌ *"Tier-1 was overworked and made a mistake"* — uncited speculation, zero points for this claim.
- ❌ *"Several tickets were closed prematurely"* — vague.
- ✅ *"SD-40812 was closed by reference to o.adegoke being 'on leave; possibly VPN' — but `sankofa-roster.csv` confirms o.adegoke's leave window (2024-06-03 to 06-07) does not align with the 02:07 UTC login on 04 June, and Sankofa's VPN does not rewrite source IPs to a Tor exit (`185.220.101.9`). The same dismissal reasoning then applied to SD-40835, SD-40837, and was the rule the Q2 ticket history shows."* — concrete, evidence-bound, defensible.

### Scoring
- Pattern named with 3+ specific ticket IDs cited: 8 pts
- Root cause names the single-analyst coverage problem with the CSV columns that prove it: 8 pts
- Tunde's escalation correctly identified as the break-point: 4 pts

**20 points total.**

---

## Deliverable 3 — Business impact and recommended next steps

### Audience
The Incident Committee. Three non-technical executives. Plain language. **No MITRE ATT&CK technique IDs, no log line numbers in the prose**. Numbers and citations live in an appendix at the end.

### Purpose
Tell the committee three things, in this order:

1. **Did anything actually leave the building?** Anchor your answer to specific evidence. If the answer is yes — what kind of data, roughly how much, who knows already. If the answer is "we can't yet tell" — say that plainly and say what the next investigative step is.
2. **What happens next, in the first 72 hours.** Three concrete actions with a named owner role (not a name — a role) and a deadline. Each action must cite at least two evidence files.
3. **What changes about Sankofa's SOC process so this does not happen again.** One systemic recommendation (not a list — pick one). Frame it as a change to the **ticket dismissal policy** or the **escalation criteria**, not as a request for more tools or more staff. Boards approve policy faster than they approve hiring.

### Required structure
Five paragraphs:

1. **Headline finding (1 paragraph, 60–80 words)** — what you concluded, in the first sentence. "Sankofa Digital was compromised in Q2 2024 by an external actor using…" Then one sentence of qualifier. The chair will quote this paragraph back to you. Write it last.
2. **What is at risk (1 paragraph, 80–100 words)** — data classes touched, ASN of the attacker, what we cannot yet rule out.
3. **Three 72-hour actions** — bullet list with owner role + deadline. ≤ 30 words per bullet.
4. **The systemic recommendation (1 paragraph, 100–120 words)** — what changes about how tickets are dismissed, who can approve a dismissal, what a "closed by reference" disposition now requires.
5. **Evidence appendix** — every file/line/ticket cited above, with row references. Bullet list, not prose.

### Citation bar
- Every action in section 3 cites ≥ 2 files.
- The systemic recommendation in section 4 cites the dismissal-pattern analysis from Deliverable 2 directly.
- Appendix lists every cited line/row in `file:line` or `SD-XXXXX` form.

### Anti-examples
- ❌ *"Sankofa should improve its monitoring."* — generic; no points.
- ❌ *"Tier-1 should be retrained."* — names a person, not a process.
- ✅ *"For the next 90 days, any ticket dismissed with a disposition of 'resolved-by-reference' or 'resolved-no-action' on a SIEM-autocreated alert at MEDIUM severity or higher must be co-signed by a second analyst within 4 hours; otherwise the ticket auto-escalates to the SOC lead's queue. The current Q2 pattern shows nine such dismissals around SD-40812 (cite `tier-1-ticket-history.csv` rows for SD-40812, SD-40819, SD-40824, SD-40826, SD-40835, SD-40837), all by the same analyst, none independently verified."* — names a policy change, scopes it, cites the evidence.

### Scoring
- Headline finding makes a clear claim and qualifies it honestly: 6 pts
- Three 72-hour actions, each with owner role + deadline + ≥ 2 file citations: 12 pts
- Systemic recommendation is a policy change, not a tool ask: 8 pts
- Evidence appendix complete and traceable: 4 pts

**30 points total.**

---

## How you'll be graded — full rubric

| Section | Points |
|---|---|
| D1 — Suspicious-login evidence table | 30 |
| D2 — Tier-1 dismissal pattern analysis | 20 |
| D3 — Business impact and next steps | 30 |
| Writing quality (sentence-level clarity, no fluff, no jargon for non-technical audience) | 10 |
| Citation discipline (every claim ties to a file/line or ticket; no uncited speculation) | 10 |
| **Total** | **100** |

Pass mark for the capstone is **70 / 100**. The cutoff for promotion to Stage 1 is set by the programme team once everyone is graded — it is not necessarily 70. See the **Universal grading rule** below for what costs you points across every section.

---

## How to submit

1. **Write the Doc in Google Docs** (or in markdown, exported as a Doc — whichever fits your workflow). Keep all three deliverables in **one Doc**, in the order above.
2. Put the Doc in a Google Drive folder. The folder may also contain any supporting artefact you want the grader to see (extracted log snippets, decoded payloads, a printout of the ticket pattern). One link covers everything.
3. Set the folder sharing to **"Anyone with the link → Viewer"**. The grader will not request access. If the grader cannot open the folder, you score zero for that section.
4. Paste the folder link into the **Report folder URL** field on `/dashboard/reports/STAGE_0`.
5. Paste a **75-word executive summary** into the **Executive summary** field. (The grader reads this first to decide whether to open the folder right away or queue you.)
6. **Submit before Friday 18:00 WAT**. Drafts auto-save every 30 seconds; you can edit until the moment you click Submit.

Once you submit, the report status moves to `SUBMITTED`. Two graders read independently; if they disagree by more than 15 points, a super-admin tiebreaks. Results publish Sunday 18:00 WAT — pass / not-passed, with grader feedback in your dashboard.

---

## Universal grading rule

Generic answers fail. **Every claim** in your submission must be tied to specific evidence: an artefact from the evidence pack (file path, line number, ticket ID, log entry, payload) **and** at least one external citation where research is relevant (NIST SP section number, MITRE technique ID, CVE, vendor advisory, ISO control ID, NDPA section, ISC2 canon).

Claims without an attached artefact, timestamp, payload, standard section, or business constraint earn **zero** for that claim. Lab-only answers earn partial credit. External-only answers earn partial credit. **Full credit requires both.**

A grader who finds a paragraph they cannot trace to your evidence pack will mark it and move on. The fastest way to earn marks is to read this rule, then go back through your draft and underline every sentence that does not name a file, line, ticket, or external reference. Those are the sentences to fix.

---

## A note on tone

You are writing to executives. You are not auditioning to be the smartest person in the room — you are auditioning to be the person whose report a busy CEO reads before her 09:30 board call. Plain sentences. Specific numbers. Citations that the chair can verify from her phone.

When in doubt: shorter sentence, more specific noun, one fewer adjective.

Amaka reads every report twice and asks exactly one question that proves you did not. Write so her one question is something you already answered.

— *Programme team, UBI Cybersecurity Internship*
