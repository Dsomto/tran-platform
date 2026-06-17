#!/usr/bin/env bash
# Regenerate the Stage 2 capstone .docx templates from the markdown sources,
# applying the branded UBI reference (blue headings, running header, callout
# blocks). Run from netforge/ : bash templates/stage-2/_assets/build-docx.sh
set -eu
HERE="$(cd "$(dirname "$0")" && pwd)"
REF="$HERE/reference-ubi.docx"
SRC="$HERE/../per-deliverable"
OUT="public/capstone/stage-2"
for pair in "d1:stage-2-d1-findings-template" "d2:stage-2-d2-chain-template" \
            "d3:stage-2-d3-report-template" "d4:stage-2-d4-ethics-template"; do
  src="${pair%%:*}"; slug="${pair##*:}"
  pandoc "$SRC/$src.md" --reference-doc="$REF" -o "$OUT/$slug.docx"
  echo "wrote $OUT/$slug.docx"
done
