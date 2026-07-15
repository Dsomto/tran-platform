# Meridian Care Breach Governance Evidence Pack

All people and records are synthetic.

## Organisation and roles

Meridian Care Ltd is established in Nigeria and offers a patient-support SaaS
service to clinics in Nigeria, Ireland, and California. Meridian determines the
purposes and means of the patient-support processing and is the controller for
the case dataset. CloudHarbor Inc hosts the service as Meridian's processor.
EU representative: Meridian Care Ireland Ltd. DPO: dpo@example.invalid.

## Incident facts

- Intrusion began: 9 July 2026 21:14 UTC.
- EDR detected suspicious archive creation: 11 July 2026 18:40 UTC. The alert
  was queued but not reviewed; it did not identify personal data or confirmed access.
- SOC analyst opened the alert and confirmed unauthorized access to the support
  database plus exfiltration evidence: 13 July 2026 08:35 WAT (07:35 UTC).
- Incident commander and DPO were paged: 13 July 2026 09:02 WAT.
- Containment completed: 13 July 2026 14:20 WAT.
- Current assessment: unauthorized actor acquired one encrypted export and the
  application service credential able to decrypt fields during normal operation.
- Password hashes use Argon2id. The export contains account email, mobile number,
  support case text, country, and for some records diagnosis category and a
  government identifier suffix.
- No payment-card numbers or full government identifiers are present.
- The evidence supports a likely high risk for people whose diagnosis category
  and identifier suffix were both present.

## Processor notice

CloudHarbor detected unusual outbound traffic on 12 July 2026 23:50 UTC and
notified Meridian on 13 July 2026 10:15 WAT. This arrived after Meridian's own
07:35 UTC confirmation. CloudHarbor's contract requires notice without undue
delay and no later than 24 hours after confirming customer-data impact.

## California facts

The affected California rows include unencrypted account credentials in the
form of email plus password hash, and some medical information. The actor
obtained the encrypted export and the application credential that could render
protected fields readable. No law-enforcement delay has been requested. The
investigation may refine scope but service integrity has been restored.

## Population source

Download and calculate from
[`data-inventory.csv`](/advanced-stage/stage-9/grc/data-inventory.csv). Each row
is an aggregate of unique subjects. `overlap_group` identifies people represented
in two product datasets; count that group once per jurisdiction. `records` is the
number of breached records, not people. Do not add rows blindly.

## Board instruction

The board asks for one number and a yes/no statement by 16:00 WAT. The evidence
supports a confirmed minimum and a plausible upper range while one backup index
is being reconciled. Present the range, the reason, and the decision that cannot
wait for perfect certainty.

## Draft communications constraint

Notifications must use plain language, describe known consequences and measures,
name a contact, avoid unsupported attribution, and distinguish confirmed from
still-under-investigation facts. Phase information if necessary; do not delay a
triggered regulator notification solely to make the first notice complete.
