*Ubuntu Bridge Initiative · Cybersecurity Internship · Cohort 1*

# Stage 2 — Frequently Asked Questions

*Compiled from questions actually asked in the channel.*

*If your question isn't here, drop it in #technical-issues for platform problems, or message a Program Manager for everything else.*

---

# Downloads — quick links

## Mission brief

**Read this first.** It describes the scenario, the four deliverables, where the points are won, and how to submit.

**Stage 2 Mission Brief (PDF)**

https://ubuntubridgeinitiatives.org/capstone/stage-2/00-mission-brief.pdf

## Templates & samples

**Editable templates — one per deliverable — are on your dashboard FAQ** (`/dashboard/faq`, the "Start from the templates" section) and direct-linked below. Each opens in Google Docs or Word; replace every `[ bracketed prompt ]`, delete the grey instruction lines, and submit one file per deliverable. They are **scaffolds, not answers** — the SQLi/SSRF payloads are server-checked and D4 is read for your own voice, so a template handed in with the brackets still in scores zero.

- **D1 — Findings catalogue (and the decoy you disprove):** https://ubuntubridgeinitiatives.org/capstone/stage-2/stage-2-d1-findings-template.docx
- **D2 — Exploit chain + CVSS and business impact:** https://ubuntubridgeinitiatives.org/capstone/stage-2/stage-2-d2-chain-template.docx
- **D3 — The report Bayo acts on (+ detection stopgaps):** https://ubuntubridgeinitiatives.org/capstone/stage-2/stage-2-d3-report-template.docx
- **D4 — Ethics stance:** https://ubuntubridgeinitiatives.org/capstone/stage-2/stage-2-d4-ethics-template.docx

The files are **.docx** so you can edit them straight in Google Docs or Word. Want a PDF to keep? Finish your document and use **File → Download → PDF** — that gives you a clean PDF of your own work.

Full sample reports for a *different* fictional client are published on the capstone page (`/dashboard/reports/STAGE_2`). Use the samples to study the form and length — **do not copy the content.**

---

# The basics

## The #1 thing to understand: the lab and the capstone are different work

This is the biggest source of confusion every stage. Read it twice.

Stage 2 has **two separate halves and you do BOTH.** The desk tasks do not cover the capstone; the capstone does not cover the desk tasks.

| | The lab (desk tasks) | The capstone |
|---|---|---|
| What it is | **8 tasks** inside the platform | **4 written deliverables (D1–D4)** you build off-platform |
| What you do | Run commands, read logs, land exploits | Reconstruct, prove, report, and reflect — in writing |
| Where you work | In the browser, on each task page | In Google Docs / Word, then one Drive folder |
| What you submit | One answer (a flag or a choice) per task | One Drive folder link + a 75-word summary |
| Graded | Instantly (all 8 are auto-graded) | By two humans, after Stage 2 closes |
| **Weight** | **20% of your Stage 2 score** | **80% of your Stage 2 score** |

**The maths matters:** the capstone is **80%**. The flags get you in the door; the deliverables are where you are actually ranked. Do the lab well — but the capstone is the work.

## Are there 8 tasks or 10?

**8.** Earlier the report-writing lived in tasks 9 and 10 inside the platform. That writing is now the **capstone** (D1–D4) instead, so the in-platform lab is 8 tasks: six hands-on exploitation tasks and two multiple-choice. **There are no written tasks inside the platform for Stage 2** — all your writing goes into the four capstone deliverables.

## How to open the desk tasks — click by click

1. Log in at `ubuntubridgeinitiatives.org/login`.
2. From your dashboard, find the **Stage 2** card and click **"Enter Stage 2"**.
3. On the Stage 2 landing page, click the left button: **"Open the desk tasks"**.
4. You're on the mission board — 8 numbered task cards.
5. Click a card, read the briefing, use the widget, type your answer in the box, click **Submit**.

## How to open and submit the capstone — click by click

1. From the dashboard Stage 2 card click **"Submit report"**, or on the Stage 2 landing page click the right button: **"Open the capstone"**.
2. You're on `/dashboard/reports/STAGE_2`.
3. At the top is the **mission brief** — read it first. It describes D1–D4 in full.
4. Below is the submission form with two fields: your **75-word executive summary** (typed in) and your **Drive folder link**.
5. Click **Submit report**. You can re-submit any time until Stage 2 closes.

## When does Stage 2 close?

**You have four days from when it opens.** The exact deadline is shown on your dashboard. The window closes automatically — there are no late submissions.

## "Stage" and "Chapter"?

Same thing. Stage 2 = Chapter 3. Used interchangeably.

---

# The lab (the 8 desk tasks)

## Do I have to do them in order?

You can do them in any order, but they tell **one story** (a break-in from recon to stolen cloud credentials), and each task feeds the capstone. Going in order (1 → 8) is the natural path, and it's the order the kill-chain happened.

## Two tasks check my answer on the server — what does that mean?

The **SQL injection** and the **SSRF** tasks check the actual payload you send, on the server. There is no shortcut and nothing to copy: a *described* answer does not pass — you have to send something that genuinely works. If it isn't shaped correctly you'll get a specific error telling you what's wrong (wrong column count, you reached metadata but not the credentials path, etc.). Save those error messages — the capstone asks for them.

## My flag won't validate even though I think it's right

Your flag is **tied to your account** — it is different from every other intern's. Type exactly what the widget gives *you*. Do not copy a flag from a peer; theirs will never validate against your account, and copying flags is collusion (it gets you both flagged).

## Can I retry a task I got wrong?

Yes. Flags and multiple-choice: retry until you get it right; once right, the task locks and your score is set. There is no penalty for a wrong attempt — but a wrong attempt is still worth *noting*, because the capstone asks about your first failed attempt.

## A couple of the tasks feel like traps

They are — on purpose, and that's fair game. One artefact will *suggest* the wrong service; the evidence (the timestamps) proves the right one. Two of the tasks look almost identical but are different vulnerability classes. Trust what the evidence shows over what a label or a banner claims. The capstone rewards you for not falling for the trap and **penalises citing a decoy as if it were real**.

## The terminal isn't returning output

In order: (1) hard refresh (Ctrl/Cmd+Shift+R). (2) Type `help` to see supported commands. (3) Use a laptop, not a phone. (4) Still stuck → #technical-issues with the exact command you ran.

## Do I need to write up the desk tasks anywhere?

Not as a separate platform submission — but **keep notes as you go**: every payload you send, every server response, every timestamp, your flags. That scratch file *is* the raw material for D1 and D2. You cannot write the capstone well from memory.

---

# The capstone (the 4 deliverables)

## What are the four deliverables?

1. **D1 — Findings catalogue (and the decoy you disprove)** — every weakness you can substantiate from the evidence, each tied to an exact line, plus the one decoy you exploit or disprove
2. **D2 — Exploit chain + CVSS and business impact** — the attacker's path rebuilt as one chain, a PoC per hop, a CVSS 3.1 vector per finding, impact in customers and naira
3. **D3 — The report Bayo acts on (+ detection stopgaps)** (6–8 pages) — the finished pentest report: exec summary, threat model, findings, the disproved decoy, remediation order by risk-reduction-per-hour, and two detection stopgaps
4. **D4 — Ethics stance** (300–500 words) — the call you make under pressure, citing an ISC2 canon by number and the NDPA duty

Each is its own file (see saving rules below).

> Note: the deliverables above are the **canonical Stage 2 capstone** — they match the submission form and the dashboard FAQ. Older drafts of this document described a different D1–D4 (intrusion timeline / kill-chain / board brief); ignore those, this list is current.

## Where does the writing happen?

Off-platform, in Google Docs or Word. The platform has no editor for the capstone. You write the four documents, put them in **one** shared Google Drive folder, set the folder sharing to **"Anyone with the link → Viewer,"** and paste the **folder URL** into the submission box with your 75-word summary.

## What about the 75-word summary?

That goes **on the platform**, in the submission form — not in the Drive folder. State which vulnerability you wrote up in D3, the root cause in one line, the highest-risk impact, and your CVSS base score.

## Can I re-submit the capstone?

Yes — as many times as you want until Stage 2 closes, or until a grader marks it PASSED/FAILED. Each submit replaces the last. Drafts auto-save while you edit.

---

# How to save and name each deliverable — do this exactly

Graders process thousands of files. **A file we cannot match to a deliverable does not get graded.** Follow this to the letter.

## Format

- **One file per deliverable. Do not merge D1–D4 into a single PDF.**
- **PDF preferred** (DOCX accepted). Export to PDF when you're done editing.
- No screenshots-as-documents. Text must be selectable.

## File and folder names

| What | Name (replace the angle-bracket parts with YOUR details) |
|---|---|
| The Drive **folder** | `UBI-STAGE2_<Surname>_<InternCode>` |
| **D1** | `STAGE2_D1_RECON_<Surname>.pdf` |
| **D2** | `STAGE2_D2_EXPLOIT_<Surname>.pdf` |
| **D3** | `STAGE2_D3_REPORT_<Surname>.pdf` |
| **D4** | `STAGE2_D4_ETHICS_<Surname>.pdf` |

## The first line inside every file

The very first line of each document must read:

`Stage 2 · D# · <Full Name> · <Intern Code>`

This is how two independent graders confirm they're reading the same person's work.

## Worked example

Intern **Aisha Okonkwo**, code **UBI-2271**:

- Folder: `UBI-STAGE2_Okonkwo_UBI-2271`
- Files inside: `STAGE2_D1_RECON_Okonkwo.pdf`, `STAGE2_D2_EXPLOIT_Okonkwo.pdf`, `STAGE2_D3_REPORT_Okonkwo.pdf`, `STAGE2_D4_ETHICS_Okonkwo.pdf`
- First line of D1: `Stage 2 · D1 · Aisha Okonkwo · UBI-2271`

## The five mistakes that cost people marks every cohort

1. **One merged PDF** instead of four files. → Graders can't score deliverables separately.
2. **Folder sharing left on "Restricted."** → We can't open it = unsubmitted. Check it in an incognito window.
3. **Random file names** ("report final v2.pdf"). → Use the names above.
4. **Pasting a single file's link** instead of the **folder** link. → Paste the folder URL.
5. **Leaving submission to the last hour.** → Drafts auto-save, but the Drive folder is on you. Submit Day 4 with time to spare.

---

# Submission and grading

## How is Stage 2 graded?

Your final Stage 2 score is **80% capstone + 20% lab**. The capstone is read by **two graders independently**; their scores are averaged, and a super-admin tiebreaks large disagreements. The detailed rubric is internal — but the mission brief's "discrimination bars" tell you exactly what each deliverable is judged on.

## Where are the points actually won?

Read "Where the ranking is won" in the mission brief. In short: proving the timeline with timestamps (not guessing the service), naming the attacker by behaviour, exploits that genuinely work, telling the two XSS apart, naming the **root cause** (not the symptom), and judgment in D4 that is specifically yours. Most people collect the easy flags — that is not where you're separated.

## Can I use AI to write my capstone?

**No.** Interns have been removed for it; there is no appeal, and a detected AI-use penalty applies on top of a failing grade. Graders are trained to spot it: confident prose with no citations, fabricated NIST/MITRE references, generic D4 reflections that fit any cohort.

**You CAN** use AI to look up what a CVE is, what a NIST control means, or a command's syntax. **You CANNOT** use it to write any part of D1–D4 or the executive summary, or to paraphrase your own analysis. The line: if the AI's words ended up in your submission, that's misuse.

## "No session" error / locked out

"No session" = you got logged out; click "Log in again" on the amber banner and you'll return to the same page with your answer intact. A password lockout clears automatically after 15 minutes.

---

# D4 — the ethics deliverable

## What is D4 and why is it only 2 pages?

Two short prompts (a scope/real-PII dilemma, and an out-of-scope discovery), neither with a single right answer. It tests your **judgment** and your **own Stage 2 work** — it cannot be ghostwritten. Specific, grounded answers pass; generic recited policy fails. Name the relevant **ISC2 Code of Ethics** canon and the **NDPA** obligation where they apply. Two graders read every D4; if both find it generic or untraceable to your own work, it's treated as not submitted.

---

# Practical things

## Do I need a laptop?

Strongly recommended. The terminal, log viewer, and vulnerable-app simulator need a real screen and keyboard. They work on mobile but are cramped, and you'll see a "Better on a laptop" warning.

## How should I spend the four days?

A workable pace (also in the brief): **Day 1** — the 8 lab tasks, saving every payload, response, and timestamp. **Day 2** — write D1 + D2 while it's fresh. **Day 3** — D3 (the heaviest). **Day 4** — D4, then assemble the folder, check the file names, set sharing to Viewer, and submit.

## Network dropped mid-task — do I restart?

No. Refresh the page; desk tasks are short. The capstone auto-saves drafts.

## Can I show my Stage 2 work on LinkedIn or GitHub?

**Yes — with PII scrubbed first.** Before posting any D1–D4 excerpt: replace the client name **Sankofa Digital** with `[FINTECH-CLIENT]`; replace staff names (Amaka, Tunde) with role labels; replace any IAM role names, internal hostnames, and customer-data identifiers with placeholders. Technical references (OWASP, CWE, MITRE, public TOR-exit IPs) are fine. **Never** share: the raw lab artefacts, platform screenshots, your flag values, or another intern's work.

---

# Etiquette

- **Search this FAQ before you ask** — it probably answers your question.
- **Tag the right person:** Program Managers (Bernie, Somto) for programme questions; #technical-issues for bugs (include your intern code, the page URL, and what you expected vs saw).
- **Don't share flags or work with peers.** Per-intern flags mean a shared flag won't validate — it just flags you both for collusion.

— *Somto, Program Head*
