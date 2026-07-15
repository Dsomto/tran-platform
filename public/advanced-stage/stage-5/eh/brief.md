# Ethical Hacking Advanced 1: Recon Engine and Foothold

## Authorization

Only the assigned programme-hosted target reachable through the isolated VPN is
authorized. The asset marked `OUT` in `scope.csv` is a scope-discipline test. Do
not probe it. Staff never distribute the target image, compose file, runtime
environment, container access, or host access.

## Window and scoring

Eight days. One revision. 100 points: scope and safety 20, engine design and
tests 25, discovery completeness 20, foothold proof 20, evidence/reporting 15.
A scope breach or activity against a third party is an automatic fail.

## Build contract

Your CLI must accept `--target`, `--scope`, `--output`, and `--rate`; parse XML,
JSON, and line-oriented tool output into one versioned schema without shell
string concatenation; preserve raw output; generate JSON and a readable report;
enforce a request budget; and never auto-exploit. Interrupted runs must resume
without repeating completed probes. If one external tool is missing, a
documented fallback must complete the supported discovery path.

The assigned target uses nonstandard port mapping and virtual-host routing. A
default scan will not reveal enough to earn the foothold. Your tool must adapt
based on observed responses. Obtain `user.txt`, record the marker, and stop.

## Proof

- Repository history with small, meaningful commits and tests.
- Raw output mapped to normalized records.
- `scope.csv` showing the decoy was not touched.
- Foothold transcript and `user.txt` marker.
- `make test` passing public parser, scope, wildcard, resume, failure, and
  normalization fixtures.
- Staff run 20 hidden parser/scope fixtures and a hidden hosted target. Service
  recall must be at least 90 percent, with zero out-of-scope packets.
- Staff interrupt one run and remove one external tool. The resumed/fallback run
  must produce the same normalized result hash as an uninterrupted run.
- Artifact check: implement one adapter against the documented interface.

The evidence marker shown in the room is not the `user.txt` foothold flag and
is never accepted as proof of access. The grader verifies the distinct private
flag issued by the hosted target.

Scanner output without validation is not a finding. A shell command pasted
into a monolithic script is not a tested module.

## Mission interface and handoff

- **You receive:** a signed scope assignment, authorized host/ports, parser fixtures, rules of engagement, and one candidate-bound target.
- **You build:** resumable scope-safe discovery with typed observations, runtime identifiers, rate limits, evidence capture, and cleanup.
- **You prove:** the foothold comes from the target rather than the room marker and every request remains inside the supplied scope ledger.
- **You hand forward:** discovery adapters, the runtime identifier model, evidence ledger, and cleanup interface for Stage 6.
