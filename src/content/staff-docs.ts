// Staff-only documents served from the gated "creators" page. Kept as Markdown
// strings so they can be both rendered on the page and offered as downloads.
// Edit the copy here; the page and download route pick it up automatically.

export interface StaffDoc {
  slug: string;
  title: string;
  filename: string; // suggested download filename (without extension)
  markdown: string;
}

const GRADER_RUBRIC = `# UBI Cohort 1 — Grader Rubric (Stages 0–4)

_Confidential. For graders and programme staff only._

## How grading works

- Every stage is scored out of **100 points**, split across its tasks below.
- A participant needs **≥ 50%** to advance. **Below 50% is an elimination** — the
  system deactivates the account and an elimination email goes out, so grade
  honestly and leave a one-line justification on every task.
- Score each task against three bands:
  - **Strong (full band):** meets the intent, correct, and clearly reasoned.
  - **Adequate (about half):** the core is right but shallow, partly wrong, or
    thinly justified.
  - **Insufficient (0–25%):** missing, copied, off-topic, or fundamentally wrong.
- **Reasoning beats the right answer.** A correct answer with no working scores
  lower than a slightly-off answer that shows sound method.
- **Integrity:** identical wording across submissions, AI-tells with no
  understanding, or pasted tool output with no interpretation cap the task at
  *Insufficient*. Flag suspected collusion to a programme manager — do not
  eliminate on suspicion alone.

Use the same scale everywhere: **4 = strong · 2 = adequate · 0–1 = insufficient**,
then weight to the points shown.

---

## Stage 0 — Foundations: Induction at the Gate (100 pts)

Goal: can this person triage, reason about basics, and act ethically?

| Task | Pts | Strong looks like | Insufficient looks like |
|---|---|---|---|
| Auth-log triage | 25 | Correctly separates normal vs suspicious lines; explains *why* (timing, geo, volume); proposes a next step | Lists lines with no reasoning; misreads benign activity as attack |
| CIA-triad CVE triage (10 CVEs) | 20 | Correct primary CIA leg per CVE with a one-line, defensible rationale | Wrong legs, no rationale, or a single copied definition |
| Decode four encoded strings | 15 | All four decoded with the encoding named and method shown | Plaintext only, no method; or wrong encodings |
| "Suspicious login" mini-playbook | 20 | Clear, ordered, actionable steps a junior could follow; scoping + escalation | Vague prose, no order, no escalation path |
| Ethics stance | 20 | Takes a clear position, weighs the trade-off honestly, shows judgement | Platitudes; dodges the dilemma |

Red flags: tool output pasted with no interpretation; "hacking" framed as the goal rather than defence.

---

## Stage 1 — Applied Cryptography: Ciphers & Secrets (100 pts)

Goal: practical crypto literacy — break, identify, and reason about controls.

| Task | Pts | Strong looks like | Insufficient looks like |
|---|---|---|---|
| Decrypt the ciphertext | 25 | Correct plaintext + reproducible recipe (e.g., CyberChef URL) + the ECB note | Plaintext with no method; can't reproduce |
| Identify the classical cipher | 15 | Correct cipher named with the tell that gave it away | Guess with no reasoning |
| Audit three JWTs | 25 | Each token's specific red flag named (alg=none, weak secret, no exp, etc.) | Generic "looks insecure"; misses the real flaw |
| Hash vs encryption memo | 15 | Crisp, correct distinction with a when-to-use-each example | Conflates the two; reversibility confusion |
| Five cryptographic controls | 20 | Specific, prioritised, justified to the scenario | Generic checklist with no fit to the brief |

Red flags: "decrypting" a hash; recommending controls that don't match the scenario.

---

## Stage 2 — Web Application Security: The Attack Surface (100 pts)

Goal: read code/traffic, find the bug, map it, and fix it.

| Task | Pts | Strong looks like | Insufficient looks like |
|---|---|---|---|
| Find the SQLi in the code | 25 | Vulnerable line quoted, class named, working PoC, and a correct parameterised fix | Points near it but no PoC or wrong fix |
| Trace the attack in the HTTP capture | 25 | Numbered, accurate sequence with annotations showing what each request did | Restates packets with no narrative |
| Map five findings to OWASP Top 10 (2021) | 25 | Correct category per finding with a one-line justification | Wrong categories; no justification |
| Remaining task(s) (fix / writeup) | 25 | Clear remediation that would actually close the issue | Superficial advice ("sanitise inputs") |

Red flags: a PoC that doesn't demonstrate the named bug; "fixes" that don't address root cause.

---

## Stage 3 — Incident Response & DFIR (100 pts)

Goal: turn messy evidence into a defensible incident narrative.

| Task | Pts | Strong looks like | Insufficient looks like |
|---|---|---|---|
| Process triage | 15 | Picks out the malicious/suspicious processes with reasoning | Lists everything; no judgement |
| Incident timeline | 20 | Accurate, ordered, time-stamped reconstruction | Out of order; gaps unaddressed |
| IOC list | 20 | Precise, correctly typed IOCs (hashes, IPs, domains) usable for detection | Vague or wrong indicators |
| MITRE ATT&CK mapping | 20 | Correct techniques (Txxxx) tied to evidence | Technique IDs with no evidence link |
| Formal incident report (5–7 pp) | 25 | Exec summary + timeline + impact + recommendations; reads like real IR | Disorganised; no recommendations |

Red flags: IOCs invented rather than extracted; ATT&CK IDs that don't match the activity.

---

## Stage 4 — Governance & Risk: The Debrief (100 pts)

Goal: translate technical incident into business risk and a credible plan.

| Task | Pts | Strong looks like | Insufficient looks like |
|---|---|---|---|
| Five-entry risk register | 20 | Real risks with likelihood/impact and sane scoring | Generic risks; arbitrary scores |
| GDPR 72-hour breach letter | 20 | Hits the required notification elements; right tone; on-time framing | Misses mandatory content; wrong audience |
| Map incident to NIST CSF 2.0 | 20 | Correct Functions/Categories tied to the incident | Name-drops CSF with no mapping |
| 12-month remediation roadmap | 20 | Sequenced, realistic, owners + horizons | Wish-list with no sequencing |
| Track-selection rationale (binding) | 20 | Honest fit between strengths and chosen track | No reasoning; contradicts their work |

Red flags: compliance theatre with no link to the actual incident.

---

## Grader checklist (every submission)

1. Score each task on the 0–4 scale, weight to points, total out of 100.
2. Leave a one-line justification per task — the participant may be eliminated on this.
3. Flag integrity concerns to a PM; never eliminate on suspicion alone.
4. Submit grades by the stage deadline so the cohort isn't held up.
`;

const PM_SOP = `# UBI Cohort 1 — Program Manager SOP

_Confidential. For programme managers and the data analyst only._

## The team and how we split the cohort

- **4 Program Managers (PMs)** + **1 Data Analyst**.
- Split the active cohort into **4 pods**, one PM per pod. Your pod is yours end
  to end: attendance, communication, deliverables, escalations.
- The **Data Analyst** owns the numbers across all four pods (completion,
  pass/fail, drop-off, leaderboard) and feeds PMs a weekly read.

## Your daily job (per PM)

You are the human layer on top of the platform. The portal holds the briefs,
assignments, and grades; **you keep your pod moving.**

1. **Morning (Slack):** post the day's focus in your pod channel — what's open,
   what's due, where to go in the portal.
2. **Drive them to the portal:** every stage brief, task, and deliverable lives
   in each participant's portal. Your job is to make sure they actually go there,
   start, and submit — not to re-explain the content.
3. **Drop assignments & deliverables:** when a stage/task opens, announce it,
   link the portal, restate the deadline and the exact deliverable format.
4. **Keep them active:** chase non-starters within 24h, the quiet ones within 48h.
   A participant who goes dark is a future elimination — intervene early.
5. **Collect blockers:** triage in-pod; escalate platform/grading issues.

## Cadence

| When | What |
|---|---|
| Daily | Pod stand-up post in Slack; nudge non-starters |
| Mid-stage | 1:1 check-ins with at-risk participants |
| Stage open | Announce brief + deliverable + deadline; confirm portal access |
| Stage close | Confirm all submissions in; hand off to graders; chase stragglers |
| Weekly | PM sync + Data Analyst report; align on at-risk list |

## Slack playbook

- One **channel per pod**; one shared **#pm-coordination** channel.
- Templates to reuse:
  - **Stage open:** "🚀 Stage N is live. Brief + task in your portal: <link>.
    Deliverable: <format>. Due <date/time WAT>. Start today — reply here if you're stuck."
  - **48h nudge:** "Checking in — I don't see a start on Stage N yet. Anything
    blocking you? The deadline is <date>; let's not lose your spot."
  - **Deadline -24h:** "24 hours left on Stage N. Submit in the portal even if
    it's not perfect — a submitted draft beats a missed deadline."
- Keep decisions in-channel, not DMs, so the pod has a shared record.

## Working with the platform

- **Briefs/tasks/grades:** in the portal — you point, you don't paste.
- **Deadlines & stage windows:** set by programme leadership; PMs communicate,
  they don't change them.
- **Eliminations are automatic:** below 50% on a stage means the account is
  deactivated and an elimination email goes out, and the data is removed a couple
  of days later. Do **not** promise a graded participant they're safe.
- **Sending email to participants is restricted** to the programme owner's
  account — PMs coordinate on Slack, not via the bulk mailer.

## Data Analyst responsibilities

- Daily: per-pod start/submission/at-risk counts to the PMs.
- Per stage: pass/fail and elimination summary once grading closes.
- Weekly: cohort funnel (active → submitted → passed) + leaderboard movement.
- Flag anomalies (sudden drop-off, a pod lagging) to the PMs and leadership.

## Escalation path

1. Participant blocker → owning PM.
2. Platform bug / grading dispute → #pm-coordination → programme leadership.
3. Integrity concern (collusion, plagiarism) → PM gathers evidence → leadership decides.

## Golden rules

- Be the reason someone didn't quietly drop out.
- Communicate early, in-channel, and in writing.
- Never re-teach the content — drive them to the portal and keep them moving.
`;

export const STAFF_DOCS: StaffDoc[] = [
  {
    slug: "grader-rubric",
    title: "Grader Rubric — Stages 0–4",
    filename: "ubi-grader-rubric",
    markdown: GRADER_RUBRIC,
  },
  {
    slug: "pm-sop",
    title: "Program Manager SOP",
    filename: "ubi-pm-sop",
    markdown: PM_SOP,
  },
];

export function getStaffDoc(slug: string): StaffDoc | undefined {
  return STAFF_DOCS.find((d) => d.slug === slug);
}
