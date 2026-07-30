#!/usr/bin/env bash
set -euo pipefail

out="${1:?output directory}"
mkdir -p "$out"
date -u +%FT%TZ > "$out/captured-at.txt"
systemctl cat netforge-support > "$out/service-unit.txt"
systemctl show netforge-support > "$out/service-state.txt"
ss -H -lntup > "$out/listeners.txt"
sudo -l -U support > "$out/support-sudo.txt"
sha256sum /opt/netforge-support/app.py /usr/local/sbin/support-backup > "$out/installed-hashes.txt"
stat --printf='%n|%U|%G|%a|%s\n' /home/support/user.txt > "$out/flag-metadata.txt"
sudo stat --printf='%n|%U|%G|%a|%s\n' /root/root.txt >> "$out/flag-metadata.txt"
