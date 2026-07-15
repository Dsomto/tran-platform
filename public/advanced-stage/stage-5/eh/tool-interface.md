# Recon Engine Interface

Required invocation:

```text
recon-engine --target <ip-or-name> --scope scope.csv --output run/ --rate 25
```

Required output:

```text
run/
  run.json                 # versions, start/end UTC, arguments, exit status
  raw/<tool>/              # unedited tool output
  normalized/assets.jsonl  # one record per observed asset/service
  report.html
  errors.jsonl
```

Each normalized record must include `observed_at`, `target`, `port`, `protocol`,
`service`, `source_tool`, `source_file`, `confidence`, and `notes`. Vhost records
also include status, length, title, redirect, and baseline-difference fields.

Minimum tests: missing tool, timeout, malformed output, wildcard vhost,
duplicate service, scope rejection, interrupted run, and empty result.
