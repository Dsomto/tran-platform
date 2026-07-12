# Advanced Stage Track Plan

Ubuntu Bridge Initiative / TRAN Foundation Programme — netforge

Prepared: July 10, 2026
Status: Planning document only. No implementation, no lab build, no artifact JSON. This is the design spec that everything else is built from.

---

## 0. Read This First

This is the **Advanced Stage**, and it is a **final elimination**. **168 interns** enter it. Exactly **9 leave it — the top 3 in each track** (3 SOC, 3 GRC, 3 Ethical Hacking). Everyone here already survived the foundation programme — they can parse a log, map a control, and write a report that reads well. That is exactly the problem: at this level a competent bluffer and a competent analyst produce documents that *look* identical, and a cut this sharp has no room for that ambiguity. Advanced Stage exists to pull those two apart and rank the top three analysts in each track with confidence.

Because the population is small (168, not thousands), difficulty can be pushed to the ceiling and **every intern can be defended orally** — there is no scale excuse for a soft evaluation. The design below assumes brutal difficulty *and* full-coverage defense.

### These are projects, not tests

Nothing in Advanced Stage is a quiz, an exam, or a test-bank question with a hidden "right answer" to guess. **Every deliverable is a real, publishable portfolio project** — the kind of work product an intern puts on GitHub, links from LinkedIn, and hands a hiring manager as a writing sample. A SOC incident case file, a GRC breach-governance pack, a full VAPT report: these are things consultants actually ship. The programme is a production simulation, and the artifact you leave with is proof you did the job, not proof you passed a test.

To make that real, each project separates two things:

- **The evidence pack (input)** — per-intern, confidential *during* the project window. This is what stops copying (see §3).
- **The portfolio artifact (output)** — the intern's own work, describing the fictional Sankofa company with entirely fake data, and therefore **fully publishable once grading closes.** Interns are encouraged to publish, and "publishable quality" is a graded dimension (§3.8). Publishing before the window closes is prohibited — not because the content is secret, but so no one hands the next intern a head start.

The tentative SOC and GRC PDFs (Ibrahim Idris's SOC proposal; the GRC track) are beginner-grade and cannot be reused as-is:

- **SOC** rides a single SSH auth log across all five stages. One dataset, one attack type (brute force → suspicious login → recon), no correlation across sources, no volume, no ambiguity. A strong intern infers the expected answer from the prompt on day one.
- **GRC** is five clean documents produced from five clean prompts. "Map control to framework," "score two risks," "list the laws." Real GRC is deciding what matters when Engineering, Legal, Finance, and the Board disagree and the evidence is thin. None of that is present.
- Both are **single-variant**: every intern sees the same file, so the first correct answer posted anywhere is the answer for everyone.

Advanced Stage is built on five non-negotiable rules. Every project below obeys all five.

1. **Doing, not describing.** Each project requires an artifact that could only be produced by actually performing the work.
2. **Evidence or it didn't happen.** Every claim ties to a specific log line, screenshot, payload, query, packet, clause, control ID, or test result. Generic-but-correct-sounding statements score **zero**, not partial.
3. **Different facts per intern.** Every intern receives a deterministic variant of the case: different company subsidiary, roster, IPs, timestamps, vendor, asset IDs, and seeded false leads. Same skill, different answer.
4. **An employer-recognizable artifact per project.** Not a certificate — a work product a hiring manager would accept as a writing sample.
5. **Defense collapses bluffing.** Projects 4 and 5 require the intern to answer unseen reviewer questions generated from *their own* variant, within 24 hours. You cannot defend evidence you did not actually examine.

This is a production simulation, not a course.

---

## 1. The Shared Case Universe

All three tracks operate inside one fictional company. This is the single biggest upgrade over both the tentative PDFs and the earlier draft: the tracks stop being three unrelated worksheets and become three *roles* responding to the same unfolding story.

### Sankofa Digital Group (SDG)

A Lagos-headquartered digital-services holding company, ~1,900 staff, that grew by acquisition and never integrated its security. It has three subsidiaries, and each track lives primarily in one of them:

| Subsidiary | What it does | Primary track | Data that makes it interesting |
|---|---|---|---|
| **Sankofa Pay** | Fintech / wallet + merchant payments | SOC | Cardholder-adjacent data, PCI DSS scope, high transaction volume, 24/7 ops |
| **AkwaabaHealth** | Telehealth + patient records SaaS | GRC | Patient PII/PHI, EU + California + Nigerian data subjects, heavy regulatory surface |
| **SDG Cloud** | Internal platform / staging estate for the group | Ethical Hacking | The staging clones and vulnerable labs live here — programme-owned, non-production |

### The one incident that threads all three tracks

A single security event runs through the whole cohort, seen from three seats:

- **Ethical Hacking** interns find the weaknesses in SDG Cloud staging *before* anyone exploits them — recon, web chain, API abuse, internal path, full VAPT. Their Project 5 report describes the exact class of flaw that, in the story, later gets exploited in production.
- **SOC** interns detect and reconstruct the compromise of Sankofa Pay — initial access through a weakness the EH track already characterized, then execution, persistence, lateral movement into a shared identity provider, and exfiltration.
- **GRC** interns govern the fallout at AkwaabaHealth — the exfiltrated data included health records of EU, California, and Nigerian subjects, so the breach triggers regulatory obligations, vendor questions, audit exposure, and a board decision.

Why this matters:
- Assets, rosters, IP ranges, and vendor names are **defined once** and reused, so building variants is cheaper.
- The story is coherent: at the end you can run a cross-track showcase where SOC, GRC, and EH each present their slice of the same incident.
- It raises difficulty honestly. An intern's Project 5 references facts a real analyst in that seat would actually have, and the defense questions can probe whether they understand the *other* seats' constraints.

**Canonical fact sheet (build once, before anything else):** company org chart, subsidiary asset inventories, the shared identity provider (call it "SankofaID"), the incident master timeline (ground truth, graders only), the vendor roster, and the regulatory footprint (which data subjects live where). Every variant is a perturbation of this sheet.

---

## 2. Programme Shape

Five projects per track. **41 calendar days.** Difficulty ramps every project; the gate is hard (fail = do not advance).

| Window | Project | Days | Difficulty posture | Revision | Gate |
|---|---|---:|---|---|---|
| Days 1–5 | Project 1 | 5 | Controlled, evidence-heavy, one clear objective | 1 allowed | Pass to continue |
| Days 6–12 | Project 2 | 7 | More artifacts, less guidance, real tooling | 1 allowed | Pass to continue |
| Days 13–21 | Project 3 | 9 | Ambiguous, noisy, multi-source, planted false lead | 1 allowed | Pass to continue |
| Days 22–31 | Project 4 | 10 | Professional-grade, **no revision**, written defense | None | Pass to continue |
| Days 32–41 | Project 5 | 10 | Capstone, **no revision**, written + oral defense | None | Final ranking |

Weekly rhythm per project:
- **Day 1:** brief opens, variant evidence pack released to each intern.
- **Midpoint:** one 60-minute async clarification window. Scope questions only. **No teaching, no hints toward the answer.** Questions and answers are posted publicly so no intern gets a private edge.
- **Final day:** submission closes 23:59 WAT. Late = zero unless pre-approved.
- **Next day:** grading opens.
- Projects 1–3 allow exactly one revision. Projects 4–5 are one-shot on purpose — Advanced Stage tests readiness, and readiness means getting it right the first time.

### Bands, and the winnow to the top 3 per track

This is an elimination, so the gate does two jobs: a hard **pass threshold of 70%** at every project (fail = out), and a **cumulative ranking** that drives the final cut to the **top 3 in each track (9 total)**.

| Band | Score | Meaning |
|---|---:|---|
| Finalist-caliber | 92–100 | Elite. Would pass a real probation with no supervision. The 3-per-track finalists come from here |
| Hire-ready | 85–91 | Strong, but not top-of-track |
| Advancing | 78–84 | Good work; continues but not in contention |
| Borderline | 70–77 | Survives the gate, flagged for audit; effectively out of finalist contention |
| Eliminated | < 70 | Does not advance |

**The final cut (top 3 per track).** Ranking is cumulative across all five projects, **weighted toward the later, harder, no-revision projects** (P1:1× · P2:1× · P3:1.5× · P4:2× · P5:2.5×) so the cut reflects performance under real pressure, not a strong start. Ranking is done **within each track** — a SOC intern is only ever compared to other SOC interns — and the top 3 of each track advance. Ties break on **defense performance**, the least fakeable signal in the programme. Two interns can both "pass" every project and still be separated decisively by the weighted score and their oral defense; that separation is the whole point.

---

## 3. Anti-Copy and Anti-Bluff System

This is the machinery that makes "make it harder" real. It is designed to be **gradeable at scale** — the variance is deterministic, so the grader's answer key is generated from the same seed as the intern's pack.

### 3.1 Deterministic per-intern variants

Each intern has a stable **seed** (their programme ID). A variant generator spec (built in implementation, not here) maps seed → a consistent set of facts:

- Company subsidiary label, employee roster (names, usernames, departments), office locations and time zones.
- IP ranges, asset IDs / hostnames, VPN pools, cloud account IDs.
- Timestamps (the incident happens on a per-intern date/time offset).
- Vendor names, framework scope (one intern is PCI-in-scope, another is HIPAA-adjacent, another NDPA-primary).
- **Seeded false leads** unique to the variant.

Same learning objective, different correct answer. Two SOC interns both investigate "brute force → suspicious success → lateral movement," but one sees SankofaID + AWS CloudTrail + Okta, the other sees on-prem AD + VPN + endpoint EDR. The report that fits intern A's facts is *wrong* for intern B.

### 3.2 Canary facts (mechanical copy detection)

Every variant contains at least two **canary tokens** — a fabricated-but-plausible detail that exists only in that intern's pack:

- A unique fake IOC (e.g., a specific hostname or hash fragment).
- A unique policy clause number, control exception ID, or vendor subprocessor name.

If intern B's report contains intern A's canary, that is near-proof of copying, and it is trivial to detect with a text search across submissions. Canaries are logged in the grader key. This turns anti-copy from a judgment call into a search query.

### 3.3 Evidence appendix required everywhere

Every serious deliverable ends with an evidence table. No appendix = incomplete = fails the auto-check before a human ever reads it.

| Field | What it must contain |
|---|---|
| Claim | The specific assertion being supported |
| Evidence | Log line / query / screenshot ID / payload / clause / control ID |
| Source | File path, artifact ID, tool, or line reference |
| Timestamp / ID | When it happened or which clause/control it maps to |
| Confidence | High / Medium / Low, with one line of reasoning |
| What it does **not** prove | The limit of the evidence |

The "does not prove" column is deliberate. It is the single hardest thing to fake and the fastest way to separate an analyst from a report-writer.

### 3.4 Mandatory "One Mistake I Almost Made"

Every project report includes 100–150 words:

> "One mistake I almost made, why it was tempting, and what specific evidence corrected me."

It must reference the intern's *own* variant facts (a specific IP, clause, or timestamp). This is the strongest single anti-AI and anti-copy device in the plan — a generic answer here is self-evidently generic, and it forces the intern to expose the shape of their reasoning, which a copied artifact cannot supply.

### 3.5 Planted false lead + forced refutation

From Project 3 onward, each pack contains one **plausible but wrong** conclusion the evidence seems to support. The deliverable must explicitly name it and refute it with evidence. Interns who "find" the false lead as their main conclusion fail the accuracy component. Interns who never mention it lose the refutation points. Only interns who saw it, were tempted, and ruled it out score full marks.

### 3.6 Defense round

- **Projects 4 and 5:** every intern answers **three written reviewer questions** within 24 hours, auto-generated from their variant (one on their evidence, one on an alternative explanation, one on a remediation/decision tradeoff).
- **Project 5:** a **15-minute live oral defense for every intern**. At 168 people this is entirely feasible (roughly two grader-days), and in an elimination this sharp the oral is the most important single signal, so no one is exempted. You cannot explain evidence you never examined, defend a decision you did not reason through, or account for a canary that isn't yours.
- **Finalist round:** the top ~6 per track after Project 5 sit a **longer panel defense** (~30 minutes, two reviewers) that decides the final **3 per track**. This is where the cut is actually made.

### 3.8 Publishability as a graded dimension

Because the output is a portfolio piece, every project is also judged on whether the intern could actually publish it and be proud of it. This is a small but real slice of every rubric (folded into "communication quality"):

- Is it self-contained — could a stranger on GitHub understand the scenario, method, and findings without the private evidence pack?
- Is it **sanitized correctly** — fictional Sankofa branding, fake data, no real IPs/tools-that-imply-real-targets, no canary tokens leaking into the public version?
- Would it survive scrutiny — no invented citations, no unsupported claims, no screenshots that don't match the narrative?
- Publishable formats by track: **SOC** — a GitHub repo (queries, detection rules as code/Sigma, IOC CSVs) plus a written case-file README; **GRC** — a polished PDF/Markdown pack (gap report, risk register, breach playbook); **EH** — a professional VAPT report (the repo already contains real examples of this format, e.g. the Bluechip / BluWatch reports — that is the bar).

A brilliant analysis that would embarrass the intern if published is not finished work. A publishable artifact that is also technically correct is the target.

### 3.7 What the combination buys you

Copying survives *one* of these. It does not survive all of them at once: the copier gets the wrong variant's facts (3.1), carries a foreign canary (3.2), cannot fill the "does not prove" column honestly (3.3), writes a generic "mistake" section (3.4), fails to refute the planted lead specific to their pack (3.5), and collapses on defense (3.6). That is the design.

---

## 4. SOC Analyst — Advanced Track

**Track goal.** Operate as a serious junior SOC analyst inside Sankofa Pay: ingest multi-source evidence, triage volume, engineer detections that are useful rather than noisy, reconstruct a real intrusion, communicate risk to leadership, and — critically — refuse to overclaim.

**Graduate competency.** Given a messy, multi-source evidence pack with gaps and decoys, the graduate can produce a correct, evidence-cited incident reconstruction, a tuned detection pack mapped to ATT&CK, and an executive brief, and can defend all three under questioning.

**What "operationally brutal" means here.** Volume, noise, missing intervals, conflicting timestamps, and decoys — the pressure of a real shift, not a clean lab.

**Interns generate their own data.** Alongside the provided SDG packs, SOC interns run a **honeypot they deploy themselves** (Cowrie / T-Pot on their own isolated infrastructure — see §7) and analyze the *real internet attacker traffic they capture*. This makes every intern's dataset genuinely unique and un-copyable, gives the detection and investigation projects live material, and produces a portfolio piece ("what I caught running a honeypot for a week") that is theirs alone.

### SOC Project 1 — Multi-Source Auth Investigation (5 days)

**Scenario.** Sankofa Pay helpdesk reports three account lockouts. The SIEM says "brute force." The SOC lead is not convinced. You get auth logs, VPN logs, the HR roster, an IP-reputation note, and a short endpoint login history — **four sources with two different time zones.**

**Do:** Separate brute force, password spraying, a genuinely suspicious success, and benign noise. Untangle employee travel, VPN churn, and attacker activity. Build a single normalized timeline. Flag 5–8 entities with justification.

**Deliverable:** Investigation report (4–6 pp) · normalized timeline · evidence table (≥ 12 rows) · non-technical executive summary · "what I'd check next" · "one mistake" section.

**Difficulty upgrades (harder than tentative's single log):**
- A legitimate employee **on approved leave** whose account logs in successfully (insider? stolen creds? or the roster is stale? — resolved only by correlating HR + location).
- A scary-looking scanner IP that **never once succeeds** (noise that begs to be over-reported).
- One successful login that is suspicious **only** when correlated across HR + geo + time zone — invisible in any single source.
- Two sources in UTC, one in WAT; naive readers build a wrong timeline.

**Grading:** accuracy 30 · evidence quality 25 · timeline/correlation 20 · clarity 15 · restraint (no unsupported claims) 10.

**Portfolio artifact:** Authentication Investigation Report.

**Grader note:** the fastest fail signal is an intern who reports the scanner IP as the incident. The fastest pass signal is one who explicitly rules it out with the "0 successes" evidence.

### SOC Project 2 — SIEM Build + Data-Quality Truth-Telling (7 days)

**Scenario.** Sankofa Pay has logs but the dashboards lie: ingestion is incomplete and fields are inconsistent across sources. Fix visibility and, harder, **document what you cannot see.**

**Do:** Ingest (or documented-simulate) auth, DNS, proxy, EDR, and cloud logs in Splunk / Elastic / Wazuh. Normalize fields. Build dashboards for failed logins, impossible travel, suspicious process execution, outbound beaconing, and privileged access. Write a data-quality memo naming every blind spot.

**Deliverable:** dashboard screenshots · query pack (SPL / KQL / Lucene / Sigma-style) · data-quality memo (missing fields, broken timestamps, parsing assumptions, blind-spot risk) · "one mistake" section.

**Difficulty upgrades:**
- One source in UTC, another in local time — impossible-travel logic breaks unless normalized first.
- The same human appears as `o.adegoke`, `Olu Adegoke`, and `olu.adegoke@sankofapay.com`; correlation fails until identities are unified.
- The "top attacker IP" is a **NAT gateway** — a false lead that punishes anyone who trusts the dashboard over the raw data.
- One log source is silently truncated; the honest answer is "I have a blind spot here," and the memo must say so.

**Grading:** working dashboards 25 · query correctness 25 · normalization 20 · operational usefulness 15 · **data-quality honesty 15** (naming your own blind spots scores; pretending completeness fails).

**Portfolio artifact:** SIEM Dashboard + Data-Quality Memo.

### SOC Project 3 — Detection Engineering Sprint (9 days)

**Scenario.** Recurring attacker behavior is slipping through. Build detections that are useful, not noisy — and prove it.

**Do:** Write **6** detection rules: password spraying · success-after-failures · suspicious PowerShell/shell exec · outbound beaconing · privilege escalation (sudo/admin) · **SankofaID / cloud identity abuse** (impossible travel or token reuse). For each: ATT&CK tactic + technique, test events that *should* and *should not* fire, a chosen threshold with a defended tradeoff, and an explicit "what this rule misses."

**Deliverable:** Detection Engineering Pack — rule logic · test data · false-positive analysis · severity rubric · escalation recommendation · "one mistake" section. **Planted false lead appears here:** one "obvious" rule that would fire constantly on legitimate admin automation; the intern must recognize and tune or reject it.

**Difficulty upgrades:**
- Normal admin behavior sits one hair away from malicious; naive rules drown the SOC.
- Every rule must ship with the input events that prove it fires correctly *and* the events that prove it stays quiet.
- "What this rule misses" is mandatory per rule — a detection engineer who thinks their rule is complete is the failure mode.

**Grading:** detection logic 30 · test cases 20 · false-positive handling 20 · ATT&CK mapping 15 · operational clarity 15.

**Portfolio artifact:** Detection Engineering Pack.

### SOC Project 4 — Alert Queue Triage Under Pressure (10 days, no revision, written defense)

**Scenario.** You inherit a **30-alert** weekend queue. Some are duplicates, some are false positives, some are fragments of one real incident hiding in the low-severity noise.

**Do:** Classify every alert (true positive / false positive / benign true positive / duplicate / needs-escalation). Group related alerts into cases. Escalate the top 3 with evidence-backed priority. Write closure notes for the rest. Answer 3 written defense questions in 24 h.

**Deliverable:** Alert Triage Workbook · escalation notes · closure notes · case-grouping map · defense answers · "one mistake" section.

**Difficulty upgrades:**
- Alerts are intentionally repetitive to test discipline under fatigue.
- **Several low-severity alerts chain into the critical incident** — the whole point is that severity labels lie.
- Some high-severity alerts are harmless in context and should be closed with a clean note.
- A duplicate cluster tempts the intern into "resolved x8" when it's one thing.

**Grading:** triage accuracy 30 · prioritization 25 · evidence + case grouping 20 · closure-note quality 15 · discipline/concision 10.

**Portfolio artifact:** Alert Triage Workbook.

### SOC Project 5 — Incident Commander Capstone (10 days, no revision, written + oral defense)

**Scenario.** The Sankofa Pay compromise is real. You get the full multi-source pack: SIEM export, endpoint process list, memory strings, DNS/proxy logs, cloud audit logs (SankofaID), HR roster, prior tickets. Reconstruct the whole intrusion and brief leadership.

**Do:** Reconstruct initial access → execution → persistence → privilege escalation → lateral movement (into the shared identity provider) → exfiltration → containment. Extract IOCs. Write the incident report around Prepare / Identify / Contain / Eradicate / Recover / Lessons-Learned. Rate confidence on every major claim. Brief leadership. Defend.

**Deliverable:** full incident report (10–15 pp) · IOC CSV · attack timeline · ATT&CK map · 1-page executive brief · written defense answers · oral defense · "one mistake" section.

**Difficulty upgrades:**
- **Decoy malware strings** that lead nowhere — reporting them as the root cause fails.
- **Missing log intervals** — the honest reconstruction says "gap here, medium confidence," not a fabricated bridge.
- **One plausible-but-wrong root cause** the evidence flirts with; must be named and refuted.
- Confidence ratings mandatory; a report with no "low confidence" anywhere is treated as overclaiming.
- The exfiltration links to AkwaabaHealth data — connecting that cross-subsidiary blast radius is the top-band signal.

**Grading:** attack reconstruction 25 · evidence quality 20 · IOCs + timeline 15 · remediation 15 · executive communication 15 · defense 10.

**Portfolio artifact:** Incident Response Case File.

---

## 5. GRC Analyst — Advanced Track

This is the track that had to change the most. The tentative GRC PDF asks for a clean document from a clean prompt at every stage — map the control, score the two risks, list the laws. That is data-entry, not governance. **Advanced GRC is intellectually brutal:** the inputs conflict, the stakeholders disagree, the evidence is weak or stale, the "right" answer is a defensible judgment call, and the intern has to own it in front of a board.

**Track goal.** Translate messy technical and business reality at AkwaabaHealth into policy, risk decisions, audit evidence, vendor rulings, regulatory obligations, and board-ready recommendations — and defend the tradeoffs.

**Graduate competency.** Given conflicting stakeholder inputs and imperfect evidence, the graduate can produce a defensible decision (not just an analysis), cite the specific framework clause or regulation that backs it, quantify the residual risk honestly, and hold the position under board-level questioning.

**Every GRC project is built on conflict.** Each pack ships with at least two stakeholder positions that cannot both win (Engineering vs. Legal, Procurement vs. Security, Finance vs. the Board). The intern must **decide and justify**, not summarize both sides.

### GRC Project 1 — Policy Failure & Control-Gap Review (5 days)

**Scenario.** AkwaabaHealth grew 30 → 300 staff. Its acceptable-use, remote-work, BYOD, access-control, and data-classification policies are stale. Engineering calls policy "paperwork." Legal says the gap is now a regulatory exposure because patient data is in scope. **They disagree in writing, in the pack.**

**Do:** Review 4–5 policy excerpts. Find contradictions and missing controls. Map gaps to NIST CSF 2.0, ISO/IEC 27001:2022 Annex A, **and NDPA 2023** obligations. Draft a focused, enforceable policy addendum. Take a side on the Engineering/Legal conflict and justify it.

**Deliverable:** Policy Gap Report · 2-page addendum · control-mapping table · a risk statement per major gap · "one mistake" section.

**Difficulty upgrades:**
- One clause **looks outdated but is still acceptable** — flagging it as a gap is a false positive that costs points.
- One modern control exists in a tool but is **not mandated by policy** (the gap is governance, not technology).
- A genuine conflict between **employee privacy and monitoring** that has no clean answer — the intern must rule and defend.

**Grading:** gap identification 25 · practical/enforceable drafting 20 · framework mapping 20 · business-risk explanation 20 · clarity 15.

**Portfolio artifact:** Policy Gap Report + Addendum.

### GRC Project 2 — Vendor Risk *Decision*, Not Checklist (7 days)

**Scenario.** AkwaabaHealth wants to onboard a payroll/HR vendor that will process employee and (through an integration) some patient-adjacent data. Procurement wants sign-off **today**. You hold a SOC 2 Type II excerpt, a completed questionnaire, a DPA excerpt, a subprocessor list, and a breach-notification clause — and they don't fully agree with each other.

**Do:** Find control exceptions. **Cross-check questionnaire claims against the audit evidence** (the vendor's self-report and its auditor's findings conflict on at least one control). Evaluate subprocessor risk. **Rule:** approve / conditionally approve / reject / defer — and write the conditions. Draft follow-up questions and contract redlines.

**Deliverable:** Vendor Risk Memo · vendor risk register · decision-with-conditions · follow-up questionnaire · contract-clause redline notes · "one mistake" section.

**Difficulty upgrades:**
- Vendor has strong encryption but **weak offboarding/data-deletion** — the trap is approving on the strength of the good control.
- One subprocessor has **no independent assurance** at all.
- The breach clause says "notify after confirmation," which is **too slow for AkwaabaHealth's own NDPA/GDPR obligations** — the intern must catch that the vendor's timeline breaks the customer's legal timeline.
- The questionnaire claims a control the SOC 2 marks as an exception. Trusting the questionnaire fails the cross-check component.

**Grading:** risk identification 25 · decision quality 20 · evidence cross-checking 20 · contract/control conditions 15 · privacy impact 10 · executive clarity 10.

**Portfolio artifact:** Vendor Risk Assessment Memo.

### GRC Project 3 — Enterprise Risk Register + Budget Tradeoff (9 days)

**Scenario.** The board funds **only three** security initiatives this quarter. You get an asset inventory, a vuln-scan summary, incident history, cyber-insurance requirements, and a business-priorities memo. Finance and Security want different things.

**Do:** Build a risk register (8–10 risks). Score inherent and residual risk. Assign owners. Choose treatment (accept / mitigate / transfer / avoid). **Rank the top three investments and explicitly defer at least three real risks** — in writing, owning the deferral.

**Deliverable:** risk register · 1-page budget recommendation · **deferral list with justification** · assumption log · "one mistake" section. **Planted false lead:** the scariest-sounding vuln (critical CVSS) sits on a **low-value, isolated asset**; a medium finding sits on a **crown-jewel** system. Ranking by CVSS alone fails.

**Difficulty upgrades:**
- Critical vulns on low-value assets; medium findings on crown jewels — business context must override the scanner.
- One expensive control is genuinely attractive but **not the first-quarter priority**; choosing it burns the budget.
- The insurance requirement forces one specific control regardless of ranking — a real-world constraint the intern must honor.

**Grading:** risk-statement quality 25 · scoring rationale 20 · treatment practicality 20 · budget prioritization 15 · ownership clarity 10 · **deferral discipline 10** (deferring real risk on purpose, and saying so, is a senior skill).

**Portfolio artifact:** Enterprise Risk Register.

### GRC Project 4 — Audit Readiness & Evidence Binder (10 days, no revision, written defense)

**Scenario.** AkwaabaHealth is preparing for ISO 27001 certification and a customer security audit. IT claims the controls are in place. The evidence is scattered, stale, and in one case **contradicts** IT's claim.

**Do:** Map 10–12 controls to evidence. Classify each compliant / partially / non-compliant / not-tested. **Grade the evidence itself:** strong / weak / missing / stale. Build a remediation tracker. Write an auditor-facing evidence binder and a management representation memo. Answer 3 defense questions in 24 h.

**Deliverable:** audit-readiness matrix · evidence binder · remediation tracker · management representation memo · defense answers · "one mistake" section.

**Difficulty upgrades:**
- Screenshots exist but are **outdated** — accepting them as evidence is the failure.
- A policy exists on paper with **no operational evidence** it's followed — "documented" ≠ "compliant."
- A tool covers *most* in-scope assets but not all — partial compliance dressed as full.
- IT's self-assessment says "compliant"; the evidence says "partial." The binder must tell the truth to the auditor, not flatter IT. **Honesty is a graded axis** — overclaiming compliance in an audit binder is the cardinal sin of the profession.

**Grading:** control interpretation 25 · evidence-quality assessment 25 · gap/remediation practicality 20 · audit-ready organization 15 · **honesty / no overclaiming 15**.

**Portfolio artifact:** Audit Evidence Binder.

### GRC Project 5 — Breach Governance Capstone (10 days, no revision, written + oral defense)

**Scenario.** The Sankofa Pay compromise (SOC track) exfiltrated data that lands in AkwaabaHealth's lap: health-related PII of **EU, California, and Nigerian** subjects. Technical containment is underway; governance is behind. You get the technical incident summary, a data inventory, customer geography, DPO notes, board minutes, draft customer comms, and external audit findings — **some facts confirmed, some still under investigation.**

**Do:** Determine which obligations are triggered (**GDPR Arts. 33/34, CCPA/CPRA, NDPA 2023 / NDPC guidance**, PCI DSS where card-adjacent). Build the regulatory timeline against the real discovery date. Draft the regulator-notification outline. Draft customer-notification language. Identify the compliance failures that let it happen. Prepare a board memo and a 30/60/90 remediation roadmap. Defend, orally.

**Deliverable:** Breach Notification & Compliance Report · regulatory timeline · draft notifications · board memo · 30/60/90 roadmap · written + oral defense · "one mistake" section.

**Difficulty upgrades (this is where GRC gets genuinely hard):**
- **Multiple jurisdictions with different clocks** — GDPR's 72-hour supervisory-authority window, NDPA's own timeline, California's requirements. The intern must run three clocks at once from one discovery date.
- **The board wants a single number** (records affected / expected fine); the evidence only supports a **range**. The intern must present the range and refuse the false precision — and defend that refusal.
- A **"what we should NOT say yet"** section is mandatory: some facts are unconfirmed, and premature disclosure creates legal exposure. Knowing what to withhold is the senior move.
- One obligation is a genuine judgment call (does this data type trigger notification under this specific regime?) with citation required either way.

**Grading:** legal/regulatory reasoning 25 · timeline accuracy 20 · board-level recommendation 20 · notification quality 15 · compliance root-cause 10 · defense 10.

**Portfolio artifact:** Breach Governance Case Pack.

---

## 6. Ethical Hacking / VAPT — Advanced Track

**Track goal.** Scope, test, exploit, document, retest, and communicate vulnerabilities in a **permissioned, programme-owned** environment (SDG Cloud staging) without causing harm — behaving like a consultant, not a script-runner.

**Graduate competency.** Given a written scope against a staging estate, the graduate can map the attack surface, prove chained vulnerabilities with least-harm evidence, abuse APIs and auth safely, move through an internal lab to meaningful impact, write a professional VAPT report, retest fixes, and defend every finding.

**What "technically brutal" means here.** Depth and proof, not chaos. The difficulty comes from chaining, from decoys that look exploitable but aren't, and from being held to a real report standard — never from touching anything live.

> **This entire track runs on programme-owned, intentionally vulnerable, isolated labs. See §7 for the hard safety constraints. They are non-negotiable and gate every project.**

### EH Project 1 — Recon & Attack-Surface Map (5 days)

**Scenario.** You're assigned an SDG Cloud staging estate: marketing site, API, admin portal, object storage, Git repo excerpts, DNS records — with decoys mixed in.

**Do:** Map assets. Identify exposed services. Fingerprint tech. Find low-risk misconfigurations. Produce an attack-surface map and a prioritized, written test plan with an explicit scope table.

**Deliverable:** Attack-Surface Report · scope table (in / out / unknown) · prioritized test plan · evidence appendix · "one mistake" section.

**Difficulty upgrades:**
- Duplicate domains, parked domains, and **decoy services** that waste time if not verified.
- One **tempting out-of-scope target** — touching it is an automatic scope violation and a fail, not a bonus.
- Stale Git references that require verification before they can be claimed.

**Grading:** scope discipline 25 · recon completeness 25 · prioritization 20 · evidence quality 15 · professional test plan 15.

**Portfolio artifact:** Recon & Attack-Surface Report.

### EH Project 2 — Web Exploitation Chain (7 days)

**Scenario.** A vulnerable staging app has several flaws, but **only a chain** reaches sensitive (fake) data.

**Do:** Discover and *prove* ≥ 4 vulnerabilities. **Chain ≥ 2** to escalate impact. No destructive testing. Capture least-harm proof. Propose remediations.

Planted vuln menu (pack picks a per-intern subset): IDOR/BOLA · SQLi or NoSQLi · stored + reflected XSS (different impact) · weak JWT validation · file-upload bypass · SSRF against *simulated* metadata · broken access control on admin routes.

**Deliverable:** Technical Finding Pack — reproduction steps · payloads · screenshots · risk rating · remediation · "one mistake" section.

**Difficulty upgrades:**
- One vuln is **real but low-impact alone** — it only matters inside the chain.
- One vuln **looks exploitable but is blocked by context** (a WAF rule, a server-side check) — claiming it without proof fails.
- A **working exploit proof is required**, not a claim. "I believe this is vulnerable" scores zero.

**Grading:** valid vuln proof 30 · chain reasoning 20 · safe-testing discipline 20 · remediation 15 · report clarity 15.

**Portfolio artifact:** Web App Pentest Finding Pack.

### EH Project 3 — API & Auth Abuse (9 days)

**Scenario.** SDG Cloud exposes mobile/API endpoints. The UI hides dangerous paths; the API accepts them.

**Do:** Build an endpoint inventory. Test authn, authz, rate limiting, object access, mass assignment, and business logic. Demonstrate impact with least-harm proof. Compare token roles (normal user / manager / admin). Write a risk-based API report.

**Deliverable:** API test matrix · endpoint inventory · top-5 findings · Postman/Burp collection (or equivalent evidence) · remediation · "one mistake" section. **Planted false lead:** one endpoint *looks* like broken object-level auth but is correctly protected server-side; reporting it as BOLA without proof fails.

**Difficulty upgrades:**
- A real BOLA that only surfaces through **ID enumeration** across roles — invisible to a single-account test.
- A **rate-limit bypass** requiring header/session variation, not brute force.
- Mass-assignment that grants privilege only when a specific hidden field is set.

**Grading:** endpoint coverage 25 · authorization-testing depth 25 · business-logic understanding 20 · exploit evidence 15 · remediation 15.

**Portfolio artifact:** API Security Assessment.

### EH Project 4 — Internal Network / AD-Lite Lab (10 days, no revision, written defense)

**Scenario.** You get access to an **isolated** lab network. Move from foothold to meaningful risk **without touching anything outside the lab.**

**Do:** Enumerate services. Find weak credentials / exposed secrets. Exploit a vulnerable service. Escalate privileges on a controlled host. Document lateral-movement *possibilities* without unnecessary exploitation. **Stop at the agreed proof-of-impact.** Answer 3 defense questions in 24 h.

Suggested lab components: Linux host with sudo misconfig · Windows/AD-lite or simulated domain data · SMB share with (fake) secrets · vulnerable internal web panel · misconfigured database/backup.

**Deliverable:** Internal Assessment Report · attack-path diagram · credential-handling notes · remediation plan · retest checklist · defense answers · "one mistake" section.

**Difficulty upgrades:**
- Many low-value findings, **one high-value path** — the skill is finding the path, not the pile.
- **Decoy / expired credentials** that waste time.
- A hard stop at proof-of-impact — going further to "prove domain admin" when the scope said stop is a **safety fail**, not extra credit.

**Grading:** enumeration discipline 25 · valid exploit path 25 · privilege/lateral reasoning 20 · **safety & scope control 15** · remediation 15.

**Portfolio artifact:** Internal Pentest Attack-Path Report.

### EH Project 5 — Full VAPT Capstone + Retest (10 days, no revision, written + oral defense)

**Scenario.** A scoped assessment of a programme-owned SDG Cloud staging environment. Behave like a consultant: scope, test, report, brief, retest, defend.

**Do:** Write a rules-of-engagement page. Run recon + web + API + internal testing. Submit a professional VAPT report. Prioritize findings by **business impact**, not raw severity. Retest two "fixed" vulnerabilities (or write a retest plan if fixes aren't deployed). Rewrite one finding for an executive audience. Defend, orally.

**Deliverable:** executive summary · technical findings · CVSS/risk rationale · attack-chain narrative · evidence appendix · remediation roadmap · retest results · written + oral defense · "one mistake" section.

**Difficulty upgrades:**
- **12–18 planted issues, only 5–7 that matter** — signal-vs-noise is the test.
- At least one **chained critical** that no single finding reveals.
- One **"won't fix" business tradeoff** requiring professional judgment (the fix breaks a legitimate function; the consultant recommends compensating controls instead).
- One finding must be **rewritten for executives** — technical validity and executive communication are graded separately.
- The class of flaw the capstone reports maps to the initial-access vector in the SOC track's incident. Interns who connect that are top-band.

**Grading:** technical validity 25 · chaining & impact 20 · report quality 20 · remediation & retest 15 · scope/safety professionalism 10 · defense 10.

**Portfolio artifact:** Full VAPT Report.

---

## 7. Self-Hosted Open-Source Lab Model & Safety

The programme does **not** build or host the labs, and interns **never** touch netforge / SDG production systems. Instead, each intern **provisions well-known open-source environments on their own infrastructure** — their laptop (Docker/VM), a personal VM, or their own free-tier cloud account — and works against *that*. This is cheaper for the programme, harder for the intern, more realistic, and it produces artifacts that are genuinely theirs to publish.

**Hard rule (the user's constraint, non-negotiable):** it must not run on programme systems, and it must not endanger programme systems. Everything lives on intern-owned, isolated infrastructure. A honeypot or vulnerable app that can pivot into anything real, or that is stood up on netforge/SDG estate, is an automatic fail.

### 7.0 Authorization & Legitimacy (read this if any part feels "malicious")

Nothing in this programme is malicious hacking, and it should not be mistaken for it. This is **authorized, permissioned security education** — the same model used by OSCP, SANS, TryHackMe, HackTheBox, and university security courses worldwide. What makes offensive-security training legitimate is *context*, and every element of that context is satisfied here:

- **Interns attack only software they own and deliberately installed to be attacked.** OWASP Juice Shop, DVWA, Metasploitable, and the rest are *published for exactly this purpose*. Honeypots analyze traffic sent to the intern's own sensor.
- **No real targets, ever** — no third party, no production system, no real personal data, no netforge/SDG estate.
- **Written scope on every project**, with hard safety gates (§7.4). Touching anything out of scope or not owned is an automatic fail.
- **The goal is defensive.** You learn how attacks work so you can detect, govern, and remediate them — which is why the deliverables are detection rules, risk registers, audit binders, and remediation-focused VAPT reports, not attack tooling.

Automated content filters sometimes flag the vocabulary (exploit, payload, attack) because those words also appear in genuine wrongdoing. The distinction that makes this lawful and ethical is the permissioned, self-owned, educational context above. Stating that context plainly — as this section does — is itself part of professional practice.

### 7.1 Where it runs vs. where it's submitted

Draw this line hard and repeat it to interns:

- **The environment runs off-programme, on the intern's own infrastructure** — laptop (Docker/VM), personal VM, or their own free-tier cloud. Never on netforge / SDG. The programme hosts nothing and is never a target.
- **The report/artifact is submitted on netforge** — the platform is only ever the submission and grading surface. The intern's evidence appendix, screenshots, seed markers, and provisioning log are what land on our system; their running lab does not.

This is the whole point of the model: we carry zero lab-hosting risk and cost, and the intern owns real infrastructure they set up and can talk about.

### 7.2 Curated open-source catalog (proven to work)

Everything below is **mature, widely deployed, and has an official one-command Docker image or a well-trodden install** — chosen so setup is not the challenge; the *work* is. The programme assigns from this menu (or lets interns pick within a tier), issues a per-intern **seed** (unique flag/data marker/config) and a written scope, and holds the grading key. Interns "find and stand up" the target themselves — part of the assessment is that they can provision a real environment from public instructions.

**Ethical Hacking — web (difficulty ↑ down the list):**
- **OWASP Juice Shop** — modern JS single-page app, dozens of challenges with a built-in scoreboard; extremely reliable Docker image. Baseline.
- **DVWA** / **bWAPP** — classic LAMP vulnerable apps with adjustable security levels; rock-solid.
- **OWASP WebGoat + WebWolf** — guided-but-deep lessons; official Docker.
- **OWASP Mutillidae II** — broad, messy, closer to a real app's sprawl.

**Ethical Hacking — API / modern:**
- **VAmPI** — deliberately vulnerable REST API, tiny and dependable. Baseline.
- **OWASP crAPI** — "completely ridiculous API," full OWASP API Top 10, realistic microservice stack. Hard.
- **DVGA** (Damn Vulnerable GraphQL App) — GraphQL-specific abuse. Hard, distinctive.

**Ethical Hacking — internal / network / AD:**
- **Metasploitable 2** — dependable single-host foothold + privesc. Baseline.
- **Vulhub** — hundreds of reproducible CVE-per-container scenarios; pick a specific CVE lab. Mid.
- **vulnerable-AD** / **GOAD** (Game of Active Directory) — self-hostable Active Directory attack range. Hard; the capstone-grade internal target.

**SOC — self-collected live data (the anti-copy engine):**
- **Cowrie** — SSH/telnet honeypot; captures **real internet attacker sessions**, keystrokes, downloaded payloads. Very reliable. Every intern's capture is unique.
- **T-Pot** — CE all-in-one multi-honeypot platform (needs a small cloud VM); richer, harder, produces a spectacular dashboard.
- **DShield** sensor — lightweight, feeds a real community threat platform.

**SOC — analysis stack (intern's own host):**
- **Wazuh** (SIEM/XDR, official Docker) · **Elastic / ELK** · **Splunk Free** · **Security Onion** (heavier, sensor-grade). Ingest honeypot captures + provided SDG packs, build dashboards, write detections.

**GRC — real open-source subjects to govern (this is what makes GRC hands-on, not paperwork):**
- Interns **threat-model, risk-assess, and audit a real, running open-source product** as if it were a vendor or an internal system — with real evidence they can point to. Reliable, self-hostable subjects: **Nextcloud**, **Mattermost**, **Gitea**, **Ghost**, **Metabase**, **Keycloak** (identity — rich for access-control review).
- Governance/analysis tooling they run themselves: **OWASP Threat Dragon** (threat modeling), **OpenSCAP** / **Lynis** (config-compliance scanning to produce audit evidence), **Eramba** or **GRC-style** open registers. They scan a real deployment, capture real findings, and build the register/audit binder from evidence *they generated* — not a prompt.

The honeypot line is the standout for anti-copy: two SOC interns who both "analyze SSH brute force" are looking at **completely different real attackers** at their own timestamps — un-copyable by construction, and a strong standalone portfolio piece. The GRC line is what finally makes that track hands-on: an audit binder built from a real OpenSCAP scan of a real Keycloak deployment is evidence-backed in a way "map the control to the framework" never was.

### 7.3 Proof-of-setup (anti-fabrication + anti-copy)

Because the intern owns the box, they must prove the box is theirs and live:

- A **unique seed marker** the programme issues (a flag string, a seeded username, a specific port/banner) must appear in their setup screenshots and in their captured data / exploit proofs.
- A short **provisioning log**: install commands, versions, a `docker ps` / service listing, and a timestamped "it's running" screenshot showing the seed.
- For honeypots: the sensor's own first-boot timestamp and public-facing evidence (their own IP redacted) so the capture window is verifiable and clearly *theirs*.

An intern who cannot show their environment running with their seed cannot have done the work — the submission fails the auto-check.

### 7.4 Safety gates (every one is pass/fail — a violation fails the project regardless of technical quality)

- **Written scope before every project.** Defines in-scope, out-of-scope, and the hard stop.
- **Self-hosted, isolated targets only.** Never programme/SDG/production systems, never someone else's system, never a live third party.
- **Honeypots must be contained** — isolated network segment, no inbound path to anything the intern cares about, no outbound abuse. A honeypot is bait, not a launch pad.
- **No persistence** on any real system. **No destructive payloads** — least-harm proof only.
- **No real phishing**, no social engineering of real people.
- **No exfiltration of actual personal data** — the vulnerable apps ship with fake data; keep it fake.
- **No public disclosure of anything real.** Publishing your *own fictional-lab / honeypot-capture* write-up after the window is encouraged (§3.8); publishing a real vulnerability in someone else's system is a fail and, off-programme, a crime.
- **Touching an out-of-scope or non-owned target is an automatic fail** — even if it was easy, even if it was interesting.

---

## 8. Cross-Track Grading Model

Each track keeps its own per-project rubric (above). For **final programme ranking across all three tracks**, normalize onto one competency model so SOC, GRC, and EH interns can be compared without pretending they do the same job.

| Competency | Weight | What it measures |
|---|---:|---|
| Technical / domain accuracy | 30% | Did they get it right, completely? |
| Evidence discipline | 25% | Every claim tied to specific proof; honest "does not prove" |
| Professional judgment | 20% | Decisions and tradeoffs under ambiguity, not just analysis |
| Communication quality | 15% | Executive-legible, structured, defensible |
| Independence & defense | 10% | Held up under unseen questions on their own work |

Ranking normalizes **within track first** (so a hard EH variant isn't punished against an easy GRC one), then maps bands onto the shared model for the final cut. Defense performance is the tiebreaker — it is the least fakeable signal in the whole programme.

---

## 9. Grader Operating Model

Advanced Stage fails if 168 beautiful, inconsistent documents hit graders with no standard — and in a 168 → ~3 elimination, an inconsistent grade is not a minor error, it eliminates the wrong person. The whole anti-copy system (§3) is deterministic precisely so grading stays consistent and defensible.

**Per project, prepared before launch:**
- One rubric.
- **One answer key generated from each variant seed** (the same generator that made the intern's pack makes the grader's key — so the key already knows this intern's canaries, false lead, and correct IPs/clauses).
- One sample **excellent**, one **borderline**, one **fail** submission for calibration.
- A **red-flag list:** generic AI phrasing, unsupported claims, invented citations, impossible screenshots, missing evidence appendix, foreign canary present, false lead adopted as main conclusion.

**Review flow:**
1. **Auto-check** submission completeness (all deliverables present, evidence appendix present, "one mistake" section present, word counts met). Incomplete = auto-return, no human time spent.
2. **Canary scan** across the cohort's submissions — flag any report carrying another intern's canary.
3. **Human grader** scores against the rubric using that intern's variant key.
4. **Second reviewer audits** everything scored **< 70 or ≥ 85** (the elimination line and the finalist-contention band), plus every canary flag. At 168 interns this is a light load and worth doing thoroughly — a mis-scored 91 could cost someone a finalist slot.
5. **Defense:** written on Projects 4–5; **live oral on Project 5 for every intern**; a longer panel for the top ~6 in each track.
6. **Rank within each track**, weighted toward the later projects (§2); the top 3 per track advance.

**Grader load at 168 interns:** the auto-check + canary scan removes incompletes and copies before humans read; the variant key means a grader isn't re-deriving the right answer each time. Budget ~20–30 min per complete submission at Projects 1–3, ~45–60 min at Projects 4–5 including written defense, plus ~15 min of oral per intern on Project 5 (~2 grader-days total for the whole cohort's orals). This is comfortably within reach for a small cohort — there is no scale excuse for skipping defense.

---

## 10. Artifact-Pack Production Plan

For each of the 3 tracks × 5 projects (15 packs), build:

- **Mission brief** — scenario, tasks, deliverables, difficulty upgrades, "one mistake" requirement, rubric.
- **Evidence pack** — the variant-generated data (logs / policies / lab / API collection) with seeded false lead(s) and canaries.
- **Rubric** — the scoring table.
- **Marking guide** — grader-facing, with the variant answer key and red-flag list.
- **Sample answers** — excellent / borderline / fail for calibration.
- **Variant generator spec** — seed → facts mapping, canary placement rules, false-lead placement rules.

**The programme builds briefs, seeds, scopes, and grading keys — not labs.** Under the self-hosted open-source model (§7), interns provision the environments themselves, so there is no lab to host or reset. What the programme produces per project is the mission brief, the per-intern seed, the written scope, the answer/grading key, and the calibration samples.

**Data-fidelity by track:**
- **SOC:** CSV/log packs suffice for the provided-scenario projects; the honeypot captures are intern-generated (Cowrie/T-Pot on their own infra), so they need no authoring at all and are unique for free. Analysis stack (Wazuh/Elastic/Splunk) is intern-hosted.
- **GRC:** PDF/Markdown/CSV artifacts (fake policies, SOC 2 excerpts, contracts, board minutes) plus a **named real OSS subject** the intern self-hosts and scans (§7.2). Variance comes from swapping vendors, jurisdictions, conflict positions, and the assigned OSS subject.
- **EH:** **no programme lab build.** Interns self-deploy from the vetted catalog (§7.2). The programme only issues the seed/flag set, the scope, and the grading key per project. This removes the single most expensive line item from the earlier plan.

---

## 11. Suggested Timeline (41 days, with build lead-time)

| Phase | When | Work |
|---|---|---|
| Universe design | Before Day 1 | Build the SDG canonical fact sheet, incident master timeline, variant/seed generator spec |
| Brief + seed authoring | Before Day 1 | Mission briefs, per-intern seeds/flags, written scopes, grading keys. **No lab build** — interns self-host from the §7.2 catalog |
| Setup validation | Before launch | Confirm every catalog target still installs cleanly from its official image; write a one-page setup guide per target so setup never becomes the blocker |
| Pilot | Before launch | Run all 15 packs against 5–10 trusted alumni on *their own* infra; time each project; check answer convergence; tighten rubrics |
| **Project 1** | Days 1–5 | Controlled, evidence-heavy |
| **Project 2** | Days 6–12 | Tooling + honesty |
| **Project 3** | Days 13–21 | Noisy, multi-source, first planted false lead |
| **Project 4** | Days 22–31 | Professional-grade, no revision, written defense |
| **Project 5** | Days 32–41 | Capstone, no revision, written + oral defense |
| Oral defense (all) | Days 42–43 | 15-min live defense for every intern on their Project 5 |
| Finalist panels | Days 44–45 | Top ~6 per track sit a ~30-min two-reviewer panel; the **3 finalists per track (9 total)** are chosen here |
| Cross-track showcase | Day 45+ | The 9 finalists present their slice of the shared incident |

**Do not launch until:** graders have marking guides and variant keys; all artifacts are accessible; EH scope docs are written and labs reset cleanly; the canary scan and auto-check are wired; the defense-question process is ready.

---

## 12. Why This Beats the Tentative Plan

| Dimension | Tentative PDFs | This Advanced plan |
|---|---|---|
| **SOC data** | One SSH auth log across all 5 stages | Multi-source packs (auth, VPN, DNS, proxy, EDR, cloud/SankofaID), time-zone conflicts, missing intervals, decoys |
| **GRC difficulty** | Clean document from clean prompt | Stakeholder conflict, weak/stale evidence, multi-jurisdiction clocks, board number-vs-range, forced decisions |
| **EH depth** | Not present at advanced level | Full lifecycle: scope → recon → chained web → API/auth → internal path → VAPT + retest, all lab-safe |
| **Labs & cost** | Implied programme-hosted labs | **Interns self-host proven open-source targets** (Juice Shop, VAmPI, GOAD, Cowrie, Keycloak…); programme hosts nothing, only receives reports |
| **Output** | Reports for a mentor to grade | **Publishable portfolio projects** — GitHub repos, VAPT reports, honeypot write-ups the intern can post on LinkedIn |
| **Copying** | Single variant — one answer for everyone | Deterministic per-intern variants + canary tokens + real self-collected honeypot data (unique by construction) |
| **Bluffing** | Report-writing rewards fluency | "Does not prove" column, "one mistake" section, planted false lead, written + oral defense |
| **Coherence** | Three unrelated worksheets | One company (SDG), one incident, three seats — cross-track showcase |
| **Grading at scale** | Four generic criteria, judgment-heavy | Per-variant answer keys, auto-check, canary scan, bounded second-review, calibration samples |
| **Realism** | "Was this an attack? Why or why not?" | "Decide, cite the clause, quantify residual risk, and defend it to the board" |

---

## 13. Recommended Final Decision

Run all three tracks on the same five-project shape, inside one shared company (Sankofa Digital Group), threaded by one incident:

- **SOC** — detect, engineer detections, reconstruct, respond. *Operationally* brutal (volume, noise, gaps).
- **GRC** — govern policy, vendors, risk budget, audit evidence, breach obligations. *Intellectually* brutal (conflict, ambiguity, judgment).
- **Ethical Hacking** — scope, recon, exploit, chain, report, retest. *Technically* brutal (depth and proof) — and **provably safe**.

Difficulty is brutal but fair because every hard thing is backed by evidence the intern can actually obtain, every variant is solvable, and every judgment call has a defensible answer. The unfairness the tentative plan risked — rewarding fluent bluffers and punishing nothing — is exactly what this design removes.

---

## 14. External Reference Baseline

Cite from these, and do not invent control IDs, technique IDs, or regulation articles.

- **NIST CSF 2.0** (Govern / Identify / Protect / Detect / Respond / Recover): https://www.nist.gov/cyberframework · https://csrc.nist.gov/pubs/cswp/29/the-nist-cybersecurity-framework-csf-20/final
- **NIST SP 800-61** (incident handling) and **SP 800-92** (log management) where relevant.
- **ISO/IEC 27001:2022 Annex A** for controls.
- **MITRE ATT&CK Enterprise** for tactics/techniques: https://attack.mitre.org/
- **OWASP WSTG** and **OWASP Top 10 / API Top 10** for web/API testing: https://owasp.org/www-project-web-security-testing-guide/ · https://owasp.org/www-project-top-ten/
- **GDPR Arts. 33/34** for EU breach notification: https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng
- **Nigeria Data Protection Act 2023** and NDPC guidance: https://ndpc.gov.ng/wp-content/uploads/2024/03/Nigeria_Data_Protection_Act_2023.pdf
- **California CCPA/CPRA** for California data subjects.
- **PCI DSS** where Sankofa Pay cardholder-adjacent data is in scope.
