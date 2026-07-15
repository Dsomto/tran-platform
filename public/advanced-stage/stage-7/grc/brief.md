# GRC Advanced 3: ISO 27001:2022 Internal Audit

## Scope

Northstar Health's identity, endpoint, change, incident, supplier, backup, and
logging processes. Audit the twelve control identifiers listed in the test
sheet. Use ISO/IEC 27001:2022 and ISO/IEC 27002:2022 references you are licensed
or authorized to access. Do not reproduce protected control text.

## Window and scoring

Ten days. Final revision opportunity. 100 points: audit planning/sampling 15,
evidence quality 20, control testing/verdicts 30, prior-finding verification 15,
nonconformity quality 10, management communication 10.

## Verdict rules

Use `conforms`, `minor_nc`, `major_nc`, or `not_tested`. Apply
`severity-rules.yaml` in first-match order. A missing sample is not conformity.
The machine verdict and rule ID are binding; the report may explain impact but
may not substitute a different classification algorithm.

The pack contains stale evidence, contradictory evidence, an implemented claim
that is not supported by operation, and prior findings with mixed closure. Your
report must identify each without assuming the answer key's wording.

## Audit-engine build

Build a collector, manifest verifier, deterministic sampler, and verdict
generator. The engine must ingest the published populations and evidence index,
preserve duplicate/excluded records with reason codes, use the assigned marker
as the sampling seed, enforce published sample sizes, and emit JSON verdicts and
nonconformity IDs with source locators. Missing, stale, hash-failed, or failed
required samples cannot become conforming.

The pack includes a broken hash, duplicate population members, timezone
differences, a stale screenshot, and a ticket whose status conflicts with its
event history. The repository must pass 24 public fixtures and 12 hidden
fixtures. Re-running the same marker must produce identical sample IDs, verdict
JSON, and evidence-index hashes. A mandatory holdout pack must produce the exact
sealed nonconformity IDs and severity rules without source changes.

## Mission interface and handoff

- **You receive:** signed populations, evidence exports, severity rules, prior findings, and the Stage 6 evidence graph/dispositions.
- **You build:** deterministic collection, sampling, evidence grading, testing records, verdict generation, and report/register outputs.
- **You prove:** samples reproduce from the marker, exclusions remain visible, and every verdict follows the published severity precedence.
- **You hand forward:** tested findings, evidence grades, affected assets, ownership, recurrence status, and closure requirements for Stage 8.
