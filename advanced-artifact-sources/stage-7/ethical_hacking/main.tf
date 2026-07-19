data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "evidence" {
  bucket = "netforge-${var.range_id}-${var.bucket_suffix}"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "evidence" {
  bucket = aws_s3_bucket.evidence.id
  block_public_acls = true
  block_public_policy = true
  ignore_public_acls = true
  restrict_public_buckets = true
}

resource "aws_s3_object" "crown_jewel" {
  bucket = aws_s3_bucket.evidence.id
  key = "synthetic/crown-jewel.txt"
  content = var.secret_value
  server_side_encryption = "AES256"
}

resource "aws_iam_role" "entry" {
  name = "${var.range_id}-entry"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Effect = "Allow", Principal = { AWS = var.candidate_principal_arn }, Action = "sts:AssumeRole" }]
  })
}

resource "aws_iam_role" "lambda_reader" {
  name = "${var.range_id}-lambda-reader"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Effect = "Allow", Principal = { Service = "lambda.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
}

resource "aws_iam_role_policy" "lambda_reader" {
  role = aws_iam_role.lambda_reader.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = ["s3:GetObject"], Resource = aws_s3_object.crown_jewel.arn }]
  })
}

resource "aws_iam_role_policy" "entry_path" {
  role = aws_iam_role.entry.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      { Effect = "Allow", Action = ["iam:GetRole", "iam:ListRolePolicies", "iam:PassRole"], Resource = aws_iam_role.lambda_reader.arn },
      { Effect = "Allow", Action = ["lambda:CreateFunction", "lambda:GetFunction", "lambda:InvokeFunction", "lambda:DeleteFunction"], Resource = "arn:aws:lambda:${var.aws_region}:${data.aws_caller_identity.current.account_id}:function:${var.range_id}-*" }
    ]
  })
}
