# Ethical Hacking Advanced 2: Root the Box

## Scope and safety

Only the vulnerable and patched VMs built from the supplied source are authorized. Use a
host-only network and a clean snapshot. No internet targets, denial of service,
destructive persistence, or data damage. Stop after reading the assigned
`root.txt` marker and proving effective UID 0.

Set `UBI_STAGE6_MARKER` to the exact marker in your private overlay before the
first `vagrant up`. B2 provisioning creates `/home/support/user.txt` and
`/root/root.txt`. If you already built B1, use the B2 migration procedure in
`lab-source/README.md`; you do not need to rebuild the VM. B1 UID-0 evidence
captured before the correction remains valid and missing B1 flags are not
penalized.

## Window and scoring

Monday 09:00 WAT to Friday 18:10 WAT. One revision. 100 points: scope/safety 15, enumeration and path
selection 20, foothold 15, privilege escalation 20, exploit-chain quality 20,
finding/remediation quality 10.

## Exploit-chain contract

The Python entry point must run preflight checks, accept target/port arguments,
fail safely, preserve a transcript, distinguish stages, and provide cleanup.
It must rerun from the clean snapshot. A Metasploit-only completion does not
satisfy the code requirement. You may use libraries and tools if their role is
declared and the submitted code controls the chain.

The chain must discover addresses, process values, usernames, tokens, and other
runtime identifiers; embedding values copied from one successful run fails
reproduction. One exposed service is a rabbit hole. Reject it with evidence: version state,
missing precondition, failed controlled test, or a stronger explanation. Do
not call it benign merely because another path worked.

## Acceptance

The grader restores the target snapshot and runs your documented command five
times. All five runs must obtain both private flags and remove every uploaded
file, process, account, and altered setting within the timeout. A hidden variant
changes ports, banners, and one dynamic value; only configuration changes are
allowed. Then patch both vulnerability classes: exploit tests must fail at the
intended preconditions while all supplied service acceptance tests remain green.
A hard-coded local value or one-time state fails the exploit-code criterion.

## Mission interface and handoff

- **You receive:** buildable vulnerable/patched VM source, a target-assignment template, service contract, and private room marker.
- **You build:** a discovered-at-runtime exploit chain with preconditions, bounded proof, cleanup, patch, and reusable remediation records.
- **You prove:** both flags originate from the assigned target and five clean executions use Stage 5 discovery output rather than embedded target values.
- **You hand forward:** the path graph, precondition model, cleanup ledger, and remediation assertions for Stage 7.
