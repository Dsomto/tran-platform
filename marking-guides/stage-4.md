# Stage 4 — Capstone Marking Guide

*Ubuntu Bridge Initiative · Cybersecurity Internship · Cohort 1*

*Confidential — for graders only. Do not share with interns.*

## Welcome — read this first

Thank you for grading Stage 4. This guide gives you the **answer to every deliverable** and tells you exactly what to mark, in what order, and how. You do **not** need to be a GRC specialist. If you can check that a number traces to evidence, that a control is specific rather than vague, that a framework ID is the right family for the weakness, and that the ethics call separates *confirmed evidence* from *allegation*, you can grade Stage 4 well.

Stage 4 is **Governance & Risk — The Debrief.** The intern is no longer a technical analyst. They are the voice the board hears. They take the breach they investigated across Stages 0–3 and turn it into six governance artefacts a real board, a regulator, and a CISO would act on.

The recurring lesson Stage 4 tests: **every claim must trace to evidence, and no clean-sounding answer is trusted.** The pack is full of governance traps — a tempting petty-cash account number, a "friendly" regulator who is not lenient, a CFO who asks "what's the worst case?" three times, and the Amaka allegation that is *strong enough for board action but not clean enough for public certainty.* The top band goes to the intern who is specific, evidence-cited, and disciplined about what they will and will not assert.

If you are ever unsure whether an answer is correct, **flag it for super-admin review** rather than guess.

## The story Stage 4 is testing

Tomorrow at 09:00 the intern is in front of Sankofa's board: the Chair (Adaeze Okonkwo), the CFO (Babatunde Olawale), and an independent director (Chief Wale Adekunle, ex-chair of a Tier-1 bank). Counsel Ifeoma Okeke sits beside them. Adaobi Nnamdi, the Data Protection Authority liaison, receives the 72-hour notification. And a leaked front page has just named **Amaka Eze, Head of Security**, as The Griot — the breach persona from Stages 0–3 — now suspended pending investigation.

The board cares about three things: did customer PII leave the building, does this trigger regulator notification duties, and which first ninety days of security spend earn the rest of the programme. The intern produces six artefacts to answer them, then makes a **binding** choice of specialist track. Track selection is locked the moment the Chair signs off.

## How Stage 4 is structured — the 6 deliverables (you hand-grade all of them)

| # | Deliverable | Pts | What it is |
|---|---|---:|---|
| **D1** | **Risk register** | **50** | Five rows; each a real risk with likelihood/impact rationale, a concrete control, owner, residual decision, framework IDs, evidence cite |
| **D2** | **Breach-notification letter (Art. 33 / NDPA)** | **60** | The 72-hour regulator letter: controller + DPO, volume, deadline, nature, consequences, containment, remediation, Article 34 decision |
| **D3** | **Board slide memo (1 page)** | **40** | One slide: title, three evidence-cited numbers, chart, ask, speaking notes, anticipated questions, tradeoff, press-risk line |
| **D4** | **30/60/90 remediation roadmap** | **50** | First 90 days only; concrete actions, owners, naira cost tiers, acceptance criteria, evidence cites, a deferral list |
| **D5** | **Control mapping** | **50** | Eight weaknesses from Stages 1–3 → NIST CSF 2.0 + ISO 27001:2022 Annex A + MITRE D3FEND, with confidence + source |
| **D6** | **Ethics stance + binding track rationale** | **80** | The Amaka ethics call (no clean option) + the binding SOC / Ethical Hacking / GRC choice grounded in their programme work |
| | **Total** | **330** | **percentage = round(rawPoints ÷ 330 × 100)** — enter the percentage |

## The golden rules (apply to every deliverable)

1. **Trace to evidence.** Every number, date, count, and claim must cite a Stage 0–3 task. A figure with no cite, or one that contradicts the evidence, scores 0 for that point and is a fabrication signal.
2. **Specific beats generic.** "Improve monitoring" is worth nothing. "Deploy Wazuh FIM on 100% of endpoints with rules for `~/.bashrc` additions, 30-day retention" is the bar. Vague controls, vague actions, and vague asks all lose.
3. **Separate the three lines on Amaka.** Confirmed evidence ≠ public allegation ≠ board-action threshold. Any deliverable that flatly asserts "Amaka is The Griot" as established fact over-claims and loses the ethics and press marks.
4. **The planted traps — do NOT reward, treat as a fabrication signal.** Citing the petty-cash account `1234567890` or the test account `0009-XX-VERIFY` instead of the real operating account (Polaris Bank, ending 4523); treating the DPA liaison's friendliness as leniency; giving the CFO the same "worst case" answer twice; inventing an affected-customer count instead of a conservative, evidence-bounded figure.
5. **Numbers must be defensible, not maximal.** The board asked for a conservative affected count until the offline evidence locker is reconciled. An intern who picks a huge scary number with no basis loses; one who states a conservative figure with the cite and a "to be reconciled" note earns it.

---

## D1 — Risk register (50 pts)

Five rows. **R-001 is given** in the template (adversary regains foothold via the `.bashrc`-sourced persistence binary → Wazuh FIM control). The other four must come from the real Stages 1–3 weaknesses (see the D5 list for the menu): the unauthenticated Elasticsearch PII exposure, SQL injection in the login, XSS in the admin dashboard, SSRF to the cloud metadata service, the NOPASSWD sudoers grant, the C2 beacon, the plaintext credentials.

Each row needs: risk statement · likelihood (1–5) **with rationale** · impact (1–5) **with rationale** · ONE concrete control · owner role · residual risk + decision (reduce / accept / transfer) · ISO 27001:2022 Annex A · NIST CSF 2.0 · evidence cite (Stage X task Y).

- **Full marks (45–50):** five distinct real risks; every likelihood/impact has a rationale tied to evidence; controls are specific and actionable; residual decisions present; framework IDs plausible; every row cites a Stage task.
- **Mid (30–44):** real risks but some vague controls, missing rationale, or thin framework mapping.
- **Low (<30):** generic risks ("cyber attack"), vague controls ("improve security"), no evidence cites, or fewer than five real rows.
- **Watch for:** reusing R-001's wording for other rows; "improve monitoring"-class controls; likelihood/impact scores with no rationale.

## D2 — Breach-notification letter, Article 33 / NDPA (60 pts)

This is a **regulated submission**, not a press release. It must include:

- **Controller identity** (Sankofa Digital Limited, RC 1234567) and a **named DPO**.
- **Category and approximate volume** of affected data subjects — a **conservative, evidence-bounded** count drawn from the Stage 2 redacted `customer_pii` sample and the Stage 3 exfil, **explicitly marked provisional** until the offline locker is reconciled (board minutes Q1/Q2).
- **The exact 72-hour deadline**, reasoned from when Security had enough evidence to suspect PII exposure. Note the audit found a **36-hour DPO-notification lag** — the lag and the regulatory clock are different things; reward the intern who keeps them separate.
- **Nature of the breach** — unauthorised access and exfiltration of customer PII via the documented kill chain (SSH foothold → privilege escalation → persistence → C2 → `scp` exfiltration).
- **Likely consequences** for the data subjects.
- **Containment and remediation** measures, tied to the roadmap.
- A reasoned **Article 34 (data-subject notification) decision** — required where the breach is high-risk; the PII exfiltration likely meets that bar, so a "yes, with reasons" is the strong answer.

- **Full marks (54–60):** all elements present; the count is conservative, cited, and marked provisional; the 72-hour clock is reasoned; Article 34 decided with a reason; plain regulator-facing language.
- **Mid (36–53):** most elements, but a guessed count, a fuzzy deadline, or no Article 34 decision.
- **Low (<36):** missing controller/DPO, no volume basis, no deadline reasoning, or written as a press release.
- **Watch for:** a maximal scary count with no basis; confusing the 72-hour clock with the 36-hour lag; asserting Amaka as the cause in a regulator letter (over-claim).

## D3 — Board slide memo, one page (40 pts)

**It must fit one page.** That is part of the test — a board reads a slide, not an essay.

- Title ≤ 8 words, active voice.
- **Three board-safe numbers, each cited** — records exposed, time-to-root or dwell time, and fine exposure under GDPR Article 83 / the NDPA. Every number traces to evidence.
- One chart **described** (a before/after under the proposed control).
- **The ask (≤ 80 words):** action + budget tier + owner role, with the specific risk-reduction it buys.
- Five speaking-note bullets, plain language.
- **Anticipated board questions = the three OPEN questions** from `07-board-minutes-excerpt.md`, each with a one-line answer.
- A **tradeoff decision** — names what they will NOT do in order to do the ask.
- The **press-risk line** on Amaka — must separate confirmed evidence, allegation, and next action. This is the trap; over-claiming guilt fails it.

- **Full marks (36–40):** fits one page; three cited numbers; a real ask with a tradeoff; the three board open questions answered; press line correctly hedged.
- **Mid (24–35):** present but bloated past one page, a number uncited, or a generic "no tradeoffs needed."
- **Low (<24):** an essay not a slide; numbers invented; no tradeoff; press line asserts guilt.
- **Watch for:** "no trade-offs needed" (loses); the Amaka press line stated as fact.

## D4 — 30/60/90 remediation roadmap (50 pts)

**First 90 days only**, 9–12 rows, prioritised by risk-reduction per naira.

- Concrete, **verb-first** actions across 0–30 / 31–60 / 61–90 days.
- Per row: owner role · naira budget tier (S < ₦5M / M ₦5–25M / L ₦25M+) · dependency or blocker · **auditable** acceptance criterion (a real pass/fail) · Stage evidence cite · NIST CSF + ISO ID.
- A **mandatory row** for interim security leadership and privileged-access separation after the Amaka allegation.
- A **deferral list** — at least three real items from Stages 1–3 deliberately NOT scheduled in the 90-day window, each with a target window and a one-sentence reason.
- An **audit-findings response** — accept / dispute / defer each of the three external audit findings, with reasons.

- **Full marks (45–50):** 9–12 concrete rows; the Amaka leadership/privileged-access row present; costs in tiers; acceptance criteria auditable; deferral list with real items and reasons; audit findings answered.
- **Mid (30–44):** real actions but some vague, missing the deferral discipline, or no Amaka row.
- **Low (<30):** generic roadmap; no costs; no deferral list; "nothing deferred."
- **Watch for:** the petty-cash `1234567890` or test `0009-XX-VERIFY` account in any cost figure (trap + fabrication flag); "nothing deferred" — the board judges discipline by what the intern says no to.

## D5 — Control mapping (50 pts)

Eight weaknesses observed across Stages 1–3, each mapped to **NIST CSF 2.0 + ISO 27001:2022 Annex A + MITRE D3FEND**, with a confidence rating, the evidence cite, and a "source checked" note. **Row 1 is given.** The framework IDs do not have to match mine exactly — reward a defensible mapping with the right control **intent**, and penalise a clearly wrong family (for example, mapping SQL injection to a physical-security control).

| # | Weakness | Defensible mapping (accept reasonable neighbours) |
|---|---|---|
| 1 | Unauthenticated Elasticsearch index exposing PII *(given)* | PR.DS-01 · A.8.3 + A.8.24 · D3-NTA |
| 2 | Plaintext credentials + base64 "API key" in committed config | PR.AA / ID.AM · A.8.24 + A.5.17 · credential hardening |
| 3 | SQL injection in the login form | PR.PS · A.8.28 (secure coding) · D3 input validation / DB query analysis |
| 4 | Reflected + stored XSS in the admin dashboard | PR.PS · A.8.28 · D3 input validation / output encoding |
| 5 | SSRF to cloud metadata (IMDSv1) | PR.PS / PR.IR · A.8.28 + A.8.20 · move to IMDSv2; outbound filtering |
| 6 | Time-unlimited NOPASSWD `less` sudoers grant | PR.AA-05 (least privilege) · A.8.2 (privileged access) · D3 privileged-account management |
| 7 | `.bashrc` shell-config persistence | DE.CM-01 · A.8.7 + A.8.16 · D3 file analysis / FIM |
| 8 | Periodic HTTPS beacon to non-allowlisted domain | DE.CM-01 · A.8.16 + A.8.20 · D3-NTA + outbound filtering |

- **Full marks (45–50):** all eight rows mapped across all three frameworks with defensible IDs, a confidence rating, and the evidence cite.
- **Mid (30–44):** most rows mapped but some missing a framework or carrying a clearly-off ID.
- **Low (<30):** fewer than eight, or IDs that do not match the weakness.

## D6 — Ethics stance + binding track rationale (80 pts) — the heaviest

Two parts. Weight roughly **50 ethics / 30 track**; flex to the work.

### Ethics stance (~50)

The Amaka reveal, where no option is clean. Full marks:

- **Separates the three lines:** confirmed evidence (delayed containment, break-glass approval, a documented legacy path) / public allegation (the leaked front page) / the board-action threshold versus the public-certainty threshold (counsel's line).
- **Names the duty owed to customers first** — the PII left, so the notification and protection duty is owed regardless of who is to blame.
- **Refuses to reduce it to "one rogue insider"** (which would let segregation of duties, exception expiry, privileged-access review, and single-analyst coverage all off the hook), **and** does not excuse the breach just because the motive is sympathetic.
- **Makes an actual call** — what to assert, what to withhold, how to protect due process — and defends it.
- **Cites at least one ethics principle by clause** (the ISC2 Code of Ethics canons, etc.).
- Is honest about which harm the intern is choosing.

Mid: takes a side but blurs the three lines, treats the allegation as proven, or ignores the customer duty. Low: theatre — names Amaka guilty as fact, or hand-waves "it's complicated" with no call.

### Track rationale (~30)

- A **binding, reasoned** choice of SOC / Ethical Hacking / GRC, grounded in **specific work the intern did** across the programme — not "I like hacking."
- Self-aware about strengths and gaps; ties the choice to evidence of aptitude shown in Stages 0–3.

Full marks: a genuine, evidence-grounded rationale. Low: generic, with no link to their actual work.

---

## Scoring & flags

- Sum the six deliverables out of 330. **Percentage = round(rawPoints ÷ 330 × 100).** Enter the percentage.
- **Fabrication** (an invented number/count with no basis; the petty-cash or test account numbers; asserting Amaka's guilt as established fact; a framework ID that contradicts the weakness): zero that element and note it. A pattern of it caps the score and is a senior-review flag.
- **Cannot assess** (unreadable links, only some deliverables submitted): flag for senior review; do not guess a score.
- **AI-tell:** generic governance prose with no evidence cites, no naira costs, no specific framework IDs, and a clean "Amaka is guilty" or "it's all fine" ethics take. The marks live in the specifics and the evidence trail; AI answers skip both.

## How to grade fast — the order

1. **Skim for the evidence trail.** Does every number cite a Stage task? If nothing cites, it is low before you read closely.
2. **D5 control mapping** is the quickest objective check — eight rows, defensible IDs.
3. **D2 letter** — controller + DPO, conservative count, 72-hour reasoning, Article 34.
4. **D1 risk register** — five real rows, specific controls, rationale.
5. **D4 roadmap** — concrete + the Amaka row + a real deferral list.
6. **D3 memo** — one page, three cited numbers, a tradeoff, a hedged press line.
7. **D6 ethics + track** — the three-line discipline, a real call, a grounded track choice.
8. Sum, convert to a percentage, and flag anything you could not judge.

*Reminder: the artefacts the intern works from (`06-external-audit-findings.md`, `07-board-minutes-excerpt.md`, the Lagos Ledger newspaper, and the five templates) are linked beside this guide on the report. Keep them open to verify citations.*
