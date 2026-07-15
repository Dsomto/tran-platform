# GRC Advanced 5: Breach Governance

## Role

You are the governance lead in the incident room. This is a synthetic case, not
legal advice. Apply the supplied facts to the cited authorities, state every
assumption, and distinguish regulator notification, data-subject communication,
customer contract notice, and internal escalation.

## Window and scoring

Fourteen days. No revision. Live defense. 100 points: fact/role analysis 15,
trigger decisions 20, exact deadline computation 20, population calculation 15,
notifications 10, board/roadmap judgment 10, live defense 10.

## Authority baseline

- GDPR Article 33: supervisory-authority notice without undue delay and, where
  feasible, within 72 hours of awareness when the risk threshold is met.
- GDPR Article 34: affected-person communication without undue delay when the
  high-risk threshold is met, subject to its exceptions.
- Nigeria Data Protection Act 2023 section 40 and current NDPC guidance: assess
  the controller/processor duties and 72-hour Commission clock on awareness for
  a breach likely to risk individuals' rights and freedoms.
- California Civil Code section 1798.82, as amended by SB 446 effective
  1 January 2026: use the statutory trigger and 30-calendar-day disclosure
  rule, including permitted delay conditions. When more than 500 California
  residents are notified, submit the sample notice to the Attorney General
  within 15 calendar days after notifying affected consumers.

Do not label California's rule "CCPA 72 hours."

## Governance-engine build

Build a tested rules engine that ingests the supplied event ledger, data
inventory, overlap groups, jurisdiction rules, contract clocks, and authority
configuration. It must distinguish occurrence, detection, awareness,
confirmation, processor notice, consumer notice, and Attorney-General sample
clocks; deduplicate subjects; exclude network-disproved datasets; maintain
confirmed/lower/upper populations; and emit machine-readable triggers,
deadlines, notices, dependencies, and work items with source row and rule IDs.

Jurisdiction rules, thresholds, delay flags, timezone/holiday conventions where
applicable, and notice dependencies belong in data/configuration, not hard-coded
case branches. Published V1-V6 fixtures must match exact snapshots. Hidden
fixtures change awareness time, encryption-key status, overlap groups, and the
California count; all must pass without source edits.

## Live defense

The panel runs two hidden fixtures and selects one output. Trace it from source
row through rule ID to the generated deadline/notice work item, then recompute
after the supplied input change. A spreadsheet-only or prose-only result cannot
pass the technical criterion.

## Mission interface and final proof

- **You receive:** signed incident facts, data inventory, jurisdiction snapshots, deadline rules, evidence-quality records, and residual risks from prior stages.
- **You build:** a versioned rules engine that produces populations, triggers, deadlines, work items, notices, ownership, exceptions, decisions, and board outputs from one frozen fact set.
- **You prove:** every action traces from source row through rule/version to output and a changed fact updates all affected artifacts without manual contradiction.
- **You close:** the continuity record links policy, vendor assurance, audit, technical treatment, and breach governance into one evidence-led portfolio.
