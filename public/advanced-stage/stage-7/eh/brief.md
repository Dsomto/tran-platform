# Ethical Hacking Advanced 3: Break the Cloud

## Authorization and cost gate

Use a dedicated AWS lab account containing no personal, employer, or production
resources. Enable root MFA. Do not create root access keys. Before CloudGoat,
create a USD 5 monthly budget with alerts at USD 3 and USD 4, plus an AWS Budget
Action or equivalent lab-account policy that denies new nonessential resource
creation at USD 4. Capture the account ID with the middle digits redacted. Stop
if an unexpected resource or principal appears.

## Supported setup

Linux or macOS, Python 3.11+, Terraform 1.5+, AWS CLI, and `jq`. The shared pack provides a
custom Terraform range derived from an IAM escalation pattern. The private room
marker supplies candidate-specific inputs. Resource
names, region, principals, decoys, and one effective-permission edge vary. Do
not download a public walkthrough or substitute the stock CloudGoat scenario.

## Window and scoring

Monday 09:00 WAT to Friday 18:10 WAT. Final revision opportunity. 100 points: account/cost safety 20,
enumeration 20, attack-path reasoning 25, CloudTrail evidence 15, remediation
10, teardown and residual checks 10.

## Completion

Begin from the scenario's low-privilege credentials. Build an enumeration tool
that calculates effective permissions across identity policies, resource
policies, trust conditions, and permission boundaries. Record effective identity
before and after each decisive action. Retrieve only the assigned Secrets
Manager value and preserve the ordered CloudTrail event IDs. Reject the planted
decoy permission with a tested explanation. Implement remediation as Terraform;
all business acceptance tests must remain green while every attack-path test
fails at its intended edge.

Destroy the range, then run residual queries across IAM, STS, Lambda, Secrets
Manager, S3, EC2, and CloudFormation/Terraform state. The result must match the
sealed empty baseline. A correct flag without tested remediation and cleanup is
capped below pass.

Destroy the scenario within four hours of the first successful create and before
23:59 UTC on the same day. If teardown fails, stop testing, preserve the failure evidence, and
remove resources manually using the inventory captured before creation.

## Mission interface and handoff

- **You receive:** buildable Terraform source, private room marker, budget and teardown limits, and public IAM interfaces for a dedicated lab account you control.
- **You build:** Terraform, runtime path discovery, CloudTrail evidence extraction, remediation, and residual inventory using the earlier path/evidence model.
- **You prove:** the secret is recovered only through the assigned IAM path and every created resource remains under the range prefix and teardown ledger.
- **You hand forward:** the identity-path graph, event provenance, cleanup model, and remediation evidence for Stage 8.
