# Stage 8 GRC Marking Guide: Hardening Compiler and Quantified Risk

The portable B2 configuration sandbox is controlling. VM, Vagrant, Ansible, Lynis, and OpenSCAP evidence is optional compatibility work and earns no hardware credit. There is no missing staff profile: the private overlay supplies budget, sensitivity, and control family; defense staff selects one control the candidate actually submitted.

## Rubric (100)

| Area | Points | Full-credit standard |
|---|---:|---|
| Release integrity and baseline | 10 | Correct B2 hash; immutable clean-state hash; complete state, service, vulnerability, and configuration inventory; baseline tests reconcile. |
| Control compiler and rollback | 25 | Versioned declarative schema; at least eight controls across required families; validated preconditions, dependency ordering, exact changes, postconditions, reason codes, and rollback; no answer-ID branches. |
| Security and service delta | 20 | At least eight expected security deltas; second apply changes zero state; rollback restores baseline hash; reapply succeeds; services remain green; planted false positive and conflict handled correctly. |
| Risk model and portfolio tests | 25 | Tested ranges, uncertainty, effectiveness, dependency, residual-risk, budget, optimization, and tie-break logic; public and changed fixture pass; exactly three treatments funded; deferrals generated from evidence. |
| Decision quality | 10 | Register and memo reconcile to program output; assumptions and limitations are explicit; investment rationale distinguishes security value, service impact, uncertainty, ownership, and residual risk. |
| Recorded defense | 10 | Candidate implements or changes one staff-selected submitted control and its tests, then runs the relevant lifecycle without manual state repair. |

## Scoring rules

- Do not require a VM, Ansible, OpenSCAP, or privileged host access.
- Manual edits to generated state do not earn compiler, idempotence, or rollback credit.
- Treating the planted false positive as a real defect or accepting a service regression loses the affected delta points.
- Exactly three treatments means exactly three; an over-budget or dependency-invalid portfolio does not earn optimizer-result credit.
- Do not impose an undisclosed cap. Score demonstrated criteria and explain every deduction.

## Required feedback

Name the evidence reviewed and commands rerun; report baseline, apply, second apply, rollback, reapply, service, and risk fixture outcomes; reconcile section arithmetic; distinguish missing from failed proof; and give a prioritized improvement path. Record any boundary-tie reread and one-point distinction.
