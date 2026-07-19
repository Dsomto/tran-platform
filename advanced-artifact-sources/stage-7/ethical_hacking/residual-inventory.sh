#!/usr/bin/env bash
set -euo pipefail

prefix="${1:?range prefix}"
region="${2:?aws region}"
out="${3:?output json path}"
jq -n \
  --argjson roles "$(aws iam list-roles --query "Roles[?starts_with(RoleName, '$prefix')]")" \
  --argjson functions "$(aws lambda list-functions --region "$region" --query "Functions[?starts_with(FunctionName, '$prefix')]")" \
  --argjson buckets "$(aws s3api list-buckets --query "Buckets[?starts_with(Name, 'netforge-$prefix')]")" \
  '{roles:$roles,functions:$functions,buckets:$buckets}' > "$out"
