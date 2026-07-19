#!/usr/bin/env python3
"""Insert the controlling Stage 5 brief into each tracked shared archive."""

from __future__ import annotations

import gzip
import hashlib
import io
import json
from pathlib import Path
import tarfile
import tempfile


ROOT = Path(__file__).resolve().parents[1]
ARTIFACT_ROOT = ROOT / "stage5-artifacts"
TRACKS = {
    "SOC_ANALYSIS": ("soc_analysis", "soc"),
    "ETHICAL_HACKING": ("ethical_hacking", "eh"),
    "GRC": ("grc", "grc"),
}
SCHEDULE = """# Advanced-stage assessment window

Every advanced stage runs from Monday 09:00 WAT to Friday 18:10 WAT. The
authenticated stage room shows the exact dates and live deadline countdown.
Access and submission close at the Friday deadline.
"""


def normalized_info(name: str, size: int) -> tarfile.TarInfo:
    info = tarfile.TarInfo(name)
    info.size = size
    info.mtime = 0
    info.uid = 0
    info.gid = 0
    info.uname = "root"
    info.gname = "root"
    info.mode = 0o600
    return info


def refresh(archive: Path, brief: bytes) -> None:
    with tempfile.NamedTemporaryFile(dir=archive.parent, delete=False) as temporary:
        temporary_path = Path(temporary.name)
        with gzip.GzipFile(filename="", mode="wb", fileobj=temporary, mtime=0) as compressed:
            with tarfile.open(fileobj=compressed, mode="w") as destination:
                with tarfile.open(archive, mode="r:gz") as source:
                    for member in source.getmembers():
                        if not member.isfile() or member.name in {"evidence/brief.md", "evidence/SCHEDULE.md"}:
                            continue
                        if member.name.startswith("/") or ".." in Path(member.name).parts:
                            raise RuntimeError(f"unsafe archive member: {member.name}")
                        payload = source.extractfile(member)
                        if payload is None:
                            raise RuntimeError(f"unable to read archive member: {member.name}")
                        destination.addfile(normalized_info(member.name, member.size), payload)
                destination.addfile(normalized_info("evidence/brief.md", len(brief)), io.BytesIO(brief))
                schedule = SCHEDULE.encode("utf-8")
                destination.addfile(normalized_info("evidence/SCHEDULE.md", len(schedule)), io.BytesIO(schedule))
    temporary_path.replace(archive)


def main() -> None:
    manifest_path = ARTIFACT_ROOT / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    by_track = {item["track"]: item for item in manifest["artifacts"]}
    for enum_track, (artifact_track, public_track) in TRACKS.items():
        archive = ARTIFACT_ROOT / artifact_track / "stage-5" / "shared-stage5-b1.tar.gz"
        brief = (ROOT / "public" / "advanced-stage" / "stage-5" / public_track / "brief.md").read_bytes()
        refresh(archive, brief)
        payload = archive.read_bytes()
        by_track[enum_track]["size_bytes"] = len(payload)
        by_track[enum_track]["sha256"] = hashlib.sha256(payload).hexdigest()
        if len(payload) > manifest["maximum_artifact_bytes"]:
            raise RuntimeError(f"archive exceeds release limit: {archive}")
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
