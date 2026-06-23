*Ubuntu Bridge Initiative · Cybersecurity Internship · Cohort 1 · Stage 3 Capstone*

*Editable template — Deliverable 1 of 5: Process triage. You read the pre-parsed memory process listing and pick the three most suspicious processes, prove each with the exact line, and say how you ruled out a false positive. Edit in Google Docs or Microsoft Word. Replace every [BRACKETED] prompt with your own work, and delete every grey guidance line before you submit.*

---

# Deliverable 1 — Process triage from the memory listing

### Before you start

- Have you read `01-process-listing.txt` in full, including Tunde's annotations at the bottom?
- A suspicious process is one you can *prove* is suspicious from the line itself — an unknown path, a beacon, a child of a shell that should not exist. "Looks weird" is not proof.
- For each pick, can you say in one sentence how you ruled out a false positive (i.e. why it is not just normal system or user activity)?
- Cross-check against `03-syslog.txt` and `04-siem-export.csv` — a process is far stronger evidence when a log line corroborates it.

> This is a scaffold, not an answer key. The findings, the evidence lines, and the false-positive reasoning are yours to do.

---

## What you submit

A short document (`process-triage`) naming your **three** most suspicious processes, each with the quoted line and a one-sentence false-positive ruling. Quality over length.

**First line of your document:**

`Stage 3 · Process triage · [Your Full Name] · [UBI-2026-####]`

## The triage table

| # | Process (PID · command) | The line that proves it (quote verbatim) | Why suspicious | How you ruled out a false positive |
|---|---|---|---|---|
| 1 | [PID · command] | [paste the exact line from `01-process-listing.txt`] | [unknown path / beacon / unexpected parent — be specific] | [why it is not normal system/user activity] |
| 2 | [ ] | [ ] | [ ] | [ ] |
| 3 | [ ] | [ ] | [ ] | [ ] |

*Pick the three strongest. Quote the line exactly — PID, parent PID, user, and command. A row with no quoted line is not a finding.*

## Method (2–3 sentences)

[State how you triaged: what made a process "normal" (a known package path, a system user, an expected parent) versus "suspicious," and which corroborating log you checked. Name the artefacts. A generic "I looked for weird processes" scores nothing.]

---

### Where the marks are won (what we look for)

- **Three real suspects, each with the exact line quoted.** Not two, not a vague list of five.
- **A parent/child or path argument**, not a vibe — e.g. an executable outside any known package, or a process whose parent is an interactive shell when it should be a service.
- **A genuine false-positive ruling per process** — the skill being tested is judgement, not paranoia. Naming why something normal is *not* your suspect is part of the credit.
- **Corroboration** — the strongest triage ties the process to a syslog or SIEM line, not the process table alone.

### Before you submit, confirm

- [ ] First line is the `Stage 3 · Process triage · Name · Code` identity line.
- [ ] Exactly three processes, each with a verbatim quoted line.
- [ ] Each has a specific reason it is suspicious AND a false-positive ruling.
- [ ] No `[BRACKETED]` prompts or grey guidance lines remain.
