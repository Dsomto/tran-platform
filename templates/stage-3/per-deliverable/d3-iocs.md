*Ubuntu Bridge Initiative · Cybersecurity Internship · Cohort 1 · Stage 3 Capstone*

*Editable template — Deliverable 3 of 5: IOC list. You extract the indicators of compromise from the evidence and format them so another analyst could block or hunt for them tomorrow. Edit in Google Docs or Microsoft Word (keep it as a table); a STIX 2.1 JSON bundle is an optional bonus. Replace every [BRACKETED] prompt and delete every grey guidance line before you submit.*

---

# Deliverable 3 — IOC list

### Before you start

- An IOC is something another team can **act on** — block, alert, or hunt for. Cover the types present: IP addresses, domains/URLs, file paths and hashes, user-agent strings, and persistence artefacts.
- Every IOC must be tied to where you saw it (the source file + line). An indicator with no provenance is not usable.
- Watch the false positives: internal infrastructure that appears in the logs (internal DNS, OS update/NTP endpoints, the host's own address) is **not** an indicator of compromise. Listing benign infrastructure as malicious is a real deduction.

> This is a scaffold, not an answer key. You extract and classify the indicators yourself.

---

## What you submit

A document (`iocs`) with one IOC table. Optionally, also paste a STIX 2.1 bundle of a subset for bonus credit (see the last section).

**First line of your document:**

`Stage 3 · IOC list · [Your Full Name] · [UBI-2026-####]`

## The IOC table

| Type | Indicator value | Context (what it is / what it did) | Source (file · line) | Confidence |
|---|---|---|---|---|
| IP address | [value] | [C2 / exfil destination / login origin] | [`06-netflow.csv` row / `04-siem-export.csv`] | [High/Med/Low] |
| URL / domain | [value] | [beacon endpoint] | [ ] | [ ] |
| File / path | [value] | [persistence binary / dropped file] | [`01-process-listing.txt` / `02-filesystem-index.txt`] | [ ] |
| User-agent / tool | [value] | [the client/tool the beacon or request used] | [`01-process-listing.txt` / `05-memory-strings.txt`] | [ ] |
| Persistence artefact | [value] | [cron entry / autostart / shell-config hook] | [ ] | [ ] |
| Account / key | [value] | [compromised user / SSH key used] | [ ] | [ ] |

*Deduplicate. One row per distinct indicator. Group by type. Mark confidence honestly — a value you inferred is not the same as one you read directly.*

## STIX 2.1 (optional bonus)

[If you want the bonus: format a subset of the above as a STIX 2.1 bundle and paste the JSON here — typically `indicator` SDOs with a `pattern` (e.g. an `ipv4-addr` or `file:name` pattern) and `valid_from`, wrapped in a `bundle`. Keep it valid; a malformed bundle earns nothing extra.]

---

### Where the marks are won (what we look for)

- **Coverage across types** — not just the C2 IP. Network, file, persistence, and account indicators each present where the evidence supports them.
- **Provenance on every row** — the source file and line. An IOC sheet is only as good as its traceability.
- **False-positive discipline** — benign internal/OS infrastructure is left out (or explicitly marked benign). This is graded.
- **Actionability** — values are exact and usable (full IP, full path, full URL), deduplicated, with honest confidence.

### Before you submit, confirm

- [ ] First line is the `Stage 3 · IOC list · Name · Code` identity line.
- [ ] IOCs span the relevant types, each tied to a source line.
- [ ] No benign internal/OS infrastructure listed as malicious.
- [ ] Values are exact, deduplicated, and confidence-rated.
- [ ] No `[BRACKETED]` prompts or grey guidance lines remain.
