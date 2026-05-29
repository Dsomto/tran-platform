# Sankofa Digital - Board Minutes Excerpt

Meeting: special board session after Q2 incident disclosure
Amaka: "This is the room your memo must survive. Answer the open questions
directly, especially where a control decision has a cost."

## Resolved Questions

Q1: Did customer data leave Sankofa control?
Resolved: Yes, based on the Stage 3 exfil evidence and the Stage 2 redacted
customer_pii sample. The board asked management to use a conservative affected
count until the offline evidence locker is reconciled.

Q2: Was the legacy-admin system still in business use?
Resolved: Yes. Engineering confirmed the system remained reachable for support
fallbacks despite prior decommission plans.

Q3: Who owns customer and regulator communications?
Resolved: General Counsel owns regulator submissions; Comms owns customer
language; Security owns the evidence appendix and technical accuracy.

## Open Questions

Q1: Which single control would have broken the exploit chain earliest: removing
legacy-admin, fixing JWT validation, disabling XML external entities, or
isolating host-87 sooner?

Q2: How many affected customers should we cite before the offline evidence
locker review is complete?

Q3: If we had isolated host-87 at 02:15 instead of 04:08, what would we have
saved?

## Tabled Motion

Motion: approve an immediate 12-month security uplift budget covering legacy
system retirement, SOC correlation rules, DPO escalation workflow, and quarterly
external assurance.

Status: tabled until management returns with a risk-ranked roadmap, named
owners, and cost bands.
