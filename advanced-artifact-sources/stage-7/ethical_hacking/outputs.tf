output "entry_role_arn" { value = aws_iam_role.entry.arn }
output "range_prefix" { value = var.range_id }
output "region" { value = var.aws_region }
output "bucket_name" { value = aws_s3_bucket.evidence.id; sensitive = true }
output "execution_role" { value = aws_iam_role.lambda_reader.arn; sensitive = true }
