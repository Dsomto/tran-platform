# EH-A2 Vulnerable and Patched VM Source

This Vagrant source builds two isolated Ubuntu VMs from the same application:
`vulnerable` contains the documented command-injection and privileged backup
wildcard chain; `patched` retains service behavior while removing both root
causes. Only the host-only addresses in `Vagrantfile` are authorized.

Copy the exact evidence marker from your private assignment overlay, then build:

```bash
export UBI_STAGE6_MARKER='UBI-A6-XXXXXXXXXXXX'
vagrant up vulnerable patched
```

Provisioning derives two candidate-bound flags from that marker:

- `/home/support/user.txt`, readable by `support`
- `/root/root.txt`, readable only by root

Do not print either value during setup. The flags bind evidence to the private
assignment; they are not substitutes for a complete exploit transcript and
effective UID proof.

After confirming the required state, save checkpoints with
`vagrant snapshot save vulnerable clean-vulnerable` and
`vagrant snapshot save patched clean-patched`. Snapshot existence is not a
substitute for recording image/box hashes and the private room marker.

## Existing B1 VM

Candidates who already built the B1 VM do not need to rebuild it. Copy
`install-assigned-flags.sh` from this B2 source into the existing B1
`lab-source/` directory, set the marker, and run:

```bash
export UBI_STAGE6_MARKER='UBI-A6-XXXXXXXXXXXX'
vagrant ssh vulnerable -c \
  "sudo bash /vagrant/install-assigned-flags.sh '$UBI_STAGE6_MARKER'"
vagrant ssh patched -c \
  "sudo bash /vagrant/install-assigned-flags.sh '$UBI_STAGE6_MARKER'"
```

Record this as programme-supplied setup, restore or save the clean snapshots,
and then run the candidate-authored chain normally. B1 UID-0 evidence captured
before this correction remains valid.
