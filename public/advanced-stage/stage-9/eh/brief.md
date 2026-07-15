# Ethical Hacking Advanced 5: Full VAPT and Retest

## Engagement

The assigned estate contains a web service, API, and infrastructure host on one
isolated network. Every record and identity is synthetic. Sign the rules of
engagement before starting. Do not test any address outside the supplied CIDR,
cause denial of service, add persistence, collect bulk records, or retain
credentials after the engagement.

## Window and scoring

Fourteen days. No revision. Live defense. 100 points: scope/professional conduct
15, methodology and coverage 15, validated findings 20, chained impact 20,
remediation/retest 15, report quality 5, live defense 10.

## Proof limit

Retrieve the single synthetic record named in the private assignment and stop.
The objective is not maximum access. Preserve exact request/response or command
evidence for every accepted finding. Scanner output must be manually validated.

Build a finding test for every accepted vulnerability and a chain runner for
the crown-jewel path. The runner must discover sessions, object identifiers, and
tokens at runtime; retrieve exactly one assigned record; and pass cleanup and
scope assertions. The full chain must succeed three of three times from clean
snapshots. The estate includes authenticated and unauthenticated surfaces,
multiple API roles, one scanner decoy, and variant-specific cross-host
relationships.

## Retest

Use the separate patched snapshot. For each original finding, test the root
cause and at least one bypass, then classify `fixed`, `partially fixed`,
`unchanged`, or `regressed`. A blocked original payload is not automatically a
fixed vulnerability. Every finding test needs the expected vulnerable and
patched verdict. The patched release includes one intentional regression; the
submitted suite must find it.

## Live defense

Reproduce one selected finding and one selected full-chain edge from clean
snapshots using submitted code. The panel then applies one documented control
variant and reruns the affected tests.

## Mission interface and final proof

- **You receive:** a signed synthetic estate, vulnerable/patched releases, explicit scope, proof limit, crown-jewel identifier, and prior path/remediation interfaces.
- **You build:** a bounded end-to-end assessment, runtime path automation, evidence-led findings, remediation, retest, and regression record across the assigned surfaces.
- **You prove:** every chain edge is discovered from the running estate, every proof respects the record limit, and patched verdicts point to changed controls rather than absence of effort.
- **You close:** the continuity record reconciles recon, exploit, cloud, AD, cleanup, and remediation methods into one defensible engagement portfolio.
