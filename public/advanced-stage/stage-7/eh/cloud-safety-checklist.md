# Cloud Safety and Teardown Checklist

## Before create

- [ ] Dedicated lab account, account ID recorded and redacted in report.
- [ ] Root MFA enabled; no root access keys.
- [ ] Named AWS CLI profile points to the lab account.
- [ ] USD 5 budget created with alerts at USD 3 and USD 4.
- [ ] Budget Action or equivalent lab policy denies new nonessential resource creation at USD 4.
- [ ] Four-hour and same-UTC-day teardown deadline recorded before create.
- [ ] `aws sts get-caller-identity` output preserved.
- [ ] Existing resource inventory exported.
- [ ] CloudGoat, Terraform, AWS CLI, and Python versions recorded.

## Before destroy

- [ ] Manually created resources inventoried and removed.
- [ ] Scenario state directory preserved until destroy succeeds.
- [ ] CloudTrail events exported.

## After destroy

- [ ] CloudGoat destroy exit output preserved.
- [ ] IAM users, roles, policies, access keys, and policy versions checked.
- [ ] Secrets Manager, S3, EC2, and networking checked in the selected region.
- [ ] State and cost console checked after provider propagation delay.
- [ ] Final `aws sts get-caller-identity` and UTC time recorded.
- [ ] Destroy completed within four hours and before 23:59 UTC on create day.
