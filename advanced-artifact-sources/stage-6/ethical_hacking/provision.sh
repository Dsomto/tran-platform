#!/usr/bin/env bash
set -euo pipefail

mode="${1:?vulnerable or patched}"
marker="${2:?Stage 6 private marker}"
if [[ ! "$marker" =~ ^UBI-A6-[A-F0-9]{12}$ ]]; then
  echo "Invalid Stage 6 marker format" >&2
  exit 2
fi

id support >/dev/null 2>&1 || useradd --create-home --shell /bin/bash support
install -d -m 0750 -o root -g support /opt/netforge-support /srv/support/uploads /var/backups/support
chown support:support /srv/support/uploads
install -m 0750 "/vagrant/app.py" /opt/netforge-support/app.py
install -m 0750 "/vagrant/support-backup-${mode}" /usr/local/sbin/support-backup
install -m 0750 /vagrant/install-assigned-flags.sh /usr/local/sbin/install-assigned-flags
install -m 0644 /vagrant/netforge-support.service /etc/systemd/system/netforge-support.service
printf 'NETFORGE_MODE=%s\n' "$mode" > /etc/netforge-support.env
printf 'support ALL=(root) NOPASSWD: /usr/local/sbin/support-backup\n' > /etc/sudoers.d/netforge-support
chmod 0440 /etc/sudoers.d/netforge-support
/usr/local/sbin/install-assigned-flags "$marker"
systemctl daemon-reload
systemctl enable --now netforge-support
printf '%s\n' "$mode" > /var/lib/netforge-build-mode
