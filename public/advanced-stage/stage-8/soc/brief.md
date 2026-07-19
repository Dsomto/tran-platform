# SOC Advanced 4: Detection Engineering Under Adversary Pressure

## Window and scoring

Monday 09:00 WAT to Friday 18:10 WAT. No revision. Recorded defense. 100 points: lab reliability 15,
telemetry validation 15, detection logic 25, adversary/benign testing 25,
coverage and blind spots 10, defense 10.

## Supported lab

- Wazuh single-node Docker release `v4.14.6` or the release pinned by the
  programme team if this file is superseded.
- Windows 11 evaluation VM with a documented Sysmon configuration and Wazuh agent.
- Atomic Red Team on a host-only lab. Never run Atomic tests on a personal,
  employer, or production machine.

Follow the official Wazuh Docker instructions, including prerequisites and
certificate generation for the pinned tag. Record `docker compose ps`, image
digests, agent status, clock source, and one known event end to end before any
attack simulation.

## Detection contract

Complete all twelve rows in `technique-matrix.csv`. Select and record a specific
Atomic test GUID for each assigned technique. For every test preserve:

1. preflight and dependency output;
2. exact execution and cleanup transcript;
3. raw Windows/Sysmon event;
4. normalized Wazuh event;
5. custom rule and resulting alert;
6. a benign lookalike and its expected/actual result;
7. tuning history and blind spot.

A rule that matches only the Atomic command string is capped. At least six rules
must correlate multiple events or enforce a sequence/time window. Submit a test
harness that classifies `no_telemetry`, `decoder_failure`, `rule_miss`,
`suppressed`, and `alerted`; runs 12 canonical attacks and 24 benign fixtures;
and exits non-zero on a verdict mismatch. Staff add eight semantic attack
mutations and twelve benign holdouts. At least six mutations must alert and no
benign holdout may alert. The clean deployment and full suite must run
unattended. The panel assigns one safe reproduction from the suite.

## Mission interface and handoff

- **You receive:** a signed Windows replay, public behavior fixtures, technique matrix, candidate marker, and access to the isolated Wazuh/Windows lab.
- **You build:** clean deployment overlays, semantic rules/decoders, raw-normalized-alert provenance, and classified telemetry-failure output using prior-stage behaviors.
- **You prove:** sparse attacks and benign near-misses are distinguished without command literals, case IDs, expected event IDs, or private marker branches.
- **You hand forward:** portable detections, parser adapters, coverage gaps, false-positive decisions, and source-to-alert locators for Stage 9.
