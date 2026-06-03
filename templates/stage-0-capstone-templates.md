# Stage 0 Capstone Templates

*Scaffolds for D1, D2, D3, D4 · Ubuntu Bridge Initiative · Cybersecurity Internship · Cohort 1*

## How to use this document

This pack contains the **exact structure** every deliverable should have. It does not contain the answers — you still have to read the evidence pack and write the analysis. Treat it as a blueprint:

1. Open a fresh Google Doc (or Word document) for each deliverable. Four docs total.
2. Copy the headings and sub-headings from the template into your Doc.
3. Replace every `[BRACKETED prompt]` with your own writing.
4. Hit the page count and length targets noted at the top of each template.
5. **Delete every bracketed prompt before submitting.** If a `[…]` placeholder is still in your final document, the grader will see it and that section will be marked incomplete.
6. Save each as PDF or DOCX, drop the four files into one shared Google Drive folder (sharing: *Anyone with the link → Viewer*), and submit the folder URL on `/dashboard/reports/STAGE_0` with a 75-word executive summary.

Page counts and word counts are not suggestions. Going over usually means you have not edited; going under usually means you have not done the analysis.

---

# Deliverable 1 — Suspicious-login evidence table

*Length: **3–5 pages**. Submit as PDF or DOCX.*

## Page 1 — Title and methodology

```
Stage 0 Capstone · Deliverable 1
Suspicious-login evidence table

[Your full name]
[UBI intern code, e.g. UBI-2026-####]
[Date you finished writing it]
```

**Methodology (one paragraph, ~150 words):**

> [Open with: which files in the evidence pack you read and in what order. Then state the criteria you applied when deciding which auth-log lines went into your table. Then say how you handled conflicts between sources (e.g., when the log says one thing and the ticket history says another, which do you trust and why). Close with how you assigned confidence ratings. Be specific to the Sankofa pack — do not write a generic methodology that could apply to any case.]

**Confidence rating definitions (sub-heading, then a short list):**

- **H — High.** [One-sentence definition + one example from your own table. E.g., "Two independent files confirm the event; no plausible benign explanation."]
- **M — Medium.** [Definition + example.]
- **L — Low.** [Definition + example.]

## Pages 2–4 — The evidence table

**Section title:** *Suspicious-login events, Q2 2024 (Sankofa gateway-01)*

| # | Timestamp (UTC) | Source IP | Account | Why suspicious | Corroborating evidence (≥ 2 files) | Confidence |
|---|---|---|---|---|---|---|
| 1 | YYYY-MM-DD HH:MM | [IP] | [account] | [one-line reason] | [file:line]; [ticket ID] | H/M/L |
| 2 | YYYY-MM-DD HH:MM | [IP] | [account] | [one-line reason] | [file:line]; [ticket ID] | H/M/L |
| 3 | YYYY-MM-DD HH:MM | [IP] | [account] | [one-line reason] | [file:line]; [ticket ID] | H/M/L |

*Add rows until you have 8–12 total. After each row, write a 2–3 sentence analyst commentary directly underneath.*

**Format for the commentary:**

> [Row X commentary: Why does this event matter? What does it imply about the attacker, the victim, or the SOC process? What would you investigate next if you only had time for one row from your table? Keep it specific to THIS row.]

**Mandatory rows you must include (in addition to your own choices):**

- **Row labelled SD-40812 publickey acceptance.** [The accepted publickey from 185.220.101.9 on 04 June 02:07 UTC. Cite both auth-log-q2.txt by line number AND the ticket disposition from tier-1-ticket-history.csv.]
- **Row labelled SD-40835 repeat.** [The next-day repeat from 05 June 03:14 UTC. Same IP, same account.]
- **Row labelled "threat actor named".** [Decode one of the four encoded strings in encoded-strings.txt — one of them names the threat actor. Put that decoded name in the "Why suspicious" cell and cite encoded-strings.txt + the relevant auth log line.]
- **Row labelled "post-offboarding access".** [The `a.eze` account appearing after the offboarding date listed in sankofa-roster.csv. Cite the log line AND the roster row.]

Rows 5 through 8–12 are your call. Defensible picks the grader will recognise:

- The cron RELOAD without a corresponding package change.
- The `/tmp/customers.csv + transactions.csv` tarball.
- The `scp` to 185.220.101.9.
- Firefox sessions outside business hours.
- Repeat unverified `sudo less /var/log/*`.

Each row you add must cite at least two files.

## Page 5 — Pattern summary and next step

**Pattern summary (~100 words):**

> [Step back from the rows. What do they SAY together that they don't say apart? Name the pattern across rows — the trajectory of the attack, the shape of the SOC's blind spots, or whatever the table reveals as a whole.]

**The row a grader should reread first:**

> [Pick ONE row from your table. Name it by number. Explain in 2–3 sentences why this single row is the most important piece of evidence in your whole table.]

**Your next investigative step:**

> [If you had 24 more hours and Amaka's blessing, what would you investigate next? Be specific — name a file you would pull, a query you would run, a ticket ID you would re-open, or a person you would interview. Vague answers like "more log analysis" do not count.]

## Pre-submission checklist for D1

- [ ] Methodology paragraph anchored to the Sankofa pack, not generic.
- [ ] H/M/L definitions each have one specific example.
- [ ] Table has 8–12 rows.
- [ ] All four mandatory rows present and correctly described.
- [ ] Every row cites ≥ 2 evidence files with precise locators (file:line, ticket ID, roster row).
- [ ] Confidence column actually used — not every row marked H.
- [ ] Each row has a 2–3 sentence analyst commentary underneath.
- [ ] Pattern summary, re-read row, and next step all present on the final page.
- [ ] All `[BRACKETED]` prompts removed.

---

# Deliverable 2 — Tier-1 dismissal pattern analysis

*Length: **3–5 pages**. Submit as PDF or DOCX.*

## Page 1 — Name the pattern

```
Stage 0 Capstone · Deliverable 2
Tier-1 dismissal pattern analysis

[Your full name]
[UBI intern code]
[Date]
```

**Opening sentence (the pattern, stated specifically):**

> [Write one sentence that names the structural failure. Specific = good. Generic = bad. Aim for the shape: "[Pattern name]: [what specifically goes wrong]". Acceptable example: "Single-analyst dismissal of MEDIUM+ auto-tickets as 'resolved-by-reference' without cross-correlation against the prior 7 days of alerts." Unacceptable: "Bad triage" or "Tier-1 was overloaded".]

**The ticket IDs that prove the pattern — at least 4, including SD-40812. Quote `disposition` and `notes` columns verbatim from `tier-1-ticket-history.csv`. Paraphrase costs points and triggers AI review.**

- **SD-40812.** disposition=`[verbatim]`; notes=`"[verbatim]"`
- **SD-[####].** disposition=`[verbatim]`; notes=`"[verbatim]"`
- **SD-[####].** disposition=`[verbatim]`; notes=`"[verbatim]"`
- **SD-[####].** disposition=`[verbatim]`; notes=`"[verbatim]"`

## Pages 2–3 — Per-ticket walkthrough

For each ticket cited above, write the block below. Repeat the block for every cited ticket.

### [Ticket ID]

**What the SIEM raised:** [One sentence describing the alert that fired.]

**Dismissal:** disposition=`[verbatim]`; notes=`"[verbatim]"`

**What was missed:** [Specific reference to another file, ticket, row, or log line that, if checked, would have escalated this ticket. Cite the file or ticket ID precisely.]

**What it cost Sankofa:** [One concrete consequence. Not "increased risk". Something specific, e.g., "the attacker returned 27 hours later via the same IP without any new SIEM rule firing."]

*Repeat the four-field block above for each ticket.*

## Page 4 — Root cause

**The single-analyst pattern, with column evidence:**

> [Use the columns of `tier-1-ticket-history.csv` to make the case. Count: how many of the Q2 auto-ticket closures were made by the same analyst? Reference the specific column you counted from. Show that this analyst closed most of the MEDIUM+ tickets. This is your root cause — say it explicitly. Do not hedge.]

**Why this matters operationally (~80 words):**

> [Explain how single-analyst coverage breaks SIEM triage. The brief mentions Sankofa's SOC bench is four analysts. Connect that bench size to the pattern you named on page 1. Two-three sentences.]

## Page 5 — Break-point and recommendation

**The moment the pattern broke — Tunde Afolabi's escalation (ticket SD-40866):**

> [Explain in 2–3 sentences why SD-40866 broke the pattern. What did Tunde do differently? Was it a different analyst closing it, a different disposition, a cross-correlation that finally happened? Why did the pattern that hid SD-40812 not work here?]

**One concrete procedural recommendation:**

> [One specific procedure change. The test of specificity: another company should be able to read your recommendation and implement it without further interpretation.
>
> Acceptable shapes:
> - "Any MEDIUM+ SIEM auto-ticket dismissed as `resolved-by-reference` requires a second analyst's signature within 4 hours of close."
> - "Dual sign-off before close on any ticket where ≥ 2 SIEM rules fired on the same asset in the prior 24 hours."
>
> Unacceptable: "improve monitoring", "review tickets more carefully", "hire more staff", "introduce more rigorous SOC processes". Those are not procedures.]

## Pre-submission checklist for D2

- [ ] Pattern named in the first sentence — specific, not vague.
- [ ] At least 4 ticket IDs cited (including SD-40812 and SD-40866).
- [ ] `disposition` and `notes` columns quoted **verbatim**.
- [ ] Per-ticket walkthrough completed for every cited ticket.
- [ ] Root-cause page uses column counts as evidence, not opinion.
- [ ] SD-40866 explicitly named as the break-point.
- [ ] Procedural recommendation is concrete enough to implement.
- [ ] All `[BRACKETED]` prompts removed.

---

# Deliverable 3 — Business impact and next steps

*Length: **3–5 pages**. Audience: three non-technical executives. They read this in under 15 minutes.*

**The audience test:** Hand page 1 to someone who knows nothing about cybersecurity. If they can quote a sentence back to you, page 1 is working. If they look confused, rewrite it before you move on.

## Page 1 — Headline and situation summary

```
Stage 0 Capstone · Deliverable 3
Business impact and next steps
For: Sankofa Digital Incident Committee

[Your name]
[UBI intern code]
[Date]
```

**Headline finding (the FIRST sentence of the page — not buried mid-paragraph):**

> [State the conclusion as a fact, not a hypothesis. Template: "Sankofa Digital was compromised in Q2 2024 by [actor name], who used [method] to access [system] starting on [date]." Acceptable to add a half-sentence qualifier: "…and we have evidence of one repeat access on [next date]." Do not write: "There may have been some suspicious activity in Q2…"]

**One-paragraph situation summary (~80 words, audience-readable):**

> [The Committee chair should be able to quote a sentence from this paragraph back to you in the meeting. Plain English. No MITRE technique IDs. No CVE numbers. No jargon that requires translation. The audience is three executives, not a security peer.]

> **Write this page LAST, after you have written pages 2–5. Page 1 distils the rest.**

## Page 2 — What's at risk and what we don't yet know

**What's at risk (one paragraph):**

> [Data classes that were touched (customer PII, transaction data, internal communications, etc.). Anchor every claim to a specific file or ticket. Do not list risks that your evidence does not support.]

**What we know about the attacker (one paragraph):**

> [The IP / ASN. The repeated entry. The threat actor name decoded from `encoded-strings.txt`. The compromised account. 3–4 sentences. Still no MITRE IDs in prose on this page — names only.]

**What we cannot yet rule out (one paragraph — honest qualification):**

> [Be specific about what your evidence does NOT prove. Examples: "We do not yet know whether transaction data was exfiltrated; the auth log shows access but not data movement." This honesty matters — overclaiming damages your credibility with executives. Name at least one specific thing you cannot rule out.]

**One external reference, named in prose (NOT as an ID on this page):**

> [Acceptable phrasings: "This maps to the NIST CSF Detect function", "This is the MITRE Valid Accounts technique", "This concerns ISO 27001 control area A.9.2.6 (Removal of access rights)". The full citation (technique ID, control number) appears in the evidence appendix on page 5, not here.]

## Pages 3–4 — Three 72-hour actions

**Each action gets its own block. One paragraph of 60–100 words. Each paragraph must contain ALL of these:**

1. Action verb first — *Disable, Rotate, Notify, Revoke, Audit, Brief…*
2. Owner ROLE — never a personal name. *"Head of Engineering"*, not *"Bayo"*.
3. Hour-precise deadline — *"within 24 hours"*, *"by 06:00 UTC tomorrow"*. Not "ASAP".
4. At least two evidence citations.
5. The one risk this action does NOT close.

### Action 1: [Verb-first one-line title]

**Owner:** [Role, not a personal name]
**Deadline:** [Hour-precise]
**Evidence cited:** [file:line]; [ticket ID]

[Paragraph 60–100 words. Why this action, how it ties to the evidence, what it accomplishes. End with: "This action does NOT close [the one specific risk it leaves open]."]

### Action 2: [Verb-first one-line title]

**Owner:** [Role]
**Deadline:** [Hour-precise]
**Evidence cited:** [cite]; [cite]

[Paragraph 60–100 words ending with the un-closed risk.]

### Action 3: [Verb-first one-line title]

**Owner:** [Role]
**Deadline:** [Hour-precise]
**Evidence cited:** [cite]; [cite]

[Paragraph 60–100 words ending with the un-closed risk.]

## Page 5 — Systemic recommendation and evidence appendix

**Systemic recommendation (one paragraph, ~120 words):**

> [Must be a policy or process change. Must NOT be a tool purchase. Must NOT be a hiring ask. Must cite at least one row from D2's dismissal-pattern analysis as justification. Acceptable shape: "Quarterly access review with mandatory revocation within 72 hours of any offboarding, signed off by a second analyst. This addresses the dismissal pattern documented in D2 around SD-[####] and SD-[####]." Unacceptable: "Buy a better SIEM", "Hire more analysts", "Improve security awareness".]

**Evidence appendix (bulleted, exhaustive):**

> Every file, line, ticket, and external reference cited across D1, D2, D3 lives here. Format:
>
> - `auth-log-q2.txt:14` — accepted publickey from 185.220.101.9 (SD-40812 trigger)
> - `tier-1-ticket-history.csv` row 12 (SD-40835) — repeat publickey access
> - `sankofa-roster.csv` row 47 — a.eze offboarded 2024-05-30
> - `encoded-strings.txt` payload 3 — decodes to threat actor name
> - NIST CSF function: Detect (DE)
> - MITRE ATT&CK technique: T1078 — Valid Accounts
> - ISO 27001:2022 Annex A.9.2.6 — Removal of access rights
>
> [Replace these placeholders with the actual citations you used. The appendix is the only place IDs may appear in their full form.]

## Pre-submission checklist for D3

- [ ] Page 1 first sentence is the conclusion stated as a fact.
- [ ] Page 1 contains NO MITRE/NIST/ISO IDs in prose.
- [ ] Page 2 includes one external reference named in plain language.
- [ ] Page 2 honestly names something the evidence does NOT prove.
- [ ] Three 72-hour actions, each with: verb-first, owner role, hour deadline, ≥ 2 citations, the un-closed risk.
- [ ] Owners are roles. No personal names anywhere in the actions.
- [ ] Systemic recommendation is policy or process — NOT tools, NOT hiring.
- [ ] Systemic recommendation cites D2 rows by ticket ID.
- [ ] Evidence appendix is complete and traceable.
- [ ] All `[BRACKETED]` prompts removed.

---

# Deliverable 4 — Judgment essay

*Length: **exactly 2 pages**. Two prompts. Neither has a correct answer.*

**Honesty rule.** Two graders read every D4 independently. If both flag it as generic or untraceable to your own D1/D2 work, this deliverable is treated as not submitted, and the AI-use penalty may also apply. D4 must be in YOUR voice, anchored to YOUR analysis.

## Page 1 — Part A: The ethics call (350–450 words)

```
Stage 0 Capstone · Deliverable 4 · Part A
The ethics call

[Your name] · [UBI intern code] · [Date]
```

**The prompt (paste verbatim into your Doc so the reader has context):**

> *You are the new Tier-1 analyst. After finishing your D1 evidence table you realise the threat actor named in `encoded-strings.txt` is the same actor active in tickets your predecessor closed as "probably nothing". You raise it with your direct manager. He says: "Just close it. The senior VP whose account is involved is in board meetings all week, and we are not going to spoil his quarter."*
>
> *Write your response.*

**Your response — 350–450 words. Cover all four points below. Use the headings or keep it as flowing prose; either is acceptable.**

**1. What you would do, concretely.**

> [Step by step. "First, I would…. Second, I would…. Within 24 hours I would…." Be specific about the artefacts you would gather and the channels you would use.]

**2. What you would NOT do, and why.**

> [At least one specific refusal. "I would not close the ticket as `resolved-by-reference`. I would not verbally agree in the standup to drop it." Each refusal has a reason — name it.]

**3. The ISC2 Code of Ethics canon that applies — by name.**

> The four canons are:
>
> - Canon I: Protect society, the common good, necessary public trust and confidence, and the infrastructure.
> - Canon II: Act honorably, honestly, justly, responsibly, and legally.
> - Canon III: Provide diligent and competent service to principals.
> - Canon IV: Advance and protect the profession.
>
> [Name ONE canon (Canon I, II, III, or IV) and explain in 2–3 sentences why it applies to THIS specific situation. Do not just paraphrase the canon — connect it to the manager's instruction and your refusal.]

**4. Who you would escalate to next, in what order, and what you would actually say.**

> [Be specific — name the role, the channel (email, in-person, ticket comment), and a one-line version of your escalation message.]

**Demonstrate the trade-off.** A strong answer acknowledges what the right thing COSTS you — your career, your relationship with the manager, the temporary disruption to the VP's week — and chooses it anyway. A weak answer recites policy without naming the cost.

## Page 2 — Part B: The scenario (300–400 words)

```
Stage 0 Capstone · Deliverable 4 · Part B
The scenario
```

**The prompt (paste verbatim):**

> *At 04:47 WAT on a Tuesday, you (Tier-1 analyst on the night shift) receive this alert from the SIEM:*
>
> *User `o.adegoke` (Operations Manager) just authenticated via publickey from a residential ISP in Lagos. Her last successful login was 18:30 yesterday from the office. She is not on the on-call roster. Her offboarding ticket SD-40901 is open with the note "departure date 30 June, key revocation pending".*
>
> *You have 30 minutes before shift handover. What do you do?*

**Your response — 300–400 words. Walk through all four:**

**1. What you investigated FIRST and why.**

> [Investigation order matters. Name your first three checks in order. For at least one of them, reference a finding from your own D1 table that informed why you would check that thing first.]

**2. Who you escalated to, at what point, and what specifically triggered it.**

> [Be specific: "When I saw [X], I would escalate to [role] via [channel] because [reason]." Name the trigger and the channel.]

**3. What you chose NOT to do, and why.**

> [Did you lock her account? Contact her directly? Involve HR? Open a fresh ticket or append to SD-40901? Each choice has a tradeoff — name it. Restraint is part of judgment.]

**4. Your handover note for the next shift.**

> [2–3 sentences, written as you would actually send it. What state did you leave the investigation in? What does the morning shift need to pick up?]

**Tie at least one paragraph to your own D1 or D2 work.** A grader reading this page should be able to tell it was written by someone who actually did Stage 0 — not by someone who could have been handed the scenario in isolation. Cite a specific row, ticket, or file from your earlier analysis.

## Pre-submission checklist for D4

- [ ] Exactly 2 pages.
- [ ] Part A is 350–450 words.
- [ ] Part B is 300–400 words.
- [ ] Part A names an ISC2 canon by number and explains how it applies to this specific situation.
- [ ] Part A demonstrates the personal cost of the right choice.
- [ ] Part B references at least one specific row, ticket, or file from your own D1 or D2.
- [ ] Investigation order in Part B is explicit and reasoned.
- [ ] Part B names what you chose NOT to do, and why.
- [ ] Neither part reads like it could apply to any cohort.
- [ ] All `[BRACKETED]` prompts removed.

---

# Final pre-submission checklist (read this just before you submit the folder)

Open your Drive folder and confirm:

- [ ] **Four documents present.** D1, D2, D3, D4. PDF or DOCX. No Sheets.
- [ ] **No `[BRACKETED]` placeholders remain in any document.** Search each file for `[` to be sure.
- [ ] **Page counts hit.** D1: 3–5 pages. D2: 3–5 pages. D3: 3–5 pages. D4: exactly 2 pages.
- [ ] **Sharing is "Anyone with the link → Viewer".** Test it by opening the folder URL in a private/incognito browser window.
- [ ] **The 75-word executive summary is typed into the form on `/dashboard/reports/STAGE_0`.** It is NOT a separate file in the folder.
- [ ] **The folder URL is pasted into the report page's submission field.**
- [ ] Click **Submit report** and wait for the green confirmation.

You can resubmit until the stage closes Friday 18:00 WAT. Use that — submit a draft early, get the submission acknowledged, then revise.

— *UBI Programme Team*
