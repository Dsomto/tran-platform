# EH-A2 Vulnerable and Patched VM Source

This Vagrant source builds two isolated Ubuntu VMs from the same application:
`vulnerable` contains the documented command-injection and privileged backup
wildcard chain; `patched` retains service behavior while removing both root
causes. Only the host-only addresses in `Vagrantfile` are authorized.

Build with `vagrant up vulnerable patched`. After confirming the required
state, save checkpoints with `vagrant snapshot save vulnerable clean-vulnerable`
and `vagrant snapshot save patched clean-patched`. Snapshot existence is not a
substitute for recording image/box hashes and the private room marker.
