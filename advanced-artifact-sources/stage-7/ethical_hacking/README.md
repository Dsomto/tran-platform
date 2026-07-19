# EH-A3 Custom AWS IAM Range Source

This Terraform bundle creates an isolated, low-cost IAM path: a declared
external principal may assume an entry role, create/invoke a Lambda function,
and pass only the range execution role. That execution role can read exactly
one synthetic crown-jewel object. The exercise is complete only inside the
candidate's dedicated lab AWS account and unique range prefix.

Supply a candidate-specific `range_id`, `candidate_principal_arn`,
`secret_value`, and random bucket suffix. Do not use a production principal.
CloudTrail must already be enabled in the candidate's lab account before the
range is deployed. Apply the supplied budget and teardown controls.
