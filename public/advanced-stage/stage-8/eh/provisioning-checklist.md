# GOAD-Light Provisioning Checklist

- [ ] Host virtualization enabled; available RAM/CPU/disk recorded.
- [ ] Provider and provider version recorded.
- [ ] GOAD git commit recorded.
- [ ] Host-only CIDR does not overlap a home, employer, VPN, or cloud network.
- [ ] Official provider prerequisites complete.
- [ ] `./goad.sh -t check -l GOAD-Light -p <provider>` output preserved.
- [ ] `./goad.sh -t install -l GOAD-Light -p <provider>` output preserved.
- [ ] Every expected VM is running and resolves within the lab.
- [ ] Domain controller time synchronization and DNS health checked.
- [ ] Attacker VM has no bridged adapter while the assessment runs.
- [ ] Snapshot or rebuild procedure tested.
- [ ] Teardown command and post-teardown checks recorded.

Local preflight verdict: `[ready / blocked]`
Failure evidence or approved pressure-task reduction: `[insert]`
