# Stage 4 Evidence Pack - Sankofa Digital Board Debrief

Use this document if you cannot find the separate Stage 4 downloads. It contains
the artefacts and templates needed for all six Stage 4 tasks.

## Quick Index

1. [GDPR Article 33 breach-notification letter](#sec-1) (`breach-notification-template.md`)
2. [Five-row risk register](#sec-2) (`risk-register-template.csv`)
3. [CEO board slide memo](#sec-3) (`board-memo-template.md`)
4. [30/60/90 remediation roadmap](#sec-4) (`30-60-90-roadmap-template.md`)
5. [Control mapping — NIST CSF / ISO 27001 / MITRE D3FEND](#sec-5) (`control-mapping-skeleton.csv`)
6. [External audit findings excerpt](#sec-6) (`06-external-audit-findings.md`)
7. [Board minutes — questions and tabled motion](#sec-7) (`07-board-minutes-excerpt.md`)
8. [Lagos Ledger newspaper transcript](#sec-8) (`08-front-page-amaka.md`)
9. [Designed newspaper (4 pages: front page, the city reacts, her statement, ethics editorial)](08-front-page-amaka.html) (`08-front-page-amaka.html`)

The designed newspaper cover uses `amaka-eze-cover.jpg` as a fictional training
portrait. If your browser supports it, open:

`/capstone/stage-4/08-front-page-amaka.html`

---

# 1. GDPR Article 33 Breach Notification Template {#sec-1}

```text
================================================================
TEMPLATE - GDPR Article 33 breach notification
Use this as a starting point. Do not copy-paste blindly. Every
[BRACKETED] field is yours to fill from the evidence you have.
================================================================

[ORG_LETTERHEAD]

The Lead Supervisory Authority
[SUPERVISORY AUTHORITY ADDRESS]

[DATE]

Filing deadline: [04:12 UTC / 05:12 WAT on 2024-01-18]

Re: Notification of Personal Data Breach - pursuant to Article 33
of the General Data Protection Regulation

Dear Supervisory Authority,

1. CONTROLLER

   Sankofa Digital Limited, RC [NUMBER], registered office at
   [ADDRESS]. Data Protection Officer: [DPO NAME], [DPO EMAIL].

2. NATURE OF BREACH

   On [DATE OF DISCOVERY] our security team confirmed that an
   unauthorised actor had been present in our environment from
   approximately [DATE OF FIRST ACCESS]. Initial access was via
   [BRIEF DESCRIPTION - one sentence, no jargon]. The actor was
   contained on [CONTAINMENT DATE].

   This notification is [BEFORE / AFTER] the Article 33 72-hour
   filing deadline.

3. CATEGORIES AND VOLUME OF DATA SUBJECTS AFFECTED

   - Approximately [N] data subjects.
   - Categories of personal data: [e.g. name, email, account
     identifier, redacted/last-4 of bank record].
   - Special categories: [None / specify].

4. CONSEQUENCES

   [ONE PARAGRAPH - what is the likely consequence to the affected
   subjects? Identity-theft risk, financial-loss risk, reputational
   harm? Be honest, be specific.]

5. CONTAINMENT AND REMEDIATION

   - [ACTION 1 - taken on DATE]
   - [ACTION 2 - taken on DATE]
   - [ACTION 3 - planned for DATE]

6. ASSUMPTIONS, UNKNOWNS, AND UPDATE COMMITMENT

   Confirmed: [WHAT IS EVIDENCED]. Still under evidence-locker review:
   [WHAT MAY CHANGE]. If [TRIGGER] changes the affected-count or risk
   assessment, [OWNER ROLE] will send a supplemental notice within
   [TIMEBOX].

7. CONTACT FOR FURTHER INFORMATION

   [DPO NAME], [DPO TITLE]
   [DPO EMAIL], [DPO PHONE]

We commit to keeping the Commission updated as the investigation
progresses. We are available for any clarification the Commission
may require.

Yours faithfully,

[NAME]
[TITLE - e.g. Chief Executive Officer]
Sankofa Digital Limited

================================================================
NOTES TO THE INTERN (delete this block before submission)
================================================================

- GDPR Article 33 requires notification within 72 hours of becoming
  aware of the breach, unless the personal data breach is unlikely
  to result in risk to the rights and freedoms of natural persons.
- GDPR Article 34 governs communication to affected data subjects
  where the breach is likely to result in a high risk.
- For this exercise, awareness starts at 04:12 UTC on 2024-01-15.
  The 72-hour deadline is 04:12 UTC / 05:12 WAT on 2024-01-18.
- "Likely to result in risk" is a judgement call. State your
  judgement with one line of reasoning in section 4.
- Do not over-claim what you know. Do not under-claim either.
  Both create future legal exposure.
- The Commission reads tone. Be plain. Be calm. Be specific.
================================================================
```

---

# 2. Risk Register Template {#sec-2}

```csv
id,risk_statement,likelihood_1_5,likelihood_rationale,impact_1_5,impact_rationale,control_concrete,owner_role,residual_risk_1_5_and_decision,iso_27001_2022_annex_a,nist_csf_2_0_category,evidence_cite_stage_task
R-001,"Adversary regains foothold via the same workstation persistence mechanism (.bashrc-sourced binary) if it is not removed and audited.",4,"The mechanism is present today and survives any single user re-login. Demonstrated working against o.adegoke (Stage 3 task 1).",4,"One workstation gives the attacker lateral movement to any internal service o.adegoke can reach - including the legacy admin app and the cloud metadata service.",Deploy Wazuh FIM agents on 100% of in-scope endpoints with rules for additions to ~/.bashrc / ~/.profile / .config/autostart/*.desktop and any new file under /var/lib/* outside a known package. 30-day retention.,Head of Security Engineering,"2 - reduce; accept only after 30 days of clean FIM alerts.",A.8.7 + A.8.16,DE.CM-01,Stage 3 task 1 + task 2
R-002,,,,,,,,,,,
R-003,,,,,,,,,,,
R-004,,,,,,,,,,,
R-005,,,,,,,,,,,
```

---

# 3. Board Memo Template {#sec-3}

## BOARD MEMO TEMPLATE - Sankofa Digital breach of 2024-01-14

Use this as the starting skeleton for your one-slide board memo. Replace every
`[BRACKETED]` field. Delete this notes block before you submit.

**Slide title (<= 8 words, active voice):**

`[e.g. Sankofa breach - board action required]`

**Three numbers anchoring the slide:**

1. `[N.k] customer PII records exposed` - cite: `[Stage 2 task 1 - ES customer_pii index, 84.2k docs]`
2. `[Nm] from initial access to root` - cite: `[Stage 3 task 5 timeline]`
3. `€[N]M estimated GDPR fine exposure` - cite: `[GDPR Article 83 - up to €10M/2% or €20M/4%, depending on infringement class]`

**One chart description (one paragraph):**

`[Describe the chart. The chart compares one before / one after under the proposed control. Examples that pass: time-to-detect before vs after the proposed control; mean attacker dwell-time before vs after; risk score before vs after each of the five risks from your risk register.]`

**The ask (<= 80 words):**

> `[The board is being asked to authorise: <action>; <budget tier S/M/L>; <owner role>. The reason this comes first is <specific risk-reduction it buys, cited to Stage X task Y>.]`

**Speaking notes (five short bullets, <= 25 words each, plain language):**

- `[...]`
- `[...]`
- `[...]`
- `[...]`
- `[...]`

**Anticipated board questions + your one-line answers:**

- Q: `[Open Question Q1 from 07-board-minutes-excerpt.md]` / A: `[your one-line answer]`
- Q: `[Open Question Q2 from 07-board-minutes-excerpt.md]` / A: `[...]`
- Q: `[Open Question Q3 from 07-board-minutes-excerpt.md]` / A: `[...]`

**Tradeoff decision (60+ words):**

`[Name one trade-off the board must accept to approve the ask. Format: "To do X by [date], we will NOT do Y (or we will delay it to Q3, or we will do it with less coverage). The reason X comes first is <evidence-backed risk-reduction it buys>." Generic "no trade-offs needed" loses.]`

**Press-risk line (<=35 words):**

`[One sentence the CEO can use if asked whether Amaka was The Griot. It must separate confirmed evidence, allegation, and next action.]`

**Evidence appendix:**

- `[Stage X task Y - what claim it supports]`
- `[GDPR Article XX]`
- `[NIST CSF 2.0 - function.category id]`
- `[MITRE ATT&CK - T1234 id]`
- `[07-board-minutes-excerpt.md - which open question it answers]`

**One mistake I almost made (50+ words):**

`[A specific moment in drafting this slide where you nearly picked the wrong third number. Be specific.]`

---

# 4. 30 / 60 / 90 Remediation Roadmap Template {#sec-4}

## Required table

| # | Window (30 / 60 / 90 days from board-approval) | Action (concrete, verb-first) | Owner role | Budget tier (S < N5M / M N5-25M / L N25M+) | Dependency or blocker | Acceptance criterion | Stage 1-3 evidence cite | NIST CSF 2.0 function.category | ISO 27001:2022 Annex A control |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Days 0-30 | Rotate every credential and IAM role token that touched workstation 10.0.1.87. | Head of Cloud Platform | S | Confirm asset/user/token inventory from Stage 3 evidence. | 100% of identified credentials rotated; no old token authenticates in audit log. | Stage 3 task 1 | RS.MI-01 | A.5.16 |
| 2 | Days 0-30 | `[Action - verb first]` | `[Owner role]` | `[S/M/L]` | `[Dependency/blocker]` | `[Auditable pass/fail criterion]` | `[Stage X task Y]` | `[NIST CSF id]` | `[ISO 27001 id]` |
| 3 | Days 0-30 | `[...]` | | | | | | | |
| 4 | Days 31-60 | `[...]` | | | | | | | |
| 5 | Days 31-60 | `[...]` | | | | | | | |
| 6 | Days 31-60 | `[...]` | | | | | | | |
| 7 | Days 61-90 | `[...]` | | | | | | | |
| 8 | Days 61-90 | `[...]` | | | | | | | |
| 9 | Days 61-90 | `[...]` | | | | | | | |

You must add one more row for interim security leadership and privileged-access
separation after the Amaka allegation. You may add up to 2 additional rows of
your own choosing. Maximum 12 rows.

## Deferral list

After the 30/60/90 table, name at least three real items from Stages 1-3 that
you are deliberately NOT scheduling inside this 90-day window, and why each one
waits.

`[Item 1]:` `[...]`

`[Item 2]:` `[...]`

`[Item 3]:` `[...]`

## Audit findings response

Use `06-external-audit-findings.md` and `08-front-page-amaka.md`. For each
finding, state whether this roadmap accepts, disputes, or defers it. Cite the
roadmap row that implements the response, or the deferral-list item that
explains why it waits. Include one sentence on why the interim-security-
leadership row is not optional.

- Finding 1: `[ACCEPTS / DISPUTES / DEFERS]` - `[...]`
- Finding 2: `[ACCEPTS / DISPUTES / DEFERS]` - `[...]`
- Finding 3: `[ACCEPTS / DISPUTES / DEFERS]` - `[...]`

---

# 5. Control Mapping Skeleton {#sec-5}

```csv
row,observed_weakness_from_stages_1_3,stage_task_evidence,nist_csf_2_0_function_category,iso_27001_2022_annex_a,mitre_d3fend_counter_technique,mapping_confidence_h_m_l,source_checked
1,Unauthenticated Elasticsearch index exposing customer PII,Stage 2 task 1 - scan-vuln.txt + es-intern_access.json,PR.DS-01,A.8.3 + A.8.24,D3-NTA (Network Traffic Analysis),H - direct exposure evidence and exact data-security mapping,NIST CSF 2.0 + ISO 27001:2022 Annex A + MITRE D3FEND
2,Plaintext credentials and base64 'API key' in committed config files,Stage 1 task 1 + task 8 - config.env + .creds.bak,,,,,
3,SQL injection in login form (evidence in MySQL general log),Stage 2 task 3 - mysql-general.log line 03:09:44,,,,,
4,Reflected and stored XSS in admin dashboard,Stage 2 tasks 4 and 5 - search + notes endpoints,,,,,
5,SSRF to cloud metadata service (IMDSv1 in use),Stage 2 task 6 - 169.254.169.254/latest/meta-data/,,,,,
6,"Time-unlimited NOPASSWD: less /var/log/* sudoers grant",Stage 3 task 3 - /etc/sudoers.d/90-ops,,,,,
7,Shell-config persistence in user .bashrc (not caught by crontab/systemd audits),Stage 3 task 2 - /home/o.adegoke/.bashrc,,,,,
8,Periodic HTTPS beacon to non-allow-listed external domain,Stage 3 task 4 - gri0t-c2.dynamic-update.net:443,,,,,
```

---

# 6. External Audit Findings Excerpt {#sec-6}

Source: independent post-incident review, working excerpt for the board pack.
Amaka: "Use this as a governance artefact, not as gospel. If you agree,
say why. If you dispute, cite the evidence that changes the conclusion."

## Finding 1 - Incident response cycle exceeded benchmark

The review team observed approximately seven calendar days between the first
relevant alert cluster and formal containment. Comparable fintech response
programmes in this review set average approximately four days for similar
severity events. The delay increased uncertainty around affected records and
forced legal to work from partial facts.

Recommendation: define severity-based containment authority for Security,
including documented criteria for isolating a host before full business-owner
approval.

OWNER ACCEPTS / DISPUTES / DEFERS:

## Finding 2 - Tier-1 dismissal pattern was systemic

The Q2 ticket history shows repeated low-friction closure of related alerts,
including SD-40812 and later tickets linked to host-87 activity. This was not
a single analyst error; the process allowed repeated closure without mandatory
correlation across user leave status, source IP, and host telemetry.

Recommendation: require correlation review for any repeated user, source IP,
or host within a rolling seven-day window before Tier 1 may close as benign.

OWNER ACCEPTS / DISPUTES / DEFERS:

## Finding 3 - DPO notification lag created governance risk

The Data Protection Officer was not notified until approximately 36 hours
after Security had enough evidence to suspect customer data exposure. While
GDPR Article 33 includes a 72-hour notification clock, the deeper issue is the
absence of a trigger that brings the DPO into the response room early.

Recommendation: add DPO notification to the high-severity incident checklist,
with owner, timestamp, and escalation evidence captured in the case record.

OWNER ACCEPTS / DISPUTES / DEFERS:

---

# 7. Board Minutes Excerpt {#sec-7}

Meeting: special board session after Q2 incident disclosure

Amaka: "This is the room your memo must survive. Answer the open questions
directly, especially where a control decision has a cost."

## Resolved Questions

Q1: Did customer data leave Sankofa control?  
Resolved: Yes, based on the Stage 3 exfil evidence and the Stage 2 redacted
customer_pii sample. The board asked management to use a conservative affected
count until the offline evidence locker is reconciled.

Q2: Was the legacy-admin system still in business use?  
Resolved: Yes. Engineering confirmed the system remained reachable for support
fallbacks despite prior decommission plans.

Q3: Who owns customer and regulator communications?  
Resolved: General Counsel owns regulator submissions; Comms owns customer
language; Security owns the evidence appendix and technical accuracy.

## Open Questions

Q1: Which single control would have broken the exploit chain earliest: removing
legacy-admin, fixing JWT validation, disabling XML external entities, or
isolating host-87 sooner?

Q2: How many affected customers should we cite before the offline evidence
locker review is complete?

Q3: If we had isolated host-87 at 02:15 instead of 04:08, what would we have
saved?

## Tabled Motion

Motion: approve the first 90 days of a security uplift programme covering
legacy-system containment, SOC correlation rules, DPO escalation workflow, and
the controls needed to justify any later 12-month spend.

Status: tabled until management returns with a risk-ranked roadmap, named
owners, and cost bands.

---

# 8. Lagos Ledger Front Page Transcript {#sec-8}

## THE GRIOT SAT BESIDE THE BOARD

### Leaked addendum names Amaka Eze, Sankofa's trusted Head of Security, as the insider behind the breach persona

**By Nkem Afolabi, Investigations Desk**  
**Dateline:** Lagos, 06:20 WAT  
**Designed cover:** `08-front-page-amaka.html`  
**Portrait used in the cover:** `amaka-eze-cover.jpg`  
**Training note:** This is a fictional newspaper artefact for the Sankofa Digital incident simulation.

For three weeks Sankofa Digital used one name for the attacker: **The Griot**.
It was a useful name because it sounded distant. The board heard it and pictured
someone outside the company wall, someone watching from an offshore server,
someone who did not know the coffee machine on level 9 was broken.

That story collapsed this morning.

Documents reviewed by *The Lagos Ledger* say the breach investigation now points
to a person who sat inside the war room, chaired security reviews, signed off on
analyst notes, and approved the exception path that let the attacker move while
everyone else waited for permission.

**This is it: the Griot was not only inside Sankofa. The Griot was Amaka Eze,
Head of Security.**

The leaked board addendum says investigators have **high confidence** that Amaka
operated the Griot identity or directed the person using it. Counsel's margin
note is careful: "Strong enough for board action. Not clean enough for public
certainty without process." That distinction now sits at the centre of Sankofa's
hardest governance decision.

## What changed overnight

The addendum identifies four facts now under legal hold:

1. A break-glass security account used during the breach window was approved
   from Amaka's privileged-access queue, not from the normal change channel.
2. The host-87 containment delay benefited the attacker and matched an exception
   route only Security leadership could approve without a second sign-off.
3. The Stage 1 cipher note that once read like a threat - "Let Amaka know the
   group is sated" - now reads like an internal status signal.
4. A draft control-mapping note reused phrases from Amaka's earlier board
   language almost word for word: "fund prevention before prevention fails in
   public."

None of those facts alone proves identity. Together, they explain how someone
who knew Sankofa's control language, escalation rituals, and blind spots could
make an external attacker feel plausible for so long.

## The breadcrumbs readers missed

- **Stage 0:** Amaka reopened Q2 ticket `SD-40812` after the previous analyst
  closed it as "probably nothing."
- **Stage 1 task 1:** Amaka placed the staging-server zip in front of the intern.
- **Stage 1 task 3:** The decoded line "Let Amaka know the group is sated" was
  too strange to ignore.
- **Stage 1 task 10:** "Amaka signs this before it goes up" looked like normal
  governance.
- **Stage 2:** The legacy admin chain required knowledge of the old export
  path, token behaviour, and analyst dashboard habits.
- **Stage 3 task 1:** host-87 was not isolated until after the decisive window.
- **Stage 3 task 3:** The time-unlimited `NOPASSWD: less /var/log/*` grant was
  framed as temporary diagnostics.
- **Stage 3 task 7:** A rejected alternate theory said "possible insider abuse"
  but stopped short of naming the control owner.

The reveal shocks because it was never a magic twist. It was a control-owner
story, and the artefacts kept saying so.

## Why would she do it?

People close to Amaka describe someone who had spent three years asking for a
legacy-system retirement budget and being told to "sequence it behind growth."
One former colleague said the old admin platform became personal after a family
cooperative lost money in a fraud wave tied to stale customer records at another
fintech. She rarely spoke about it, but when she did, the phrasing was almost
always the same: "Nobody funds prevention until prevention fails in public."

The leaked notes suggest a motive more complicated than theft and less innocent
than whistleblowing. Amaka may have believed a controlled breach would force the
board to fund prevention: expose the legacy admin risk, force Legal into the
room early, make a quiet failure visible before a worse one arrived.

If that was the plan, it failed at the line that matters. Real customer data
appears to have left Sankofa control. Real people may need GDPR Article 34
notice. A controlled burn still burns.

## The governance failure behind the person

The easy story is "rogue insider." The harder story is that Sankofa built a
system where one trusted person could approve privileged access, shape the
incident narrative, influence containment decisions, and remain the board's main
interpreter of the facts.

The GRC failure is not only that Amaka may have crossed an ethical line. It is
that the line had no independent monitor. Segregation of duties failed.
Privileged access review failed. Exception expiry failed. Board challenge failed.
Legal escalation arrived after the facts were already being framed.

The board's ethical problem now has no clean answer:

- Name Amaka publicly and Sankofa may punish before process, weaken the
  investigation, and expose itself to defamation or labour-law claims.
- Hide her role and Sankofa may look like it protects executives while customers
  carry the harm.
- Use role-based language and the press may call it evasion.
- Reduce the breach to one person's motive and the board may avoid funding the
  controls that would have stopped any insider with the same power.

## Editorial note for the board pack

This front page is an external-pressure artefact. Treat it as a source of public
risk, stakeholder questions, and ethics tension, not as the sole source of
technical proof. Where it makes a factual claim, tie your response back to
Stages 0-3 artefacts, the legal-hold addendum, GDPR Article 33/34 duties, and
the board's obligation to act without pretending uncertainty is innocence.
