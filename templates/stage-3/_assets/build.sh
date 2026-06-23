#!/usr/bin/env bash
# Build Stage 3 capstone deliverable templates -> branded .docx (pandoc) + .pdf (pdfkit).
# Run from netforge/ : bash templates/stage-3/_assets/build.sh
set -eu
HERE="$(cd "$(dirname "$0")" && pwd)"
REF="$HERE/reference-ubi.docx"
SRC="$HERE/../per-deliverable"
OUT="public/capstone/stage-3"
mkdir -p "$OUT"
# src basename : output slug : PDF title label
for row in \
  "d1-process-triage:stage-3-process-triage-template:Stage 3 Process Triage" \
  "d2-incident-timeline:stage-3-incident-timeline-template:Stage 3 Incident Timeline" \
  "d3-iocs:stage-3-iocs-template:Stage 3 IOC List" \
  "d4-attack-map:stage-3-attack-map-template:Stage 3 ATT&CK Map" \
  "d5-incident-report:stage-3-incident-report-template:Stage 3 Incident Report"; do
  src="${row%%:*}"; rest="${row#*:}"; slug="${rest%%:*}"; title="${rest#*:}"
  pandoc "$SRC/$src.md" --reference-doc="$REF" -o "$OUT/$slug.docx"
  IN="$SRC/$src.md" OUT="$OUT/$slug.pdf" TITLE_LABEL="$title" npx tsx scripts/generate-doc-pdf.ts >/dev/null 2>&1
  echo "built $slug (.docx + .pdf)"
done
