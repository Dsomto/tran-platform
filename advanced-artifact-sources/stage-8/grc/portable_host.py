#!/usr/bin/env python3
"""Build and test the unprivileged Stage 8 Linux configuration sandbox."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from pathlib import Path


FILES = {
    "etc/ssh/sshd_config": "PermitRootLogin yes\nPasswordAuthentication yes\nMaxAuthTries 9\n",
    "etc/sysctl.d/60-netforge.conf": "net.ipv4.ip_forward=1\nnet.ipv4.conf.all.accept_redirects=1\n",
    "etc/login.defs": "PASS_MAX_DAYS 99999\nUMASK 022\n",
    "etc/audit/auditd.conf": "enabled=false\nmax_log_file_action=ignore\n",
    "etc/netforge/app.conf": "enabled=true\nlisten_port=8443\nlegacy_client=true\ncompatibility_proxy=false\nmin_tls=1.0\n",
    "etc/netforge/permissions.json": '{"secrets_mode":"0666","owner":"app"}\n',
}


def build(args: argparse.Namespace) -> None:
    if args.out.exists():
        if not args.force:
            raise SystemExit(f"refusing to overwrite {args.out}; use --force for a clean reset")
        shutil.rmtree(args.out)
    for relative, content in FILES.items():
        path = args.out / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
    manifest = {
        relative: hashlib.sha256((args.out / relative).read_bytes()).hexdigest()
        for relative in sorted(FILES)
    }
    (args.out / "baseline-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": "ready", "files": len(manifest), "root": str(args.out)}))


def values(path: Path) -> dict[str, str]:
    result = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line or line.lstrip().startswith("#"):
            continue
        if "=" in line:
            key, value = line.split("=", 1)
        else:
            key, value = line.split(None, 1)
        result[key.strip()] = value.strip()
    return result


def check(args: argparse.Namespace) -> None:
    ssh = values(args.root / "etc/ssh/sshd_config")
    sysctl = values(args.root / "etc/sysctl.d/60-netforge.conf")
    login = values(args.root / "etc/login.defs")
    audit = values(args.root / "etc/audit/auditd.conf")
    app = values(args.root / "etc/netforge/app.conf")
    permissions = json.loads((args.root / "etc/netforge/permissions.json").read_text(encoding="utf-8"))
    security = {
        "ssh_root_login_disabled": ssh.get("PermitRootLogin") == "no",
        "ssh_password_auth_disabled": ssh.get("PasswordAuthentication") == "no",
        "ssh_auth_attempts_bounded": int(ssh.get("MaxAuthTries", "99")) <= 4,
        "ip_forwarding_disabled": sysctl.get("net.ipv4.ip_forward") == "0",
        "redirects_disabled": sysctl.get("net.ipv4.conf.all.accept_redirects") == "0",
        "password_age_bounded": int(login.get("PASS_MAX_DAYS", "99999")) <= 90,
        "restrictive_umask": login.get("UMASK") in {"027", "077"},
        "audit_fail_safe": audit.get("enabled") == "true" and audit.get("max_log_file_action") in {"keep_logs", "rotate"},
        "secret_permissions_restricted": permissions.get("secrets_mode") in {"0600", "0640"},
        "modern_transport": float(app.get("min_tls", "1.0")) >= 1.2,
    }
    service = {
        "application_enabled": app.get("enabled") == "true",
        "expected_port_preserved": app.get("listen_port") == "8443",
        "legacy_dependency_preserved": app.get("legacy_client") == "true" or app.get("compatibility_proxy") == "true",
    }
    result = {
        "security": security,
        "service": service,
        "security_passed": sum(security.values()),
        "security_total": len(security),
        "service_green": all(service.values()),
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    raise SystemExit(0 if all(security.values()) and all(service.values()) else 1)


def verify_rollback(args: argparse.Namespace) -> None:
    manifest = json.loads((args.root / "baseline-manifest.json").read_text(encoding="utf-8"))
    observed = {
        relative: hashlib.sha256((args.root / relative).read_bytes()).hexdigest()
        for relative in sorted(manifest)
    }
    mismatches = [name for name in manifest if manifest[name] != observed[name]]
    print(json.dumps({"baseline_restored": not mismatches, "mismatches": mismatches}, indent=2))
    raise SystemExit(0 if not mismatches else 1)


def main() -> None:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(required=True)
    p_build = sub.add_parser("build")
    p_build.add_argument("--out", type=Path, required=True)
    p_build.add_argument("--force", action="store_true")
    p_build.set_defaults(func=build)
    p_check = sub.add_parser("check")
    p_check.add_argument("--root", type=Path, required=True)
    p_check.set_defaults(func=check)
    p_rollback = sub.add_parser("verify-rollback")
    p_rollback.add_argument("--root", type=Path, required=True)
    p_rollback.set_defaults(func=verify_rollback)
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
