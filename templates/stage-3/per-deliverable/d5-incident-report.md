*Ubuntu Bridge Initiative · Cybersecurity Internship · Cohort 1 · Stage 3 Capstone*

*Editable template — Deliverable 5 of 5: The formal incident report. This is the cover report for the CISO and Legal — it folds in your triage, timeline, IOCs, and ATT&CK map and tells the story a non-analyst can act and decide on. Target length 5–7 pages. Edit in Google Docs (recommended). Replace every [BRACKETED] prompt and delete every grey guidance line before you submit.*

---

# Deliverable 5 — The formal incident report

### Before you start

- Audience: **CISO + Legal.** They need the facts, the impact, and the decisions — not raw log lines. Keep the analyst detail in D1–D4 and reference it.
- It must be **internally consistent** with your other four deliverables: the timeline, the IOCs, and the root cause should match what you submitted there.
- Root cause is a **cause, not a symptom.** "Malware ran" is a symptom; the cause is how the attacker got a foothold and how that became persistent root.
- Be exact about **what was accessed** — name the data that left the host. Legal acts on this.

> This is a scaffold, not an answer key. The analysis is yours; this gives you the section order graders expect.

---

## What you submit

A 5–7 page document (`incident-report`) with the sections below, in this order.

**First line of your document:**

`Stage 3 · Incident report · [Your Full Name] · [UBI-2026-####]`

## Section order (use these headings)

1. **Executive summary** — [6–10 lines a CISO/Legal reader understands with no jargon: what happened, on which host, what data was at risk, and the one decision or action that matters most.]
2. **Scope** — [the host(s), the user account, the time window, and what was in and out of scope for this investigation.]
3. **Timeline (summary)** — [the condensed version of D2 — the key events in order. Reference the full timeline deliverable; do not paste all rows.]
4. **Root cause** — [how the attacker got in and how that became persistent root access. Cause, not symptom. Tie it to the evidence.]
5. **What was accessed / impact** — [name the data that was bundled and exfiltrated, and the business impact. Be specific about the files and what they contained.]
6. **Containment** — [what was done to stop it — e.g. host isolation — with the timestamp, and what should happen next.]
7. **Eradication** — [removing the foothold: the persistence mechanism(s), the attacker's access path, and any credentials/keys that must be rotated.]
8. **Lessons learned** — [what the incident exposed about detection and response gaps — specific, not platitudes.]
9. **Policy changes proposed** — [concrete changes — access control, logging/alerting, key hygiene — each tied to something this incident proved.]

---

### Where the marks are won (what we look for)

- **A CISO/Legal-readable executive summary** — could a non-analyst act on it? No raw logs up top.
- **Root cause stated as a cause** — the foothold and the persistence mechanism, not "malware was found."
- **Accurate "what was accessed"** — the exfiltrated data named precisely; Legal relies on this being right.
- **Containment + eradication that fit the evidence** — isolation already done, plus the specific artefacts and credentials to remove/rotate.
- **Consistency with D1–D4** — the timeline, IOCs, and root cause match your other deliverables. Contradictions across your own pack cost marks.
- **Lessons and policy that are specific** — each one traceable to something in this incident, not generic best practice.

### Before you submit, confirm

- [ ] First line is the `Stage 3 · Incident report · Name · Code` identity line.
- [ ] All nine sections present, in order, 5–7 pages.
- [ ] Executive summary is jargon-free and decision-focused.
- [ ] Root cause is a cause; "what was accessed" names the actual data.
- [ ] Timeline / IOCs / root cause are consistent with D2–D4.
- [ ] No `[BRACKETED]` prompts or grey guidance lines remain.
