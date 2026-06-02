# Stage 0 — Frequently Asked Questions

*Ubuntu Bridge Initiative · Cybersecurity Internship · Cohort 1*

Compiled from questions actually asked in the channel. If your question isn't here, drop it in #technical-issues for platform problems, or ping a Program Manager for everything else.

## The basics

### Where are the tasks vs the capstone?

Every stage has **two tracks** and you can work on them in any order:

1. **Desk tasks** — 10 short tasks (Shell warmup, Find the hidden file, Hash this, etc.) inside the platform. Each one is auto-graded the moment you submit it. Open them via the "Open the desk tasks" button on the Stage 0 page.
2. **Capstone** — four written deliverables (D1, D2, D3, D4) that you build off-platform in Google Docs or Microsoft Word, drop into one shared Drive folder, and submit the folder link on the platform. Open via the "Open the capstone" button.

Both tracks count for the stage. You can start with either. You can switch back and forth.

### "Stage" and "Chapter" — what's the difference?

They mean the same thing in our platform. Stage 0 = Chapter 1. Stage 1 = Chapter 2. The mismatch is cosmetic — don't read anything into it.

### I can't see Stage 0 yet

If you can log in but the Stage 0 buttons are greyed out or missing, message a Program Manager with your UBI code. It's almost always a per-account toggle that we can fix in under a minute.

### When does Stage 0 close?

**Friday 5 June 2026 at 18:00 WAT.** You have the full week. Results publish Sunday 18:00 WAT.

### How long does the full programme run?

10 weeks. Stage 0 is week 1. Stages 1 through 4 run weekly after.

## Desk tasks (the 10 small tasks)

### Do I have to do them in order?

No. Pick the one you want. Tasks 1–10 are independent.

### Are there 10 tasks or 11?

**Ten.** The 11th task you may have briefly seen ("Analyst handover note") was a seed mistake and has been removed. If you still see 11, hard-refresh the page.

### The terminal isn't returning any output

Try in this order: hard refresh the page (Cmd/Ctrl + Shift + R), check that you're typing a valid command (run `help` to list what works), make sure you're on a desktop or laptop (mobile is supported but cramped — see "Can I use my phone?" below). If still broken after that, post in #technical-issues with the command you typed.

### Can I edit my answer after I submit?

For **flag tasks** (Shell warmup, Hash this, etc.): the task locks the moment you get it right. If you got it wrong, just try again — there's no submission limit.

For **writeup tasks** (8, 9, 10): you can keep editing until Stage 0 closes Friday.

### My writeup tasks (8, 9, 10) haven't turned green — did I get them wrong?

No. Writeup tasks are graded by a human, not auto-graded. They stay "submitted" (not green) until after Stage 0 closes Friday. Green checkmarks only appear after grading.

### How do I see my flag if the terminal shows me one?

Read it from inside your own terminal output, copy it (including the `TRAN{...}` wrapper), paste it into the "Your answer" box below the terminal, and click Submit. The flag is unique to YOUR account — if you copy a flag from someone else's screenshot, it will not work. That's intentional, to prevent collusion.

### Do I need to document the desk tasks for the capstone?

**Yes, informally.** Keep a notepad (Notion, Word, paper — whatever) open while you do the desk tasks. Jot down what you found and which files you used. You'll lean on those notes when writing D1–D4. The platform does NOT require you to upload that documentation — it's for your own use.

### Can I screenshot the terminal for my own notes?

For your own use, yes. **Do not share screenshots of the platform itself** (terminal output, dashboard, the desk tasks UI) publicly — that's a confidentiality breach. Sharing your own written capstone deliverables on LinkedIn and the rest is allowed with PII scrubbed (see "Can I show my capstone on LinkedIn or GitHub?" below).

## Capstone (the four deliverables)

### What goes into the Drive folder?

**Four documents.** That's it.

1. D1 — Suspicious-login evidence table (3–5 pages)
2. D2 — Tier-1 dismissal pattern analysis (3–5 pages)
3. D3 — Business impact and next steps (3–5 pages)
4. D4 — Judgment essay, ethics + scenario (exactly 2 pages)

Total intern-written work is 11–17 pages.

### What about the 75-word executive summary?

That goes **on the platform**, not in the Drive folder. There's a field on the submission page where you type it directly. Don't put it in a separate Doc.

### Can I submit my capstone more than once?

**Yes — as many times as you want until Stage 0 closes** OR until a grader marks your report as PASSED or FAILED. Each time you click Submit, your previous submission is replaced. Drafts auto-save every 30 seconds while you're editing.

### Where does the capstone work happen?

Off-platform, in Google Docs or Microsoft Word. The platform does not have a writing editor for the capstone. You write in Docs/Word, put each of the four documents in one shared Drive folder, set sharing to "Anyone with the link → Viewer", and paste the folder URL into the submission box.

### Can I show my capstone on LinkedIn or GitHub?

**Yes — with PII scrubbed first.** Sharing parts of your D1–D4 for portfolio purposes is encouraged. Before you post, replace every piece of personally identifiable information with a generic label:

- Replace employee names (Amaka Eze, Tunde Afolabi, `o.adegoke`, `a.eze`, etc.) with role labels: "Head of Security", "Threat Intel Lead", "Operations Manager", "former employee account".
- Replace ticket IDs (SD-40812, SD-40835, SD-40866, SD-40901) with generic placeholders: `[TICKET-A]`, `[TICKET-B]`, etc.
- Replace the company name **Sankofa Digital** with something like `[FINTECH-CLIENT]` or "a Nigerian fintech client".
- Keep technical content — the IP `185.220.101.9` is a public TOR exit node, that's fine. NIST / MITRE / ISO references are fine.

What you may NOT share publicly even with scrubbing:

- The raw evidence pack files themselves (`auth-log-q2.txt`, `encoded-strings.txt`, `tier-1-ticket-history.csv`, `sankofa-roster.csv`).
- Screenshots of the platform UI (terminal, dashboard, task pages).
- Other interns' work.
- Your flag values or anything that would help a peer copy your answer.

What you may share as-is:

- The mission brief PDF (it's already public).
- Your own scrubbed D1–D4 excerpts.
- The high-level methodology and what you learned.

Why scrub? The scenario uses fictional Nigerian names that could be mistaken for real people. Scrubbing protects against accidental defamation and keeps cohort-specific findings private until programme results publish.

### How is the capstone graded?

Two independent graders read each submission. Each scores 0–100 against the rubric in the marking guide. Their scores are averaged. If they differ by more than 12 points, a super-admin tie-breaks. Results publish Sunday 18:00 WAT.

### How long does grading take?

After Stage 0 closes Friday at 18:00 WAT, two graders need to read your full folder. Results publish Sunday by 18:00 WAT — so roughly 48 hours.

## AI use

### Can I use AI to write my deliverables?

**No.** Two participants have already been removed from the programme for using Claude directly on their capstone. There is no second chance and no appeal for AI-generated work.

### Can I use AI to help me understand something?

Yes — to research, to look up what a CVE is, to understand a NIST control name. NOT to write your deliverable text. The line is: if you couldn't have written it yourself given the same evidence, an LLM probably wrote it. Graders are trained to spot the signals.

### What if I write a draft myself and then have AI polish the grammar?

Still risky. AI-polished prose has detectable patterns (em-dash density, repeated structures, generic safety language). Trust your own voice. Two graders independently flag suspected AI use; the super-admin reviews.

### What about using AI for the desk tasks?

The 10 desk tasks have specific correct answers that you find in the evidence pack. AI can't tell you what the correct answer is because the answers are per-intern (derived from your account). Use AI to understand WHAT something is (a hash, an encoding); do not use it to find your specific answer.

## Submission and grading

### Do I submit work daily, or all at once on Friday?

No daily submission requirement. Submit when you're ready. You can submit the capstone, then re-edit and re-submit, until Friday 18:00 WAT.

### How do I know my desk task got accepted?

For flag and multiple-choice tasks: instant green checkmark + score. For writeup tasks (8, 9, 10): status changes to "submitted" — you'll see green checkmarks after Stage 0 closes and a grader reads them.

### "Why is the debrief locked?"

The debrief (Amaka's close-out at the bottom of the board) unlocks when all 10 desk tasks have been **graded** (not just submitted). For writeup tasks that's after Friday. So the debrief stays locked all week — that's expected.

### I got graded 0 even though I followed the instructions and typed the right answer

Almost always a session-expiry race. The widget shows you the correct flag, but by the time you click Submit, your session has quietly expired on the subdomain — and the grading endpoint compares your typed flag against a fresh-but-different session's expected flag, scoring you 0.

Fix:

1. Log out completely (or close the browser entirely).
2. Wait 30 seconds.
3. Log back in at `ubuntubridgeinitiatives.org/login`.
4. Hard refresh the task page (Cmd / Ctrl + Shift + R).
5. Re-read the flag from your widget and paste it into the answer box.
6. Submit.

If you still get 0 after that, send a Program Manager a screenshot AND your UBI code.

### The task wording looks different from what I saw before / from what someone else sees

Two things to know:

1. **Every flag is per-intern.** The terminal in your task shows YOUR flag — different from your peers'. Don't compare flag values; they're supposed to differ.
2. **The same question can read slightly differently on reload.** Same answer requirement, same evidence pack, same widget. If your submitted folder/answer addressed the substance, you're fine. Compare side-by-side and you'll see the meaning is identical.

## Technical issues

### "no-session" error when I try to submit

Your session expired. Click the "Log in again" button on the error banner — you'll be sent to /login and then bounced back to where you were. Your typed answer is still in the box. If this keeps happening, message #technical-issues.

### My account got locked after wrong password attempts

The lockout clears automatically after 15 minutes. If you're confident your password is right and you're still locked out, message #technical-issues with the email you're using.

### I forgot my password

Use "Forgot password" on the login page. You'll get an email with a reset link. Check your spam folder if it doesn't arrive in 5 minutes.

### My internet disconnected — do I have to start over?

For desk tasks: refresh the page and re-type your answer. The desk tasks are short, so this costs you ~30 seconds.

For the capstone editor: drafts auto-save every 30 seconds. Worst case you lose the last 30 seconds of typing. Your saved draft is still there when you log back in.

### Can I use my phone?

Yes for the capstone submission page, reading the brief, and the simple desk tasks. **Not recommended** for the terminal-style widgets (Shell warmup, Log viewer, Vuln app sim, Cipher tools, Port scanner, Stego viewer). You'll see an amber "Better on a laptop" warning when you're on one of those. They do work on a phone with mobile keyboard but it's cramped.

### When I press Enter in the terminal on my phone, the page jumps to the answer box below

That was a real bug — fixed. Hard refresh (Cmd/Ctrl + Shift + R) and it should stay inside the terminal.

### How do I download the mission brief?

Open the report page (the "Open the capstone" button) and click `00-mission-brief.pdf` in the evidence pack list. It downloads as a PDF. (If you have an old link to a `.md` version, that's no longer hosted — use the PDF link from inside the platform.)

## Schedule and communication

### Are there live classes?

No live classes. This is self-paced.

### Are there office hours / AMA sessions?

Yes — keep an eye on the channel for AMA announcements. The first one is "tonight at 8pm WAT" per Somto's pinned message. Bring your questions.

### Is there a WhatsApp group?

No official WhatsApp group. Slack is the official channel. We don't moderate WhatsApp groups, so anything shared there is not vetted — be careful what you trust.

### I missed a session — how do I catch up?

Ask in the channel; someone usually has notes. The mission brief PDF + this FAQ cover the structural questions. There's no formal "Saturday session content" you can miss — Stage 0 doesn't require attendance.

### Where do I report a platform bug?

**#technical-issues** — Somto pinned it. Use that channel for "I clicked X and got error Y" type problems. Use this main channel for general questions.

## Final etiquette notes

- **Search before you ask.** This FAQ probably answers your question. Read it first.
- **Tag the right person.** Program Managers (Bernie, Somto) for programme questions. #technical-issues for bugs. The main channel is for general discussion.
- **Sharing parts of your capstone publicly is allowed** with PII scrubbed (see "Can I show my capstone on LinkedIn or GitHub?" above). Sharing screenshots of the platform itself, the evidence pack files, or other interns' work is not.
- **Don't share flag values with peers.** Per-intern flags mean theirs won't match yours — sharing just gets you both flagged for collusion.

— *Somto, Program Head*
