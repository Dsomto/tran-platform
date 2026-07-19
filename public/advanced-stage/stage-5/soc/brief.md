# SOC Advanced 1: Millions of Lines

## Window and scoring

Monday 09:00 WAT to Friday 18:10 WAT. One revision. 100 points: pipeline and data quality 20, campaign
accuracy 30, evidence and correlation 25, false-positive restraint 15,
communication and reproducibility 10.

## Input

The programme team supplies one shared SOC Stage 5 archive capped at 100 MB,
plus a private discrepancy JSON tied to your account. Verify the archive's
published SHA-256 before extraction. The archive contains auth, web, DNS,
firewall, and endpoint events plus a source manifest. Some rows are malformed
deliberately. Some timestamps use an explicit offset. Never overwrite the
source files.

## Required work

1. Profile row counts, date ranges, fields, nulls, duplicates, parse failures,
   and clock assumptions per source.
2. Build a repeatable DuckDB import and normalization process.
3. Reconstruct every campaign using at least two independent sources and a
   normalized UTC timeline.
4. Investigate your 96 assigned review candidates. Exactly 80 have a valid
   benign explanation; 16 contain a wrong asset, actor, approver, status, or
   time window and must be escalated. A benign verdict requires complete
   ownership and change evidence, not appearance.
5. Record one rejected hypothesis per campaign and one next collection action.

## Acceptance tests

- `make build INPUT=<pack>` creates `clean.db`, `results.json`,
  `quarantine.csv`, and `reconciliation.json` from an empty work directory.
- Submitted source counts reconcile to the supplied manifest.
- Every campaign claim has two or more raw locators in `evidence-index.csv`.
- Every false positive has a positive benign explanation.
- Two clean runs produce identical normalized-table and result hashes.
- The shared pack completes in 12 minutes on the published 4-vCPU/8-GB grader.
- The compressed supplied archive must not exceed 100 MB.

The normalizer must support three schema versions per source, quarantine bad
rows with reason codes, infer variant clock offsets from cross-source anchors,
preserve stable ordering for equal timestamps, and resolve identity aliases.
`make test` must cover valid, duplicate, malformed, offset, and empty inputs.
Staff supply a deterministic 25,000-row holdout shard. Exact campaign,
false-positive, quarantine, reconciliation, and source-accounting counts must
match its sealed oracle without changing source code.

## Automatic caps

Grep-only analysis: 55. Single-line campaign attribution: 60. Screenshots
without raw rows/queries: 50. Undeclared source edits or fabricated evidence:
integrity escalation.

Start with the common submission and technical assessment contracts.

## Mission interface and handoff

- **You receive:** one shared signed track archive, five raw log sources, public schemas, and a private marker/discrepancy overlay.
- **You build:** the canonical ingestion, provenance, identity, clock, query, and command-line interfaces used throughout the SOC track.
- **You prove:** every source row is accounted for, every campaign edge has two raw locators, and every one of your 96 review candidates has a defensible verdict; candidate IDs, indicators, counts, and timestamps are configuration or evidence, never source constants.
- **You hand forward:** the normalized event schema, adapter interface, provenance model, and reusable hunt runner for Stage 6.
