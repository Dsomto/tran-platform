#!/usr/bin/env python3
"""Fetch every current Stage 5 Drive submission with bounded concurrency."""

import concurrent.futures
import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BATCH = ROOT / "marking-guides" / "stage5-all-batch.json"
FETCHER = ROOT / "marking-guides" / "stage5_fetch.py"
SUMMARY = ROOT / "marking-guides" / "stage5-fetch-summary.json"
CACHE = Path("/tmp/stage5-grade")
WORKERS = 5


def fetch(row, force=False):
    manifest_path = CACHE / row["reportId"] / "manifest.json"
    if manifest_path.exists() and not force:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        return {
            "reportId": row["reportId"],
            "name": row["name"],
            "track": row["track"],
            "version": row["version"],
            "cannotOpen": manifest.get("cannotOpen", False),
            "fileCount": manifest.get("fileCount", 0),
            "extractedCount": manifest.get("extractedCount", 0),
            "combinedTextBytes": manifest.get("combinedTextBytes", 0),
            "manifestPath": str(manifest_path),
            "cached": True,
            "exitCode": 0,
        }
    result = subprocess.run(
        [sys.executable, str(FETCHER), row["reportId"]],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    try:
        payload = json.loads(result.stdout)
    except json.JSONDecodeError:
        payload = {
            "reportId": row["reportId"],
            "name": row["name"],
            "track": row["track"],
            "error": (result.stderr or result.stdout or "unknown fetch error").strip(),
        }
    payload["exitCode"] = result.returncode
    return payload


def main():
    rows = json.loads(BATCH.read_text(encoding="utf-8"))
    force = "--force" in sys.argv[1:]
    status_filters = {
        argument.split("=", 1)[1]
        for argument in sys.argv[1:]
        if argument.startswith("--status=")
    }
    requested = {
        argument
        for argument in sys.argv[1:]
        if argument != "--force" and not argument.startswith("--status=")
    }
    if status_filters:
        rows = [row for row in rows if row["status"] in status_filters]
    if requested:
        rows = [row for row in rows if row["reportId"] in requested]

    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {pool.submit(fetch, row, force): row for row in rows}
        for completed, future in enumerate(
            concurrent.futures.as_completed(futures), start=1
        ):
            result = future.result()
            results.append(result)
            state = (
                "ERROR"
                if result.get("error") or result.get("exitCode")
                else "LOCKED"
                if result.get("cannotOpen")
                else "OK"
            )
            print(
                f"[{completed:02d}/{len(rows):02d}] {state:6} "
                f"{result.get('track', '?'):16} {result.get('name', '?')}"
            )

    results.sort(key=lambda item: item["reportId"])
    SUMMARY.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
    ok = sum(
        1
        for result in results
        if not result.get("cannotOpen")
        and not result.get("error")
        and result.get("exitCode") == 0
    )
    locked = sum(1 for result in results if result.get("cannotOpen"))
    errors = len(results) - ok - locked
    print(f"\nFetched {ok}; inaccessible {locked}; errors {errors}.")
    print(f"Summary: {SUMMARY}")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
