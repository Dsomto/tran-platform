# SOC Advanced 2: Build a Honeypot, Catch the Internet

## Safety gate

Use a fresh, minimal supported Linux VM. T-Pot changes SSH, DNS, firewall, and
Docker configuration. The management plane must be restricted to your IP. The
sensor must have no route to private, corporate, metadata, or home LAN ranges.
Never execute a captured binary.

## Supported setup

Check the current official T-Pot requirements before provisioning. Run the
official installer as a non-root user from `$HOME`, follow its prompts, inspect
port conflicts, and reboot. Record the release/commit used. At assessment
authoring time, a sensor requires at least 8 GB RAM and 128 GB disk; the full
hive commonly needs 16 GB and 256 GB.

## Window and scoring

Monday 09:00 WAT to Friday 18:10 WAT. One revision. 100
points: isolation 25, deployment/reliability 15, evidence handling 15, analysis
30, communication 15. Event volume and country counts earn no points by
themselves.

## Required work

- Complete every row in `isolation-tests.csv` before public exposure.
- Preserve collection start/end UTC, host identity, T-Pot version, container
  status, and raw export hashes.
- Build `make ingest`, `make analyze`, and `make test` targets. The analysis
  pipeline must ingest both the sealed replay and a live T-Pot export through
  adapters, normalize to a documented schema, sessionize reordered reconnects,
  cluster infrastructure, extract payload hashes, and emit STIX 2.1 plus tested
  Sigma/Suricata content.
- Analyze credentials, protocols, infrastructure clusters, payload hashes, and
  at least one session at command level.
- Enrich indicators, but treat reputation as context rather than attribution.
- The sealed replay is the complete scored dataset. A candidate-owned live
  sensor is an additional pressure task and must never delay replay analysis.

Missing management isolation is a safety failure. A world-open dashboard caps
the project at zero pending incident review.

## Mandatory verification

- Isolation tests run from external, management, and sensor viewpoints; private,
  metadata, and management paths fail closed where prohibited.
- A holdout replay produces the exact session, cluster, payload, and detection
  counts declared by the assessment runner.
- For candidates completing the live pressure task, the assessor destroys and
  redeploys the candidate-owned sensor from the runbook. Collection and the
  supplied test alert must recover within 45 minutes.
- Missing raw-to-normalized locators, a manual-only analysis, or a pipeline that
  accepts only the candidate's own export is a reproduction failure.

## Mission interface and handoff

- **You receive:** the signed sealed replay, public session fixtures, isolation matrix, candidate marker, and candidate-run T-Pot boundary source.
- **You build:** a reproducible T-Pot boundary plus a live/replay adapter that emits the Stage 5 normalized schema, sessions, clusters, hashes, STIX, and detection content.
- **You prove:** live infrastructure evidence and replay evidence separately; neither may be claimed as proof of the other.
- **You hand forward:** normalized network sessions, cluster truth, detection candidates, false leads, and adapter contracts for Stage 7.
