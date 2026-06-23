*Ubuntu Bridge Initiative · Cybersecurity Internship · Cohort 1 · Stage 3 Capstone*

*Editable template — Deliverable 4 of 5: MITRE ATT&CK technique map. You map each event in your timeline to a specific ATT&CK technique (and sub-technique where it applies). Browse attack.mitre.org directly to get the IDs right. Edit in Google Docs or Microsoft Word (keep it as a table). Replace every [BRACKETED] prompt and delete every grey guidance line before you submit.*

---

# Deliverable 4 — MITRE ATT&CK technique map

### Before you start

- Work from your D2 timeline: every adversary action in it should map to a technique here. If a timeline event has no technique, ask whether it is really adversary behaviour.
- Use **specific** technique IDs — `Txxxx`, and the **sub-technique** `Txxxx.xxx` where one fits (a bare tactic name is not enough). Confirm each ID on attack.mitre.org rather than from memory.
- One row per behaviour, with the evidence line that supports it. The grader checks that the technique actually matches what the evidence shows — not just a plausible-sounding ID.

> This is a scaffold, not an answer key. You choose and justify the techniques from your own evidence.

---

## What you submit

A document (`attack-mapping`) with one table mapping the incident's behaviours to ATT&CK, covering the tactics from initial access through exfiltration.

**First line of your document:**

`Stage 3 · ATT&CK map · [Your Full Name] · [UBI-2026-####]`

## The mapping table

| Tactic | Technique ID + name | Sub-technique (if any) | Adversary behaviour observed | Evidence (source · line) |
|---|---|---|---|---|
| Initial Access | [Txxxx — name] | [Txxxx.xxx] | [what the attacker did] | [`03-syslog.txt` line] |
| Privilege Escalation | [ ] | [ ] | [ ] | [ ] |
| Persistence | [ ] | [ ] | [ ] | [ ] |
| Command & Control | [ ] | [ ] | [ ] | [ ] |
| Exfiltration | [ ] | [ ] | [ ] | [ ] |

*Add rows for any other tactic your evidence supports (Discovery, Defense Evasion, etc.). Every row needs an evidence cell. Map behaviour to technique — do not list techniques you cannot evidence.*

---

### Where the marks are won (what we look for)

- **Specific IDs, verified on attack.mitre.org** — `Txxxx` and the sub-technique where it applies, not just "Persistence" or a wrong/aged ID.
- **Technique matches the evidence** — the behaviour in the row genuinely is that technique. A plausible ID that does not match what the log shows loses the row.
- **Coverage of the chain** — initial access, privilege escalation, persistence, C2, and exfiltration are all represented.
- **Traceability** — each row cites the same evidence that backs the corresponding timeline event.

### Before you submit, confirm

- [ ] First line is the `Stage 3 · ATT&CK map · Name · Code` identity line.
- [ ] Every row has a specific technique ID (and sub-technique where one fits) plus an evidence line.
- [ ] The major tactics (initial access → exfiltration) are all covered.
- [ ] Each technique genuinely matches the behaviour the evidence shows.
- [ ] No `[BRACKETED]` prompts or grey guidance lines remain.
