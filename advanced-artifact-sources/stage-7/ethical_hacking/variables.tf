variable "aws_region" { type = string }
variable "range_id" { type = string }
variable "candidate_principal_arn" { type = string }
variable "secret_value" { type = string; sensitive = true }
variable "bucket_suffix" { type = string; sensitive = true }
