# GRC Advanced 1: Policy Gap Under Constraint

## Window and scoring

Monday 09:00 WAT to Friday 18:10 WAT. One revision. 100 points: gap accuracy 25, control mapping 20,
evidence judgment 20, three-control decision 20, enforceable drafting 15.

## Board instruction

CloudScale Dynamics supplies one shared evidence corpus and assigns exactly
three technical control outcomes in `control-state.json`. Your private board
overlay changes capacity, deadline, and applicability facts without changing
the shared corpus. Map and implement those three outcomes only. Other material risks
must be deferred, accepted, transferred, or reduced by an existing control with
an owner and review trigger. Adding or replacing an assigned outcome fails the
board constraint.

## Required work

1. Separate policy, implementation, process, and evidence gaps.
2. Correct one planted bad control mapping in the colleague draft.
3. Decide whether the screenshot proves current implementation.
4. Resolve Engineering's delivery concern and Legal's privacy/regulatory concern.
5. Draft a two-page addendum. Every clause needs owner, scope, requirement,
   exception route, enforcement evidence, and review cadence.

## Policy-engine build

Implement the three assigned controls as OPA/Rego policies over the versioned
`control-state.json` schema. Emit machine-readable decisions containing policy
ID, asset locator, allow/deny, violation code, and evidence locator. Exceptions
must contain owner, reason, approval, expiry, and compensating control; malformed,
incomplete, or expired exceptions fail closed. Asset IDs and fixture answers may
not be embedded in policy source.

`opa test` must pass 18 published positive, negative, malformed, and exception
fixtures. Staff add 12 hidden state fixtures with different IDs/order and then
one asset plus one exception during the artifact check. Exact decisions and the
generated report must update without policy-source changes. The written control
test, evidence index, and policy result must reconcile exactly.

Use NIST CSF 2.0 identifiers and valid ISO/IEC 27001:2022 Annex A control
identifiers. Do not reproduce licensed ISO text. Cite the NDPA source used and
state legal assumptions.

## Proof

The report must show the corrected mapping, exactly three selected controls,
explicit deferrals, and the evidence-quality verdict for every artifact. A
document-only submission cannot pass this project.

## Mission interface and handoff

- **You receive:** shared signed state/fixture inputs, a planted mapping, evidence records, and a private board/marker overlay.
- **You build:** a typed control, exception, evidence-quality, decision, and reporting model with deterministic machine output.
- **You prove:** all three selected outcomes trace from source evidence through policy decision to written control and explicit deferral.
- **You hand forward:** the schemas, evidence grades, control identifiers, exception logic, and decision ledger for Stage 6.
