# Stage 0 Capstone Templates

*All four deliverables — D1, D2, D3, D4 — plus the 75-word executive-summary guidance.*

## The 75-word executive summary goes ON THE PLATFORM — not in any of the four documents

When you submit on `/dashboard/reports/STAGE_0`, the form has TWO fields:

1. A Drive folder URL (where D1, D2, D3, D4 live as four separate files).
2. A 75-word executive summary, typed directly into the form.

The summary is the platform-facing one. It does NOT go inside D1, D2, D3, or D4. Think of it as the elevator pitch for the whole submission — three executives reading it should know whether to read the full pack.

**Suggested shape for the 75-word summary:**

> *"Sankofa Digital was compromised in Q2 2024 by [actor], who used [method] to access [system]. The Tier-1 analyst who closed the original alert was [pattern], and the breach went undetected for [N] days. I recommend [policy/process change] addressing [specific gap]. Full evidence in the four-document pack: D1 evidence table, D2 dismissal pattern, D3 business impact, D4 judgment essay."*

---

*Ubuntu Bridge Initiative · Cybersecurity Internship · Cohort 1 · Stage 0 Capstone*

*Editable template — Deliverable 1 of 4. Target length: 3–5 pages. This template mirrors the structure of a full-marks submission. Edit in Google Docs or Microsoft Word. Replace every `[BRACKETED]` prompt with your own writing. Delete every prompt before you save the final file. The italic guidance notes (like this one) should also be removed before submission.*

---

# Deliverable 1 — Suspicious-login evidence table

> 📋 **Before you start writing, check yourself:**
>
> - Have you read `auth-log-q2.txt`, `encoded-strings.txt`, `tier-1-ticket-history.csv`, and `sankofa-roster.csv` end to end?
> - Have you decoded ALL FOUR payloads in `encoded-strings.txt`? One of them names the threat actor — it has to appear in your table.
> - Do you know which row of `sankofa-roster.csv` corresponds to the offboarded `a.eze` account, and on what date?
> - If any answer is no, close this template and finish that work first. The template will not save you from missing evidence.

---

## ── Page 1 ──

# Stage 0 Capstone · Deliverable 1

## Suspicious-login evidence table

**Author:** [Your full name as it appears on the UBI platform]
**Intern code:** [UBI-2026-####]
**Date completed:** [DD Month 2026]
**Programme:** Ubuntu Bridge Initiative · Cybersecurity Internship · Cohort 1
**Stage:** 0 · Induction at the Gate

---

### Methodology

[Replace this paragraph with your own writing — target ~150 words. Open with: which files in the evidence pack you read and in what order. Then state the criteria you applied when deciding what counted as suspicious in the auth log. Then say how you handled conflicts between sources (e.g., when the log says one thing and the ticket history says another — which do you trust and why?). Close with how you assigned confidence ratings. Be specific to the Sankofa pack — do not write a generic methodology that could apply to any case.]

*Example opener you can adapt: "I read `auth-log-q2.txt` first to build a chronological view of authentication events, then cross-referenced each suspicious line against `tier-1-ticket-history.csv` to determine which had been raised by the SIEM and how the responding analyst had dispositioned them. `sankofa-roster.csv` was loaded last to identify accounts whose owners were no longer with Sankofa during the breach window …"*

### Confidence rating definitions

Each row in the table below is rated High (H), Medium (M), or Low (L) using the definitions here. The example for each rating comes from a row in my own table.

**H — High confidence.**
[Your definition. When do you consider an event High? E.g., "Two or more independent files corroborate the event; no plausible benign explanation exists."]
*Example from my table:* [Cite a specific row by number, e.g., "Row 1 — the SD-40812 publickey acceptance is corroborated by `auth-log-q2.txt:14` and the ticket disposition in `tier-1-ticket-history.csv` row 3."]

**M — Medium confidence.**
[Your definition. E.g., "One file shows the event directly; corroboration is plausible but not confirmed within this pack."]
*Example from my table:* [Cite a specific row.]

**L — Low confidence.**
[Your definition. E.g., "Suspicious by pattern only; no single line of evidence directly confirms it."]
*Example from my table:* [Cite a specific row.]

---

> 📋 **Before you move to page 2, confirm:**
>
> - [ ] Title block is complete (name, intern code, date).
> - [ ] Methodology paragraph is ~150 words and specific to Sankofa.
> - [ ] H/M/L definitions each have one concrete example referencing a row in your own table.
> - [ ] No `[BRACKETED]` prompts remain on this page.
> - [ ] No italic guidance notes remain on this page.

---

## ── Pages 2–3 — The evidence table ──

### Suspicious-login events, Q2 2024 (Sankofa gateway-01)

| # | Timestamp UTC | Source IP | Account | Why suspicious | Corroborating evidence (≥ 2 files) | Confidence |
|---|---|---|---|---|---|---|
| 1 | YYYY-MM-DD HH:MM | [source IP] | [account] | [one-line reason] | [file:line]; [ticket ID]; [optional 3rd source] | H/M/L |
| 2 | YYYY-MM-DD HH:MM | [source IP] | [account] | [one-line reason] | [file:line]; [ticket ID] | H/M/L |
| 3 | YYYY-MM-DD HH:MM | [source IP] | [account] | [one-line reason] | [file:line]; [ticket ID] | H/M/L |
| 4 | YYYY-MM-DD HH:MM | [source IP] | [account] | [one-line reason] | [file:line]; [roster row] | H/M/L |
| 5 | YYYY-MM-DD HH:MM | [source IP] | [account] | [one-line reason] | [file:line]; [ticket ID] | H/M/L |
| 6 | YYYY-MM-DD HH:MM | [source IP] | [account] | [one-line reason] | [file:line]; [ticket ID] | H/M/L |
| 7 | YYYY-MM-DD HH:MM | [source IP] | [account] | [one-line reason] | [file:line]; [ticket ID] | H/M/L |
| 8 | YYYY-MM-DD HH:MM | [source IP] | [account] | [one-line reason] | [file:line]; [ticket ID] | H/M/L |

*Add rows 9, 10, 11, 12 if your analysis surfaced them. Minimum 8 rows. Maximum 12. Every additional row must cite at least two evidence files.*

### Per-row commentary

Below the table, write a 2–3 sentence analyst commentary for **every** row. Use this format. Make each commentary specific to the row above it — do not paraphrase the whole table.

**Row 1.** [Why does this event matter? What does it imply about the attacker, the victim, or the SOC process? What would you investigate next if you only had time for one row from your table? Keep it specific to THIS row.]

**Row 2.** [Commentary specific to row 2.]

**Row 3.** [Commentary specific to row 3.]

**Row 4.** [Commentary specific to row 4.]

**Row 5.** [Commentary specific to row 5.]

**Row 6.** [Commentary specific to row 6.]

**Row 7.** [Commentary specific to row 7.]

**Row 8.** [Commentary specific to row 8.]

### Mandatory rows you must include

These four rows are required. The grader will check for each by name. If any is missing or wrong, that section of D1 is unscoreable.

**Row labelled "SD-40812 — publickey acceptance":**
[Describe the accepted publickey from 185.220.101.9 on 04 June 02:07 UTC. Cite the line in `auth-log-q2.txt` by number AND the ticket disposition from `tier-1-ticket-history.csv`. Your commentary should explain why this row is the breach itself — the moment the attacker had legitimate-looking access.]

**Row labelled "SD-40835 — next-day repeat":**
[The repeat access from 05 June 03:14 UTC. Same source IP, same account. Cite both the auth log line AND the ticket. Commentary should explain why a repeat at this interval (about 25 hours) is a planned return, not coincidence.]

**Row labelled "Threat actor named":**
[Decode the four encoded payloads in `encoded-strings.txt`. ONE of them names the threat actor. Put the decoded name in the "Why suspicious" cell. Cite `encoded-strings.txt` (which payload number) AND the auth log line where this actor's access appears. Commentary should explain how you decoded it.]

**Row labelled "a.eze — post-offboarding access":**
[The `a.eze` account appearing AFTER the offboarding date listed in `sankofa-roster.csv`. Cite both the auth log line AND the roster row. Commentary should explain why this account being usable at all is the underlying control failure.]

### Defensible additional rows (your call)

The remaining rows (numbers 5 through 8–12) are your own analysis. Each row you add must cite at least two evidence files. Defensible picks the grader will recognise:

- The cron `RELOAD` event without a corresponding package change.
- The `/tmp/customers.csv` and `transactions.csv` tarball.
- The `scp` transfer to 185.220.101.9.
- Firefox sessions outside Sankofa business hours.
- Repeat unverified `sudo less /var/log/*` activity.

Pick the rows that strengthen your case. You are not obliged to include every defensible pick — eight rows of strong evidence beat twelve rows of mixed quality.

---

> 📋 **Before you move to page 4, confirm:**
>
> - [ ] Table has 8–12 rows.
> - [ ] All four mandatory rows are present and described correctly.
> - [ ] Every row cites at least two evidence files with precise locators (`file:line`, ticket ID, roster row number).
> - [ ] Confidence column is varied — not every row marked H.
> - [ ] Per-row commentary is written for every row (not just rows 1–4).
> - [ ] Threat actor is named correctly in row 3.
> - [ ] No `[BRACKETED]` prompts remain.

---

## ── Page 4 (or 5) — Pattern summary and next step ──

### Pattern summary

[~100 words. Step back from the rows. What do they SAY together that they don't say apart? Name the pattern across rows — the trajectory of the attack from first foothold to data exfiltration, the shape of the SOC's blind spots, or whatever the table reveals as a whole. Be specific. Do not just count rows.]

*Example shape to adapt: "The eight rows above describe a single attacker (one IP, one account, one decoded threat-actor name) returning N times across N days to the same gateway, escalating from authentication to lateral movement to data staging. M of N events were raised by the SIEM and M of N were dismissed as routine activity. The dismissal pattern is the throughline that D2 unpacks."*

### The row a grader should reread first

[Pick ONE row from your table by number. Explain in 2–3 sentences why this single row is the most important piece of evidence in your whole table. Strong picks are the rows where the attacker's behaviour shifted from "lurking" (authentication) to "doing damage" (data movement, persistence) — or the row that ties together the most evidence files.]

### My next investigative step

[If you had 24 more hours and Amaka's blessing, what would you investigate next? Be concrete — name a specific file you would pull, a specific query you would run, a specific ticket ID you would re-open, or a specific person you would interview. Vague answers like "more log analysis" or "deeper investigation" do not count.]

*Example shape to adapt: "Pull the full sudo audit log for `a.eze` between 03 and 05 June and correlate against the firefox session timestamps. If the sudo events do not match an interactive session, that confirms automated post-compromise activity rather than an opportunistic human session."*

---

# Pre-submission checklist for D1

Read this list before you save the file and add it to your Drive folder.

- [ ] **Title block** is complete and correct (name, intern code, date).
- [ ] **Methodology** is ~150 words and specific to Sankofa (not generic).
- [ ] **H/M/L definitions** each have one concrete example from your own table.
- [ ] **Table** has 8–12 rows (minimum 8, maximum 12).
- [ ] **Four mandatory rows** are present and correctly described.
- [ ] **Every row** cites at least two evidence files with precise locators.
- [ ] **Confidence column** is varied — at least one M and one L, with reasoning.
- [ ] **Per-row commentary** is written underneath every row.
- [ ] **Pattern summary** is on the final page (~100 words).
- [ ] **Re-read row** is named by number with reasoning.
- [ ] **Next investigative step** is specific (a file, query, ticket, or person).
- [ ] **Every `[BRACKETED]` prompt** is removed.
- [ ] **Every italic guidance line** is removed.
- [ ] **File saved as PDF or DOCX.**
- [ ] **Page count is 3–5.**
- [ ] **File named** `D1-suspicious-login-evidence-table.pdf` (or .docx) for the Drive folder.

— *UBI Programme Team*
*Ubuntu Bridge Initiative · Cybersecurity Internship · Cohort 1 · Stage 0 Capstone*

*Editable template — Deliverable 2 of 4. Target length: 3–5 pages. Edit in Google Docs or Word. Replace every `[BRACKETED]` prompt with your own writing. Remove every prompt and every italic guidance line before submission.*

---

# Deliverable 2 — Tier-1 dismissal pattern analysis

> 📋 **Before you start writing:**
>
> - Have you finished D1? D2 builds on rows from your D1 table — write D1 first.
> - Have you opened `tier-1-ticket-history.csv` in a spreadsheet tool and sorted by `closed_by` column?
> - Do you know which Tier-1 analyst closed the most MEDIUM+ tickets in Q2?
> - Have you located the ticket Tunde Afolabi escalated (the break-point)?
> - If any answer is no, close this template and finish that work first.

---

## ── Page 1 — Title and the pattern ──

# Stage 0 Capstone · Deliverable 2

## Tier-1 dismissal pattern analysis

**Author:** [Your full name]
**Intern code:** [UBI-2026-####]
**Date completed:** [DD Month 2026]
**Programme:** Ubuntu Bridge Initiative · Cybersecurity Internship · Cohort 1
**Stage:** 0 · Induction at the Gate

---

### The pattern

[Replace this with ONE sentence stating the pattern specifically. Specific = good. Generic = bad.

**Acceptable example shape:** "Single-analyst dismissal of MEDIUM+ auto-tickets as `resolved-by-reference` without cross-correlation against the prior 7 days of alerts."

**Unacceptable shapes — do NOT write any of these:**
- "Bad triage."
- "Tier-1 was overloaded."
- "The analyst made mistakes."

Your pattern statement must name (a) the structural failure, (b) the disposition vocabulary the failure hid behind, and (c) the missing cross-check.]

### Tickets that prove the pattern

You must cite at least four ticket IDs, including SD-40812. Quote the `disposition` and `notes` columns **verbatim** from `tier-1-ticket-history.csv`. Paraphrasing in this section costs points and is a strong AI-use signal.

- **SD-40812.** disposition=`[verbatim from CSV]`; notes=`"[verbatim from CSV]"`
- **SD-[####].** disposition=`[verbatim]`; notes=`"[verbatim]"`
- **SD-[####].** disposition=`[verbatim]`; notes=`"[verbatim]"`
- **SD-[####].** disposition=`[verbatim]`; notes=`"[verbatim]"`

*Add more ticket IDs if your analysis surfaced them. Four is the minimum.*

---

> 📋 **Before you move to page 2, confirm:**
>
> - [ ] Title block is complete.
> - [ ] Pattern statement is ONE sentence, specific, naming both the disposition and the missing check.
> - [ ] At least four ticket IDs are cited.
> - [ ] `disposition` and `notes` columns are quoted **word-for-word** from the CSV.
> - [ ] No `[BRACKETED]` prompts remain.

---

## ── Pages 2–3 — Per-ticket walkthrough ──

For each ticket cited on page 1, write the four-field block below. Repeat the block for **every** cited ticket.

### [Ticket ID — e.g. SD-40812]

**What the SIEM raised.** [One sentence describing the alert that fired. Be specific to what the SIEM rule was watching for — e.g., "publickey acceptance from an IP not in the documented vendor range" — not just "suspicious login".]

**Dismissal.** disposition=`[verbatim from CSV]`; notes=`"[verbatim from CSV]"`

**What was missed.** [Specific reference to another file, ticket, row, or log line that, if checked, would have escalated this ticket. Cite the file or ticket ID precisely. Example shape: "If the analyst had cross-referenced this against `sankofa-roster.csv` row X, they would have seen that the account had been offboarded N days earlier — which the SIEM rule does not auto-correlate."]

**What it cost Sankofa.** [One concrete consequence. Not "increased risk" — something specific. Example shape: "The attacker returned 25 hours later from the same IP without any new SIEM rule firing; if this ticket had been escalated, the SD-40835 alert would have inherited the prior context and triggered a manual review."]

### [Ticket ID — second one]

**What the SIEM raised.** [...]

**Dismissal.** disposition=`[verbatim]`; notes=`"[verbatim]"`

**What was missed.** [...]

**What it cost Sankofa.** [...]

### [Ticket ID — third one]

**What the SIEM raised.** [...]

**Dismissal.** disposition=`[verbatim]`; notes=`"[verbatim]"`

**What was missed.** [...]

**What it cost Sankofa.** [...]

### [Ticket ID — fourth one]

**What the SIEM raised.** [...]

**Dismissal.** disposition=`[verbatim]`; notes=`"[verbatim]"`

**What was missed.** [...]

**What it cost Sankofa.** [...]

---

> 📋 **Before you move to page 4, confirm:**
>
> - [ ] You have a four-field block for every ticket cited on page 1.
> - [ ] Every dismissal quote is verbatim from the CSV.
> - [ ] "What was missed" cites a specific external source (file, row, ticket, log line) — not an opinion.
> - [ ] "What it cost" is concrete and specific to each ticket, not generic risk language.

---

## ── Page 4 — Root cause ──

### The single-analyst pattern, with column evidence

[Use the columns of `tier-1-ticket-history.csv` to make the case explicitly. Count the closures:

- "Of the N partner-portal auto-tickets opened in Q2 2024, M were closed by the same Tier-1 analyst (column `closed_by`)."
- "Of those M, K used the `resolved-by-reference` disposition (column `disposition`)."

This is your root cause. Say it explicitly. Do not hedge. Reference the columns by name.]

### Why this matters operationally

[~80 words. Explain how single-analyst coverage breaks SIEM triage. The brief mentions Sankofa's SOC bench size — connect that bench size to the pattern you named on page 1. Two-three sentences.]

*Example shape to adapt: "Sankofa's SOC bench is four analysts on rotating shifts. Coverage on the high-volume auto-ticket queue collapsed to a single rotation slot during the breach window because [reason from the evidence pack]. The breach period aligns exactly with the period when [analyst name] held that queue alone, which is why the dismissal pattern was uniform — there was no second pair of eyes."*

---

> 📋 **Before you move to page 5, confirm:**
>
> - [ ] The root cause uses column counts as evidence — actual numbers, not opinions.
> - [ ] The single-analyst problem is named explicitly.
> - [ ] Sankofa's SOC bench size is connected to the failure.

---

## ── Page 5 — Break-point and recommendation ──

### The moment the pattern broke — Tunde Afolabi's escalation (SD-40866)

[Explain in 2–3 sentences why SD-40866 broke the pattern. What did Tunde do differently? Was it a different analyst closing it, a different disposition vocabulary, a cross-correlation that finally happened? Why did the pattern that hid SD-40812 not work here?]

### One concrete procedural recommendation

[Write ONE specific procedure change. The test of specificity: another company should be able to read your recommendation and implement it without further interpretation.

**Acceptable shapes:**
- "Any MEDIUM+ SIEM auto-ticket dismissed as `resolved-by-reference` requires a second analyst's signature within 4 hours of close."
- "Dual sign-off before close on any ticket where ≥ 2 SIEM rules fired on the same asset in the prior 24 hours."
- "Mandatory cross-check against `sankofa-roster.csv` before any ticket touching an account with status 'offboarded' or 'pending revocation' can be dispositioned."

**Unacceptable shapes — do NOT write any of these:**
- "Improve monitoring."
- "Review tickets more carefully."
- "Hire more staff."
- "Introduce more rigorous SOC processes."
- "Provide additional training."

Those are not procedures.]

---

# Pre-submission checklist for D2

- [ ] **Title block** complete.
- [ ] **Pattern statement** is one sentence, specific, names the failure and the missing check.
- [ ] **At least four ticket IDs** cited (including SD-40812 and SD-40866).
- [ ] **`disposition` and `notes` columns** quoted **verbatim** for every cited ticket.
- [ ] **Four-field walkthrough** completed for every cited ticket.
- [ ] **Root cause** uses column counts as evidence (actual numbers from the CSV).
- [ ] **SD-40866** is explicitly named as the break-point.
- [ ] **Procedural recommendation** is specific enough that another company could implement it.
- [ ] **No "improve monitoring" or "hire more staff"** language anywhere.
- [ ] **Every `[BRACKETED]` prompt** is removed.
- [ ] **Every italic guidance line** is removed.
- [ ] **File saved as PDF or DOCX.**
- [ ] **Page count is 3–5.**
- [ ] **File named** `D2-tier-1-dismissal-pattern.pdf` (or .docx) for the Drive folder.

— *UBI Programme Team*
*Ubuntu Bridge Initiative · Cybersecurity Internship · Cohort 1 · Stage 0 Capstone*

*Editable template — Deliverable 3 of 4. Target length: 3–5 pages. Audience: three non-technical executives. They read this in under 15 minutes. Edit in Google Docs or Word. Replace every `[BRACKETED]` prompt with your own writing. Remove every prompt and every italic guidance line before submission.*

---

# Deliverable 3 — Business impact and next steps

> 📋 **Before you start writing:**
>
> - Have you finished D1 and D2? D3 distils them for executives — write them first.
> - Have you decided what your THREE 72-hour actions are? Each action needs a verb, an owner role, a deadline, ≥ 2 citations, and the one risk it does NOT close.
> - Have you decided what your ONE systemic recommendation is? It must be a policy or process change, NOT a tool ask, NOT a hiring ask.
> - Have you compiled the evidence appendix?
> - **The audience for this deliverable is three non-technical executives.** If you cannot explain something in plain English, you are not ready to write page 1.

---

## ── Page 1 — Headline and situation summary ──

# Stage 0 Capstone · Deliverable 3

## Business impact and next steps

**Prepared for:** Sankofa Digital Incident Committee
**Author:** [Your full name]
**Intern code:** [UBI-2026-####]
**Date completed:** [DD Month 2026]
**Programme:** Ubuntu Bridge Initiative · Cybersecurity Internship · Cohort 1
**Stage:** 0 · Induction at the Gate

---

### Headline finding

[State the conclusion as a FACT in ONE sentence at the very top — not buried mid-paragraph, not hedged. This is the line the Committee chair will quote in the next board meeting.

**Acceptable template:** "Sankofa Digital was compromised in Q2 2024 by [actor name], who used [method] to access [system] starting on [date]."

**Unacceptable shapes — do NOT write any of these:**
- "There may have been some suspicious activity in Q2 2024."
- "Our analysis suggests the possibility that …"
- "We are continuing to investigate whether …"

Be a fact, not a hedge.]

### Situation summary

[One paragraph, ~80 words, audience-readable. The Committee chair should be able to quote a sentence from this back to you. Plain English throughout. **No MITRE technique IDs. No CVE numbers. No NIST control numbers in this paragraph.** The audience is three executives, not a security peer.]

*This page should be WRITTEN LAST. Write pages 2 through 5 first, then come back and distil them into this page 1.*

---

> 📋 **Before you move to page 2, confirm:**
>
> - [ ] Headline finding is the FIRST sentence and reads as a fact, not a hypothesis.
> - [ ] Situation summary is plain English with NO technique IDs, CVE numbers, or NIST control numbers in prose.
> - [ ] A non-technical person could read page 1 in under 2 minutes and walk away with the key facts.

---

## ── Page 2 — What's at risk and what we don't yet know ──

### What's at risk

[One paragraph. Data classes touched by the breach (customer PII, transaction data, internal communications, etc.). Anchor every claim to a specific file or ticket. Do not list risks that your evidence does not support.]

### What we know about the attacker

[One paragraph, 3–4 sentences. The source IP and its ASN. The repeated access pattern. The threat actor name decoded from `encoded-strings.txt`. The compromised account. Still no MITRE IDs in prose on this page — names only. Examples of acceptable phrasing: "the attacker self-identified as [name]", "access originated from a TOR exit IP", "the same account was used four times across nine days".]

### What we cannot yet rule out

[One paragraph — honest qualification. Be specific about what your evidence does NOT prove. Examples: "We do not yet know whether transaction data was exfiltrated; the auth log shows access but not data movement." or "We cannot rule out lateral movement into the customer-care system until the network capture log is reviewed." This honesty matters — overclaiming damages your credibility with executives. Name at least one specific thing you cannot rule out.]

### One external reference, named in prose

[Acceptable phrasings — pick one that fits your analysis:
- "This maps to the NIST CSF Detect function."
- "This is the MITRE Valid Accounts technique."
- "This concerns ISO 27001 Annex A.9.2.6 (Removal of access rights)."

The full citation (technique ID, control number) appears in the evidence appendix on page 5, not here on page 2. Page 2 names it in plain language only.]

---

> 📋 **Before you move to pages 3–4, confirm:**
>
> - [ ] Every claim on this page is anchored to a specific file, line, ticket, or row.
> - [ ] You have NAMED what you cannot yet rule out — at least one specific gap.
> - [ ] You have named ONE external framework in plain language, with the ID deferred to the appendix.

---

## ── Pages 3–4 — Three 72-hour actions ──

Each action gets its own block. One paragraph of 60–100 words. Every paragraph must contain ALL FIVE elements:

1. **Action verb first** — *Disable*, *Rotate*, *Notify*, *Revoke*, *Audit*, *Brief*, *Patch*. NOT *Consider*, *Look into*, *Improve*.
2. **Owner ROLE** — never a personal name. *"Head of Engineering"*, not *"Bayo"*.
3. **Hour-precise deadline** — *"within 24 hours"*, *"by 06:00 UTC tomorrow"*. NOT *"ASAP"*, NOT *"as soon as possible"*.
4. **At least two evidence citations** — file path with line number, ticket ID, or roster row.
5. **The one risk this action does NOT close** — be honest about what remains open.

---

### Action 1: [Verb-first one-line title]

**Owner:** [Role, not a personal name]
**Deadline:** [Hour-precise — e.g., "within 24 hours", "by 18:00 UTC tomorrow"]
**Evidence cited:** [file:line]; [ticket ID]

[Paragraph 60–100 words. Why this action, how it ties to the evidence, what it accomplishes. End with: "This action does NOT close [the one specific risk it leaves open]."]

---

### Action 2: [Verb-first one-line title]

**Owner:** [Role, not a personal name]
**Deadline:** [Hour-precise]
**Evidence cited:** [file:line]; [ticket ID]

[Paragraph 60–100 words ending with: "This action does NOT close [the one specific risk it leaves open]."]

---

### Action 3: [Verb-first one-line title]

**Owner:** [Role, not a personal name]
**Deadline:** [Hour-precise]
**Evidence cited:** [file:line]; [ticket ID]

[Paragraph 60–100 words ending with: "This action does NOT close [the one specific risk it leaves open]."]

---

> 📋 **Before you move to page 5, confirm for each action:**
>
> - [ ] Owner is a role, NEVER a personal name (no "Amaka", no "Tunde", no "Bayo").
> - [ ] Deadline is hour-precise, not vague.
> - [ ] At least two specific evidence citations.
> - [ ] The paragraph ends with the one risk this action does NOT close.
> - [ ] The action verb is at the START of the title, not mid-sentence.

---

## ── Page 5 — Systemic recommendation and evidence appendix ──

### Systemic recommendation

[One paragraph, ~120 words.

**Must be:** a policy or process change.
**Must NOT be:** a tool purchase ("buy a better SIEM"), a hiring ask ("expand the SOC"), a training ask ("more security awareness"), or a generic improvement ("strengthen the security culture").

**Must cite:** at least one row from D2's dismissal-pattern analysis as justification. Reference the ticket ID by number — e.g., "the dismissal pattern documented in D2 around SD-40812 and SD-40835".

**Acceptable example shape:** "Quarterly access review with mandatory revocation within 72 hours of any offboarding, signed off by a second analyst. The review reads `sankofa-roster.csv` against the SSO authoritative directory, surfaces every credential whose owning party is no longer with Sankofa, and forces revocation before the review can be closed. This recommendation directly addresses the dismissal pattern documented in D2 around SD-40812 and SD-40835: had the roster been the authoritative source rather than a reference the on-call analyst had to remember to check, the pattern could not have hidden the breach."]

### Evidence appendix

Every file, line, ticket, and external reference cited anywhere across D1, D2, D3 lives here. Format suggestions:

- `auth-log-q2.txt:[line number]` — [one-line description of what this line shows]
- `tier-1-ticket-history.csv` row [N] (SD-[####]) — [one-line description]
- `sankofa-roster.csv` row [N] — [one-line description of the relevant row]
- `encoded-strings.txt` payload [N] — decodes to [threat actor name or whatever you decoded]
- NIST CSF function: [Detect (DE), Identify (ID), etc.]
- MITRE ATT&CK: T[####] — [technique name, e.g., "Valid Accounts"]
- ISO 27001:2022 Annex A.[####] — [control name]
- *Add every other citation that appears anywhere in D1, D2, or D3.*

The appendix is the only place IDs may appear in their full form. Page 1 should be readable without any of these. Page 2 and pages 3–4 name them in prose without the ID.

---

# Pre-submission checklist for D3

- [ ] **Title block** complete.
- [ ] **Page 1 first sentence** is the conclusion stated as a fact, not a hypothesis.
- [ ] **Page 1 contains NO** MITRE IDs, CVE numbers, or NIST control numbers in prose.
- [ ] **Page 2** includes one external reference named in plain language only.
- [ ] **Page 2** honestly names something the evidence does NOT prove.
- [ ] **Three 72-hour actions**, each with verb-first, role owner, hour deadline, ≥ 2 citations, the un-closed risk.
- [ ] **Owners are roles. NO personal names** anywhere in the actions.
- [ ] **Systemic recommendation** is policy or process — NOT tools, NOT hiring, NOT training.
- [ ] **Systemic recommendation** cites D2 rows by ticket ID.
- [ ] **Evidence appendix** is complete — every cite from D1, D2, D3 listed.
- [ ] **Every `[BRACKETED]` prompt** is removed.
- [ ] **Every italic guidance line** is removed.
- [ ] **File saved as PDF or DOCX.**
- [ ] **Page count is 3–5.**
- [ ] **File named** `D3-business-impact.pdf` (or .docx) for the Drive folder.

— *UBI Programme Team*
*Ubuntu Bridge Initiative · Cybersecurity Internship · Cohort 1 · Stage 0 Capstone*

*Editable template — Deliverable 4 of 4. Target length: EXACTLY 2 pages. Edit in Google Docs or Word. Replace every `[BRACKETED]` prompt with your own writing. Remove every prompt and every italic guidance line before submission.*

---

# Deliverable 4 — Judgment essay

> 📋 **Before you start writing:**
>
> - Have you finished D1 and D2? D4 must tie back to your own D1/D2 work — write them first.
> - Have you read the four canons of the ISC2 Code of Ethics? You will name one by number in Part A.
> - Are you prepared to write in your own voice, with personal judgment, not in the third-person analyst tone of D1/D2/D3? D4 is the only deliverable that is supposed to sound like you.
> - **This is the AI-resistant deliverable.** Two graders read every D4 independently. If both flag it as generic or untraceable to your own analysis, D4 earns zero, AND the AI-use penalty may apply. Write it yourself.

---

## ── Page 1 — Part A: The ethics call (350–450 words) ──

# Stage 0 Capstone · Deliverable 4

## Part A — The ethics call

**Author:** [Your full name] · [UBI-2026-####] · [Date]

### The prompt (paste verbatim into your document)

> *You are the new Tier-1 analyst. After finishing your D1 evidence table you realise the threat actor named in `encoded-strings.txt` is the same actor active in tickets your predecessor closed as "probably nothing". You raise it with your direct manager. He says: "Just close it. The senior VP whose account is involved is in board meetings all week, and we are not going to spoil his quarter."*
>
> *Write your response.*

### Your response (350–450 words — cover all four points below)

#### 1. What you would do, concretely

[Step by step. "First, I would …. Second, I would …. Within 24 hours I would …."

Be specific about:
- The artefacts you would gather BEFORE doing anything else.
- The channels you would use (in-person, email, ticket, page).
- The people / roles you would loop in, and in what order.
- A timeframe — what happens in the first hour, first 4 hours, first 24 hours.]

#### 2. What you would NOT do, and why

[At least one specific refusal, ideally two. "I would not close the ticket as `resolved-by-reference`. I would not verbally agree in the standup to drop it."

Each refusal has a reason — name it.]

#### 3. The ISC2 Code of Ethics canon that applies

The four canons are:

- **Canon I:** Protect society, the common good, necessary public trust and confidence, and the infrastructure.
- **Canon II:** Act honorably, honestly, justly, responsibly, and legally.
- **Canon III:** Provide diligent and competent service to principals.
- **Canon IV:** Advance and protect the profession.

[Name ONE canon — Canon I, II, III, or IV — and explain in 2–3 sentences why it applies to THIS specific situation. Do not just paraphrase the canon. Connect it to the manager's instruction and your refusal.

*Example structure: "Canon I applies here. The compromised account exposed customer billing records of an unknown set of people; the manager's instruction prioritises one party's brand interest above those individuals' right to be told. The canon orders these for us: society — which includes the customers whose data may have been touched — comes before the manager's reputational concern."*]

#### 4. Who you would escalate to next, in what order, and what you would actually say

[Be specific — name the role, the channel (email, in-person, ticket comment), and a one-line version of your escalation message.

*Example structure: "I would email the Head of Information Security within 4 hours, copying the Head of Legal, with subject 'BWT-XXXXX — possible customer-data exposure, escalation requested'. The body would say: 'I have evidence of customer-data exposure tied to [ticket] across [N] log entries between [date] and [date]. I have been asked to close the ticket. I have not. I would like 15 minutes today.'"*]

### Demonstrate the trade-off

> **This is what separates a strong Part A from a weak one.** Name what the right choice COSTS you — your career, your relationship with the manager, the temporary disruption to the VP's week — and explain why you choose the right thing anyway.

[Include 2–3 sentences acknowledging the cost. A grader who reads Part A without seeing the trade-off named will mark it as policy-recitation, not judgment.]

---

> 📋 **Before you move to page 2, confirm Part A:**
>
> - [ ] Word count is 350–450.
> - [ ] You named an ISC2 canon by number (I, II, III, or IV) AND explained why it applies to this specific situation.
> - [ ] You named at least one specific action AND at least one specific refusal.
> - [ ] You named the trade-off — what choosing the right thing costs you personally.
> - [ ] No `[BRACKETED]` prompts remain. No italic guidance lines remain.

---

## ── Page 2 — Part B: The scenario (300–400 words) ──

## Part B — The scenario

### The prompt (paste verbatim into your document)

> *At 04:47 WAT on a Tuesday, you (Tier-1 analyst on the night shift) receive this alert from the SIEM:*
>
> *User `o.adegoke` (Operations Manager) just authenticated via publickey from a residential ISP in Lagos. Her last successful login was 18:30 yesterday from the office. She is not on the on-call roster. Her offboarding ticket SD-40901 is open with the note "departure date 30 June, key revocation pending".*
>
> *You have 30 minutes before shift handover. What do you do?*

### Your response (300–400 words — walk through all four points)

#### 1. What you investigated FIRST and why

[Investigation order matters. Name your first three checks IN ORDER. For at least one of them, reference a finding from your own D1 table that informed why you would check that thing first.

*Example structure to adapt: "I would investigate three things first, in this order. First, the timestamp of her last legitimate office session versus the time gap to the residential-ISP login — her normal pattern from the partner-portal logs is daytime-only, so a 04:47 access is itself the anomaly. Second, the status of SD-40901 — specifically whether the 'key revocation pending' date has elapsed, because Lesson 1 from my D1 row 4 (the a.eze post-offboarding access) is that offboarding paperwork that does not enforce itself becomes the attack surface. Third, the publickey fingerprint — if it matches her registered key, this is harder to dismiss as a forged session; if it does not match, we have something closer to confirmation."*]

#### 2. Who you escalated to and what specifically triggered it

[Be specific: "When I saw [X], I would escalate to [role] via [channel] because [reason]."

The trigger matters — name what would tip you over from investigation to escalation. The channel matters — name pager vs email vs in-person and why.]

#### 3. What you chose NOT to do, and why

[At least three specific refusals:

- Did you lock her account? Why or why not?
- Did you contact her directly? Why or why not?
- Did you involve HR at this stage? Why or why not?
- Did you open a fresh ticket or append to SD-40901? Why?

Each choice has a tradeoff. Name it. Restraint is part of judgment — a strong Part B shows you understand when NOT to act.]

#### 4. Your handover note for the next shift

[2–3 sentences, written as you would actually send it. What state did you leave the investigation in? What does the morning shift need to pick up?

*Example structure: "SD-40901 active. o.adegoke authenticated 04:47 from residential ISP; key fingerprint [match/mismatch] (see ticket SD-XXXXX I opened). Security on-call paged 05:02. No lock applied, no direct contact. Morning shift: confirm with o.adegoke via her registered work number, and only via that number, whether she initiated."*]

### Tie at least one paragraph to your own D1 or D2 work

> **This is the AI-resistance check.** A grader reading Part B should be able to tell it was written by someone who actually did Stage 0 — not by someone who could have been handed the scenario in isolation. Cite a specific row, ticket, or file from your earlier analysis.

[Make sure at least one paragraph above (1, 2, 3, or 4) references a specific row, ticket ID, or file from your own D1 or D2 work. Generic answers fail.]

---

# Pre-submission checklist for D4

- [ ] **Exactly 2 pages.** Not 1.5, not 2.5.
- [ ] **Part A** is 350–450 words.
- [ ] **Part B** is 300–400 words.
- [ ] **Part A** names an ISC2 canon by number and explains how it applies to this specific situation.
- [ ] **Part A** names at least one specific action and at least one specific refusal.
- [ ] **Part A** names the personal cost — what choosing the right thing costs you.
- [ ] **Part B** investigation order is explicit (three checks in order) and reasoned.
- [ ] **Part B** escalation trigger is named specifically.
- [ ] **Part B** names what you chose NOT to do, and why, with at least three specific refusals.
- [ ] **Part B** handover note is written as you would actually send it.
- [ ] **At least one Part B paragraph** references a specific row, ticket, or file from your own D1 or D2.
- [ ] **Neither part reads like it could apply to any cohort or any case.**
- [ ] **Every `[BRACKETED]` prompt** is removed.
- [ ] **Every italic guidance line** is removed.
- [ ] **File saved as PDF or DOCX.**
- [ ] **File named** `D4-judgment-essay.pdf` (or .docx) for the Drive folder.

— *UBI Programme Team*
