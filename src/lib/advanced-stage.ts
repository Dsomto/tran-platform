import type { StageKey, StageSlug } from "./stage-login";

export type AdvancedTrack = "SOC_ANALYSIS" | "ETHICAL_HACKING" | "GRC";
export const ADVANCED_STAGE_WINDOW_LABEL = "Mon 09:00 WAT - Fri 18:10 WAT";

export type AdvancedResource = {
  label: string;
  href: string;
  description: string;
  kind: "brief" | "artifact" | "template" | "reference";
};

export type AdvancedProject = {
  stage: StageKey;
  slug: StageSlug;
  number: 1 | 2 | 3 | 4 | 5;
  title: string;
  duration: string;
  difficulty: 3 | 4 | 5;
  revision: "One revision" | "No revision";
  defense: "Artifact check" | "Recorded defense" | "Live defense";
  objective: string;
  setup: string[];
  mission: string[];
  technicalChallenges: string[];
  verificationTests: string[];
  proof: string[];
  deliverables: string[];
  gates: string[];
  pressureSlots: string[];
  resources: AdvancedResource[];
};

export type AdvancedTrackOutcome = {
  learning: string[];
  toolkit: string;
  destination: string;
};

/** Files required by the submission contract for every advanced project. */
export const ADVANCED_COMMON_DELIVERABLES = [
  "evidence-index.csv",
  "manifest.sha256",
  "integrity-attestation.md",
  "README.md",
  "assessment-manifest.json",
  "continuity-record.md",
] as const;

/**
 * Return the one controlling deliverable list used across the project room,
 * track workspace, and report editor. Project-specific ordering is preserved,
 * and common files already listed by a project are not duplicated.
 */
export function requiredAdvancedDeliverables(
  project: Pick<AdvancedProject, "deliverables">
): string[] {
  return [
    ...project.deliverables,
    ...ADVANCED_COMMON_DELIVERABLES.filter(
      (file) => !project.deliverables.includes(file)
    ),
  ];
}

export const ADVANCED_TRACK_OUTCOMES: Record<AdvancedTrack, AdvancedTrackOutcome> = {
  SOC_ANALYSIS: {
    learning: [
      "Normalize and correlate hostile-quality security data",
      "Build isolated sensors and network ranges as code",
      "Test detections against attacks and benign lookalikes",
      "Reconstruct a multi-host incident from primary evidence",
    ],
    toolkit: "Python · DuckDB · T-Pot · containerlab · Zeek/Suricata · Wazuh · Volatility 3",
    destination: "A defensible detection portfolio that runs from raw telemetry to a reconstructed incident.",
  },
  ETHICAL_HACKING: {
    learning: [
      "Build discovery and evidence tooling that respects scope",
      "Prove exploit chains safely and test remediation",
      "Model attack paths across AWS IAM and Active Directory",
      "Run a bounded assessment with cleanup and regression proof",
    ],
    toolkit: "Python · pytest · AWS IAM · Active Directory · BloodHound · reproducible lab automation",
    destination: "A scope-safe assessment portfolio spanning automation, cloud, identity, exploitation, and retesting.",
  },
  GRC: {
    learning: [
      "Turn control requirements into testable policy as code",
      "Verify vendor claims against structured evidence",
      "Run deterministic audits and quantified treatment choices",
      "Build jurisdiction-aware breach decision workflows",
    ],
    toolkit: "Python · OPA/Rego · control evidence · audit sampling · risk models · regulatory decision logic",
    destination: "Governance work that is testable, evidence-led, and connected to real technical outcomes.",
  },
};

export const ADVANCED_STAGE_META: Record<
  Extract<StageKey, "STAGE_5" | "STAGE_6" | "STAGE_7" | "STAGE_8" | "STAGE_9">,
  { number: 1 | 2 | 3 | 4 | 5; slug: StageSlug; name: string; subtitle: string }
> = {
  STAGE_5: { number: 1, slug: "stage-5", name: "Signal", subtitle: "Find what ordinary analysis misses" },
  STAGE_6: { number: 2, slug: "stage-6", name: "Exposure", subtitle: "Operate a real system and own its consequences" },
  STAGE_7: { number: 3, slug: "stage-7", name: "Architecture", subtitle: "Build, test, and defend the whole design" },
  STAGE_8: { number: 4, slug: "stage-8", name: "Adversity", subtitle: "No revision. Defend the work under challenge" },
  STAGE_9: { number: 5, slug: "stage-9", name: "The Final Case", subtitle: "Recover, decide, and stand behind the result" },
};

const common = (stage: number): AdvancedResource[] => [
  {
    label: "Submission contract",
    href: "/advanced-stage/common/submission-contract.md",
    description: "Required folder structure, filenames, hashes, and evidence rules.",
    kind: "brief",
  },
  {
    label: "Evidence index",
    href: "/advanced-stage/common/evidence-index-template.csv",
    description: "Every material claim must point to a raw artifact and exact locator.",
    kind: "template",
  },
  {
    label: "Evidence index example",
    href: "/advanced-stage/common/evidence-index-example.csv",
    description: "A fictional, non-answer row showing the expected locator and reasoning standard.",
    kind: "reference",
  },
  {
    label: "Technical assessment contract",
    href: "/advanced-stage/common/technical-assessment-contract.md",
    description: "Objective build, hidden-test, reliability, and reproduction rules for every project.",
    kind: "brief",
  },
  {
    label: "Assessment manifest",
    href: "/advanced-stage/common/assessment-manifest-template.json",
    description: "Machine-readable clean-build commands, versions, test counts, runtimes, and output hashes.",
    kind: "template",
  },
  {
    label: "Assessment manifest example",
    href: "/advanced-stage/common/assessment-manifest-example.json",
    description: "A fictional, non-answer manifest showing structure without project values or solutions.",
    kind: "reference",
  },
  {
    label: "Defense readiness",
    href: "/advanced-stage/common/defense-readiness.md",
    description: "Clean-state reproduction and evidence-navigation checklist.",
    kind: "template",
  },
  {
    label: "Portfolio continuity contract",
    href: "/advanced-stage/common/portfolio-continuity.md",
    description: "What must be reused from the previous project and handed to the next one.",
    kind: "brief",
  },
  {
    label: "Stage integrity attestation",
    href: `/advanced-stage/stage-${stage}/integrity-attestation.md`,
    description: "Sign and include this stage-specific declaration in the submission root.",
    kind: "template",
  },
];

const p = (stage: number, track: "soc" | "eh" | "grc", file: string) =>
  `/advanced-stage/stage-${stage}/${track}/${file}`;

export const ADVANCED_PROJECTS: Record<AdvancedTrack, AdvancedProject[]> = {
  SOC_ANALYSIS: [
    {
      stage: "STAGE_5", slug: "stage-5", number: 1,
      title: "Build a Production Hunt Engine",
      duration: ADVANCED_STAGE_WINDOW_LABEL, difficulty: 4, revision: "One revision", defense: "Artifact check",
      objective: "Engineer a tested hunt pipeline for a compact hostile-quality evidence pack: schema drift, duplicates, invalid timestamps, clock offsets, identity aliases, 96 assigned review cases, and three linked attack campaigns.",
      setup: ["Python 3.11+", "DuckDB with pytest", "8 GB RAM and 2 GB free disk", "Shared track archive capped at 100 MB plus your signed private discrepancy set"],
      mission: ["Implement streaming ingestion, typed normalization, quarantine, deduplication, clock correction, and source reconciliation without editing raw files.", "Resolve identity and host aliases, then correlate auth, web, DNS, firewall, and endpoint events into campaign graphs.", "Write reusable hunts and a command-line runner; no campaign-specific constants, IP lists, usernames, or timestamps in code.", "Benchmark a clean build, incremental ingest, and all hunts; publish query plans and peak memory."],
      technicalChallenges: ["At least three schema versions per source and a malformed-row quarantine with reason codes.", "Clock offsets must be inferred from cross-source anchors and corrected without reordering equal-time events.", "The shared pool contains 384 attacker-like activities; the private set assigns 96, of which exactly 80 have valid benign evidence and 16 contain a material approval mismatch."],
      verificationTests: ["A clean staff runner ingests the full pack and executes all hunts in 12 minutes or less on 4 vCPU/8 GB RAM.", "A hidden 25,000-row shard must produce exact campaign, quarantine, reconciliation, and source-accounting results.", "The discrepancy result must classify all 96 assigned cases from raw locators and controlling records; two clean runs must produce identical hashes."],
      proof: ["Every campaign edge resolves to two independent source locators.", "All 96 assigned review cases cite raw locators and the controlling change record; appearance-only classification receives no credit.", "Automated tests cover schema drift, bad timestamps, duplicates, aliases, offsets, and empty inputs.", "The CLI rebuilds the database and exports all scored tables without manual SQL edits."],
      deliverables: ["hunt-engine/", "tests/", "queries/", "benchmark.json", "normalized-timeline.csv", "campaign-graph.json", "tp-fp-table.csv", "data-quality-register.csv", "evidence-index.csv", "manifest.sha256"],
      gates: ["Any unaccounted source row fails ingestion integrity.", "Any hard-coded campaign indicator caps technical implementation below pass.", "Failure of the hidden shard or deterministic rebuild is a project failure."],
      pressureSlots: ["Add a sixth source through the plugin interface", "Cut peak memory by 25 percent without changing output", "Repair a failing clock-correction fixture"],
      resources: [...common(5), { label: "Project brief", href: p(5, "soc", "brief.md"), description: "Full mission, scoring, and exact submission contract.", kind: "brief" }, { label: "Public schema fixtures", href: p(5, "soc", "schema-fixtures.json"), description: "Eighteen exact schema, clock, malformed-row, and alias normalization cases.", kind: "artifact" }, { label: "DuckDB starter", href: p(5, "soc", "starter.sql"), description: "Schema and import skeleton; no hunt answers.", kind: "template" }, { label: "Hunt templates", href: p(5, "soc", "hunt-workbook.csv"), description: "Claim, evidence, confidence, alternatives, and next step.", kind: "template" }],
    },
    {
      stage: "STAGE_6", slug: "stage-6", number: 2,
      title: "Engineer a Deception Sensor and Analysis Pipeline",
      duration: ADVANCED_STAGE_WINDOW_LABEL, difficulty: 4, revision: "One revision", defense: "Artifact check",
      objective: "Build a production-style sessionization, clustering, payload-handling, and detection pipeline against a sealed T-Pot replay; optionally prove it against a candidate-owned live sensor.",
      setup: ["Shared sealed T-Pot replay", "Python 3.11+ analysis environment", "Candidate-owned Linux VM and public address only for the live pressure task", "Supplied T-Pot boundary source"],
      mission: ["Build and verify the candidate-run sensor boundary source with ingress, egress, metadata, private-range, and management controls; live public exposure is optional.", "Build a Python pipeline that normalizes sessions, clusters infrastructure/credentials, hashes payloads, and emits STIX 2.1 plus Sigma or Suricata content.", "Replay the sealed protocol/session evidence through the pipeline and prove stable output independently of live collection volume.", "Quarantine every binary by hash and metadata only; never execute captured payloads."],
      technicalChallenges: ["Management must be reachable only through the declared source and all RFC1918/metadata egress tests must fail closed.", "Sessionization must handle reordered events, repeated credentials, protocol differences, and reconnects.", "The analysis pipeline must support both a live T-Pot export and the sealed fallback schema through adapters."],
      verificationTests: ["All isolation rows pass in a local boundary test, and again from external, management, and sensor viewpoints if the live pressure task is attempted.", "A holdout replay must produce exact session, cluster, payload, and detection counts.", "The analysis environment rebuilds cleanly and reproduces all scored outputs without access to programme infrastructure."],
      proof: ["Machine-readable firewall tests and a management-port scan from both allowed and denied sources.", "Pipeline unit tests plus raw-to-STIX and raw-to-detection traceability.", "One protocol session reconstructed byte-for-byte where the source supports it."],
      deliverables: ["sensor-infrastructure/", "analysis-pipeline/", "tests/", "isolation-results.json", "raw-export/", "sessions.parquet", "clusters.json", "stix-bundle.json", "detections/", "hash-ledger.csv", "evidence-index.csv", "manifest.sha256"],
      gates: ["Any reachable management service from an unapproved source fails the live pressure task.", "Any payload execution fails safety.", "Failure of the sealed replay or clean analysis rebuild fails technical completion."],
      pressureSlots: ["Add a second T-Pot export schema adapter", "Sessionize an unseen protocol fixture", "Convert one cluster into a tested Suricata rule"],
      resources: [...common(6), { label: "Project brief", href: p(6, "soc", "brief.md"), description: "Deployment, isolation, fallback, and grading rules.", kind: "brief" }, { label: "Public replay fixtures", href: p(6, "soc", "public-fixtures.json"), description: "Sixteen reordered, reconnect, and protocol cases with exact expected sessions.", kind: "artifact" }, { label: "Isolation test sheet", href: p(6, "soc", "isolation-tests.csv"), description: "Required reachability and management checks.", kind: "template" }, { label: "Session analysis template", href: p(6, "soc", "session-analysis.md"), description: "Evidence-led session reconstruction.", kind: "template" }],
    },
    {
      stage: "STAGE_7", slug: "stage-7", number: 3,
      title: "Build a Network Detection Range as Code",
      duration: ADVANCED_STAGE_WINDOW_LABEL, difficulty: 5, revision: "One revision", defense: "Artifact check",
      objective: "Build a seven-zone routed enterprise range in containerlab, enforce policy with Linux/nftables, generate attacks and business traffic, and verify segmentation and detection through code.",
      setup: ["Linux host with Docker and containerlab", "FRRouting containers", "nftables gateway", "Zeek or Suricata sensor", "pytest/testinfra acceptance harness"],
      mission: ["Define user, finance, engineering, server, management, guest, and DMZ zones entirely as code with deterministic addressing and routing.", "Implement stateful least privilege, administrative paths, NAT, DNS/NTP, centralized logs, and a mirrored sensor path.", "Write positive, negative, return-path, spoofing, management, and logging tests for the published matrix.", "Inject the three published fault conditions plus the private D-set condition, identify each from packets/logs, and restore the passing baseline through version-controlled changes."],
      technicalChallenges: ["No manually configured node: topology, routes, policy, services, telemetry, and tests must rebuild from the repository.", "Stateful return traffic must work while new forbidden east-west sessions fail and generate observable telemetry.", "Sensor placement must capture all scored paths without receiving an address that can initiate production-zone traffic."],
      verificationTests: ["`make clean && make lab && make test` must build from zero and pass at least 30 published path/policy assertions.", "A hidden addressing variant and five hidden policy tests must pass without code changes outside the variant file.", "Each supplied fault must be detected by a failing test and the submitted fix must return the suite to green."],
      proof: ["Packet captures and firewall/Zeek records for every denied-path class.", "Machine-readable test report tied to topology commit and container hashes.", "Git history shows fault injection, failing test, fix, and clean retest."],
      deliverables: ["network-range/", "topology.clab.yml", "configs/", "services/", "detections/", "tests/", "pcaps/", "test-results.xml", "fault-recovery-log.md", "evidence-index.csv", "manifest.sha256"],
      gates: ["A diagram or Packet Tracer file does not satisfy this project.", "Any broad any-any inter-zone rule fails segmentation.", "Failure of clean build, hidden variant, or negative-path tests fails technical completion."],
      pressureSlots: ["Add a contractor zone through one variant file", "Implement an emergency rule with an automated expiry test", "Diagnose a hidden asymmetric-return failure"],
      resources: [...common(7), { label: "Project brief", href: p(7, "soc", "brief.md"), description: "Business requirements, constraints, and acceptance tests.", kind: "brief" }, { label: "Public test fixtures", href: p(7, "soc", "public-fixtures.json"), description: "Thirty machine-readable path verdicts matching the published interface.", kind: "artifact" }, { label: "Address plan", href: p(7, "soc", "address-plan.csv"), description: "Assigned networks and capacity constraints.", kind: "artifact" }, { label: "Control test matrix", href: p(7, "soc", "control-test-matrix.csv"), description: "Required positive and negative tests.", kind: "template" }],
    },
    {
      stage: "STAGE_8", slug: "stage-8", number: 4,
      title: "Detection Engineering Under Adversary Pressure",
      duration: ADVANCED_STAGE_WINDOW_LABEL, difficulty: 5, revision: "No revision", defense: "Recorded defense",
      objective: "Build detection-as-code for twelve controlled ATT&CK procedures, then pass a regression suite of attacks, mutations, benign lookalikes, telemetry failures, and clean-state deployment.",
      setup: ["Wazuh 4.14.6 single-node Docker deployment", "Windows 11 evaluation VM with Sysmon", "Atomic Red Team on an isolated host-only lab", "16 GB RAM minimum; 24 GB recommended"],
      mission: ["Pin and deploy Wazuh, Sysmon, agents, decoders, rules, and test data from code.", "Execute twelve assigned procedures across five ATT&CK tactics plus twenty-four benign controls and preserve source/normalized/alert triples.", "Build an automated replay/regression harness and detection tests; tune field logic, thresholds, parent/child relationships, and time windows.", "Measure behavior when one telemetry field is removed, one binary is renamed, and one command is encoded differently."],
      technicalChallenges: ["At least six detections must correlate multiple events or enforce a sequence/time window.", "Rules must detect semantic variants rather than exact Atomic command strings.", "The test harness must distinguish no telemetry, decoder failure, rule miss, suppression, and successful alert."],
      verificationTests: ["All twelve canonical attack fixtures and all twenty-four benign fixtures must produce the published expected verdicts.", "At least six of eight hidden attack mutations must alert with zero alerts across twelve hidden benign fixtures.", "A clean deployment must load every rule without error and complete the regression suite unattended."],
      proof: ["Raw, normalized, and alert artifacts for every expected detection.", "JUnit or equivalent machine-readable regression results.", "Recorded defense checks out a clean commit, runs a staff-selected mutation, and traces the matching logic."],
      deliverables: ["detection-lab/", "rules/", "decoders/", "tests/", "fixtures/", "raw-events/", "alerts/", "coverage-matrix.csv", "regression-results.xml", "video-url.txt", "manifest.sha256"],
      gates: ["No revision after submission.", "Canonical-only detection without hidden-mutation coverage cannot pass.", "A rule that matches a command literal or test identifier fails that detection."],
      pressureSlots: ["Repair a decoder against an unseen event", "Port and unit-test one rule in Sigma", "Reduce a supplied false-positive fixture without losing mutation coverage"],
      resources: [...common(8), { label: "Project brief", href: p(8, "soc", "brief.md"), description: "Pinned versions, test safety, and scoring.", kind: "brief" }, { label: "Public detection fixtures", href: p(8, "soc", "public-fixtures.json"), description: "Twelve attack and twenty-four benign event cases with exact verdicts.", kind: "artifact" }, { label: "Technique matrix", href: p(8, "soc", "technique-matrix.csv"), description: "Assigned tests and required benign controls.", kind: "artifact" }, { label: "Rule test template", href: p(8, "soc", "rule-test-record.md"), description: "Raw event to alert to tuning record.", kind: "template" }],
    },
    {
      stage: "STAGE_9", slug: "stage-9", number: 5,
      title: "Full Incident Response",
      duration: ADVANCED_STAGE_WINDOW_LABEL, difficulty: 5, revision: "No revision", defense: "Live defense",
      objective: "Solve a sealed multi-source DFIR case from host logs, email, and packet evidence; recover the exfiltrated dataset and ship reproducible timeline and detection code.",
      setup: ["Wireshark and Zeek", "oletools", "Shared sealed incident package", "Candidate-owned optional memory-capture source", "20 GB free disk and 8 GB RAM recommended"],
      mission: ["Verify acquisitions and build a parser-driven super-timeline with explicit source clocks and provenance.", "Recover the phishing object, execution chain, persistence, credentials, privilege path, lateral movement, staging commands, C2, and exfiltration flow across at least three hosts.", "Extract and reconstruct the synthetic stolen archive from network or host artifacts; calculate exact record and byte counts.", "Write and test Sigma/YARA/Zeek content against supplied positive and negative fixtures, then produce containment and recovery automation."],
      technicalChallenges: ["The case contains duplicate events, one damaged artifact, two source-clock offsets, a benign administrative sequence, and a tampered evidence item identified by manifest verification.", "The recovered archive is split across multiple sessions and must be reconstructed and hashed.", "The submitted timeline builder must parse at least four evidence types and preserve source locators for every row."],
      verificationTests: ["The recovered archive hash, file count, record count, and case flags must match the staff key exactly.", "The clean timeline build must match required event IDs and ordering while accounting for every parser error.", "Detection content must pass all supplied positives/negatives plus the staff holdout; live defense reproduces two selected extractions from raw evidence."],
      proof: ["Recovered archive and payload hashes with exact content counts.", "Parser-generated timeline, source locator, and clock-correction tests.", "Clean-state live reproduction of an extraction, timeline query, and detection test."],
      deliverables: ["incident-report.pdf", "executive-brief.pdf", "timeline-builder/", "timeline.csv", "ioc-set.csv", "recovered/", "detections/", "tests/", "queries/", "evidence-index.csv", "manifest.sha256", "video-url.txt"],
      gates: ["No revision.", "A manually assembled timeline without reproducible parser output cannot pass.", "Wrong archive hash/count or unsupported exfiltration claim fails the central case result."],
      pressureSlots: ["Add an unseen EVTX channel to the timeline parser", "Write a Zeek test for a second C2 fixture", "Recover one file from a separately supplied stream fragment"],
      resources: [...common(9), { label: "Project brief", href: p(9, "soc", "brief.md"), description: "Case scope, evidence handling, and live-defense rules.", kind: "brief" }, { label: "Public parser tests", href: p(9, "soc", "public-tests.json"), description: "Twelve exact parser, integrity, clock, duplicate, and archive interface cases.", kind: "artifact" }, { label: "Timeline template", href: p(9, "soc", "timeline.csv"), description: "Fact, source, confidence, and hypothesis fields.", kind: "template" }, { label: "IOC template", href: p(9, "soc", "ioc-set.csv"), description: "Observable, context, confidence, and handling.", kind: "template" }],
    },
  ],
  ETHICAL_HACKING: [
    {
      stage: "STAGE_5", slug: "stage-5", number: 1,
      title: "Build a Recon Engine and Earn the Foothold",
      duration: ADVANCED_STAGE_WINDOW_LABEL, difficulty: 4, revision: "One revision", defense: "Artifact check",
      objective: "Engineer a resumable, scope-safe recon platform, pass unreleased fixtures, discover a local runtime profile's hidden service chain, and obtain its fresh foothold flag.",
      setup: ["Any machine with Python 3.11 or newer", "Supplied standard-library loopback lab", "Candidate-authored discovery adapters", "No Docker, VPN, cloud account, package install, or internet access required"],
      mission: ["Implement discovery, DNS/wildcard handling, probing, TLS/SNI, virtual-host enumeration, service scanning, fingerprinting, normalization, and report generation as tested modules.", "Enforce CIDR/hostname/port scope before every network call; the out-of-scope decoy must generate zero packets.", "Support bounded concurrency, rate limiting, timeouts, retries, resumable state, tool failure, and deterministic deduplication.", "Use the engine's output to obtain the private `user.txt` flag, then stop at the stated proof."],
      technicalChallenges: ["Adapters must parse XML, JSON, and line-oriented output into one versioned schema without shell-string concatenation.", "Wildcard DNS/vhost baselining must suppress random-label responses without hiding the assigned vhost.", "Interrupted runs must resume without repeating completed probes or corrupting the evidence ledger."],
      verificationTests: ["The published unit/integration suite plus 20 unreleased parser and scope fixtures must pass.", "After a clean local-target restart under another profile, service recall must be at least 90 percent with zero out-of-scope requests and no more than the published request budget.", "With one adapter unavailable and one run interrupted, the engine must finish through fallback/resume and produce the same normalized result hash."],
      proof: ["Git history shows modules, tests, failures, and fixes rather than one generated commit.", "Engine and target ledgers reconcile, prove zero decoy traffic, and account for the rate budget.", "The fresh foothold flag, raw multi-protocol response chain, and normalized record all reconcile."],
      deliverables: ["recon-engine/", "tests/", "schemas/", "attack-surface-report.pdf", "scope-register.csv", "raw-output/", "normalized.json", "request-ledger.csv", "foothold-evidence.txt", "test-results.xml", "manifest.sha256"],
      gates: ["Only endpoints marked IN in the generated loopback scope are authorized.", "Neither the room marker nor a copied flag is foothold proof without a reconciling response chain and ledgers.", "No auto-exploitation in the recon engine.", "A wrapper that ignores errors or only concatenates outputs is capped."],
      pressureSlots: ["Add an unseen JSON parser", "Handle a wildcard-vhost response", "Re-run against a target with one tool unavailable"],
      resources: [...common(5), { label: "Project brief", href: p(5, "eh", "brief.md"), description: "Scope, build contract, and foothold stop point.", kind: "brief" }, { label: "Public parser fixtures", href: p(5, "eh", "parser-fixtures.json"), description: "Twenty exact parser, scope, wildcard, resume, deduplication, and failure cases.", kind: "artifact" }, { label: "Rules of engagement", href: p(5, "eh", "rules-of-engagement.md"), description: "Authorized target and prohibited actions.", kind: "artifact" }, { label: "Tool interface spec", href: p(5, "eh", "tool-interface.md"), description: "Required inputs, outputs, exit codes, and test hooks.", kind: "template" }],
    },
    {
      stage: "STAGE_6", slug: "stage-6", number: 2,
      title: "Root the Box: Exploit Chain as Code",
      duration: ADVANCED_STAGE_WINDOW_LABEL, difficulty: 4, revision: "One revision", defense: "Artifact check",
      objective: "Write a reliable, non-Metasploit foothold-to-root exploit chain for the offline VM built from supplied source, patch both root causes, and prove exploit and negative retest from clean snapshots.",
      setup: ["Supplied vulnerable/patched Vagrant source", "Kali attacker on host-only network", "Snapshot target before testing", "No walkthrough for the assessment target during the window"],
      mission: ["Enumerate the target and derive the initial-access and privilege-escalation preconditions from raw evidence.", "Implement the chain in Python or Go with explicit protocol handling, preflight checks, timeouts, safe failure, and idempotent cleanup.", "Run the complete chain five times from a clean snapshot and record reliability and timing.", "Apply minimum root-cause patches, rerun the exploit as a negative test, and prove intended service behavior still passes."],
      technicalChallenges: ["The chain contains at least two distinct vulnerability classes and one planted service that returns convincing but non-exploitable output.", "Exploit code must discover dynamic target values rather than embed addresses, process IDs, usernames, or tokens from one run.", "Cleanup must remove every uploaded file, account, process, and altered setting without reverting the whole VM."],
      verificationTests: ["Five of five clean-snapshot runs must obtain both private flags and finish cleanup within the published timeout.", "A hidden variant changes ports, banners, and one dynamic value; the chain must pass through configuration only, not source edits.", "After patching, exploit tests must fail at the intended precondition while all supplied service acceptance tests remain green."],
      proof: ["Private user/root flags and full protocol/command transcript.", "Five-run reliability report plus automated preflight, exploit, cleanup, and negative-retest results.", "Patch diff tied to root cause and acceptance tests."],
      deliverables: ["exploit-chain/", "tests/", "patches/", "technical-findings.pdf", "execution-transcripts/", "reliability.json", "rabbit-hole-analysis.md", "cleanup-results.xml", "negative-retest.xml", "manifest.sha256"],
      gates: ["Assigned lab only.", "Fewer than five successful clean runs cannot pass reliability.", "Kernel panic, destructive persistence, or data damage fails safety.", "Metasploit or public exploit execution without candidate-authored chain code fails implementation."],
      pressureSlots: ["Adapt through configuration to a hidden port map", "Replace one unavailable library", "Repair cleanup after an interrupted exploit"],
      resources: [...common(6), { label: "Project brief", href: p(6, "eh", "brief.md"), description: "Assignment, safety, and repeatability rules.", kind: "brief" }, { label: "Public exploit tests", href: p(6, "eh", "public-tests.json"), description: "Exact configuration, precondition, cleanup, patch, and service assertions.", kind: "artifact" }, { label: "Target assignment", href: p(6, "eh", "target-assignment.md"), description: "Variant ID, image hash, scope, and flags.", kind: "artifact" }, { label: "Exploit test record", href: p(6, "eh", "exploit-test-record.md"), description: "Preconditions, transcript, rollback, and retest.", kind: "template" }],
    },
    {
      stage: "STAGE_7", slug: "stage-7", number: 3,
      title: "Compromise a Custom AWS IAM Range",
      duration: ADVANCED_STAGE_WINDOW_LABEL, difficulty: 5, revision: "One revision", defense: "Artifact check",
      objective: "Compromise the supplied CloudGoat-derived range in a dedicated AWS lab account containing trust-policy, policy-version, permission-boundary, and workload-role edges; then implement and test least-privilege remediation.",
      setup: ["Dedicated AWS lab account with MFA on the root user", "USD 5 budget, USD 3/USD 4 alerts, and a USD 4 Budget Action or equivalent deny policy", "CloudGoat 2.x and Terraform", "Four-hour and same-UTC-day teardown SLA"],
      mission: ["Enumerate the starting principal, attached/inline policies, policy versions, trust relationships, boundaries, and effective permissions without using the scenario name as a walkthrough search term.", "Traverse at least four scored permission edges, retrieve only the assigned secret, and preserve CloudTrail for every decisive API call.", "Patch the supplied Terraform/IAM definitions, redeploy, and run positive business tests plus negative attack-path tests.", "Destroy within the cost SLA and independently query every service class in the release manifest for residuals."],
      technicalChallenges: ["Resource names, regions, principal names, one permission edge, and decoy policies differ across V1-V6.", "One apparently powerful action is neutralized by a boundary or trust condition and must be rejected by effective-permission analysis.", "Remediation must preserve the workload's supplied positive tests while removing every scored escalation edge."],
      verificationTests: ["The private secret and ordered CloudTrail event IDs must match the staff variant key.", "All business acceptance tests pass and all attack-path tests fail after the remediation Terraform is applied.", "Teardown finishes inside four hours and residual queries return the exact empty baseline across IAM, STS, Lambda, Secrets Manager, S3, EC2, and CloudFormation/Terraform state."],
      proof: ["Machine-readable graph from starting identity to secret with policy/trust/boundary evidence per edge.", "CloudTrail export and tested Terraform/IAM remediation diff.", "Budget Action, timestamps, destroy output, residual inventory, and final cost."],
      deliverables: ["cloud-assessment/", "enumeration/", "attack-path.json", "cloudtrail-events.json", "remediation/", "tests/", "business-tests.xml", "attack-tests.xml", "cost-guardrail.md", "destroy-proof.txt", "residual-checks.json", "manifest.sha256"],
      gates: ["Dedicated lab account only.", "Root access keys are prohibited.", "Missing cost guardrail, clean teardown, private flag, or remediation tests fails the project."],
      pressureSlots: ["Repair a broken trust-policy test", "Remove one escalation edge without breaking workload tests", "Diagnose a denied API call from policy simulation and CloudTrail"],
      resources: [...common(7), { label: "Project brief", href: p(7, "eh", "brief.md"), description: "AWS boundary, cost controls, evidence, and cleanup.", kind: "brief" }, { label: "Public IAM tests", href: p(7, "eh", "public-tests.json"), description: "Exact effective-permission, condition, PassRole, and remediation cases.", kind: "artifact" }, { label: "Cloud safety checklist", href: p(7, "eh", "cloud-safety-checklist.md"), description: "Mandatory preflight and teardown evidence.", kind: "template" }, { label: "Attack path template", href: p(7, "eh", "attack-path.json"), description: "Identity, permission, action, evidence, and remediation.", kind: "template" }],
    },
    {
      stage: "STAGE_8", slug: "stage-8", number: 4,
      title: "Own the Forest",
      duration: ADVANCED_STAGE_WINDOW_LABEL, difficulty: 5, revision: "No revision", defense: "Recorded defense",
      objective: "Provision a variant Active Directory forest, validate two independent paths to domain control, automate one path reliably, and prove the corresponding Windows detection and remediation tests.",
      setup: ["GOAD-Light is the supported baseline; full GOAD is an approved pressure task", "Provider-specific official GOAD install", "32 GB RAM and 110 GB free disk recommended for GOAD-Light", "Impacket, NetExec, BloodHound CE, Hashcat"],
      mission: ["Provision and health-check the assigned forest from the supported provider files and preserve range hashes.", "Enumerate without SharpHound defaults alone; validate at least eight graph edges by direct LDAP/SMB/Kerberos evidence and identify the planted stale edge.", "Prove two independent domain-control paths, execute one through candidate-authored automation, and stop without persistence.", "Enable and export the required Windows events, write two detections for decisive edges, remediate both paths, and rerun negative attack tests."],
      technicalChallenges: ["V1-V6 change users, groups, SPNs, ACL holders, one stale edge, and the path selected for recorded reproduction.", "At least one path requires combining credential abuse with an ACL or delegation edge; a single cracked password is insufficient.", "Automation must start from the supplied foothold, discover dynamic identifiers, and clean temporary artifacts."],
      verificationTests: ["The two private path flags and all directly validated edge IDs match the staff variant key.", "The automated path succeeds three of three times from the clean checkpoint and leaves the range health suite green.", "After remediation, both path tests fail at their intended edges and both submitted detections alert on replayed positive fixtures but not benign controls."],
      proof: ["Provisioning report, graph queries, direct edge evidence, and stale-edge rejection.", "Three clean automation transcripts with cleanup results.", "Recorded clean-state edge reproduction plus detection and remediation test output."],
      deliverables: ["ad-range/", "enumeration/", "attack-paths.json", "automation/", "tests/", "windows-events/", "detections/", "remediation/", "credential-handling.md", "video-url.txt", "manifest.sha256"],
      gates: ["No revision.", "No production or shared-directory credentials in the report.", "BloodHound path output without direct edge validation fails proof.", "One path, one run, or missing remediation tests cannot pass."],
      pressureSlots: ["Repair automation after one account is disabled", "Validate an unseen ACL edge directly", "Tune a detection against a benign administrator fixture"],
      resources: [...common(8), { label: "Project brief", href: p(8, "eh", "brief.md"), description: "Supported lab sizes, path requirements, and defense.", kind: "brief" }, { label: "Public AD tests", href: p(8, "eh", "public-tests.json"), description: "Exact edge validation, stale-path, cleanup, patch, and detection assertions.", kind: "artifact" }, { label: "Provisioning checklist", href: p(8, "eh", "provisioning-checklist.md"), description: "Provider checks and fallback decision points.", kind: "template" }, { label: "Credential handling", href: p(8, "eh", "credential-handling.md"), description: "Redaction and disposal contract.", kind: "template" }],
    },
    {
      stage: "STAGE_9", slug: "stage-9", number: 5,
      title: "Full VAPT and Retest",
      duration: ADVANCED_STAGE_WINDOW_LABEL, difficulty: 5, revision: "No revision", defense: "Live defense",
      objective: "Compromise a custom web/API/infrastructure estate through a three-host chain, implement reliable verification code, and prove the patched release removes root causes without regressions.",
      setup: ["Supplied candidate-run estate source: web, API, and records services", "Dedicated local Docker network", "Signed rules of engagement and test window", "Clean vulnerable and patched releases"],
      mission: ["Map and test the assigned estate under the machine-readable rules of engagement, recording every request and target transition.", "Chain at least three distinct control failures across the web, API, and infrastructure hosts to retrieve exactly one synthetic crown-jewel record.", "Write deterministic verification tests for every accepted finding and a full-chain runner with rate, safety, and cleanup controls.", "Run the same tests against the patched release, identify regressions, and distinguish payload blocking from root-cause removal."],
      technicalChallenges: ["The estate contains authenticated and unauthenticated surfaces, multiple API roles, one scanner decoy, and variant-specific service/secret relationships.", "The chain runner must discover session and object identifiers at runtime and may not embed the crown-jewel value.", "The patched release changes controls across hosts and includes one intentional regression detectable only by the submitted suite."],
      verificationTests: ["The full chain succeeds three of three times from clean snapshots, retrieves one record only, and passes cleanup/scope assertions.", "Each finding test has a positive vulnerable-state result and the exact expected patched-state result; the intentional regression must be detected.", "Live defense reproduces a staff-selected finding and full-chain edge against clean snapshots using the submitted code."],
      proof: ["Private crown-jewel flag, three-host chain graph, and raw request/response or protocol evidence per edge.", "Machine-readable vulnerable/patched test results and cleanup logs.", "Live clean-state reproduction of two selected tests."],
      deliverables: ["engagement-suite/", "rules-of-engagement.pdf", "vapt-report.pdf", "executive-summary.pdf", "evidence/", "finding-tests/", "chain-runner/", "vulnerable-results.xml", "patched-results.xml", "retest-matrix.csv", "video-url.txt", "manifest.sha256"],
      gates: ["No revision.", "Out-of-scope access or bulk collection is automatic failure.", "Scanner output without a passing manual verification test is not a finding.", "Failure of three-run reliability or patched regression detection fails the project."],
      pressureSlots: ["Add an unseen API role to the authorization test matrix", "Repair one test after a response-schema change", "Prove a payload block leaves the root cause exploitable"],
      resources: [...common(9), { label: "Project brief", href: p(9, "eh", "brief.md"), description: "Estate scope, engagement phases, and proof limits.", kind: "brief" }, { label: "Public engagement tests", href: p(9, "eh", "public-tests.json"), description: "Exact authorization, runtime-ID, proof-limit, patch, and regression assertions.", kind: "artifact" }, { label: "Rules of engagement", href: p(9, "eh", "rules-of-engagement.md"), description: "Signed scope and stop conditions.", kind: "artifact" }, { label: "Retest matrix", href: p(9, "eh", "retest-matrix.csv"), description: "Root cause, original proof, changed control, and verdict.", kind: "template" }],
    },
  ],
  GRC: [
    {
      stage: "STAGE_5", slug: "stage-5", number: 1,
      title: "Policy as Code Under Constraint",
      duration: ADVANCED_STAGE_WINDOW_LABEL, difficulty: 4, revision: "One revision", defense: "Artifact check",
      objective: "Map and implement the variant's three assigned control outcomes in OPA/Rego, then prove policy, exception, and audit behavior against published and hidden infrastructure states.",
      setup: ["Assigned CloudScale Dynamics evidence pack", "OPA current stable release", "Python 3.11 and pytest", "NIST CSF 2.0 and authorized ISO/IEC 27001:2022 control index"],
      mission: ["Correct the planted framework mapping for the three variant-assigned control outcomes; do not substitute a different control.", "Write an enforceable policy addendum with owner, trigger, exception, expiry, evidence source, and test method for each assigned control.", "Implement an OPA/Rego policy bundle that evaluates the supplied identity, endpoint, storage, and logging state JSON and emits deterministic violations with control IDs.", "Build positive, negative, malformed-input, exception-expiry, and audit-log tests; generate the compliance report from engine output."],
      technicalChallenges: ["The three selected controls must share one versioned input schema and produce machine-readable decisions, not hard-coded asset names.", "Exceptions require owner, reason, approval, expiry, and compensating-control fields; expired or incomplete exceptions must fail closed.", "Policy results must reconcile exactly to the written control test and evidence index."],
      verificationTests: ["All 18 published fixtures and 12 hidden state fixtures must produce the exact expected allow/deny and violation codes.", "The bundle must reject malformed/missing security fields and pass a hidden asset set with different IDs and ordering.", "A mandatory artifact check adds one resource and one exception record; `opa test` and the generated report must update without policy-source edits."],
      proof: ["`opa test` output and coverage report for all three controls.", "Generated compliance JSON/CSV tied to input and bundle hashes.", "Exact control mapping from evidence gap to policy rule to test result."],
      deliverables: ["policy-bundle/", "tests/", "schemas/", "compliance-report.json", "policy-gap-report.pdf", "policy-addendum.pdf", "control-mapping.csv", "decision-log.md", "evidence-index.csv", "manifest.sha256"],
      gates: ["Invented framework identifiers or replacement of an assigned outcome fails mapping.", "More or fewer than the three assigned controls fails the board constraint.", "Failure of hidden policy fixtures or mandatory artifact check fails technical completion."],
      pressureSlots: ["Add a new resource type through the shared schema", "Implement an expiring emergency exception", "Repair a policy that passes an incomplete record"],
      resources: [...common(5), { label: "Project brief", href: p(5, "grc", "brief.md"), description: "Scenario, policy engine, board constraint, and scoring.", kind: "brief" }, { label: "Public policy fixtures", href: p(5, "grc", "public-fixtures.json"), description: "Eighteen exact control, resource, and violation-code cases.", kind: "artifact" }, { label: "Evidence pack", href: p(5, "grc", "evidence-pack.md"), description: "Policy, context, emails, screenshot record, and draft mapping.", kind: "artifact" }, { label: "Control-state fixture", href: p(5, "grc", "control-state.json"), description: "Versioned synthetic infrastructure state consumed by the policy bundle.", kind: "artifact" }, { label: "Control map", href: p(5, "grc", "control-mapping.csv"), description: "Gap, evidence, control, rationale, and test fields.", kind: "template" }],
    },
    {
      stage: "STAGE_6", slug: "stage-6", number: 2,
      title: "Verify the Vendor, Then Decide",
      duration: ADVANCED_STAGE_WINDOW_LABEL, difficulty: 4, revision: "One revision", defense: "Artifact check",
      objective: "Build an evidence-verification pipeline for a vendor's machine-readable exports, reconcile its output against SOC 2/SIG/DPA claims, and issue enforceable go/no-go conditions.",
      setup: ["Assigned PeopleFlow due-diligence pack", "Python 3.11 with JSON Schema and pytest", "Synthetic SSO, TLS, audit-log, deletion, backup, and subprocessor exports", "No contact with the fictional vendor"],
      mission: ["Define schemas and write validators for the supplied technical exports, including timestamps, scope, retention, privileged access, and integrity hashes.", "Implement checks that test questionnaire claims against technical evidence and output pass/fail/insufficient with exact locators.", "Construct a subprocessor/data-flow graph and calculate which datasets, roles, regions, and contractual requirements touch each node.", "Issue the commercial decision, contract redlines, conditions precedent, monitoring tests, and an executable quarterly verification command."],
      technicalChallenges: ["Exports contain stale records, duplicate audit events, one broken hash chain, inconsistent region labels, and one deletion job that reports success before completion.", "The pipeline must separate control failure from missing evidence and must never convert `insufficient` into pass.", "Monitoring conditions must map to a runnable check and a fail-closed commercial action."],
      verificationTests: ["All 20 published evidence fixtures and 10 hidden fixtures must produce exact result codes and locators.", "The graph must include every supplied subprocessor/data-class edge and pass cycle/orphan validation.", "A mandatory artifact check supplies a replacement export; the pipeline and decision memo must regenerate within 45 minutes without validator-source edits."],
      proof: ["Validator tests, schema coverage, and generated evidence-verdict report.", "Hash-chain failure and premature deletion success correctly detected.", "Every contract condition maps to an executable monitor and failure action."],
      deliverables: ["vendor-verifier/", "schemas/", "tests/", "evidence-verdicts.json", "data-flow.graphml", "vendor-risk-memo.pdf", "vendor-risk-register.csv", "contradiction-matrix.csv", "contract-redlines.md", "monitoring-plan.yaml", "manifest.sha256"],
      gates: ["Trusting questionnaire text over failing technical evidence fails the decision.", "A conditional approval without executable fail-closed monitoring cannot pass.", "Failure of hidden fixtures or mandatory replacement-export check fails technical completion."],
      pressureSlots: ["Add a new export schema version", "Verify a rotated audit-signing key", "Detect a subprocessor edge missing from the declared graph"],
      resources: [...common(6), { label: "Project brief", href: p(6, "grc", "brief.md"), description: "Technical verification and decision standard.", kind: "brief" }, { label: "Public verifier fixtures", href: p(6, "grc", "public-fixtures.json"), description: "Twenty exact status, code, and locator validation cases.", kind: "artifact" }, { label: "Due-diligence pack", href: p(6, "grc", "evidence-pack.md"), description: "Human-readable context and stakeholder messages.", kind: "artifact" }, { label: "Vendor claims", href: p(6, "grc", "vendor-claims.json"), description: "Typed SIG claims and evidence-presence fields.", kind: "artifact" }, { label: "Assurance and contract", href: p(6, "grc", "assurance-and-contract.json"), description: "Typed assurance exceptions, DPA requirements, and subprocessor records.", kind: "artifact" }, { label: "Vendor telemetry", href: p(6, "grc", "vendor-telemetry.json"), description: "Synthetic machine-readable control evidence for validator input.", kind: "artifact" }, { label: "Contradiction matrix", href: p(6, "grc", "contradiction-matrix.csv"), description: "Claim, contrary evidence, consequence, and disposition.", kind: "template" }],
    },
    {
      stage: "STAGE_7", slug: "stage-7", number: 3,
      title: "Automate an ISO 27001 Evidence Audit",
      duration: ADVANCED_STAGE_WINDOW_LABEL, difficulty: 5, revision: "One revision", defense: "Artifact check",
      objective: "Build a deterministic evidence collector/verifier, execute eighteen audit tests across twelve Annex A controls, select reproducible samples, and issue verdicts generated from traceable test results.",
      setup: ["Assigned Northstar Health evidence pack", "ISO/IEC 27001:2022 and ISO/IEC 27002:2022 references", "Audit sampling sheet", "No inference from screenshots without date, scope, and ownership"],
      mission: ["Write a collector that validates file hashes, timestamps, owners, scope, sample populations, and evidence age across CSV/JSON/ticket exports.", "Select access, training, vulnerability, backup, and change samples deterministically from the room marker so staff can reproduce them.", "Execute eighteen documented tests, emit machine-readable evidence grades/verdicts, and generate the audit test sheet from results.", "Retest prior findings against objective closure evidence and produce the final report/nonconformity register from the frozen result set."],
      technicalChallenges: ["The evidence set contains a broken hash, duplicate population members, timezone differences, a stale screenshot, and a ticket whose status conflicts with its event history.", "Sampling code must meet published sizes, be deterministic for the marker, and preserve excluded/duplicate records with reasons.", "Verdict generation must enforce that missing, stale, or failed required samples cannot become conforming."],
      verificationTests: ["The collector and sample engine must pass 24 published fixtures and 12 hidden evidence fixtures.", "Staff rerunning with the same marker must obtain identical sample IDs, verdict JSON, and evidence-index hashes.", "A mandatory holdout evidence pack must produce the exact expected nonconformity IDs and severity rules without code changes."],
      proof: ["Eighteen generated test records tied to exact evidence locators and procedure versions.", "Reproducible sample manifest and hash-verification report.", "Generated nonconformity register and prior-finding closure results."],
      deliverables: ["audit-engine/", "schemas/", "tests/", "sample-manifest.csv", "evidence-verdicts.json", "internal-audit-report.pdf", "audit-test-sheet.csv", "nonconformity-register.csv", "prior-findings-tracker.csv", "management-letter.pdf", "evidence-index.csv", "manifest.sha256"],
      gates: ["A missing or failed required sample cannot be called conforming.", "Manual sample substitution or non-reproducible verdicts fail audit integrity.", "ISO text may be referenced but not reproduced beyond licensed limits.", "Failure of the holdout evidence pack fails technical completion."],
      pressureSlots: ["Add a new ticket export adapter", "Repair deterministic sampling after duplicate IDs", "Validate a corrective-action hash chain"],
      resources: [...common(7), { label: "Project brief", href: p(7, "grc", "brief.md"), description: "Audit engine, scope, criteria, and classification rules.", kind: "brief" }, { label: "Public audit fixtures", href: p(7, "grc", "public-fixtures.json"), description: "Twenty-four exact condition, rule, sample, and verdict cases.", kind: "artifact" }, { label: "Audit evidence pack", href: p(7, "grc", "evidence-pack.md"), description: "SoA, policies, exports, tickets, interviews, and prior audit.", kind: "artifact" }, { label: "Audit populations", href: p(7, "grc", "audit-populations.csv"), description: "Synthetic access, training, vulnerability, backup, and change populations for deterministic sampling.", kind: "artifact" }, { label: "Severity rules", href: p(7, "grc", "severity-rules.yaml"), description: "Exact nonconformity classification algorithm and precedence.", kind: "artifact" }, { label: "Audit test sheet", href: p(7, "grc", "audit-test-sheet.csv"), description: "Criteria, procedure, sample, evidence, and verdict.", kind: "template" }],
    },
    {
      stage: "STAGE_8", slug: "stage-8", number: 4,
      title: "Hardening as Code and Quantified Risk",
      duration: ADVANCED_STAGE_WINDOW_LABEL, difficulty: 5, revision: "No revision", defense: "Recorded defense",
      objective: "Build an idempotent Ansible hardening role with rollback and service tests, prove its OpenSCAP/Lynis delta, and generate a tested quantitative treatment model.",
      setup: ["Fresh Debian 12 or Rocky Linux 9 VM", "Lynis current release", "OpenSCAP and SCAP Security Guide profile appropriate to the selected OS", "Provided known-good vulnerability scan export"],
      mission: ["Baseline the assigned host with pinned profiles and a machine-readable service acceptance suite.", "Implement at least eight scored remediations in an Ansible role with handlers, prechecks, rollback, and no manual configuration.", "Prove idempotence, rollback, and before/after scanner delta while keeping all service tests green.", "Write a risk-model program that consumes the supplied scan/assets, runs the published range/sensitivity calculations, and selects exactly three treatments under the variant budget."],
      technicalChallenges: ["The second Ansible run must report zero changes and the rollback play must restore the baseline service/config hashes.", "One scanner finding is a false positive and one remediation conflicts with the declared service until correctly parameterized.", "The risk model must separate asset criticality, control effectiveness, loss ranges, dependencies, and residual risk without embedding finding IDs."],
      verificationTests: ["A clean VM must pass baseline, apply, second-run-idempotence, service, rollback, and reapply stages unattended.", "At least eight expected scanner/test deltas occur with zero service regressions; the false positive is not remediated as a real defect.", "The risk program must match published calculations and a hidden budget/asset fixture; recorded defense implements and tests one staff-selected role change."],
      proof: ["Raw before/after scans, Ansible logs, config hashes, and service test XML.", "Zero-change second run and successful rollback/reapply transcript.", "Tested risk-model outputs and exactly three funded treatments."],
      deliverables: ["hardening-role/", "molecule-or-testinfra/", "rollback/", "before/", "after/", "service-results.xml", "idempotence.log", "risk-model/", "risk-register.csv", "investment-memo.pdf", "video-url.txt", "manifest.sha256"],
      gates: ["No revision.", "Manual hardening or a non-idempotent role cannot pass.", "Any failed service or rollback test fails technical completion.", "Do not claim CIS certification from automated scan output."],
      pressureSlots: ["Implement a hidden hardening control in the role", "Repair a supplied service regression", "Pass the risk model against a reduced-budget fixture"],
      resources: [...common(8), { label: "Project brief", href: p(8, "grc", "brief.md"), description: "Supported OS paths, evidence, and investment constraint.", kind: "brief" }, { label: "Public risk fixtures", href: p(8, "grc", "public-fixtures.json"), description: "Eight seeded budget and portfolio cases using the pinned model interface.", kind: "artifact" }, { label: "Vulnerability export", href: p(8, "grc", "vulnerability-scan.csv"), description: "Validated scan data with asset and finding identifiers.", kind: "artifact" }, { label: "Risk model contract", href: p(8, "grc", "risk-model-contract.md"), description: "Pinned simulation algorithm, seed, rounding, optimization, and tie-break rules.", kind: "brief" }, { label: "Risk register", href: p(8, "grc", "risk-register.csv"), description: "Inherent, quantified, treatment, residual, and acceptance fields.", kind: "template" }],
    },
    {
      stage: "STAGE_9", slug: "stage-9", number: 5,
      title: "Build a Breach Governance Engine",
      duration: ADVANCED_STAGE_WINDOW_LABEL, difficulty: 5, revision: "No revision", defense: "Live defense",
      objective: "Build and test a jurisdiction-aware breach engine that deduplicates affected people, evaluates fixed statutory triggers, computes every deadline, and generates regulator/subject work items from the assigned evidence.",
      setup: ["Assigned breach evidence pack and data inventory", "GDPR Articles 33 and 34", "Nigeria Data Protection Act 2023 section 40 and current NDPC guidance", "California Civil Code section 1798.82 as amended by SB 446 effective 1 January 2026"],
      mission: ["Parse and validate the evidence timeline/inventory, establish the controlling awareness event, and deduplicate people through overlap groups.", "Implement jurisdiction rules for GDPR Articles 33/34, Nigeria section 40, and California section 1798.82/SB 446 including the separate section 1798.82(f) AG clock.", "Emit exact trigger results, WAT/UTC deadlines, affected-person/record counts, owners, and machine-readable work items.", "Generate draft notices and board tables from engine output, then run the full suite against the V1-V6 and hidden fixtures."],
      technicalChallenges: ["The model must distinguish event occurrence, detection, confirmation/awareness, processor notice, consumer notice, and AG-sample clocks.", "Population logic must deduplicate overlap groups, exclude network-disproved datasets, and maintain confirmed/lower/upper counts.", "Jurisdiction rules, clocks, holidays/timezones where applicable, delay flags, and notice dependencies must be data/configuration rather than hard-coded case answers."],
      verificationTests: ["All published V1-V6 fixtures must match exact trigger, deadline, population, and work-item snapshots.", "Hidden fixtures change awareness time, encryption-key status, overlap groups, and California count; all snapshot tests must pass without source edits.", "Live defense runs two staff fixtures and traces one output from source row through rule ID to generated deadline/notice work item."],
      proof: ["Tested source code and snapshot outputs for every jurisdiction/variant.", "Reproducible population calculation with row-level inclusion/exclusion reasons.", "Deadline ledger and notices generated from the same frozen engine result."],
      deliverables: ["breach-engine/", "rules/", "schemas/", "tests/", "variant-snapshots/", "deadline-ledger.csv", "population-calculation.csv", "work-items.json", "regulator-notifications/", "subject-notice.md", "board-memo.pdf", "30-60-90-roadmap.csv", "video-url.txt", "manifest.sha256"],
      gates: ["No revision.", "California is not a generic CCPA 72-hour rule.", "Hard-coded case answers or failure of any jurisdiction snapshot fails technical completion.", "False precision outside the engine's confirmed/range model fails population integrity."],
      pressureSlots: ["Add a hidden awareness timestamp fixture", "Run the encryption-key-acquired rule set", "Pass a California threshold and AG-clock fixture"],
      resources: [...common(9), { label: "Project brief", href: p(9, "grc", "brief.md"), description: "Roles, trigger tests, outputs, and defense.", kind: "brief" }, { label: "Public jurisdiction snapshots", href: p(9, "grc", "public-fixtures.json"), description: "Exact V1-V6 trigger, deadline, threshold, and work-item inputs/outputs.", kind: "artifact" }, { label: "Breach evidence pack", href: p(9, "grc", "evidence-pack.md"), description: "Incident facts, geography, encryption, and data inventory.", kind: "artifact" }, { label: "Deadline ledger", href: p(9, "grc", "deadline-ledger.csv"), description: "Authority, trigger, clock, deadline, owner, and status.", kind: "template" }],
    },
  ],
};

export function getAdvancedProject(stage: string, track: string): AdvancedProject | null {
  if (!(track in ADVANCED_PROJECTS)) return null;
  return ADVANCED_PROJECTS[track as AdvancedTrack].find((project) => project.stage === stage) ?? null;
}

export function isAdvancedStage(stage: string): stage is keyof typeof ADVANCED_STAGE_META {
  return stage in ADVANCED_STAGE_META;
}

const ADVANCED_CONTINUITY: Record<AdvancedTrack, string[]> = {
  SOC_ANALYSIS: [
    "Create the normalized evidence model, provenance rules, and command-line interfaces that every later SOC project must reuse.",
    "Add the T-Pot replay adapter to the Stage 5 model; hand normalized sessions, clusters, and detections to the network range.",
    "Feed range telemetry through the existing evidence model; hand verified network behaviors and false-positive cases to detection engineering.",
    "Convert prior hunt and range behaviors into detection-as-code while retaining raw-to-alert provenance for the final incident case.",
    "Reuse the parsers, provenance model, hunts, and detections to solve the sealed case; document every incompatibility discovered.",
  ],
  ETHICAL_HACKING: [
    "Create the scope-safe discovery engine, runtime identifier model, evidence ledger, and cleanup behavior used by later engagements.",
    "Drive the assigned exploit chain from Stage 5 discovery output and hand reusable precondition, cleanup, and remediation checks forward.",
    "Apply the same runtime discovery and evidence ledger to IAM; hand the path graph and teardown discipline to the directory range.",
    "Extend the path graph to Active Directory and preserve reusable edge validation, cleanup, detection, and remediation records.",
    "Combine web, host, cloud, and identity methods into one bounded assessment and demonstrate that earlier automation transfers without embedded answers.",
  ],
  GRC: [
    "Create the typed control, evidence, exception, and decision model that later governance projects must consume.",
    "Use the Stage 5 evidence model to verify vendor claims and hand the resulting evidence graph and dispositions to audit.",
    "Audit the accumulated control and vendor evidence deterministically; hand tested findings and evidence grades to risk treatment.",
    "Connect audit findings to reproducible hardening outcomes and quantified treatment choices for use in breach governance.",
    "Use the same evidence, decision, ownership, exception, and deadline models to drive the final breach response and board record.",
  ],
};

export function advancedContinuity(track: AdvancedTrack, projectNumber: number): string {
  return ADVANCED_CONTINUITY[track][projectNumber - 1];
}

export function advancedTrackLabel(track: AdvancedTrack): string {
  if (track === "SOC_ANALYSIS") return "SOC Analyst";
  if (track === "ETHICAL_HACKING") return "Ethical Hacking / VAPT";
  return "GRC Analyst";
}
