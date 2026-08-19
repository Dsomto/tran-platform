# SOC Advanced 4: Detection Engineering Under Adversary Pressure

## Window and scoring

Use the exact opening and deadline shown in the authenticated stage room. No
revision. Recorded defense. 100 points: release integrity and source accounting
10, normalization and provenance 15, detection logic 25, adversarial and benign
testing 25, deterministic automation 15, defense 10.

## Controlling execution route

The signed Windows replay in the issued archive is the complete scored source.
The mandatory route requires Python 3.11 or newer, 4 GB RAM, 2 GB free disk, and
no VM, Docker, cloud account, live endpoint, or internet connection after setup.
Process the replay as immutable evidence and preserve its manifest and hashes.

A candidate who already built Wazuh, Sysmon, Windows, or Atomic Red Team may
retain that work as a compatibility adapter and additional provenance. It does
not replace the replay results and earns no hardware bonus. Nobody is required
to rebuild or discard valid work already completed.

## Detection contract

Complete all twelve rows in `technique-matrix.csv`. Build a versioned event
adapter, semantic detection rules, and a command-line regression runner. For
every technique preserve:

1. source event locator and immutable hash;
2. normalized event or event sequence;
3. matching fields, window, threshold, and rule version;
4. alert or no-alert verdict with reason code;
5. a benign near-match and its expected/actual result;
6. one field-loss, rename, encoding, parent-process, or timing mutation;
7. tuning history and the remaining blind spot.

At least six detections must correlate multiple events or enforce a sequence or
time window. Exact command strings, case IDs, fixture IDs, expected event IDs,
private markers, and answer lookups are prohibited detection constants.

The harness must run twelve canonical attacks, twenty-four benign controls,
eight semantic attack mutations, and twelve benign holdouts. It must classify
`no_telemetry`, `parse_failure`, `rule_miss`, `suppressed`, `alerted`, and
`unexpected_alert`; emit machine-readable results; and exit non-zero on any
verdict mismatch. At least six mutations must alert and no benign holdout may
alert. Two clean runs must produce identical result hashes.

## Required proof

- Immutable source manifest and complete source-accounting totals.
- Raw-to-normalized-to-decision provenance for every case.
- Detection source, tests, mutation generator, and deterministic CLI runner.
- JUnit or equivalent regression output and stable result hashes.
- Coverage matrix showing tested fields, missing-field behavior, false-positive
  decisions, and blind spots.
- Recorded defense from a clean checkout against one staff-selected mutation.

## Compatibility rule

Existing Wazuh XML, Sigma, Sysmon, Atomic, OVA, or Docker evidence remains
admissible when an adapter maps it to the same portable event and verdict
contract. Scoring is based on correctness, generalization, evidence, and
reproducibility, not the size of the machine used.

## Mission interface and handoff

- **You receive:** signed replay, public behavior fixtures, technique matrix,
  private marker, and exact input/output contracts.
- **You build:** portable normalization, semantic detections, mutation tests,
  source-to-alert provenance, and classified failure output.
- **You prove:** sparse attacks and benign near-misses are distinguished without
  answer constants or infrastructure-dependent screenshots.
- **You hand forward:** tested detections, parser adapters, coverage gaps,
  false-positive decisions, and reproducible evidence for Stage 9.
