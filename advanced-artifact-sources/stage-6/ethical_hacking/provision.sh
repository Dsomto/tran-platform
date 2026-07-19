#!/usr/bin/env bash
set -euo pipefail

mode="${1:?vulnerable or patched}"
id support >/dev/null 2>&1 || useradd --create-home --shell /bin/bash support
install -d -m 0750 -o root -g support /opt/netforge-support /srv/support/uploads /var/backups/support
chown support:support /srv/support/uploads
install -m 0750 "/vagrant/app.py" /opt/netforge-support/app.py
install -m 0750 "/vagrant/support-backup-${mode}" /usr/local/sbin/support-backup
install -m 0644 /vagrant/netforge-support.service /etc/systemd/system/netforge-support.service
printf 'NETFORGE_MODE=%s\n' "$mode" > /etc/netforge-support.env
printf 'support ALL=(root) NOPASSWD: /usr/local/sbin/support-backup\n' > /etc/sudoers.d/netforge-support
chmod 0440 /etc/sudoers.d/netforge-support
systemctl daemon-reload
systemctl enable --now netforge-support
printf '%s\n' "$mode" > /var/lib/netforge-build-mode
