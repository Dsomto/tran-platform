*Ubuntu Bridge Initiative · Cybersecurity Internship · Cohort 1 · Stage 3 Capstone*

*Editable template — Deliverable 2 of 5: The incident timeline. You reconstruct what happened, in order, one event per row, every row tied to a source line. Edit in Google Docs or Microsoft Word (keep it as a table). Replace every [BRACKETED] prompt and delete every grey guidance line before you submit.*

---

# Deliverable 2 — The incident timeline

### Before you start

- The timeline is built from the logs, not from memory. Your sources are `03-syslog.txt`, `04-siem-export.csv`, `06-netflow.csv`, and the `01-process-listing.txt` start times.
- One event per row, in strict UTC chronological order. Every row must name the source file and the exact line (a grep line, a PID, or a CSV row) that proves it.
- Cover the whole arc: **initial access → privilege escalation → persistence → command-and-control → lateral movement → exfiltration attempt → containment.** A timeline that stops at "they got in" is incomplete.
- **Handle lateral movement honestly.** `06-netflow.csv` contains unrelated background and lateral flows (SMB/RDP/Postgres) from *other* hosts. If you cannot evidence lateral movement *from* `10.0.1.87`, say so — "no lateral movement confirmed from this host; the 445/3389/5432 flows originate from other hosts" is the correct, full-credit answer. Do not invent it, and do not attribute another host's flow to this incident.

> This is a scaffold, not an answer key. Every timestamp, event, and evidence cell is yours to fill from the logs.

---

## What you submit

A document (`incident-timeline`) containing one table, in UTC order, covering the full kill chain on host `10.0.1.87`.

**First line of your document:**

`Stage 3 · Incident timeline · [Your Full Name] · [UBI-2026-####]`

## The timeline table

| Timestamp (UTC) | Phase | Event | Source file | Evidence (grep line / PID / row) |
|---|---|---|---|---|
| [YYYY-MM-DDThh:mm:ssZ] | Initial access | [what happened] | [`03-syslog.txt` / `04-siem-export.csv`] | [quote the line] |
| [ ] | Privilege escalation | [ ] | [ ] | [ ] |
| [ ] | Persistence | [ ] | [ ] | [ ] |
| [ ] | Command & control | [ ] | [ ] | [ ] |
| [ ] | Lateral movement | [what you can evidence — or "none confirmed from this host"] | [`06-netflow.csv`] | [the line, or your reasoning that the lateral flows are other hosts] |
| [ ] | Exfiltration attempt | [ ] | [ ] | [ ] |
| [ ] | Containment | [ ] | [ ] | [ ] |

*Add rows as your reconstruction needs — but every row is load-bearing and cited. Do not pad with background noise. Keep the columns exactly.*

## Two-line narrative (optional but rewarded)

[After the table, 2–3 sentences linking the rows into one story: how initial access led to root, how root was made to persist, and how the data left. This shows you understand it as a chain, not a list.]

---

### Where the marks are won (what we look for)

- **Strict chronological order** with real UTC timestamps copied from the logs — not approximations.
- **Every row cited** to a specific source line. A row with no evidence cell is cut.
- **All phases present** — initial access through containment. The exfiltration and containment rows are the ones weak timelines miss.
- **Correct attribution** — events on `10.0.1.87` tied to the attacker, with unrelated/background netflow rows left out (or explicitly marked as not part of this incident).

### Before you submit, confirm

- [ ] First line is the `Stage 3 · Incident timeline · Name · Code` identity line.
- [ ] Rows are in strict UTC order and every row names a source file + line.
- [ ] All six phases are covered, including exfiltration attempt and containment.
- [ ] No unrelated background/lateral flows attributed to this incident.
- [ ] No `[BRACKETED]` prompts or grey guidance lines remain.
