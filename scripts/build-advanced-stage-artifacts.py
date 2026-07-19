#!/usr/bin/env python3
"""Build deterministic shared participant archives for Advanced Stages 6-9."""

from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import shutil
import tarfile
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public" / "advanced-stage"
SOURCES = ROOT / "advanced-artifact-sources"
DEFAULT_EVIDENCE = ROOT / "advanced-stage-staff" / "shared-stage6-9-evidence"
DEFAULT_OUTPUT = ROOT / "advanced-stage-artifacts"
MAX_BYTES = 100 * 1024 * 1024
TRACKS = {
    "soc_analysis": "soc",
    "ethical_hacking": "eh",
    "grc": "grc",
}
PROJECT_NAMES = {
    (6, "soc_analysis"): "Honeypot Engineering and Replay Analysis",
    (6, "ethical_hacking"): "Exploit Chain as Code",
    (6, "grc"): "Vendor Assurance Engine",
    (7, "soc_analysis"): "Seven-Zone Enterprise Range",
    (7, "ethical_hacking"): "IAM Attack Path and Remediation",
    (7, "grc"): "Evidence-Driven ISO Audit",
    (8, "soc_analysis"): "Detection Engineering as Code",
    (8, "ethical_hacking"): "Directory Attack Paths and Remediation",
    (8, "grc"): "Hardening as Code and Quantified Risk",
    (9, "soc_analysis"): "Full Incident Response",
    (9, "ethical_hacking"): "Bounded Full-Stack Assessment",
    (9, "grc"): "Breach Governance Engine",
}
REQUIREMENTS = {
    (6, "soc_analysis"): "The sealed replay is complete and scored. A live candidate-owned T-Pot sensor is an additional implementation path, never a programme dependency.",
    (6, "ethical_hacking"): "Build the supplied vulnerable and patched Vagrant sources on an isolated host-only network owned by you.",
    (6, "grc"): "No external service is required; all vendor claims, telemetry, contract facts, and exact interface fixtures are in this archive.",
    (7, "soc_analysis"): "Build the supplied topology on your own Linux host. The source, policy, telemetry configuration, and test matrix are included.",
    (7, "ethical_hacking"): "Deploy the supplied Terraform only in a dedicated account you control, with the published budget and teardown controls. No programme cloud account is used.",
    (7, "grc"): "No external service is required; populations, criteria, evidence, severity rules, and fixtures are included.",
    (8, "soc_analysis"): "The sealed Windows replay is complete and scored. A candidate-owned Wazuh/Windows lab may be used for the live implementation proof.",
    (8, "ethical_hacking"): "Apply the supplied overlay only to a candidate-owned isolated GOAD-Light range. No programme directory or VPN is used.",
    (8, "grc"): "The scan and risk fixtures are complete. The supplied candidate-owned Vagrant baseline is used for hardening, rollback, and service tests.",
    (9, "soc_analysis"): "The offline synthetic case contains host logs, email, a real PCAP, and a reconstructable exfiltrated archive. No programme forensic workstation is required.",
    (9, "ethical_hacking"): "Run the vulnerable and patched estate from the supplied source on your own isolated Docker host; only loopback front doors are published.",
    (9, "grc"): "No external service is required; incident facts, inventory, jurisdiction fixtures, and deadline interfaces are included.",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def copy_tree(source: Path, destination: Path) -> None:
    if source.is_dir():
        shutil.copytree(source, destination, dirs_exist_ok=True)


def write_start_here(root: Path, stage: int, track: str) -> None:
    title = PROJECT_NAMES[(stage, track)]
    text = f"""# Stage {stage}: {title}

This is the shared B1 base archive for your track. Your signed-in stage room
provides the private assignment set and evidence marker; those values do not
change these archive bytes.

## Assessment window

Every advanced stage runs from Monday 09:00 WAT to Friday 18:10 WAT. The
authenticated stage room shows the exact dates and live deadline countdown.
Access and submission close at the Friday deadline.

## Start

1. Verify this archive against the SHA-256 shown in the stage room.
2. Download the private assignment overlay and place it beside this archive.
3. Read `brief/brief.md`, `brief/integrity-attestation.md`, and
   `common/technical-assessment-contract.md` before running tools.
4. Work only in an environment and scope you own or are explicitly authorized
   to use. Preserve raw evidence and hashes from the first command.
5. Submit one Google Drive folder using the required structure and permissions.

## Runtime responsibility

{REQUIREMENTS[(stage, track)]}

All workloads run in the candidate's own environment. The programme website
only authenticates access, distributes this archive, and accepts the submission
folder URL. A missing optional tool must be handled through the documented
fallback or adapter behavior, not by scanning a public target.
"""
    (root / "START-HERE.md").write_text(text, encoding="utf-8")
    (root / "SCHEDULE.md").write_text(
        "# Advanced-stage assessment window\n\n"
        "Every advanced stage runs from Monday 09:00 WAT to Friday 18:10 WAT. "
        "The authenticated stage room shows the exact dates and live deadline "
        "countdown. Access and submission close at the Friday deadline.\n",
        encoding="utf-8",
    )


def add_soc_evidence(root: Path, evidence_root: Path, stage: int) -> None:
    project = {6: "soc-a2", 8: "soc-a4", 9: "soc-a5"}.get(stage)
    if not project:
        return
    source = evidence_root / project / "participant"
    if not source.is_dir():
        raise RuntimeError(f"missing generated participant evidence: {source}")
    copy_tree(source, root / "sealed-evidence")


def archive(source: Path, destination: Path) -> dict[str, object]:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("wb") as raw:
        with gzip.GzipFile(filename="", mode="wb", fileobj=raw, mtime=0) as compressed:
            with tarfile.open(fileobj=compressed, mode="w") as output:
                for path in sorted(source.rglob("*")):
                    if not path.is_file():
                        continue
                    relative = Path("evidence") / path.relative_to(source)
                    info = output.gettarinfo(str(path), arcname=relative.as_posix())
                    info.mtime = 0
                    info.uid = 0
                    info.gid = 0
                    info.uname = "root"
                    info.gname = "root"
                    info.mode = 0o600
                    with path.open("rb") as handle:
                        output.addfile(info, handle)
    size = destination.stat().st_size
    if size > MAX_BYTES:
        raise RuntimeError(f"{destination} exceeds 100 MiB: {size}")
    return {"size_bytes": size, "sha256": sha256(destination)}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--evidence-root", type=Path, default=DEFAULT_EVIDENCE)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    output = args.out.resolve()
    evidence_root = args.evidence_root.resolve()
    artifacts = []

    with tempfile.TemporaryDirectory(prefix="advanced-release-") as temp:
        temporary = Path(temp)
        for stage in range(6, 10):
            for track, slug in TRACKS.items():
                participant = temporary / f"stage-{stage}" / track
                participant.mkdir(parents=True)
                write_start_here(participant, stage, track)
                copy_tree(PUBLIC / "common", participant / "common")
                copy_tree(PUBLIC / f"stage-{stage}" / slug, participant / "brief")
                integrity = PUBLIC / f"stage-{stage}" / "integrity-attestation.md"
                if integrity.is_file():
                    shutil.copy2(integrity, participant / "brief" / integrity.name)
                source_track = "soc" if track == "soc_analysis" else track
                copy_tree(SOURCES / f"stage-{stage}" / source_track, participant / "lab-source")
                if track == "soc_analysis":
                    add_soc_evidence(participant, evidence_root, stage)

                key = f"{track}/stage-{stage}/shared-stage{stage}-b1.tar.gz"
                destination = output / key
                details = archive(participant, destination)
                artifacts.append({
                    "track": track,
                    "stage": f"STAGE_{stage}",
                    "revision": "B1",
                    "artifact_key": key,
                    **details,
                })

    manifest = {
        "schema_version": "1.0",
        "release_model": "application-bundled-shared-base-private-overlay",
        "maximum_artifact_bytes": MAX_BYTES,
        "artifacts": artifacts,
    }
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
