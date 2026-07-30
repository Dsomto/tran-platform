#!/usr/bin/env bash
set -euo pipefail

marker="${1:?Stage 6 private marker}"
if [[ ! "$marker" =~ ^UBI-A6-[A-F0-9]{12}$ ]]; then
  echo "Invalid Stage 6 marker format" >&2
  exit 2
fi

id support >/dev/null 2>&1 || {
  echo "The support account must exist before flags are installed" >&2
  exit 3
}

user_digest="$(printf 'stage6:user:%s' "$marker" | sha256sum | cut -c1-24)"
root_digest="$(printf 'stage6:root:%s' "$marker" | sha256sum | cut -c1-24)"

umask 077
printf 'UBI{A6_USER_%s}\n' "${user_digest^^}" > /home/support/user.txt
printf 'UBI{A6_ROOT_%s}\n' "${root_digest^^}" > /root/root.txt
chown support:support /home/support/user.txt
chown root:root /root/root.txt
chmod 0400 /home/support/user.txt /root/root.txt

printf 'Installed assigned Stage 6 markers at /home/support/user.txt and /root/root.txt\n'
