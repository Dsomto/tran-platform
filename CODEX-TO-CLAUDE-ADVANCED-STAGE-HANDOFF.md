# Codex to Claude: Complete Advanced-Stage Handoff

**Repository:** `/Users/dsomto891/hng/netforge`  
**Branch:** `main`  
**Remote:** `origin/main`  
**Baseline before percentile implementation:** `84f8b27`
**Percentile implementation:** `3f6e426`
**Prepared:** 19 July 2026, WAT  
**Purpose:** This is the complete handoff of the advanced-stage work Codex implemented and verified. Claude should use this file as an index, then inspect the referenced source files and commits before changing anything.

## 1. Read This First

The advanced programme is no longer only a design document. It now has:

- 15 technically difficult projects: 5 SOC, 5 Ethical Hacking/VAPT, and 5 GRC.
- Track-gated intern dashboards and secured Stage 5-9 rooms.
- Shared per-track artifact packs with private per-intern overlays and markers.
- Self-contained Stage 5 artifacts and prepared Stage 6-9 artifacts.
- Admin open, pause, close, and schedule controls.
- Fixed Monday-Friday WAT windows and a visible intern countdown.
- Submission pages for view-only Drive links and exact package instructions.
- Preview interns and preview pages for all 15 projects.
- Light/dark accessibility across the advanced dashboard and rooms.
- 15 distinct project FAQs, 11 answers each, rendered inside the secured room.
- A single within-track percentile engine used by ranking, finalization, result emails, and the read-only Stage 9 audit.
- Release and cohort audit scripts.
- A corrected real cohort of 169 interns and 172 Stage 5 grants including 3 preview accounts.

Do not confuse three different things:

1. **Intern-facing controlling material:** `src/lib/advanced-stage.ts`, `src/lib/advanced-guidance.ts`, `src/lib/advanced-faq.ts`, and `public/advanced-stage/**`.
2. **Generated/shared candidate artifacts:** `stage5-artifacts/**` and `advanced-stage-artifacts/**`.
3. **Historical planning and review documents:** `docs/ADVANCED-STAGE-TRACK-PLAN.md` and `docs/advanced-stage-briefs/**`. The main track plan now matches the live cadence and percentile policy; archived review packets may still describe earlier designs and are not controlling material.

## 2. Current Verified Release State

Codex reran both read-only audits immediately before writing this handoff.

### Stage 5 audit

Command:

```bash
npx tsx scripts/audit-stage5-release.ts
```

Verified result:

```json
{
  "grants": 172,
  "artifacts": 3,
  "counts": {
    "SOC_ANALYSIS": 93,
    "ETHICAL_HACKING": 57,
    "GRC": 22
  },
  "realCounts": {
    "SOC_ANALYSIS": 92,
    "ETHICAL_HACKING": 56,
    "GRC": 21
  },
  "admissionHistory": 169,
  "uniqueSocAssignments": 93,
  "socValidFalsePositivesPerIntern": 80
}
```

The difference between `counts` and `realCounts` is the one preview intern per track. The 172 total is therefore 169 real interns plus 3 preview interns.

On 20 July 2026, Temitope Mustapha (`UBI-2026-0042`, `temitopemustapha95@gmail.com`) was moved from SOC Analysis to GRC before downloading an advanced artifact or creating an advanced report. All Stage 5-9 grants were atomically rebound to the official GRC artifacts and the change was recorded as `advanced-track.change`. The resulting real distribution is SOC 92, Ethical Hacking 56, GRC 21.

### Stages 6-9 audit

Command:

```bash
npx tsx scripts/audit-advanced-stage-release.ts
```

Verified result:

```json
{
  "release": "READY_CLOSED",
  "artifacts": 12,
  "largestArtifactBytes": 7335839,
  "grants": 688,
  "realInterns": 169,
  "previewInterns": 3,
  "stage5Window": {
    "status": "OPEN",
    "activeFrom": "2026-07-20T08:00:00.000Z",
    "submitUntil": "2026-07-24T17:10:00.000Z"
  },
  "windows": {
    "STAGE_6": "CLOSED",
    "STAGE_7": "CLOSED",
    "STAGE_8": "CLOSED",
    "STAGE_9": "CLOSED"
  }
}
```

Each future stage has 172 grants: SOC 93, Ethical Hacking 57, GRC 22. Across four stages this is 688 grants. Stages 6-9 are closed and locked even though their grants and artifacts already exist.

The local audit process prints `missing SMTP_USER` and `missing SMTP_PASS`. That is a local environment warning and did not prevent either read-only release audit from passing. Do not interpret it as proof that production email configuration is missing.

## 3. Fixed Schedule and Locking Rules

All advanced stages use this fixed cadence:

- Opens Monday at **09:00 WAT**.
- Closes Friday at **18:10 WAT**.
- WAT is UTC+1.
- The admin API rejects advanced-stage dates that do not match this cadence.

Current expected windows:

| Stage | Opens UTC | Opens WAT | Closes UTC | Closes WAT | Current status |
|---|---|---|---|---|---|
| Stage 5 | 2026-07-20 08:00Z | Mon 20 Jul 09:00 | 2026-07-24 17:10Z | Fri 24 Jul 18:10 | `OPEN`, scheduled |
| Stage 6 | 2026-07-27 08:00Z | Mon 27 Jul 09:00 | 2026-07-31 17:10Z | Fri 31 Jul 18:10 | `CLOSED`, locked |
| Stage 7 | 2026-08-03 08:00Z | Mon 3 Aug 09:00 | 2026-08-07 17:10Z | Fri 7 Aug 18:10 | `CLOSED`, locked |
| Stage 8 | 2026-08-10 08:00Z | Mon 10 Aug 09:00 | 2026-08-14 17:10Z | Fri 14 Aug 18:10 | `CLOSED`, locked |
| Stage 9 | 2026-08-17 08:00Z | Mon 17 Aug 09:00 | 2026-08-21 17:10Z | Fri 21 Aug 18:10 | `CLOSED`, locked |

Important behavior:

- `OPEN` does not bypass `activeFrom`; scheduled access is still blocked before the start time.
- `PAUSED` blocks access and submission without losing the configured window.
- `CLOSED` blocks access and submission.
- `isLocked` remains as a legacy mirror and is synchronized with status.
- Artifact, assignment, discrepancy, resource, report-create, and report-submit endpoints all use the stage access/window gate.
- The intern room displays a countdown to `submitUntil` through `StageDeadlineCountdown`.

Primary files:

- `src/lib/stage-window.ts`
- `src/lib/stage-access.ts`
- `src/app/api/admin/stage-windows/status/route.ts`
- `src/app/api/admin/stage-windows/route.ts`
- `src/app/admin/assignments/[id]/stage-admin-panel.tsx`
- `src/components/stage/StageDeadlineCountdown.tsx`

## 4. Admin Controls

Admins can manage each stage from the assignment admin panel:

- Set `OPEN`, `PAUSED`, or `CLOSED`.
- Set the active start and submission deadline.
- See a scheduled state when `OPEN` has a future `activeFrom`.
- Optionally announce an opening when it is actually live.
- See who entered, first and last access, visit count, submission counts, grade state, and published result counts.
- Open the dedicated Stage Results workflow.

Every status or timing change is written to the audit log. A future stage can be scheduled silently, but the API rejects an announcement before it is live.

The old one-click result publication path was removed from this panel. Results now go through `/admin/stage-results`, where staff apply a cutoff, review pending promotion/elimination buckets, make audited swaps when justified, and finalize.

## 5. Intern Access and Track Isolation

An advanced intern sees only their bound track.

Core routes:

- `/dashboard/advanced` - advanced programme dashboard.
- `/subdomains/stage-5` through `/subdomains/stage-9` - secured stage rooms.
- `/dashboard/reports/STAGE_5` through `/dashboard/reports/STAGE_9` - submission pages.
- `/stage-preview` - staff/design index for all 15 project pages.
- `/stage-preview/[track]/[stage]` - project preview, for example `/stage-preview/soc/5`.
- `/admin/advanced-preview` and `/advanced-preview` - preview intern tooling.

Track identifiers:

- `SOC_ANALYSIS`
- `ETHICAL_HACKING`
- `GRC`

Track isolation is enforced server-side, not only hidden in navigation. Project lookup uses the authenticated intern's `Intern.track`; artifact grants also bind `internId`, stage, track, variant, marker, artifact key, hash, and signature.

Relevant files:

- `src/app/dashboard/advanced/page.tsx`
- `src/components/stage/AdvancedStagePage.tsx`
- `src/components/stage/AdvancedStageRoom.tsx`
- `src/components/stage/StageShell.tsx`
- `src/lib/advanced-stage.ts`
- `src/lib/advanced-variant.ts`
- `src/lib/advanced-artifact-storage.ts`
- `src/proxy.ts`

## 6. The 15 Projects Now Implemented

### SOC Analysis

| Stage | Project | Technical center |
|---|---|---|
| 5 | Build a Production Hunt Engine | Python/DuckDB ingestion, schema drift, quarantine, deduplication, clock correction, identity aliases, campaign graphs, hidden 25,000-row shard, 96 discrepancy cases, deterministic rebuild. |
| 6 | Engineer a Deception Sensor and Analysis Pipeline | Sealed T-Pot replay, optional candidate-owned live sensor, isolation tests, sessionization, clustering, payload hashing only, STIX and detection output, adapter-based schemas. |
| 7 | Build a Network Detection Range as Code | Docker/containerlab/FRR/nftables, seven zones, stateful least privilege, Zeek/Suricata, positive and negative path tests, fault injection and recovery, clean rebuild. |
| 8 | Detection Engineering Under Adversary Pressure | Wazuh 4.14.6, Windows 11/Sysmon/Atomic lab, 12 attacks and 24 benign controls, semantic mutations, correlation detections, regression harness, recorded defense, no revision. |
| 9 | Full Incident Response | Sealed multi-source DFIR, parser-driven timeline, damaged/tampered evidence, two clock offsets, split archive reconstruction, Sigma/YARA/Zeek tests, live defense, no revision. |

### Ethical Hacking / VAPT

| Stage | Project | Technical center |
|---|---|---|
| 5 | Build a Recon Engine and Earn the Foothold | Python 3.11 standard-library loopback target, strict scope before every request, wildcard/vhost handling, bounded concurrency, fallback/resume, request ledger, fresh foothold evidence, no auto-exploitation. |
| 6 | Root the Box: Exploit Chain as Code | Offline Vagrant target, candidate-authored Python/Go chain, two vulnerability classes, dynamic values, five clean runs, cleanup, root-cause patch and negative retest. |
| 7 | Compromise a Custom AWS IAM Range | Dedicated AWS lab, MFA/no root keys, USD 5 cap, Terraform, four permission edges, effective-policy analysis, CloudTrail evidence, least privilege remediation, same-day teardown. |
| 8 | Own the Forest | GOAD-Light, direct LDAP/SMB/Kerberos edge validation, stale graph edge, two independent domain-control paths, one automated 3/3, Windows detections, remediation, recorded defense, no revision. |
| 9 | Full VAPT and Retest | Candidate-run local Docker estate, signed machine-readable scope, three-host chain, exactly one synthetic crown-jewel record, deterministic finding tests, patched-state regression, live defense, no revision. |

### GRC

| Stage | Project | Technical center |
|---|---|---|
| 5 | Policy as Code Under Constraint | Exactly three assigned controls, OPA/Rego, one typed schema, fail-closed exceptions, 18 public and 12 hidden fixtures, generated compliance output. |
| 6 | Verify the Vendor, Then Decide | Schema-validated technical exports, pass/fail/insufficient separation, broken hashes, premature deletion success, data-flow graph, executable fail-closed monitoring, replacement-export regeneration. |
| 7 | Automate an ISO 27001 Evidence Audit | Deterministic marker-seeded samples, 18 audit tests across 12 controls, hash/time/owner/scope validation, stale/conflicting evidence, generated verdicts and nonconformities, holdout pack. |
| 8 | Hardening as Code and Quantified Risk | Debian 12 or Rocky 9, Ansible idempotence, rollback, service tests, Lynis/OpenSCAP delta, false-positive handling, quantified risk model, exactly three treatments, recorded defense, no revision. |
| 9 | Build a Breach Governance Engine | GDPR 33/34, Nigeria NDPA section 40, California 1798.82/SB 446, separate clocks, overlap deduplication, confirmed/lower/upper populations, generated deadlines/notices/work items, live trace, no revision. |

The canonical detailed definitions live in `src/lib/advanced-stage.ts`. Prerequisites, glossary, rubric, environment constraints, fallback rules, support rules, revision rules, and pass requirements live in `src/lib/advanced-guidance.ts`.

## 7. Public Brief and Fixture Inventory

Every stage has an integrity attestation. Shared files include:

- `public/advanced-stage/common/submission-contract.md`
- `public/advanced-stage/common/technical-assessment-contract.md`
- `public/advanced-stage/common/portfolio-continuity.md`
- `public/advanced-stage/common/defense-readiness.md`
- `public/advanced-stage/common/evidence-index-template.csv`
- `public/advanced-stage/common/evidence-index-example.csv`
- `public/advanced-stage/common/assessment-manifest-template.json`
- `public/advanced-stage/common/assessment-manifest-example.json`
- `public/advanced-stage/common/decision-log-template.md`

Track/stage materials include:

- Stage 5 SOC: brief, schema fixtures, DuckDB starter, hunt workbook.
- Stage 5 EH: brief, parser fixtures, rules of engagement, tool interface.
- Stage 5 GRC: brief, public policy fixtures, evidence pack, control state, control mapping.
- Stage 6 SOC: brief, public replay fixtures, isolation tests, session analysis template.
- Stage 6 EH: brief, public exploit tests, target assignment, exploit test record.
- Stage 6 GRC: brief, public verifier fixtures, evidence pack, vendor claims, assurance/contract, telemetry, contradiction matrix.
- Stage 7 SOC: brief, public path fixtures, address plan, control test matrix.
- Stage 7 EH: brief, public IAM tests, cloud safety checklist, attack-path template.
- Stage 7 GRC: brief, public audit fixtures, evidence pack, audit populations, severity rules, audit test sheet.
- Stage 8 SOC: brief, public detection fixtures, technique matrix, rule test record.
- Stage 8 EH: brief, public AD tests, provisioning checklist, credential-handling contract.
- Stage 8 GRC: brief, public risk fixtures, vulnerability export, risk-model contract, risk-register template.
- Stage 9 SOC: brief, public parser tests, timeline template, IOC template.
- Stage 9 EH: brief, public engagement tests, rules of engagement, retest matrix.
- Stage 9 GRC: brief, jurisdiction snapshots, evidence pack, data inventory, deadline ledger.

These files are protected through `/api/advanced-stage/resource`; interns should not receive arbitrary filesystem access.

## 8. Artifact Release Model

The release model is:

```text
application-bundled-shared-base-private-overlay
```

Meaning:

- Everyone in the same track/stage receives the same shared base archive.
- Each intern receives a deterministic private overlay containing their marker/variant/binding.
- Stage 5 SOC additionally receives a deterministic private discrepancy set.
- The private assignment is computed by `advancedVariantFor`; it is not hand-assigned.
- Grants are signed with `ADVANCED_ARTIFACT_SECRET` and store the shared archive SHA-256.
- Archive size is capped at 100 MiB.
- Artifacts are served by application routes; interns do not work on a programme server.

### Stage 5 release artifacts

Manifest: `stage5-artifacts/manifest.json`

| Track | Bytes | SHA-256 |
|---|---:|---|
| SOC | 11,780,400 | `535e2c483a01f20dad10a893eea6ba3cf89e4bd349beea126739df2df16ca43c` |
| Ethical Hacking | 7,694 | `984b531bec2214f217975dbbe9bab1afc14a3eac021df5e24f61d99622b6259e` |
| GRC | 2,819 | `35401db7422c5a289692ad33b8d0a69d2abcd668379709caa6bfbf38e9948ccb` |

The SOC visual was corrected from the stale “5.8M events” claim to “100MB maximum shared archive” in `src/lib/advanced-visuals.ts`.

### Stage 6-9 release artifacts

Manifest: `advanced-stage-artifacts/manifest.json`

| Stage | Track | Bytes | SHA-256 |
|---|---|---:|---|
| 6 | SOC | 7,335,839 | `2942ddec7918684e80a3d3e7bdb579a814228f6c95bb089b16a33866bae740e8` |
| 6 | EH | 10,387 | `be9b5c540f1dab556dbd60d66846880ad147ea0f45394c04b8518a8117eff7ea` |
| 6 | GRC | 11,269 | `3e5e6e8f39975da3e07d1b72a54181910e97db74c0d09b43c8553381e6866973` |
| 7 | SOC | 10,616 | `33281c8381cf7a7744f76e016d7b3cb3957f491422a8987dd7d483890009e1fd` |
| 7 | EH | 9,907 | `910eb0279259ce53763ba99987f3646e689cd43363abba8b71292fd0c8f4b5a7` |
| 7 | GRC | 12,321 | `7f2e8fc437405b251d7a963f73241b56eec72b0297435c4d4aab43170dc2cd4e` |
| 8 | SOC | 5,696,063 | `12f48d2d800a107855e6fe8384e7c6b34b5481d94042d21eab174fb64b2c16a9` |
| 8 | EH | 10,030 | `3535ba56359dc27e883523b651e2f94ff3b05eea6b808e7902e06304b680ee56` |
| 8 | GRC | 11,977 | `9be5e36adc4d906f0fdac3b2a893da3bfb4b994e7423c0ee3cc320ca265e283b` |
| 9 | SOC | 2,723,254 | `df8fb093a6a69ca885a0f22518f842cf6a470232a6df821fb759a507389f2022` |
| 9 | EH | 10,396 | `2254d3010eb23c4230369e69d98dbcc5c60d245abf62dac5759706b976211843` |
| 9 | GRC | 10,160 | `1aba047e715886721bb377fa059c76fa4b554da4eb8c784f7b61b02520b8b9a6` |

Artifact source scaffolds are under `advanced-artifact-sources/**` and include Vagrant, Ansible, containerlab, Terraform, Wazuh setup, AD variant scripts, Docker vulnerable/patched estates, and synthetic incident scripts. `scripts/build-advanced-stage-artifacts.py` rebuilds the shared archives.

Important scripts:

- `scripts/grant-shared-stage5-artifacts.ts`
- `scripts/grant-shared-advanced-artifacts.ts`
- `scripts/grant-advanced-artifact.ts`
- `scripts/audit-stage5-release.ts`
- `scripts/audit-advanced-stage-release.ts`
- `scripts/build-advanced-stage-artifacts.py`
- `scripts/refresh-stage5-artifact-briefs.py`

Grant scripts default to dry-run and require `COMMIT=1` for writes.

## 9. Stage 5 SOC Discrepancy Design

Every SOC participant receives:

- The same shared SOC base archive.
- A private assignment marker and variant.
- A deterministic set of 96 review candidates.
- Exactly 80 candidates with valid benign/change approval evidence.
- Exactly 16 candidates with a material approval mismatch.

The 80 valid false positives are different per SOC intern because assignment generation is seeded from the intern binding. The audit verifies 96 review candidates, 96 change records, exactly 80 valid false positives, and unique assignment IDs.

Primary files:

- `src/lib/advanced-discrepancy.ts`
- `src/app/api/advanced-stage/discrepancy/route.ts`
- `scripts/audit-stage5-release.ts`

## 10. Submission Contract

Interns submit one view-only Google Drive folder URL.

The stage room and report editor tell them:

- Use the exact required root names.
- Include source, tests, raw evidence, derived evidence, and reports.
- Include `README.md`, `evidence-index.csv`, `manifest.sha256`, `integrity-attestation.md`, `assessment-manifest.json`, and `continuity-record.md` in addition to project-specific outputs.
- Generate the SHA-256 manifest only after the package is final.
- Type the executive summary in the UBI form unless an executive-summary file is explicitly listed.
- Test the link in a private/incognito browser where they are not signed in.
- Do not submit the downloaded participant artifact as their own work.

Submission is blocked outside the active stage window. Stage 8 and 9 are no-revision projects; Stages 5-7 currently use one revision under the published rule.

Relevant files:

- `public/advanced-stage/common/submission-contract.md`
- `src/lib/submission-links.ts`
- `src/app/dashboard/reports/[stage]/report-editor.tsx`
- `src/app/api/reports/route.ts`
- `src/app/api/reports/[id]/submit/route.ts`

## 11. FAQ System Added in the Latest Commit

Commit: `0d65959 feat: add advanced project FAQs`

Implemented:

- `src/lib/advanced-faq.ts` contains 15 distinct FAQ datasets.
- `src/components/stage/AdvancedProjectFaq.tsx` renders accessible native-details accordions.
- `AdvancedStageRoom` renders the FAQ inside the already track-gated room.
- A “Read this project's FAQ” jump link appears in Start Here.
- Each project has 10 questions grouped into:
  - Setup & access.
  - Build & prove.
  - Package & submit.
- Total rendered answers: 150.
- Shared questions are generated only for truly shared rules: fixed window, Drive organization, UBI form, and incognito permission check.
- Technical answers are unique to each project and cover exact tools, safety constraints, hidden-test behavior, troubleshooting distinctions, evidence, cleanup, teardown, and defense.
- FAQ styling is responsive and has explicit dark-mode contrast in `src/app/subdomains/advanced-theme.css`.

All 15 preview routes returned HTTP 200 with exactly 3 FAQ groups and 10 questions each.

## 12. Theme and Visual Accessibility Work

Commits:

- `c9f1a91 fix: improve auth home link contrast`
- `5106092 feat: add accessible advanced stage themes`

Implemented:

- Made the login/auth “Back to home” control visible in both themes.
- Added theme controls to `/dashboard/advanced`.
- Added theme controls to the secured Stage 5-9 shell.
- Added theme controls to the stage-preview detail pages.
- Added dark tokens and overrides for advanced progress, hero, start-here, readiness, assessment, technical constraints, decision rules, downloads, pressure tasks, submission, FAQ, and preview navigation.
- Preserved each project's accent color while using high-contrast neutral surfaces and text.
- Added responsive behavior for compact screens.
- Reused the existing persisted root theme instead of creating a separate advanced-only preference.

The public project review index and detail pages are available locally at `http://localhost:3004/stage-preview` while the current dev server is running.

## 13. Corrected Cohort Counting and Purge Behavior

Commit: `0208b03 fix: preserve cohort results and public counts`

This corrected the earlier display where only surviving intern accounts were counted and eliminated applicants disappeared from public totals.

The change separated durable cohort/result facts from purgeable login/account data. Landing and results counts no longer rely only on currently existing intern records, and the purge job preserves the public application/result facts required to represent the original selected cohort accurately.

Relevant files:

- `src/lib/cohort-results.ts`
- `src/lib/landing-stats.ts`
- `src/app/results/page.tsx`
- `src/components/landing/stats-dashboard.tsx`
- `src/app/api/cron/purge-eliminated/route.ts`
- `src/lib/auth.ts`

## 14. Victor Ladat Reinstatement

Commit: `cf0c9d8 fix: reinstate Victor in advanced cohort`

Person:

- Name: Dakang Victor Ladat.
- Email: `dakang346@gmail.com`.
- Intern code: `UBI-2026-0025`.
- Track: `SOC_ANALYSIS`.
- Recovered Stage 4 final score: 89.

What was implemented and performed:

- Rebuilt the purged user/intern through the standard onboarding path.
- Restored the public application to approved/advanced Stage 5 state.
- Created a passed Stage 4 report with the reinstatement feedback and recovered Drive URL.
- Added Stage 4 to Stage 5 history with `promotedBy: reinstate-victor`.
- Added him to the SOC advanced admissions and grants.
- Generated his Stage 5 variant/marker through `advancedVariantFor`; it was not hand-set.
- Included him in the release audit expectations.
- Sent the pass notification.
- Sent login credentials.
- Sent the Stage 4 certificate and pass-letter PDFs as attachments.

Current database recheck:

- Public application: approved, stage 5, `stageStatus: advanced`.
- Intern: active, `STAGE_5`, `SOC_ANALYSIS`.
- Stage 4 report: `PASSED`, final score 89.
- Stage 5 grant: present, SOC, not revoked.
- Credential timestamp: present.
- Reinstatement pass email: `SENT`.
- Login/Slack credentials email: `SENT`.
- Certificate/pass-letter attachment email: `SENT`.

Operational script: `scripts/reinstate-victor-ladat.ts`. It has separate `ACTION=rebuild`, `ACTION=email`, and `ACTION=documents` modes, defaults to dry-run, and refuses duplicate rebuild/email actions.

## 15. Preview Interns

There are three preview interns, one per track, using `@netforge.invalid` accounts. They are intentionally included in artifact grant totals but excluded from the real cohort counts.

Purpose:

- Simulate the intern experience without exposing another real intern's account.
- Validate track gating.
- Validate assignment overlays and artifact downloads.
- Validate all 15 room designs through staff preview pages.

Script: `scripts/seed-advanced-preview-interns.ts`.

## 16. Commit-by-Commit History

These commits are on `main` and pushed to `origin/main`:

| Commit | Work |
|---|---|
| `3f3f82b` | Added the advanced track plan, three track DOCX briefs, prep guide, project HTML, and review packet. |
| `a01eb72` | Added the first complete track-gated Stage 5-9 implementation: schema, rooms, briefs, fixtures, artifacts, APIs, dashboards, submissions, scripts, and 15 seed scenarios. |
| `659ffa5` | Redesigned the advanced programme experience and created the `/stage-preview` review surface. |
| `a21d6cd` | Refined advanced design and QA, added project continuity and a Claude QA prompt. |
| `445626b` | Wired the advanced programme into the intern dashboard and sidebar. |
| `1abd833` | Launched the advanced-stage experience: guidance, previews, report editor hardening, submission-link rules, examples, certificate/letter compatibility, and preview intern tools. |
| `0208b03` | Preserved cohort/result counts independently of purged intern accounts. |
| `ba1fd92` | Switched Stage 5 to shared per-track artifacts plus private overlay and SOC discrepancy assignments. |
| `e5be2ca` | Made Stage 5 self-contained and application-served, including local EH loopback lab and release audit. |
| `8261a04` | Enforced scheduled windows across dashboard, artifacts, resources, reports, and submissions. |
| `cc56e81` | Hardened the Stage 5 admissions audit. |
| `08e42b3` | Built and prepared the 12 Stage 6-9 shared artifacts, source scaffolds, future grants, future windows, and admin controls. |
| `7ecc27c` | Enforced fixed Mon 09:00-Fri 18:10 WAT cadence, updated all 15 briefs, rebuilt artifacts, and added the deadline countdown. |
| `cf0c9d8` | Reinstated Victor and changed cohort expectations to 169 real interns. |
| `c9f1a91` | Improved auth home-link contrast. |
| `5106092` | Added accessible light/dark advanced themes across dashboard, rooms, and previews. |
| `0d65959` | Added all 15 project FAQs and corrected the stale SOC artifact-volume visual. |

## 17. Validation Already Performed

Latest percentile/FAQ validation:

```bash
npx prisma generate
npx tsx --test src/lib/advanced-ranking.test.ts
npx eslint src/lib/advanced-ranking.ts src/lib/advanced-ranking.test.ts \
  src/lib/advanced-faq.ts src/components/stage/AdvancedStageRoom.tsx \
  src/app/admin/stage-results/stage-results-panel.tsx \
  src/app/admin/stage-results/review/cutoff-review-panel.tsx \
  src/app/api/admin/stage-results/route.ts \
  scripts/advanced-track-ranking.ts scripts/close-advanced-stages.ts
npx tsc --noEmit
npm run build
```

Results:

- Prisma Client generation passed with the nullable legacy-safe advanced gate field.
- All 6 percentile-engine tests passed, including gate-before-ranking, exact cohort targets, Stage 8 top 6, and Stage 9 top 3/boundary tie behavior.
- ESLint passed.
- Full TypeScript passed after the concurrent dashboard work completed.
- Fresh Next.js production build passed, including TypeScript and all 132 generated static pages.
- A generated FAQ audit returned `{rooms:15, questions:165, scoringPolicyAnswers:15}`.

Known build warning:

- Turbopack warns that `next.config.ts` participates in a broad Prisma/NFT trace through `src/generated/prisma/index.js` and an admin email route. The build still completes. This warning predates the FAQ work and is not a failure of the advanced-stage implementation.

No automated browser screenshot was captured in the latest FAQ pass because no supported in-app browser runtime was available. Route HTML, responsive CSS, compile checks, and production build were verified. Claude should perform a manual visual check in a real browser before making design claims beyond that.

## 18. Important Open Issues and Honest Limitations

### 18.1 Percentile elimination is implemented; validate it before the first grading run

The approved model is now explicit and shared:

- Stage 5 eliminates the bottom 20% of eligible candidates within each track.
- Stage 6 eliminates the bottom 25% of the remaining eligible candidates within each track.
- Stage 7 eliminates the bottom 33% of the remaining eligible candidates within each track.
- Stage 8 retains the top 6 per track by cumulative weighted percentile.
- Stage 9 retains the top 3 per track by cumulative weighted percentile.
- Advanced-stage weights are 1, 1, 1.5, 2, and 2.5 for Stages 5-9.
- Automatic fail gates are recorded and applied before percentile ranking.
- Exact boundary ties are surfaced for audited defense or blinded-review resolution.
- Every pending advanced result requires QA verification, and finalization rejects stale ranks, gate-failed promotions, and incorrect per-track counts.

Implementation sources:

- `src/lib/advanced-ranking.ts`: policy, percentile formula, weights, ranking, target calculation, and tie detection.
- `src/app/api/admin/stage-results/route.ts`: gate recording, percentile application, evidence persistence, finalization enforcement, and percentile result email data.
- `prisma/schema.prisma`: persisted gate, rank, cohort, percentile, cumulative percentile, and selection-rule evidence.
- `src/app/admin/stage-results/**`: admin policy controls, gate UI, percentile review, audited swaps, QA, and CSV evidence.
- `src/components/stage/AdvancedStageRoom.tsx` and `src/lib/advanced-faq.ts`: intern-facing exact policy. Every one of the 15 FAQs now includes the scoring decision answer.
- `scripts/advanced-track-ranking.ts`: read-only Stage 9 review using the same shared engine.

The legacy `StageWindow.passingScore` integer remains in the schema for foundation-stage compatibility. Advanced actions reject numeric cutoff application and ignore this value when selecting or finalizing.

### 18.2 “Ready” is structurally audited, not a claim that every external lab was manually exercised

- Artifact hashes, sizes, grants, windows, bindings, and release paths are audited.
- The Next.js application compiles and routes render.
- This does not mean Codex manually ran GOAD, a real AWS account, every Vagrant provider, Wazuh/Windows, or every scanner/toolchain end to end on this machine.
- Stage 7 EH requires a candidate-owned AWS lab account and cost controls.
- Stage 8 EH requires substantial candidate-owned hardware for GOAD-Light.
- These are candidate-side dependencies, not programme-server dependencies, but they remain real prerequisites.

### 18.3 Historical documents may conflict with live cadence

- The 15 public `brief.md` files and live `ADVANCED_STAGE_WINDOW_LABEL` say Mon-Fri.
- Some historical planning/DOCX material may still discuss 8-14 day projects or the old grading design.
- Claude should treat the live brief, room, and schedule as controlling and explicitly reconcile any historical document before republishing it.

### 18.4 Production deployment was not independently inspected

- All commits are pushed to `origin/main`.
- The local production build passed.
- This handoff does not assert that an external deployment pipeline completed or that the public production URL was manually inspected after `0d65959`.

### 18.5 Local SMTP variables are absent

- Local read-only DB scripts warn about missing `SMTP_USER` and `SMTP_PASS`.
- Victor's relevant email queue rows are confirmed `SENT` in the database.
- Do not attempt to resend them; the reinstatement script intentionally refuses duplicates.

## 19. Dirty Worktree Warning

The repository contains many modified and untracked files unrelated to this advanced-stage handoff, including grading batches, Stage 3/4 capstone documents, package files, dashboard/report files, and scripts produced by other work.

Claude must:

- Run `git status --short` before editing.
- Never reset, checkout, clean, or revert unrelated files.
- Stage only files deliberately changed for the next task.
- Assume unrelated dirty files belong to the user or another agent.

At the time of handoff, the five FAQ release files are committed and clean. The broader worktree is not clean.

## 20. What Claude Should Review Next

Claude should now assess, in this order:

1. Validate the admin flow on seeded non-production reports: grade, set/clear gate, rank, edit score, rerank, QA, audited boundary swap, and finalize.
2. Confirm each track's expected advance target against the live eligible count before committing a stage result.
3. Manually test one real/preview intern per track through login, advanced dashboard, Stage 5 room, artifact, assignment, discrepancy where applicable, report submission, and the new selection text.
4. Manually inspect light/dark and mobile layouts for `/dashboard/advanced` and representative SOC/EH/GRC rooms.
5. Exercise the Stage 6-9 lab scaffolds on supported environments where practical, especially GOAD, AWS, Wazuh/Windows, and Vagrant.
6. Reconcile archived review packets/DOCX wording with the live Mon-Fri cadence and percentile model before republishing them.
7. Confirm the production deployment from the latest `main` commit is live.

## 21. Commands Claude Can Safely Start With

Read-only checks:

```bash
git status --short
git log -17 --oneline
npx tsx scripts/audit-stage5-release.ts
npx tsx scripts/audit-advanced-stage-release.ts
npx tsc --noEmit
npm run build
```

Local review:

```text
http://localhost:3004/stage-preview
http://localhost:3004/stage-preview/soc/5
http://localhost:3004/stage-preview/ethical-hacking/8
http://localhost:3004/stage-preview/grc/9
```

Do not run grant/admission/reinstatement scripts with `COMMIT=1` merely to validate them. The database is already populated and the release audits pass.

## Bottom Line

The advanced-stage website, track isolation, 15 technical project contracts, artifacts, private overlays, admin stage controls, fixed schedule, countdown, submissions, themes, previews, FAQs, release audits, and corrected 169-person cohort are implemented and pushed.

The percentile policy is no longer an open product decision. It is implemented across the shared engine, admin review/finalization, result evidence, intern room, FAQs, staff plan, and read-only final ranking. Claude should now pressure-test the implementation on non-production data, verify the exact live per-track counts before each result run, and avoid using the legacy foundation-stage cutoff field for Stages 5-9.
