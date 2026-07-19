# SOC Advanced 5: Full Incident Response

## Case authority and evidence handling

This is a fictional incident built from synthetic data. Analyze only the sealed
package assigned to you. Record every source hash before opening it, preserve
source files read-only where possible, preserve time zones, and keep recovered content
inside the submission's sealed `recovered/` directory.

## Window and scoring

Fourteen days. No revision. Live defense. 100 points: evidence integrity 10,
multi-source reconstruction 30, recovered data and impact boundary 20,
hypothesis quality 10, response plan/detections 15, executive communication 5,
live defense 10.

## Required case questions

- What delivered initial access, and what exact artifact executed?
- What command-and-control infrastructure was used, and when was it active?
- How did privileges increase and which identity was affected?
- Which host-to-host movement is confirmed rather than inferred?
- What was accessed, what was staged, and what was confirmed exfiltrated?
- What exact synthetic records were recovered from the exfiltration stream?
- What evidence would most strongly challenge your primary hypothesis?

Use Zeek/Wireshark, oletools, and defensible host-log methods as the evidence
supports. The optional candidate-owned Windows capture source can extend the
case with Volatility 3 work, but memory analysis is not required for the scored
shared case. Tool choice earns no points by itself.

## Engineering deliverable

Build an unattended timeline pipeline that parses at least four evidence types,
normalizes both supplied clock offsets, preserves source locators, quarantines
parser failures, detects the manifest-tampered item, and emits deterministic
CSV/JSON. Reconstruct the split exfiltration archive from multiple sessions and
report its SHA-256, file count, record count, and synthetic case flags. Submit
tested detection content with positive and negative fixtures.

Staff verify exact archive facts, required event IDs and ordering, source-row
accounting, and a hidden detection fixture. During defense, the candidate must
reproduce two selected extractions from raw evidence using the submitted code.
Screenshots, a hand-built timeline, or archive creation without stream-level
reconstruction cannot satisfy the technical criterion.

## Live defense

The panel will select an artifact, ask for one fresh query, and inject one late
fact. Update the timeline or state why the fact does not change it. Concealing a
changed conclusion is worse than correcting it.

## Mission interface and final proof

- **You receive:** a signed sealed case containing host logs, email, a real PCAP, manifest, reconstructable archive, and candidate-marker evidence.
- **You build:** parser-driven acquisition verification, clock correction, super-timeline, archive reconstruction, detections, containment, and recovery using the prior SOC stack.
- **You prove:** each central conclusion has raw locators, alternatives, parser provenance, and exact reconstructed hashes/counts; an optional memory capture may add evidence but cannot replace the sealed sources.
- **You close:** the continuity record identifies every reused component, migration, discovered incompatibility, and final portfolio limitation.
