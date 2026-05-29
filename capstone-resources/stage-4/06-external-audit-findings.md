# Sankofa Digital - External Audit Findings Excerpt

Source: independent post-incident review, working excerpt for the board pack.
Amaka: "Use this as a governance artefact, not as gospel. If you agree,
say why. If you dispute, cite the evidence that changes the conclusion."

## Finding 1 - Incident response cycle exceeded benchmark

The review team observed approximately seven calendar days between the first
relevant alert cluster and formal containment. Comparable fintech response
programmes in this review set average approximately four days for similar
severity events. The delay increased uncertainty around affected records and
forced legal to work from partial facts.

Recommendation: define severity-based containment authority for Security,
including documented criteria for isolating a host before full business-owner
approval.

OWNER ACCEPTS / DISPUTES / DEFERS:

## Finding 2 - Tier-1 dismissal pattern was systemic

The Q2 ticket history shows repeated low-friction closure of related alerts,
including SD-40812 and later tickets linked to host-87 activity. This was not
a single analyst error; the process allowed repeated closure without mandatory
correlation across user leave status, source IP, and host telemetry.

Recommendation: require correlation review for any repeated user, source IP,
or host within a rolling seven-day window before Tier 1 may close as benign.

OWNER ACCEPTS / DISPUTES / DEFERS:

## Finding 3 - DPO notification lag created governance risk

The Data Protection Officer was not notified until approximately 36 hours
after Security had enough evidence to suspect customer data exposure. While
NDPA Section 40 includes a 72-hour notification clock, the deeper issue is the
absence of a trigger that brings the DPO into the response room early.

Recommendation: add DPO notification to the high-severity incident checklist,
with owner, timestamp, and escalation evidence captured in the case record.

OWNER ACCEPTS / DISPUTES / DEFERS:
