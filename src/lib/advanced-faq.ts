import {
  requiredAdvancedDeliverables,
  type AdvancedProject,
  type AdvancedTrack,
} from "./advanced-stage";
import {
  advancedSelectionPolicy,
  type AdvancedRankingStage,
} from "./advanced-ranking";

export type AdvancedFaqCategory =
  "Setup & access" | "Build & prove" | "Package & submit";

export type AdvancedFaqItem = {
  category: AdvancedFaqCategory;
  question: string;
  answer: string;
};

export type AdvancedProjectFaq = {
  intro: string;
  items: AdvancedFaqItem[];
};

type ProjectNumber = AdvancedProject["number"];
type FaqSeed = Pick<AdvancedProjectFaq, "intro" | "items">;

const setup = (question: string, answer: string): AdvancedFaqItem => ({
  category: "Setup & access",
  question,
  answer,
});

const build = (question: string, answer: string): AdvancedFaqItem => ({
  category: "Build & prove",
  question,
  answer,
});

const submit = (question: string, answer: string): AdvancedFaqItem => ({
  category: "Package & submit",
  question,
  answer,
});

const FAQ_SEEDS: Record<AdvancedTrack, Record<ProjectNumber, FaqSeed>> = {
  SOC_ANALYSIS: {
    1: {
      intro:
        "Practical answers for building the hunt engine, reconciling the private discrepancy set, and proving that every source row is accounted for.",
      items: [
        setup(
          "Which files do I treat as immutable source evidence?",
          "Treat the shared SOC archive, your assignment overlay, and your private discrepancy set as read-only. Verify their supplied hashes before ingestion, retain the originals unchanged, and write normalized, quarantined, and derived data to separate paths.",
        ),
        setup(
          "What is the minimum environment that staff will reproduce?",
          "Use Python 3.11 or newer, DuckDB, and pytest on a clean 4 vCPU and 8 GB environment. Your full ingest and hunt runner must finish within 12 minutes, so record dependency versions, peak memory, query plans, and runtime in benchmark.json.",
        ),
        build(
          "How should malformed rows and schema drift be handled?",
          "Create typed adapters for every published source version. Never silently discard or repair a raw row: send invalid records to quarantine with a stable reason code, preserve the source locator, and include accepted plus quarantined counts in the source-accounting result.",
        ),
        build(
          "May I hard-code the three campaigns after I discover them?",
          "No. Hunts must express reusable behavior, joins, windows, and relationships. Campaign IPs, usernames, timestamps, case IDs, and expected counts must not appear as detection constants; staff will run a hidden 25,000-row shard with changed values.",
        ),
        build(
          "How do I classify the 96 discrepancy cases?",
          "Resolve all 96 from raw locators and the controlling approval or change record. Exactly 80 have valid benign evidence and 16 contain a material approval mismatch. Record the classification, rationale, evidence locator, and controlling-record locator for every case; appearance alone is not proof.",
        ),
        submit(
          "What evidence proves the campaign graph rather than only describing it?",
          "For every scored edge, include two independent raw source locators, the normalized event IDs, the correlation rule or query, and the exported graph edge. The CLI must regenerate normalized-timeline.csv, campaign-graph.json, and tp-fp-table.csv from a clean database.",
        ),
      ],
    },
    2: {
      intro:
        "Setup and troubleshooting guidance for the sealed T-Pot replay, safe payload handling, deterministic sessionization, and the optional live sensor boundary.",
      items: [
        setup(
          "Do I need a public server or a live T-Pot deployment to pass?",
          "No. The sealed replay is the scored source and the analysis environment must work without programme infrastructure. A candidate-owned live sensor is optional pressure work; do not rent infrastructure merely to complete the mandatory project.",
        ),
        setup(
          "If I attempt the live sensor, what must be isolated first?",
          "Before exposure, restrict management to the declared source and prove that unapproved management access, RFC1918 destinations, metadata services, and forbidden egress fail closed. Capture machine-readable tests from management, sensor, external, allowed, and denied viewpoints.",
        ),
        build(
          "How do I support both sealed replay and live exports?",
          "Put each source format behind an adapter that emits one versioned normalized session schema. The session, cluster, STIX, hash-ledger, and detection stages must consume that schema, not source-specific fields.",
        ),
        build(
          "What should happen when events arrive out of order or a client reconnects?",
          "Apply explicit session keys and bounded inactivity or protocol-aware windows. Tests must cover reordered events, reconnects, repeated credentials, and protocol changes, with expected session membership and stable output hashes.",
        ),
        build(
          "Can I open or execute a captured payload to identify it?",
          "No. Quarantine binary content and handle it only by hash, size, type metadata, and source locator. Executing captured payloads is an automatic safety failure.",
        ),
        submit(
          "What is enough proof for a reconstructed session?",
          "Preserve the raw replay locators, normalized events, session membership decision, cluster membership, and derived detection or STIX object. Where the source supports it, reconstruct one protocol session byte-for-byte and include the verification result.",
        ),
      ],
    },
    3: {
      intro:
        "Answers for building the seven-zone range entirely as code, diagnosing path failures, and proving both allowed and denied network behavior.",
      items: [
        setup(
          "What operating system and tools are required for the supported path?",
          "Use a Linux host with Docker, containerlab, FRRouting containers, nftables, Zeek or Suricata, and pytest or testinfra. Verify nested virtualization and available disk before starting; Packet Tracer and manually configured nodes do not satisfy the project.",
        ),
        setup(
          "What must make clean, make lab, and make test actually do?",
          "make clean must remove the generated range state, make lab must rebuild topology, routes, policy, services, and telemetry from repository files, and make test must run the published path and policy assertions unattended. No post-build shell edits are allowed.",
        ),
        build(
          "How do I prove a denied path instead of showing a failed ping?",
          "Pair the client-side negative assertion with firewall or Zeek telemetry and, when useful, a packet capture. The evidence must identify source zone, destination zone, service, policy verdict, timestamp, and exact test ID.",
        ),
        build(
          "How should stateful return traffic be tested?",
          "Test both directions separately: an allowed client-initiated session must receive return traffic, while a new session initiated from the protected zone must fail. Include established-state, spoofing, management, and asymmetric-return cases.",
        ),
        build(
          "Where should addresses and policy differences for a hidden variant live?",
          "Keep assigned networks, zone membership, service endpoints, and policy inputs in one variant file or equivalent structured configuration. Staff must be able to apply a changed addressing variant without editing topology or test logic.",
        ),
        submit(
          "What does the fault-recovery evidence need to show?",
          "For every published fault, preserve the injected change, failing test, packet or log diagnosis, corrective commit, and green retest. The Git history and fault-recovery-log.md must agree with test-results.xml and the submitted topology hash.",
        ),
        build(
          "Does my private D-set condition repeat one of the three baseline faults?",
          "The corrected overlay does not. Complete the three baseline faults and one separate private D-set fault, each with its own failing test, diagnosis, corrective commit, and green retest. If you preserved an earlier D1, D2, or D3 overlay whose condition overlaps a baseline fault, submit that exact legacy condition, label it LEGACY_D_SET in fault-recovery-log.md, and include the preserved wording and download date. You will not be required to invent a fifth condition or lose marks because of the earlier programme-issued wording.",
        ),
      ],
    },
    4: {
      intro:
        "No-revision guidance for portable replay detection engineering, semantic attack coverage, benign controls, and recorded clean-state defense.",
      items: [
        setup(
          "What is the controlling scored environment?",
          "Use the signed Windows replay in the B2 archive with Python 3.11 or newer. Verify its source manifest, keep it read-only, and write all normalized events, decisions, mutations, and results elsewhere. Wazuh, Windows, Sysmon, Atomic, Docker, and an OVA are optional compatibility routes only.",
        ),
        setup(
          "What hardware is required, and does earlier Wazuh work still count?",
          "The mandatory route is designed for 4 GB RAM and 2 GB free disk and needs no VM or Docker. Keep any valid Wazuh, Sysmon, Windows, Atomic, OVA, or Docker work already completed; export it through the same source-normalized-decision and regression interfaces. It receives no hardware bonus and you do not restart.",
        ),
        build(
          "What is a source-normalized-alert triple?",
          "For each canonical attack and benign control, preserve the original replay record, your normalized representation, and the resulting alert or explicit no-alert verdict. Tie all three to the same source locator and fixture ID in coverage-matrix.csv.",
        ),
        build(
          "How do I avoid a rule that only matches the Atomic command?",
          "Detect stable semantics such as fields, parent-child relationships, sequences, time windows, or behavior combinations. Test renamed binaries, missing fields, and alternate encodings; literal commands, Atomic IDs, or fixture IDs in a rule invalidate that detection.",
        ),
        build(
          "How should no alert be diagnosed?",
          "The harness must distinguish missing telemetry, collection delay, decoder failure, rule miss, and suppression. Export the intermediate event and decoder result so a staff-selected mutation can be traced without relying on the Wazuh UI.",
        ),
        submit(
          "What must the recorded defense contain?",
          "Start from the submitted clean commit and untouched replay, run the staff-selected mutation, show the source event and normalized fields, identify the matching rule logic, and finish with machine-readable regression output and its stable hash. This stage has no revision.",
        ),
      ],
    },
    5: {
      intro:
        "Final-case guidance for evidence integrity, parser-driven reconstruction, archive recovery, tested detections, and the live defense.",
      items: [
        setup(
          "What should I do before examining the incident package?",
          "Verify the supplied manifest, record the tampered item as an integrity finding, and work from copies. Preserve acquisition hashes, parser versions, source clock assumptions, and every parser error before drawing conclusions.",
        ),
        setup(
          "Is a memory image or a commercial DFIR product required?",
          "No commercial tool is required, and the candidate-owned memory source is optional. The mandatory case is solvable from the sealed host, email, and packet evidence using reproducible parsers and the supplied interfaces.",
        ),
        build(
          "Can I assemble timeline.csv manually after investigating?",
          "No. timeline.csv must be generated by submitted code that parses at least four evidence types, preserves raw source locators, applies explicit clock corrections, and accounts for duplicate and damaged records. Manual annotations may be layered on generated rows but cannot replace the builder.",
        ),
        build(
          "How do I know the split exfiltration archive is correct?",
          "Reconstruct it from the relevant sessions or host artifacts, then verify the exact archive hash, file count, record count, and byte count. Preserve fragment locators and ordering logic so staff can reproduce the extraction from raw evidence.",
        ),
        build(
          "How should I handle the benign administrative sequence?",
          "Test it as an alternative hypothesis and cite the evidence that separates it from the malicious chain. Do not force every suspicious-looking event into the incident; confidence and contradiction fields belong in the timeline and report.",
        ),
        submit(
          "What will staff ask me to reproduce live?",
          "Expect two selected extractions from raw evidence plus a timeline query or detection test. Your clean environment must rebuild the timeline, locate the source row, run the relevant Sigma, YARA, or Zeek test, and explain any clock correction without manual repair.",
        ),
      ],
    },
  },
  ETHICAL_HACKING: {
    1: {
      intro:
        "Scope-safe guidance for the local recon engine, wildcard handling, interruption recovery, evidence ledgers, and the authorized foothold stop point.",
      items: [
        setup(
          "Do I need Docker, a VPN, cloud access, or internet access?",
          "No. The supported target is a supplied Python 3.11 standard-library loopback lab. Run it locally, capture its generated scope profile, and do not add external targets or package dependencies merely to complete the assignment.",
        ),
        setup(
          "What is authorized when the target profile changes?",
          "Only endpoints explicitly marked IN in the generated scope are authorized. Enforce CIDR, hostname, and port scope immediately before every network call; the out-of-scope decoy must receive zero packets.",
        ),
        build(
          "How should wildcard DNS and virtual hosts be handled?",
          "Probe random labels to establish a wildcard baseline, compare status, headers, body fingerprints, and TLS or SNI behavior, then suppress baseline-equivalent responses without hiding the assigned virtual host. Keep the raw probes in the request ledger.",
        ),
        build(
          "What does resumable mean for the engine?",
          "Persist completed work units and evidence atomically. After interruption, resume unfinished probes without repeating completed requests, breaking the rate budget, duplicating normalized records, or changing the final result hash.",
        ),
        build(
          "May the recon engine automatically exploit a discovered service?",
          "No. Discovery, fingerprinting, and the explicitly bounded foothold request are separate steps. The engine must not launch generic exploitation; stop as soon as the private user.txt proof defined in the rules of engagement is obtained.",
        ),
        submit(
          "How do I prove the foothold flag is mine and current?",
          "Submit the fresh flag together with the raw multi-protocol response chain, normalized service record, engine request ledger, and target-side ledger. A copied flag or room marker without reconciling requests and responses is not foothold proof.",
        ),
      ],
    },
    2: {
      intro:
        "Answers for the offline vulnerable VM, candidate-authored exploit chain, five-run reliability, cleanup, root-cause patching, and negative retest.",
      items: [
        setup(
          "What network and snapshot arrangement is authorized?",
          "Use the supplied Vagrant vulnerable and patched source with a Kali attacker on a host-only network. Take a clean target snapshot before testing and keep the range disconnected from production or public systems.",
        ),
        setup(
          "Can I use Metasploit or a public exploit as the submission?",
          "No. You may use documentation to understand a protocol or vulnerability class, but the scored chain must be candidate-authored Python or Go with explicit protocol handling, preflight checks, bounded timeouts, safe failure, and cleanup.",
        ),
        build(
          "Which values must be discovered at runtime?",
          "Discover ports, banners, process or object identifiers, usernames, tokens, and other run-specific values from the target or configuration. The hidden variant changes ports, banners, and one dynamic value; adapting must require configuration, not source edits.",
        ),
        build(
          "What counts as five successful reliability runs?",
          "Restore the clean snapshot before each run, execute the full foothold-to-root chain, obtain both private flags, complete cleanup, and save timing plus machine-readable results. Five of five must succeed inside the published timeout.",
        ),
        build(
          "What must cleanup remove?",
          "Remove uploaded files, temporary accounts or credentials, spawned processes, scheduled items, and altered settings created by the chain. Cleanup must be idempotent and tested after success, partial failure, and interruption without simply reverting the VM.",
        ),
        submit(
          "How do I prove the patch fixes root cause?",
          "Show the minimal patch diff, rerun the exploit so it fails at the intended precondition, and run the supplied positive service tests to prove intended behavior remains green. Payload filtering alone is not root-cause remediation.",
        ),
      ],
    },
    3: {
      intro:
        "Cloud-lab guidance for cost guardrails, effective-permission analysis, four-edge IAM compromise, least-privilege remediation, and verified teardown.",
      items: [
        setup(
          "May I use an existing personal or production AWS account?",
          "No. Use a dedicated lab account with MFA on the root user and no root access keys. Install the USD 3 and USD 4 alerts plus a USD 4 Budget Action or equivalent deny policy before deploying the range.",
        ),
        setup(
          "What are the time and cost stop conditions?",
          "Stay within the USD 5 budget, destroy the range within four hours and on the same UTC day, and stop if the deny control or cost visibility is not working. Preserve timestamps, guardrail evidence, and final cost.",
        ),
        build(
          "How do I decide whether a permission edge is actually exploitable?",
          "Evaluate identity policy, resource policy, trust conditions, permission boundaries, session context, and effective permissions together. Record the exact policy statement and decisive API evidence for every accepted or rejected edge.",
        ),
        build(
          "Can I search for a walkthrough using the scenario name?",
          "No. Enumerate from the assigned starting principal and supplied artifacts. Resource names, region, principal names, one edge, and decoy policies vary, so a copied scenario path will not satisfy the variant key.",
        ),
        build(
          "What must remediation preserve?",
          "Patch the Terraform and IAM definitions to remove every scored escalation edge while retaining the supplied business behavior. Apply the change, run positive business tests, then run negative attack-path tests against the deployed state.",
        ),
        submit(
          "When is teardown proof complete?",
          "After destroy, independently query IAM, STS, Lambda, Secrets Manager, S3, EC2, and CloudFormation or Terraform state. residual-checks.json must match the empty baseline and include the query time, account, region scope, and command result.",
        ),
      ],
    },
    4: {
      intro:
        "No-revision guidance for the portable directory range, direct graph-edge validation, two proof paths, reliable automation, detection, and remediation.",
      items: [
        setup(
          "Which directory range controls, and what hardware is required?",
          "Use the portable offline range and your authenticated candidate JSON from the B2 release. It requires Python 3.11+, 4 GB RAM, and 2 GB free disk; GOAD, Windows VMs, a hypervisor, Docker, and cloud infrastructure are not mandatory.",
        ),
        setup(
          "I already started GOAD. Do I lose that work?",
          "No. Preserve valid GOAD health, enumeration, path, event, detection, and remediation evidence. Export it through the portable graph and test interfaces and complete any missing portable assertions. Stronger hardware earns no extra points and you do not rebuild work merely for presentation.",
        ),
        build(
          "Is a BloodHound path screenshot enough to prove an edge?",
          "No. Directly validate at least eight object, membership, ACL, SPN, authentication, session, or delegation edges against the primary range records. Identify and reject the planted stale edge rather than treating your generated graph as ground truth.",
        ),
        build(
          "What makes the two domain-control paths independent?",
          "They must diverge at a meaningful credential, ACL, delegation, or control edge rather than being the same chain with a different command. Each path needs its own ordered edge evidence and private flag.",
        ),
        build(
          "What must the automated path discover?",
          "Start from the supplied foothold and discover changed users, groups, SPNs, ACL holders, and runtime identifiers. Run three times from a clean generated state, clean temporary artifacts, and leave range health green. Names, proof values, SIDs, and path IDs may not be embedded in source.",
        ),
        submit(
          "What belongs in the recorded defense?",
          "Reproduce the selected decisive edge from a clean generated state, show its primary record, replay the corresponding event sequence into the submitted detection, apply remediation, and show the negative path plus legitimate-access tests. This stage has no revision.",
        ),
      ],
    },
    5: {
      intro:
        "Final-engagement guidance for scope enforcement, the three-host chain, deterministic finding tests, one-record proof, patched-state regression, and live retest.",
      items: [
        setup(
          "Where may I run the assessment?",
          "Only against the supplied candidate-run estate on its dedicated local Docker network during the signed test window. Parse the machine-readable rules of engagement into the runner and stop on any target, role, action, or proof limit outside scope.",
        ),
        setup(
          "How should vulnerable and patched environments be prepared?",
          "Build both releases from the supplied source, record image and commit hashes, verify health checks, and create clean starting states. Keep evidence paths separate so vulnerable-state and patched-state results cannot be mixed.",
        ),
        build(
          "What qualifies as the required three-host chain?",
          "Chain at least three distinct control failures across the web, API, and infrastructure or records services. Preserve the runtime transition, request and response, identity or role, and root cause for every edge.",
        ),
        build(
          "How do I respect the one-record proof limit?",
          "Make the runner request and save exactly one assigned synthetic crown-jewel record, assert the count, then stop. Bulk enumeration or collection is out of scope even inside the local estate.",
        ),
        build(
          "Can scanner output be reported as a finding?",
          "Not by itself. Every accepted finding needs a deterministic candidate-authored verification test with a positive vulnerable-state result, an expected patched-state result, cleanup, and raw protocol evidence.",
        ),
        submit(
          "What will the live retest require?",
          "From clean snapshots, run a staff-selected finding test and one full-chain edge using the submitted code. Explain whether the patch removes the root cause or only blocks a payload, and show the intentional regression detected by the suite. No revision is available.",
        ),
      ],
    },
  },
  GRC: {
    1: {
      intro:
        "Technical guidance for mapping exactly three assigned control outcomes, building one typed OPA policy bundle, and reconciling decisions to tests and evidence.",
      items: [
        setup(
          "Which control references may I use?",
          "Use NIST CSF 2.0 and the authorized ISO/IEC 27001:2022 control index supplied or lawfully available to you. Correct the planted mapping only for your three assigned outcomes; do not invent identifiers or reproduce licensed control text.",
        ),
        setup(
          "What should the shared policy input look like?",
          "Define one versioned JSON schema for identity, endpoint, storage, and logging state. Validate input before OPA evaluation, preserve malformed records as failures, and avoid asset IDs or case answers in policy source.",
        ),
        build(
          "Why must there be exactly three controls?",
          "The board constraint is scored. Implement, test, report, and map only the three variant-assigned outcomes; replacing one with an easier control or adding unrelated controls fails the decision constraint.",
        ),
        build(
          "How should exceptions behave?",
          "Require owner, reason, approval, expiry, and compensating-control fields. Missing, malformed, unapproved, or expired exceptions must fail closed and emit a deterministic violation code and evidence locator.",
        ),
        build(
          "How do written policy and Rego stay consistent?",
          "Generate or reconcile a control map from evidence gap to written requirement, Rego package and rule, fixture, decision code, owner, and evidence index row. A written claim that cannot be produced by the engine is unsupported.",
        ),
        submit(
          "What happens during the artifact check?",
          "Staff adds one resource and one exception record, then runs opa test and regenerates the report. Your schema and policy must accept changed IDs and ordering without source edits while producing the correct new decision.",
        ),
      ],
    },
    2: {
      intro:
        "Answers for schema-validating vendor evidence, distinguishing failure from insufficiency, building the data-flow graph, and issuing executable commercial conditions.",
      items: [
        setup(
          "May I contact the vendor or fill gaps with assumptions?",
          "No. The vendor is fictional and the assessment is evidence-led. Record absent or unusable proof as insufficient; never infer implementation from questionnaire language or contact an external organization.",
        ),
        setup(
          "Which exports must the verifier consume?",
          "Validate the supplied SSO, TLS, audit-log, deletion, backup, subprocessor, assurance, and contractual records through versioned schemas. Preserve raw hashes and locators before producing verdicts.",
        ),
        build(
          "What is the difference between fail and insufficient?",
          "Fail means usable evidence contradicts or does not meet the claim. Insufficient means required proof is missing, stale, out of scope, invalid, or unverifiable. Both may block approval, but they must remain separate result codes.",
        ),
        build(
          "How do I handle duplicates, stale evidence, and the broken hash chain?",
          "Normalize identifiers and timestamps, retain duplicate provenance, apply explicit age rules, and verify each integrity link. The deletion job that says success before completion must not pass merely because its status field is positive.",
        ),
        build(
          "What makes a commercial condition executable?",
          "Map each condition to a runnable check, schedule, evidence source, owner, threshold, and fail-closed action. A conditional approval with prose-only quarterly review is incomplete.",
        ),
        submit(
          "What must regenerate during the replacement-export check?",
          "Within 45 minutes, ingest the replacement export without validator-source edits and regenerate evidence-verdicts.json, the contradiction matrix, graph, memo decision, and affected monitoring condition with consistent locators.",
        ),
      ],
    },
    3: {
      intro:
        "Audit-engine guidance for immutable evidence intake, marker-seeded sampling, eighteen generated tests, exact verdict rules, and reproducible nonconformities.",
      items: [
        setup(
          "How should I preserve the evidence pack?",
          "Verify file hashes first and keep the supplied pack read-only. The collector must record hash, owner, scope, timestamp, timezone, evidence age, and parser result before any audit verdict is generated.",
        ),
        setup(
          "Can I quote ISO clauses inside my repository or report?",
          "Reference authorized clause or control identifiers and your audit criteria, but do not reproduce licensed ISO text beyond permitted limits. Your procedure and verdict must be written in your own words and tied to objective evidence.",
        ),
        build(
          "How is the audit sample selected?",
          "Derive the deterministic seed from your room marker and apply the published population, exclusion, deduplication, sample-size, and ordering rules. Preserve every excluded or duplicate member with a reason; do not manually swap sample IDs.",
        ),
        build(
          "What should happen with the stale screenshot or conflicting ticket?",
          "Apply the published evidence validity and event-history rules. A screenshot without adequate date, scope, and ownership cannot satisfy the test, and a ticket status cannot override contradictory immutable event history.",
        ),
        build(
          "Can a missing or failed sample still produce a conforming verdict?",
          "No. The verdict generator must fail closed according to the supplied severity and sufficiency rules. Manual report wording may not override evidence-verdicts.json.",
        ),
        submit(
          "How will reproducibility be checked?",
          "Staff will rerun the collector with the same marker and expect identical sample IDs, verdict JSON, nonconformity IDs, and evidence-index hashes. The holdout pack must work without source changes.",
        ),
      ],
    },
    4: {
      intro:
        "No-revision guidance for a portable hardening compiler, zero-change idempotence, rollback, service safety, evidence interpretation, and quantified treatment selection.",
      items: [
        setup(
          "Which host and profile should I use?",
          "The B2 portable Linux configuration sandbox is the controlling scored host; it requires Python 3.11+, 4 GB RAM, and 1 GB free disk. There is no private OpenSCAP profile to guess and no VM, Vagrant, Ansible, Lynis, OpenSCAP, Docker, or privileged host change is mandatory.",
        ),
        setup(
          "I already started the VM or Ansible route. Do I lose that work?",
          "No. Keep valid baseline, Ansible, scanner, idempotence, rollback, and service evidence. Add a compatibility adapter that exports the same declarative plan, state, security-delta, rollback, and test records required by the portable contract. You do not restart and stronger hardware earns no bonus.",
        ),
        build(
          "What does idempotent mean here?",
          "After the first successful apply, a second compiler/apply run must report zero changes. Preconditions, templates, generated state, and conditional controls must settle; suppressing change output without a real invariant does not count.",
        ),
        build(
          "How do I handle the scanner false positive and service conflict?",
          "Validate each finding against the host state and the published service requirement. Document the false positive instead of remediating a nonexistent defect, and parameterize the conflicting hardening control so the required service remains green.",
        ),
        build(
          "What must rollback prove?",
          "The rollback engine must restore baseline service behavior and controlled configuration hashes, then permit a clean reapply. Deleting and regenerating the sandbox does not prove the submitted rollback automation.",
        ),
        submit(
          "What is required in the recorded defense?",
          "Staff selects one control from the controls you submitted during the defense; there is no separate control file to download. From a clean sandbox, implement or adjust it, run apply and zero-change second run, show security and service tests, then run the affected risk fixture. Exactly three treatments must remain selected. No revision is available.",
        ),
      ],
    },
    5: {
      intro:
        "Final governance guidance for evidence-driven awareness clocks, jurisdiction rules, deduplicated populations, generated work items, and live traceability.",
      items: [
        setup(
          "Which legal sources and rule versions control this project?",
          "Implement the fixed assignment sources: GDPR Articles 33 and 34, Nigeria Data Protection Act 2023 section 40 with current NDPC guidance supplied for the project, and California Civil Code section 1798.82 as amended by SB 446 effective 1 January 2026.",
        ),
        setup(
          "Should the case facts be written directly into the jurisdiction rules?",
          "No. Parse facts through versioned schemas and keep rule thresholds, clocks, dependencies, and jurisdiction configuration separate from case data. Hidden fixtures change awareness time, encryption-key status, overlap groups, and California count.",
        ),
        build(
          "Which timestamps must remain separate?",
          "Model event occurrence, detection, confirmation or awareness, processor notice, consumer notice, and California AG-sample clocks independently. Convert and report WAT and UTC explicitly without silently replacing one clock with another.",
        ),
        build(
          "How are affected people counted across overlapping datasets?",
          "Resolve overlap groups, exclude network-disproved datasets, and emit row-level inclusion or exclusion reasons. Keep confirmed, lower-bound, and upper-bound counts distinct; do not force uncertainty into one precise number.",
        ),
        build(
          "Is California a general 72-hour breach rule?",
          "No. Implement the exact section 1798.82 triggers and the separate subsection (f) Attorney General sample-notice clock from the supplied rule contract. Do not substitute a generic CCPA 72-hour rule.",
        ),
        submit(
          "What will the live defense trace?",
          "Staff will run two fixtures and select one output. Trace it from the source row through schema validation, population decision, jurisdiction rule ID, controlling clock, computed deadline, and generated notice or work item. This stage has no revision.",
        ),
      ],
    },
  },
};

type AdvancedFaqWindow = {
  activeFrom?: string | null;
  submitUntil?: string | null;
};

const WAT_WINDOW_FORMATTER = new Intl.DateTimeFormat("en-NG", {
  timeZone: "Africa/Lagos",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function timingAnswer(window: AdvancedFaqWindow): string {
  const opens = window.activeFrom ? new Date(window.activeFrom) : null;
  const closes = window.submitUntil ? new Date(window.submitUntil) : null;
  if (opens && closes && !Number.isNaN(opens.getTime()) && !Number.isNaN(closes.getTime())) {
    return `This project opened ${WAT_WINDOW_FORMATTER.format(opens)} WAT and closes ${WAT_WINDOW_FORMATTER.format(closes)} WAT. These exact timestamps and the countdown in this room control; weekday cadence text or an older email does not override them. Submit early enough to test the Drive link.`;
  }
  return "Use the exact opening and submission-deadline timestamps displayed in your authenticated project room. The room countdown controls; weekday cadence text or an older email does not override it. Submit early enough to test the Drive link.";
}

function sharedQuestions(track: AdvancedTrack, project: AdvancedProject, window: AdvancedFaqWindow): AdvancedFaqItem[] {
  const deliverables = requiredAdvancedDeliverables(project);
  const firstFiles = deliverables.slice(0, 4).join(", ");
  const stage = `STAGE_${project.number + 4}` as AdvancedRankingStage;
  const policy = advancedSelectionPolicy(stage);
  const trackTarget = policy.fixedAdvanceByTrack?.[track];
  const decisionDetail = policy.basis === "CUMULATIVE_WEIGHTED_PERCENTILE"
    ? "The cumulative percentile uses completed advanced-stage percentiles with weights of 1, 1, 1.5, 2, and 2.5 for Stages 5 through 9."
    : "This decision uses the percentile from the current project only.";
  const cohortDetail = trackTarget !== undefined
    ? `This stage advances the top ${trackTarget} scored associates in your track. Non-submitters cannot advance and occupy the bottom of the full track cohort before scored reports are ranked.`
    : policy.eliminationRate !== null
    ? `The denominator is the full cohort that entered this stage in your track, including people who did not submit. Non-submitters are removed first and count toward the ${Math.round(policy.eliminationRate * 100)}% attrition target. If that does not reach the target, only the remaining shortfall is taken from the lowest-ranked graded reports.`
    : "The denominator is the full cohort assigned to this stage in your track; a non-submitter cannot advance.";

  const stageSixVideo = project.number === 2
    ? [
        submit(
          "Is a screen recording or video required for Stage 6?",
          "No. A Stage 6 video is optional supporting evidence. It carries no standalone marks, and omitting it does not reduce your score. Grading is based on the submitted implementation, tests, raw evidence, machine-readable outputs, report, and reproducibility record. If you voluntarily include a recording, keep it focused and remove unrelated tabs, accounts, notifications, credentials, and private keys.",
        ),
      ]
    : [];

  return [
    setup(
      "When is this project open, and may I submit after the deadline?",
      timingAnswer(window),
    ),
    build(
      "How does my score become an advancement or elimination decision?",
      `${policy.label}. Candidates are ranked only against interns in the same track, never against another track. ${cohortDetail} No report is silently removed before ranking: safety, integrity, and reproduction concerns are recorded in the reviewed technical result and require a documented staff decision. The highest result receives the highest percentile; for more than one cohort member the published percentile is 100 × (cohort size − competition rank) ÷ (cohort size − 1). ${decisionDetail} There is no fixed 70% advanced-stage pass mark. Exact ties at the selection boundary are resolved through an audited defense or blinded review, not an arbitrary hidden cutoff.`,
    ),
    submit(
      "How should I organize the final Drive folder?",
      `Use one project root with the exact required names shown in this room, including ${firstFiles}. Keep source, tests, raw evidence, derived evidence, and reports distinguishable. Generate manifest.sha256 after the folder is final and ensure every scored claim has a locator in evidence-index.csv.`,
    ),
    submit(
      "What exactly do I paste into the UBI submission form?",
      `Paste one view-only Google Drive folder URL into the Stage ${project.number + 4} submission page and type the executive summary in the form unless executive-summary.pdf is explicitly listed as a deliverable. Do not submit separate file links or a compressed archive that staff cannot inspect.`,
    ),
    submit(
      "How do I check that staff can open my submission?",
      `Open the submitted folder URL in a private or incognito browser where you are not signed in. Confirm the root opens without a permission request, every file is downloadable, manifest.sha256 verifies, and the clean build or test command in README.md is exact. ${project.revision === "No revision" ? "This project has no revision, so complete this check before submitting." : "One revision may be offered under the published rule, but inaccessible or missing evidence can still prevent assessment."}`,
    ),
    ...stageSixVideo,
  ];
}

export function advancedProjectFaq(
  track: AdvancedTrack,
  project: AdvancedProject,
  window: AdvancedFaqWindow = {},
): AdvancedProjectFaq {
  const seed = FAQ_SEEDS[track][project.number];
  return {
    intro: seed.intro,
    items: [...seed.items, ...sharedQuestions(track, project, window)],
  };
}
