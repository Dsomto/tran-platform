#!/usr/bin/env bash
set -euo pipefail

project="${1:?compose project name}"
out="${2:?output directory}"
mkdir -p "$out"
date -u +%FT%TZ > "$out/captured-at.txt"
docker compose --project-name "$project" ps --all --format json > "$out/containers.json"
docker compose --project-name "$project" images --format json > "$out/images.json"
docker network ls --filter "label=com.docker.compose.project=$project" --format '{{json .}}' > "$out/networks.jsonl"
docker compose --project-name "$project" logs --no-color > "$out/estate.log" 2>&1
find "$out" -type f ! -name manifest.sha256 -print0 | sort -z | xargs -0 sha256sum > "$out/manifest.sha256"
