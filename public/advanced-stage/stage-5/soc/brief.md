# SOC Advanced 1: Millions of Lines

## Window and scoring

Eight days. One revision. 100 points: pipeline and data quality 20, campaign
accuracy 30, evidence and correlation 25, false-positive restraint 15,
communication and reproducibility 10.

## Input

The programme team supplies `soc-a1-<variant>.tar.zst` privately. Verify its
published SHA-256 before extraction. It contains auth, web, DNS, firewall, and
endpoint events plus a source manifest. Some rows are malformed deliberately.
Some timestamps use an explicit offset. Never overwrite the source files.

## Required work

1. Profile row counts, date ranges, fields, nulls, duplicates, parse failures,
   and clock assumptions per source.
2. Build a repeatable DuckDB import and normalization process.
3. Reconstruct every campaign using at least two independent sources and a
   normalized UTC timeline.
4. Investigate the approved scanner, failed backup process, and updater-like
   beacon. A benign verdict requires ownership or change evidence, not appearance.
5. Record one rejected hypothesis per campaign and one next collection action.

## Acceptance tests

- `make build INPUT=<pack>` creates `clean.db`, `results.json`,
  `quarantine.csv`, and `reconciliation.json` from an empty work directory.
- Submitted source counts reconcile to the supplied manifest.
- Every campaign claim has two or more raw locators in `evidence-index.csv`.
- Every false positive has a positive benign explanation.
- Two clean runs produce identical normalized-table and result hashes.
- The full 5-8 million-row pack completes in 20 minutes on the published
  8-vCPU/16-GB grader.

The normalizer must support three schema versions per source, quarantine bad
rows with reason codes, infer variant clock offsets from cross-source anchors,
preserve stable ordering for equal timestamps, and resolve identity aliases.
`make test` must cover valid, duplicate, malformed, offset, and empty inputs.
Staff supply a deterministic 250,000-row holdout shard. Exact campaign,
false-positive, quarantine, reconciliation, and source-accounting counts must
match its sealed oracle without changing source code.

## Automatic caps

Grep-only analysis: 55. Single-line campaign attribution: 60. Screenshots
without raw rows/queries: 50. Undeclared source edits or fabricated evidence:
integrity escalation.

Start with the common submission and technical assessment contracts.

## Mission interface and handoff

- **You receive:** one signed candidate archive, five raw log sources, identity/change records, public schemas, and a private marker overlay.
- **You build:** the canonical ingestion, provenance, identity, clock, query, and command-line interfaces used throughout the SOC track.
- **You prove:** every source row is accounted for and every campaign edge has two raw locators; candidate IDs, indicators, counts, and timestamps are configuration or evidence, never source constants.
- **You hand forward:** the normalized event schema, adapter interface, provenance model, and reusable hunt runner for Stage 6.
