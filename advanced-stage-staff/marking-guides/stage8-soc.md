# Stage 8 SOC Marking Guide: Portable Detection Engineering

Score only reproducible evidence in the submitted folder. The signed B2 replay is controlling; Wazuh, Windows, Sysmon, Atomic, OVA, and Docker evidence is optional and earns no hardware credit. Video is corroboration, never a substitute for files and machine-readable results.

## Rubric (100)

| Area | Points | Full-credit standard |
|---|---:|---|
| Release integrity and accounting | 10 | Correct B2 and replay hashes; immutable source; every input has a locator and disposition; totals reconcile. |
| Normalization and provenance | 15 | Versioned schema; deterministic adapter; raw-to-normalized-to-decision chain for every case; parse failures are explicit. |
| Detection logic | 25 | Twelve semantic detections; at least six multi-event, sequence, threshold, or time-window detections; no answer constants; rules explain decisive fields and blind spots. |
| Adversarial and benign testing | 25 | 12/12 canonical attacks, 24/24 benign controls, at least 6/8 mutations, and 0/12 benign holdout alerts; mismatches fail the runner; failure states are correctly classified. |
| Deterministic automation | 15 | One unattended command; clean checkout works; two runs have identical result hashes; machine-readable output and non-zero failure exit; dependencies and runtime documented. |
| Recorded defense | 10 | Candidate reproduces a staff-selected mutation from clean state and traces source, normalization, rule, verdict, and test without hand repair. |

## Scoring rules

- Do not award canonical or mutation points from screenshots alone.
- A literal case ID, fixture ID, expected event ID, marker, or complete command-line answer in detection logic scores zero for the affected detection.
- Calculate test credit proportionally inside the 25-point test section; do not impose an undisclosed total-score cap.
- Missing telemetry, parse failure, rule miss, suppression, successful alert, and unexpected alert must not be conflated.
- Existing Wazuh work may satisfy evidence only after its adapter produces the same portable contract.

## Required feedback

State what was opened and executed, the decisive evidence for each section, exact failed fixtures, score arithmetic, and a prioritized improvement path. Distinguish absent evidence from incorrect evidence. Record any boundary-tie reread and the defensible one-point distinction.
