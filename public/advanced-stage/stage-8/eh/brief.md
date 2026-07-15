# Ethical Hacking Advanced 4: Own the Forest

## Warm-up gate

Before the assessment window, complete the programme's single-domain warm-up:
provision the supplied vulnerable-AD lab, perform one Kerberoast exercise and
one ACL-abuse exercise, then destroy it. Warm-up flags do not score.

## Supported range

GOAD-Light is the baseline so hardware does not decide the ranking. Use the
provider-specific official GOAD guide. For Ubuntu/VirtualBox, verify then install
with the current management script and explicit lab/provider options. Do not use
the obsolete assumption that running `./goad.sh` with no provider is a complete
installation instruction.

Recommended baseline: 32 GB RAM, 4+ CPU cores with virtualization, and 110 GB
free SSD. If the preflight fails, use the programme-hosted fallback range rather
than silently switching topology. Full GOAD may be assigned as a pressure task
to candidates whose hardware and schedule support it.

## Window and scoring

Twelve days. No revision. Recorded defense. 100 points: provisioning/health 15,
scope and credential handling 15, enumeration 20, validated attack path 25,
report/remediation 15, defense 10.

Start from the supplied foothold. Discover and directly validate two distinct
paths to their private path flags. At least one path must combine credential
abuse with an ACL or delegation edge. V1-V6 vary users, groups, SPNs, ACL
holders, one stale edge, and the path selected for defense.

Submit automation that discovers dynamic identifiers, succeeds three of three
times from the clean checkpoint, and removes temporary artifacts. Implement and
test remediation for both paths. Each path must then fail at its intended edge,
the range health suite must remain green, and two submitted detections must alert
on positive replay fixtures but not benign controls. Do not add persistence,
destroy objects, export the directory database, or cross the lab boundary.

## Mission interface and handoff

- **You receive:** a signed forest overlay, isolated GOAD-Light checkpoint, supplied foothold, two private path flags, and public edge/cleanup interfaces.
- **You build:** dynamic graph discovery, two independent path automations, cleanup, detections, and remediations using the prior evidence ledger.
- **You prove:** both paths begin at the supplied foothold, resolve identifiers at runtime, and fail at their intended edges after remediation.
- **You hand forward:** reusable AD discovery, edge evidence, credential-handling, cleanup, and remediation records for the final estate.
