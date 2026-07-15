# CloudScale Dynamics Evidence Pack

## Organisation context, 14 July 2026

CloudScale is a 240-person Nigerian SaaS provider. Staff work in Lagos, Abuja,
London, and remotely. The company processes customer account contacts and
support attachments. Engineering owns endpoint administration. Legal owns
privacy advice. Security has two staff and no dedicated policy administrator.

Board constraint: fund and mandate exactly three new controls this quarter.
Maximum implementation effort is 900 staff-hours. Customer support must remain
available 24/7. Existing enterprise tools: Entra ID, GitHub Enterprise, an MDM
platform covering company laptops, and central logging for production servers.

## Legacy Acceptable Use Policy, approved 3 September 2018

1. Passwords must be eight characters, contain three character classes, and be
   changed every 90 days.
2. Staff may use personal devices with manager approval. CloudScale may inspect
   any device used for work at any time.
3. Multi-factor authentication is available for staff who want additional
   protection.
4. Remote access must use the corporate VPN.
5. Company email may be used for reasonable personal communication.
6. Production access is granted by the Head of Engineering and reviewed when a
   manager requests it.
7. Security monitoring may be performed on company systems.
8. Suspected incidents must be emailed to the IT helpdesk.

The annual policy review date in section 11 remains appropriate and is not a
gap merely because the document is old.

## Stakeholder message: Engineering

From: VP Engineering  
Date: 9 July 2026  

"Do not mandate security keys for every role this quarter. Support contractors
change weekly and we cannot wait for physical delivery. MDM already reports
encryption on our 176 enrolled laptops. I can support phishing-resistant MFA
for production admins and a joiner/mover/leaver review if Security automates it."

## Stakeholder message: Legal

From: General Counsel  
Date: 10 July 2026  

"The personal-device inspection clause is too broad. Approval does not establish
informed monitoring terms. Support attachments can contain identity documents.
We need a lawful, proportionate control and a clear incident escalation route.
An email to a general helpdesk is not enough for a likely personal-data breach."

## Evidence record: MDM dashboard screenshot

Filename offered: `mdm-compliance.png`  
Captured: 18 November 2024  
Scope visible: 91 devices; 89 encrypted  
Current inventory: 176 company laptops plus approved personal devices  
Owner statement: "This proves encryption is implemented everywhere."

## Colleague's draft mapping

| Draft gap | Proposed mapping | Draft conclusion |
|---|---|---|
| MFA is optional | ISO A.8.5 | Make strong authentication mandatory for privileged access |
| Access reviews occur only on request | ISO A.5.18 | Establish scheduled access-right reviews |
| BYOD monitoring has no privacy boundary | ISO A.8.12 | Data leakage prevention fully addresses employee-monitoring law |
| Helpdesk is the only incident route | ISO A.5.24 | Establish incident-management roles and escalation |
| 90-day password changes | NIST CSF PR.AA-01 | Keep the rule because frequent rotation is always safer |

At least one ISO mapping above is materially wrong for the stated gap. Several
conclusions also overstate what their evidence or reference proves.

## Artifact reliability notes

- The MDM screenshot has no export metadata and predates the current inventory.
- No current access-review ticket was supplied.
- Entra ID configuration export shows MFA enabled for administrators but no
  conditional-access policy requiring it for all privileged roles.
- Helpdesk records show three security emails in Q2; one was routed after 31 hours.
