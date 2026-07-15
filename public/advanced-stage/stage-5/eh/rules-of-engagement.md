# Rules of Engagement: A1 Recon Target

| Item | Rule |
|---|---|
| In scope | The assigned container network and IP listed in `scope.csv` |
| Out of scope | Every other IP, domain, local service, and the explicit decoy |
| Allowed | Discovery, low-rate enumeration, vhost probing, authentication with credentials found inside the assigned target |
| Prohibited | Denial of service, destructive writes, persistence, malware, credential reuse elsewhere, internet scanning |
| Proof limit | Read the assigned `user.txt`; stop before privilege escalation |
| Hours | The published assessment window only |
| Stop condition | Unexpected third-party address, unstable target, or evidence of non-synthetic data |
| Escalation | Stop, preserve output, and notify the assessment lead with UTC time and last command |

I understand and accept the scope.

Intern code: `[insert]`  
Signed name: `[insert]`  
UTC date/time: `[insert]`
