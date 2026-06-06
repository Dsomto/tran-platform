#!/usr/bin/env bash
# Fetch every file from a Google Drive folder shared "Anyone with the link ->
# Viewer" and extract its text to /tmp/grading/<reportId>/.
#
# Usage:
#   ./scripts/fetch-drive-folder.sh <reportId> <folderUrl>
#
# Output: text files in /tmp/grading/<reportId>/ named after the source file,
# extension changed to .txt. PDFs go through pdftotext; DOCX through pandoc;
# Google Docs through their public text-export endpoint.
#
# Exit codes:
#   0 success (at least one file extracted)
#   2 folder URL not in expected shape
#   3 folder fetch failed (network / 403 / private)
#   4 no files visible in folder

set -e

REPORT_ID="$1"
FOLDER_URL="$2"

if [[ -z "$REPORT_ID" || -z "$FOLDER_URL" ]]; then
  echo "usage: $0 <reportId> <folderUrl>" >&2
  exit 2
fi

FOLDER_ID=$(echo "$FOLDER_URL" | grep -oE 'folders/[A-Za-z0-9_-]+' | cut -d/ -f2)
if [[ -z "$FOLDER_ID" ]]; then
  # Tolerate id=... query format too
  FOLDER_ID=$(echo "$FOLDER_URL" | grep -oE 'id=[A-Za-z0-9_-]+' | cut -d= -f2)
fi
if [[ -z "$FOLDER_ID" ]]; then
  echo "could not parse folder ID from $FOLDER_URL" >&2
  exit 2
fi

OUT_DIR="/tmp/grading/$REPORT_ID"
mkdir -p "$OUT_DIR"

HTML="$OUT_DIR/_folder.html"
curl -sL "https://drive.google.com/embeddedfolderview?id=$FOLDER_ID#list" -o "$HTML"
if [[ ! -s "$HTML" ]]; then
  echo "folder fetch failed (empty)" >&2
  exit 3
fi

# Parse entries: id="entry-<FILE_ID>" and adjacent <div class="flip-entry-title">NAME</div>
# Pair them in document order.
IDS=$(grep -oE 'id="entry-[A-Za-z0-9_-]+"' "$HTML" | sed -E 's/id="entry-(.*)"/\1/')
NAMES=$(grep -oE '<div class="flip-entry-title">[^<]+</div>' "$HTML" | sed -E 's/<div class="flip-entry-title">(.*)<\/div>/\1/')

ID_ARR=()
while IFS= read -r id; do ID_ARR+=("$id"); done <<< "$IDS"
NAME_ARR=()
while IFS= read -r n; do NAME_ARR+=("$n"); done <<< "$NAMES"

COUNT=${#ID_ARR[@]}
NAME_COUNT=${#NAME_ARR[@]}
if [[ "$COUNT" -eq 0 || "$NAME_COUNT" -eq 0 ]]; then
  echo "no files visible in folder $FOLDER_ID (may be private or empty)" >&2
  exit 4
fi
if [[ "$COUNT" -ne "$NAME_COUNT" ]]; then
  echo "warning: ID count ($COUNT) != name count ($NAME_COUNT); pairing in order anyway" >&2
fi

EXTRACTED=0
for i in "${!ID_ARR[@]}"; do
  FID="${ID_ARR[$i]}"
  RAW_NAME="${NAME_ARR[$i]:-file-$i}"
  # Sanitize: spaces -> _, drop weird chars
  SAFE=$(echo "$RAW_NAME" | sed -E 's/[^A-Za-z0-9._-]+/_/g')
  EXT="${RAW_NAME##*.}"
  EXT=$(echo "$EXT" | tr '[:upper:]' '[:lower:]')

  # Download to a temp file based on extension
  case "$EXT" in
    pdf)
      TMP="$OUT_DIR/${SAFE}"
      curl -sL "https://drive.google.com/uc?export=download&id=$FID" -o "$TMP"
      if [[ -s "$TMP" ]]; then
        # pdftotext -layout preserves table structure best for these reports
        pdftotext -layout "$TMP" "$OUT_DIR/${SAFE}.txt" 2>/dev/null || true
        rm -f "$TMP"
        if [[ -s "$OUT_DIR/${SAFE}.txt" ]]; then
          EXTRACTED=$((EXTRACTED + 1))
          echo "  ✓ $RAW_NAME -> ${SAFE}.txt ($(wc -c < "$OUT_DIR/${SAFE}.txt") bytes)"
        else
          echo "  ✗ $RAW_NAME (pdftotext empty — scanned image?)"
        fi
      else
        echo "  ✗ $RAW_NAME (download empty)"
      fi
      ;;
    docx)
      TMP="$OUT_DIR/${SAFE}"
      curl -sL "https://drive.google.com/uc?export=download&id=$FID" -o "$TMP"
      if [[ -s "$TMP" ]]; then
        pandoc "$TMP" -o "$OUT_DIR/${SAFE}.txt" 2>/dev/null || true
        rm -f "$TMP"
        if [[ -s "$OUT_DIR/${SAFE}.txt" ]]; then
          EXTRACTED=$((EXTRACTED + 1))
          echo "  ✓ $RAW_NAME -> ${SAFE}.txt ($(wc -c < "$OUT_DIR/${SAFE}.txt") bytes)"
        else
          echo "  ✗ $RAW_NAME (pandoc failed)"
        fi
      else
        echo "  ✗ $RAW_NAME (download empty)"
      fi
      ;;
    *)
      # Treat anything else (Google Docs natively don't have an extension in the name) as a Doc export
      OUT="$OUT_DIR/${SAFE}.txt"
      curl -sL "https://docs.google.com/document/d/$FID/export?format=txt" -o "$OUT"
      if [[ -s "$OUT" ]]; then
        EXTRACTED=$((EXTRACTED + 1))
        echo "  ✓ $RAW_NAME -> ${SAFE}.txt ($(wc -c < "$OUT") bytes)"
      else
        rm -f "$OUT"
        echo "  ? $RAW_NAME (unknown type, no extension — could not export)"
      fi
      ;;
  esac
done

if [[ "$EXTRACTED" -eq 0 ]]; then
  echo "no files extracted" >&2
  exit 4
fi

echo "files in $OUT_DIR:"
ls -la "$OUT_DIR" | grep -v "^total" | grep -v "_folder.html"
