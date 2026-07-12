# Review Request v2: Advanced-Stage Cybersecurity Internship Projects

**To the reviewer (Codex):** This is the **second pass**. You reviewed v1 and raised 7 findings; we accepted almost all of them and revised. Below is (A) what you flagged and what we changed, and (B) the full revised project set. Please tell us honestly whether the fixes actually resolve your concerns, and whether the changes introduced any *new* problems. Be critical. Questions are at the bottom. Everything is self-contained.

---

## 0. Context (unchanged)

- Cybersecurity internship, Advanced Stage = final elimination. ~168 interns enter; we keep the **top 3 in each of 3 tracks** (SOC, GRC, Ethical Hacking) = 9 finalists.
- Goal: genuinely separate the good from the merely-competent. Definite proof + no-revision late projects + defense = the anti-bluff sieve.
- Everything is open-source, self-hosted on the intern's own machine; only the report + proof is submitted to us.

## A. Your v1 findings → what we changed

1. **EH-4 / GOAD is a prior-exposure filter.** → Added a **"Learn first" AD warm-up** (deploy `vulnerable-AD`, practice Kerberoast + one ACL abuse) + AD/BloodHound reading before the no-revision forest. Kept 12 days.
2. **GRC-3 technically confused (OpenSCAP/Lynis don't audit Keycloak).** → **Removed entirely.** GRC-3 is now a **full ISO 27001:2022 audit from a real evidence pack** (files). The OpenSCAP/Lynis hardening moved to GRC-4 with its **correct scope (OS hardening)**.
3. **SOC-2 honeypot too luck-based to rank.** → Kept the project (it's a great portfolio piece) but **grading is now on deployment rigor + isolation + depth of analysis, not attacker volume.**
4. **SOC-1 needs real ground-truth investment.** → Now shipped as a **sharp 5–8M-line pack with exact documented ground truth first**, scaling to 30M once validated.
5. **EH-1 recon wrapper too AI-copyable.** → Target is now a **per-intern custom variant** (non-standard ports/vhost hiding the foothold, so off-the-shelf scripts miss it); intern must **add a new module to their own tool live on video** under questioning; repo must show commit history.
6. **EH-3 CloudGoat "AWS or LocalStack" risky.** → **AWS free-tier is the supported path**; LocalStack marked not-guaranteed for that scenario.
7. **GRC-4 OpenVAS container unreliable.** → We now **provide a known-good pre-generated vuln-scan export** to build the register from; live OpenVAS is optional/bonus only, so tooling flakiness can't decide the ranking.

**Also added across all tracks (from your anti-bluff notes):**
- **Raw artifacts required** (command history, raw exports, hashes, git commit history w/ timestamps) — screenshots alone don't count.
- **Video defense on Projects 4 & 5 in every track** (screen-recorded walkthrough + reproduce a step live + unseen questions).
- **Per-intern unique variants** on every project.
- **"Learn first, no walkthroughs"** pointers on the hardest projects.

## B. The revised 15 projects

### TRACK 1 — SOC Analyst
- **SOC-1 · Large-Scale Threat Hunt (7d)** — `pip install duckdb` or docker-elk. A sharp **5–8M-line** (→30M) multi-source pack with exact ground truth; 2–3 real campaigns + planted FPs (own-scanner, broken backup job, auto-updater). Ingest at scale, reconstruct campaigns, separate + justify FPs. *Proof:* reconstructions + TP/FP table vs ground truth.
- **SOC-2 · Build a Honeypot (7d)** — `git clone telekom-security/tpotce && sudo ./install.sh` on an internet VM, 7+ days. Collect/analyse real attacks, enrich IPs. *Graded on deployment rigor + analysis depth, not volume.* *Proof:* live dashboard + unique dataset + malware hashes.
- **SOC-3 · Design + Defend a Network (9d)** — Cisco Packet Tracer. Build segmented net (VLANs/DMZ/ACLs/syslog); prove segmentation stops an attacker or fix the hole; log to syslog. *Proof:* `.pkt` file + syslog evidence.
- **SOC-4 · Build a Detection Lab (10d, no revision, video defense)** — Wazuh docker + Windows/Sysmon victim + Atomic Red Team. Build pipeline, run 8 techniques, write rules that provably fire and stay quiet. *Proof:* raw alerts + rules + video.
- **SOC-5 · Full IR capstone (10d, video + live defense)** — Volatility3/Zeek/oletools; we hand a PCAP + memory dump + host logs of a full kill chain. Reconstruct each stage with a definite artifact; **recover the actual stolen data.** *Proof:* recovered data + IOCs + video/live defense.

### TRACK 2 — Ethical Hacking / VAPT (OSCP-grade)
- **EH-1 · Build a Recon Engine + Foothold (6d)** — `go install` subfinder/httpx/naabu/nuclei; target is a **per-intern variant** hiding the foothold behind non-standard ports/vhost. Build the tool, surface + exploit the foothold, **add a module live on video.** *Proof:* repo w/ history + report + user flag + live module-add.
- **EH-2 · Root the Box — Exploit as Code (8d)** — a hard VulnHub box (rotated per intern, 3–4 equivalents). *Learn first:* Linux privesc fundamentals. Foothold→root, packaged as a re-runnable Python exploit; one planted rabbit-hole. *Proof:* `root.txt` + exploit script.
- **EH-3 · Break the Cloud (9d)** — CloudGoat `iam_privesc_by_rollback` on **AWS free-tier (supported)**; Pacu. Deploy w/ Terraform, IAM privesc low→admin, reach crown-jewel secret, destroy. *Proof:* secret + privesc path.
- **EH-4 · Own the Forest — GOAD (12d, no revision, video defense)** — *Learn first: single-DC vulnerable-AD warm-up.* `git clone GOAD && ./goad.sh`; Impacket/NetExec/BloodHound/Hashcat. Stand up multi-DC forest, BloodHound → Kerberoast → crack → ACL abuse → lateral → DCSync, own both domains. *Proof:* flags + BloodHound path graph + video.
- **EH-5 · Full VAPT + Retest (12d, capstone, video + live defense)** — build a web+API+ (Kubernetes Goat / Metasploitable 3) estate. RoE, test all, chain to crown-jewel + exfil a record, **retest a patched version**, rewrite one finding for execs. Reuse P1 tool + P2 exploits. *Proof:* crown-jewel record + retest deltas + video.

### TRACK 3 — GRC Analyst (rebuilt)
- **GRC-1 · Policy Gap (5d, hardened)** — CloudScale AUP + context, **now with contradictory stakeholder emails, outdated screenshots, a planted WRONG control mapping to catch, and a board constraint (mandate only 3 controls).** Map gaps to correct control IDs, catch the fake mapping, prioritise 3, flag the FP-trap clause. *Proof:* correct IDs + caught fake mapping + prioritised 3.
- **GRC-2 · Vendor Risk (7d, hardened)** — PeopleFlow SOC 2 (3 exceptions) + SIG, **now with a Procurement "approve today" email, a Security concern email, and a stale SOC 2 audit period.** Catch residency/Philippines contradiction, breach-clause hedge, stale period; rate exceptions; rule w/ conditions + redlines. *Proof:* contradictions named + decision.
- **GRC-3 · Full ISO 27001:2022 Audit (9d, NEW, files-based)** — we give a real evidence pack: **SoA + policies + config exports + screenshots + tickets + interview notes + last year's audit report with open nonconformities.** Some evidence stale/contradictory; one control claimed-but-not-implemented. Audit ~12 Annex A controls → conformity verdict per control; grade evidence quality; **verify prior findings actually remediated**; write audit report + nonconformity register + management letter. *Proof:* verdicts vs key + stale/contradictory evidence caught + unremediated findings.
- **GRC-4 · Host Hardening + Risk Register (10d, no revision, video defense)** — **OpenSCAP + Lynis correctly scoped to OS hardening** on a Linux VM: baseline → fix ≥5 → re-scan (measurable delta), map to ISO/CIS. Build a risk register from a **provided known-good vuln-scan export** (live OpenVAS optional); compute ALE; rank by business impact not CVSS (crown-jewel trap); fund 3, defer rest. *Proof:* before/after hardening delta + register traced to findings + video.
- **GRC-5 · Breach Governance capstone (10d, video + live defense)** — incident summary with definite facts (data types, EU/California/Nigeria subjects, timeline). Compute exact deadlines (GDPR 72h/NDPA/CCPA), which frameworks trigger, affected count; draft notifications + board memo (present a range, not a false single number). *Proof:* deadlines + framework list + count (checkable) + video/live defense.

## C. Still to build (authoring effort, carries the ground truth)

The SOC-1 log pack (with exact FP ground truth), the SOC-5 IR incident package (PCAP + memory + logs), the GRC-1/2 artifact packs, and **the new GRC-3 ISO 27001 evidence pack + answer key**. Everything else is download-and-run.

---

## Questions for this pass

1. **Do the fixes actually resolve your 7 v1 findings?** Go one by one — resolved / partially / not.
2. Did any fix introduce a **new** problem (e.g., is the ISO 27001 audit now the right kind of hard, or did it become a paperwork exercise)?
3. Is **GRC** now a fair, discriminating sieve comparable to SOC/EH, or still the weak track?
4. Is the **EH-1 anti-copy design** (per-intern variant + live module-add on video) actually enough to stop an AI/GitHub shortcut?
5. Any remaining **anti-bluff holes** or places an LLM can still pass?
6. Any **factual/technical errors** in the revised setup commands or scenarios (esp. the OpenSCAP/Lynis scope in GRC-4 and the ISO 27001 audit design)?
7. Ship it, or one more iteration? If one more, name the single highest-priority change.
