import {
  requiredAdvancedDeliverables,
  type AdvancedProject,
  type AdvancedTrack,
} from "./advanced-stage";

export type AdvancedGlossaryEntry = {
  term: string;
  meaning: string;
};

export type AdvancedRubricCriterion = {
  label: string;
  weight: number;
};

export type AdvancedEnvironmentPlan = {
  hardware: string;
  cost: string;
  fallback: string;
};

type GuidanceSeed = {
  prerequisites: string[];
  glossary: AdvancedGlossaryEntry[];
  rubric: AdvancedRubricCriterion[];
  environment: AdvancedEnvironmentPlan;
};

export type AdvancedLearnerGuidance = GuidanceSeed & {
  startHere: string[];
  summary: {
    build: string;
    prove: string;
    submit: string;
  };
  passRequirements: string[];
  revisionRule: string;
  automaticFailureRules: string[];
  supportRules: string[];
};

type ProjectNumber = AdvancedProject["number"];

const GUIDANCE: Record<AdvancedTrack, Record<ProjectNumber, GuidanceSeed>> = {
  SOC_ANALYSIS: {
    1: {
      prerequisites: [
        "Write and test a Python command-line application with pytest.",
        "Query structured data with SQL and explain joins, types, nulls, and indexes.",
        "Recognize common authentication, DNS, web, firewall, and endpoint log fields.",
      ],
      glossary: [
        { term: "Schema drift", meaning: "A source changes field names, types, nesting, or meaning between versions." },
        { term: "Quarantine", meaning: "A separate, reason-coded path for rows that cannot safely enter the normalized model." },
        { term: "Source reconciliation", meaning: "Accounting for every source row as accepted, duplicated, or rejected without silent loss." },
      ],
      rubric: [
        { label: "Pipeline and data quality", weight: 20 },
        { label: "Campaign accuracy", weight: 30 },
        { label: "Evidence and correlation", weight: 25 },
        { label: "False-positive restraint", weight: 15 },
        { label: "Communication and reproducibility", weight: 10 },
      ],
      environment: {
        hardware: "4 vCPU and 8 GB RAM baseline; keep at least 2 GB disk free. The compressed shared base artifact is capped at 100 MB.",
        cost: "No cloud service or paid tool is required. DuckDB, Python, and the public fixtures run locally.",
        fallback: "Use the public shard to validate adapters while developing. The shared base pack and your private discrepancy set control the final assessment.",
      },
    },
    2: {
      prerequisites: [
        "Administer a Linux VM, Docker services, firewall rules, and restricted SSH access.",
        "Build a Python parser that validates and emits structured JSON or Parquet data.",
        "Handle hostile files safely using hashes and metadata without executing payloads.",
      ],
      glossary: [
        { term: "Management plane", meaning: "Administrative services used to operate the sensor, kept separate from exposed collection services." },
        { term: "Sessionization", meaning: "Grouping related, possibly reordered events into one protocol or actor session." },
        { term: "STIX 2.1", meaning: "A structured format for exchanging cyber-threat objects and their relationships." },
      ],
      rubric: [
        { label: "Isolation", weight: 25 },
        { label: "Deployment and reliability", weight: 15 },
        { label: "Evidence handling", weight: 15 },
        { label: "Analysis", weight: 30 },
        { label: "Communication", weight: 15 },
      ],
      environment: {
        hardware: "Sensor minimum: 8 GB RAM and 128 GB disk. Full hive guidance: 16 GB RAM and 256 GB disk, on a fresh supported Linux VM.",
        cost: "A programme-authorized public address or VM is required. Do not purchase or expose infrastructure until its ownership and cost responsibility are confirmed.",
        fallback: "The sealed replay protects assessment quality when live traffic is quiet. It does not waive isolation or deployment proof; stop and escalate if a safe public sensor cannot be provisioned.",
      },
    },
    3: {
      prerequisites: [
        "Configure Linux routing, nftables, Docker networks, and basic FRRouting.",
        "Explain stateful segmentation, NAT, DNS/NTP dependencies, and return paths.",
        "Write positive and negative infrastructure assertions with pytest or testinfra.",
      ],
      glossary: [
        { term: "East-west traffic", meaning: "Traffic moving between internal zones rather than entering from or leaving to an external network." },
        { term: "Stateful policy", meaning: "Filtering that understands connection state and permits valid return traffic without opening new sessions." },
        { term: "Asymmetric return", meaning: "A reply follows a different path, often breaking state tracking or observability." },
      ],
      rubric: [
        { label: "Requirements and architecture", weight: 20 },
        { label: "Correct implementation", weight: 25 },
        { label: "Positive and negative testing", weight: 25 },
        { label: "Observability", weight: 15 },
        { label: "Evidence and trade-off defense", weight: 15 },
      ],
      environment: {
        hardware: "A Linux host capable of Docker/containerlab plus storage for container images, logs, and packet captures. Run the supplied preflight before the window.",
        cost: "No paid cloud environment is required; the supported path is a local or programme-issued Linux host.",
        fallback: "There is no approved diagram-only or Packet Tracer substitute. If containerlab or virtualization preflight fails, preserve the output and request an approved host before building.",
      },
    },
    4: {
      prerequisites: [
        "Operate a single-node Wazuh deployment and validate agent telemetry.",
        "Read Windows Event Logs and Sysmon process, network, and registry events.",
        "Translate behavior into testable detection logic without matching case identifiers.",
      ],
      glossary: [
        { term: "Canonical procedure", meaning: "The documented baseline execution of an ATT&CK behavior used to establish expected telemetry." },
        { term: "Benign lookalike", meaning: "Legitimate activity that resembles an attack and must not create an alert." },
        { term: "Mutation", meaning: "A controlled change to a command, field, or binary name used to test detection generalization." },
      ],
      rubric: [
        { label: "Lab reliability", weight: 15 },
        { label: "Telemetry validation", weight: 15 },
        { label: "Detection logic", weight: 25 },
        { label: "Adversary and benign testing", weight: 25 },
        { label: "Coverage and blind spots", weight: 10 },
        { label: "Recorded defense", weight: 10 },
      ],
      environment: {
        hardware: "16 GB RAM minimum and 24 GB recommended for Wazuh, a Windows 11 evaluation VM, Sysmon, and the isolated test host.",
        cost: "The supported tools and evaluation VM are free. Do not run tests on employer, personal-production, or paid infrastructure.",
        fallback: "If the clean lab cannot sustain the pinned stack, stop before executing tests and request a programme-approved environment; silently dropping telemetry or procedures is not a fallback.",
      },
    },
    5: {
      prerequisites: [
        "Preserve evidence hashes, time zones, and read-only source handling.",
        "Build parser-driven timelines from host, network, identity, and email evidence.",
        "Form and test competing incident hypotheses using exact source locators.",
      ],
      glossary: [
        { term: "Super-timeline", meaning: "A normalized, ordered view of events from several evidence sources with provenance retained." },
        { term: "Controlling clock", meaning: "The source time and offset used to reconcile an event across systems." },
        { term: "Impact boundary", meaning: "The evidence-supported limit of affected hosts, identities, records, and actions." },
      ],
      rubric: [
        { label: "Evidence integrity", weight: 10 },
        { label: "Multi-source reconstruction", weight: 30 },
        { label: "Recovered data and impact boundary", weight: 20 },
        { label: "Hypothesis quality", weight: 10 },
        { label: "Response plan and detections", weight: 15 },
        { label: "Executive communication", weight: 5 },
        { label: "Live defense", weight: 10 },
      ],
      environment: {
        hardware: "16 GB RAM and 40 GB free disk recommended for the sealed package, read-only copies, recovered content, indexes, and derived exports.",
        cost: "No cloud or commercial forensic suite is required; the supported toolchain is local and open source.",
        fallback: "A parser may be replaced with another documented tool if provenance is preserved. The assigned evidence may never be replaced, repaired, or silently converted when a source fails to parse.",
      },
    },
  },
  ETHICAL_HACKING: {
    1: {
      prerequisites: [
        "Explain DNS, HTTP, TLS/SNI, TCP ports, CIDR scope, and virtual hosting.",
        "Build tested Python CLI adapters with timeouts, retries, rate limits, and safe failure.",
        "Distinguish discovery from exploitation and enforce scope before every request.",
      ],
      glossary: [
        { term: "Wildcard DNS", meaning: "DNS behavior that returns an address for many nonexistent names and can create false discoveries." },
        { term: "Virtual host", meaning: "A service selected by hostname on a shared address, often invisible to address-only scans." },
        { term: "Request ledger", meaning: "A machine-readable record proving where, when, and why every network request was sent." },
      ],
      rubric: [
        { label: "Scope and safety", weight: 20 },
        { label: "Engine design and tests", weight: 25 },
        { label: "Discovery completeness", weight: 20 },
        { label: "Foothold proof", weight: 20 },
        { label: "Evidence and reporting", weight: 15 },
      ],
      environment: {
        hardware: "Any laptop that can run Python 3.11 or newer and retain raw tool output. The supplied target uses only the Python standard library and binds to 127.0.0.1.",
        cost: "No VPN, cloud account, container runtime, public scanning service, package installation, or paid subscription is required.",
        fallback: "The engine must include a standard-library discovery path and continue when an optional external adapter is removed. A failed local target must be restarted from the unchanged shared pack, never replaced with a public target.",
      },
    },
    2: {
      prerequisites: [
        "Enumerate Linux services, files, permissions, processes, and privilege boundaries.",
        "Write Python or Go code with explicit protocol handling and bounded failure.",
        "Operate VM snapshots and distinguish symptom mitigation from root-cause remediation.",
      ],
      glossary: [
        { term: "Precondition", meaning: "A state that must be true before an exploit step can work safely and predictably." },
        { term: "Idempotent cleanup", meaning: "Cleanup that can run repeatedly and still leaves the target in the same intended state." },
        { term: "Negative retest", meaning: "Running the original exploit after remediation to prove the vulnerable behavior no longer succeeds." },
      ],
      rubric: [
        { label: "Scope and safety", weight: 15 },
        { label: "Enumeration and path selection", weight: 20 },
        { label: "Foothold", weight: 15 },
        { label: "Privilege escalation", weight: 20 },
        { label: "Exploit-chain quality", weight: 20 },
        { label: "Finding and remediation quality", weight: 10 },
      ],
      environment: {
        hardware: "A Kali attacker and the assigned offline target VM on a host-only network, with a clean target snapshot before every reliability run.",
        cost: "No cloud target, internet scanning, or paid exploit framework is required.",
        fallback: "Revert to the verified clean snapshot after a failed run. Only staff may reissue or change the assigned VM variant; a public walkthrough box is never an approved substitute.",
      },
    },
    3: {
      prerequisites: [
        "Explain AWS identities, policies, trust relationships, role assumption, boundaries, and effective permissions.",
        "Use AWS CLI, Terraform, JSON, and CloudTrail in an isolated lab account.",
        "Operate budgets, MFA, teardown, and residual-resource checks before testing attack paths.",
      ],
      glossary: [
        { term: "Effective permissions", meaning: "The final allowed actions after identity policy, resource policy, boundary, session, and denial logic are combined." },
        { term: "Trust policy", meaning: "The role policy that defines which principals may assume that role and under what conditions." },
        { term: "Residual baseline", meaning: "The expected empty or approved resource state after the range is destroyed." },
      ],
      rubric: [
        { label: "Account and cost safety", weight: 20 },
        { label: "Enumeration", weight: 20 },
        { label: "Attack-path reasoning", weight: 25 },
        { label: "CloudTrail evidence", weight: 15 },
        { label: "Remediation", weight: 10 },
        { label: "Teardown and residual checks", weight: 10 },
      ],
      environment: {
        hardware: "Linux or macOS with Python 3.11+, Terraform 1.5+, AWS CLI, and jq; use a dedicated AWS lab account with root MFA.",
        cost: "Hard ceiling: USD 5 monthly budget, alerts at USD 3 and USD 4, and a deny action or equivalent at USD 4.",
        fallback: "If provisioning, region compatibility, budget enforcement, or teardown fails, stop and preserve logs. Do not change region, raise the budget, or leave resources running without written programme approval.",
      },
    },
    4: {
      prerequisites: [
        "Understand Active Directory authentication, groups, ACLs, delegation, Kerberos, and common privilege edges.",
        "Provision and snapshot an isolated vulnerable-AD range and verify host health.",
        "Use BloodHound, Impacket, NetExec, and credential material without exposing secrets.",
      ],
      glossary: [
        { term: "Attack-path edge", meaning: "A validated relationship showing how one principal or host can influence another." },
        { term: "Runtime resolution", meaning: "Discovering current identifiers and principals during execution rather than embedding assigned values." },
        { term: "GOAD-Light", meaning: "The supported smaller Game of Active Directory range used as the scored hardware baseline." },
      ],
      rubric: [
        { label: "Provisioning and health", weight: 15 },
        { label: "Scope and credential handling", weight: 15 },
        { label: "Enumeration", weight: 20 },
        { label: "Validated attack path", weight: 25 },
        { label: "Report and remediation", weight: 15 },
        { label: "Recorded defense", weight: 10 },
      ],
      environment: {
        hardware: "GOAD-Light baseline: 32 GB RAM, 4+ CPU cores with virtualization, and 110 GB free SSD recommended.",
        cost: "No paid directory or cloud service is required. Do not expand to full GOAD unless it is separately issued as a pressure task.",
        fallback: "Use the programme-hosted fallback range when the documented preflight fails. Record the failure first; do not silently remove hosts, memory, or scored paths to fit weaker hardware.",
      },
    },
    5: {
      prerequisites: [
        "Plan a bounded web, API, host, and infrastructure assessment from signed rules of engagement.",
        "Validate exploitability with minimal proof and preserve an evidence chain for every finding.",
        "Write root-cause remediation and execute clean-snapshot retests without persistence.",
      ],
      glossary: [
        { term: "Proof limit", meaning: "The smallest authorized action and data volume needed to demonstrate impact safely." },
        { term: "Chained impact", meaning: "A sequence of individually bounded findings whose combined effect is materially greater." },
        { term: "Retest matrix", meaning: "A structured record linking each finding to its patch, original proof, expected denial, and regression result." },
      ],
      rubric: [
        { label: "Scope and professional conduct", weight: 15 },
        { label: "Methodology and coverage", weight: 15 },
        { label: "Validated findings", weight: 20 },
        { label: "Chained impact", weight: 20 },
        { label: "Remediation and retest", weight: 15 },
        { label: "Report quality", weight: 5 },
        { label: "Live defense", weight: 10 },
      ],
      environment: {
        hardware: "The assigned synthetic estate, a dedicated host-only network, signed rules of engagement, and clean original/patched snapshots.",
        cost: "No public target or paid scanner is required. Only the assigned estate is authorized.",
        fallback: "Restore the supplied clean snapshot when state is uncertain. If scope, credentials, or the patched image are inconsistent, stop and request staff disposition rather than repairing the estate yourself.",
      },
    },
  },
  GRC: {
    1: {
      prerequisites: [
        "Separate policy, implementation, process, and evidence gaps.",
        "Write and test basic Python plus OPA/Rego rules against structured inputs.",
        "Use NIST CSF and only ISO/IEC references you are licensed or authorized to access.",
      ],
      glossary: [
        { term: "Control outcome", meaning: "The security result a control must achieve, independent of one specific implementation." },
        { term: "Policy as code", meaning: "Machine-executable rules that evaluate structured facts and return consistent decisions." },
        { term: "Compensating control", meaning: "A different safeguard that reduces the same risk when the primary control is not feasible." },
      ],
      rubric: [
        { label: "Gap accuracy", weight: 25 },
        { label: "Control mapping", weight: 20 },
        { label: "Evidence judgment", weight: 20 },
        { label: "Three-control decision", weight: 20 },
        { label: "Enforceable drafting", weight: 15 },
      ],
      environment: {
        hardware: "Any current laptop capable of Python 3.11, pytest, and OPA; no virtual lab is required.",
        cost: "OPA, Python, NIST CSF, and the supplied synthetic evidence are free. Use ISO/IEC material only through an authorized copy.",
        fallback: "If an authorized standard reference is unavailable, stop and escalate before mapping. Do not reproduce protected text or substitute an unofficial summary as controlling criteria.",
      },
    },
    2: {
      prerequisites: [
        "Perform evidence-led vendor due diligence and distinguish claims from verified operation.",
        "Validate JSON and tabular exports with Python, JSON Schema, and pytest.",
        "Write risk conditions with owners, deadlines, closure evidence, and consequences.",
      ],
      glossary: [
        { term: "Contradiction matrix", meaning: "A structured comparison of a claim against supporting, conflicting, missing, and superseding evidence." },
        { term: "Conditional approval", meaning: "A decision to proceed only while explicit risk conditions, owners, and deadlines remain enforceable." },
        { term: "Residual risk", meaning: "Risk that remains after all agreed conditions and controls are implemented." },
      ],
      rubric: [
        { label: "Contradiction detection", weight: 25 },
        { label: "Exception and evidence judgment", weight: 20 },
        { label: "Risk analysis", weight: 20 },
        { label: "Decision and conditions", weight: 20 },
        { label: "Redlines and communication", weight: 15 },
      ],
      environment: {
        hardware: "Any current laptop capable of Python 3.11, JSON Schema validation, and the supplied synthetic exports.",
        cost: "No vendor contact, commercial portal, or paid assurance platform is required.",
        fallback: "If an export is missing, corrupt, or contradicts its signed manifest, preserve it and request a staff reissue. Missing evidence must remain missing—not be inferred as conforming.",
      },
    },
    3: {
      prerequisites: [
        "Plan an ISO 27001:2022 internal audit using authorized criteria and defined scope.",
        "Select deterministic samples and distinguish design, implementation, and operating effectiveness.",
        "Write supported findings, nonconformities, and management communication from exact evidence locators.",
      ],
      glossary: [
        { term: "Audit population", meaning: "The complete set of items from which a documented sample is selected." },
        { term: "Operating effectiveness", meaning: "Evidence that a control worked consistently during the period, not merely that it was designed." },
        { term: "Nonconformity", meaning: "A supported failure to meet an applicable audit criterion, classified using the supplied rules." },
      ],
      rubric: [
        { label: "Audit planning and sampling", weight: 15 },
        { label: "Evidence quality", weight: 20 },
        { label: "Control testing and verdicts", weight: 30 },
        { label: "Prior-finding verification", weight: 15 },
        { label: "Nonconformity quality", weight: 10 },
        { label: "Management communication", weight: 10 },
      ],
      environment: {
        hardware: "Any current laptop with spreadsheet and scripting support; all audit populations and evidence are synthetic files.",
        cost: "No production audit platform is required. ISO/IEC references must come from an authorized copy or programme-provided access.",
        fallback: "If the criteria are unavailable or evidence lineage fails, mark the test not tested and escalate. Do not invent criteria, evidence, or a clean verdict to complete the sheet.",
      },
    },
    4: {
      prerequisites: [
        "Administer a Debian or Rocky Linux VM and automate change with Ansible.",
        "Interpret Lynis/OpenSCAP findings and verify services before and after remediation.",
        "Implement and test a quantitative risk model with explicit ranges, sensitivity, and tie-break rules.",
      ],
      glossary: [
        { term: "Idempotence", meaning: "A second automation run makes no unintended changes because the desired state already exists." },
        { term: "Scanner delta", meaning: "The explained difference between comparable before-and-after security scan results." },
        { term: "Residual annual loss", meaning: "The modeled loss remaining after a treatment changes likelihood or impact." },
      ],
      rubric: [
        { label: "Baseline integrity", weight: 15 },
        { label: "Remediation and service safety", weight: 25 },
        { label: "Measurable delta", weight: 15 },
        { label: "Risk analysis", weight: 25 },
        { label: "Investment and deferral judgment", weight: 10 },
        { label: "Recorded defense", weight: 10 },
      ],
      environment: {
        hardware: "One fresh assigned Debian 12 or Rocky Linux 9 VM with snapshot/rollback support and room for before/after scanner exports.",
        cost: "Ansible, Lynis, OpenSCAP, and the supplied risk data require no paid cloud or scanning license.",
        fallback: "Use only the OS path in the private assignment. If its scanner profile, package source, or rollback preflight fails, preserve the output and request disposition rather than switching OS or profile.",
      },
    },
    5: {
      prerequisites: [
        "Distinguish regulator, subject, customer-contract, and internal breach obligations.",
        "Read authoritative legal sources while recording version, effective date, assumptions, and uncertainty.",
        "Implement deterministic date, timezone, deduplication, and rules-engine tests in Python.",
      ],
      glossary: [
        { term: "Awareness event", meaning: "The controlling fact and time from which a statutory notification clock may begin." },
        { term: "Trigger decision", meaning: "A reasoned determination that a specific notification or communication duty does or does not apply." },
        { term: "Population deduplication", meaning: "Counting each affected person once across overlapping datasets while retaining source lineage." },
      ],
      rubric: [
        { label: "Fact and role analysis", weight: 15 },
        { label: "Trigger decisions", weight: 20 },
        { label: "Exact deadline computation", weight: 20 },
        { label: "Population calculation", weight: 15 },
        { label: "Notifications", weight: 10 },
        { label: "Board and roadmap judgment", weight: 10 },
        { label: "Live defense", weight: 10 },
      ],
      environment: {
        hardware: "Any current laptop capable of Python tests and the supplied synthetic evidence, inventory, and jurisdiction snapshots.",
        cost: "The cited official sources and supplied synthetic materials require no paid legal-research platform; this assessment is not legal advice.",
        fallback: "When authorities conflict, a source version is unavailable, or an edge case is not specified, record the uncertainty and escalate. Never silently invent a legal rule or deadline convention.",
      },
    },
  },
};

export function advancedLearnerGuidance(
  track: AdvancedTrack,
  project: AdvancedProject
): AdvancedLearnerGuidance {
  const seed = GUIDANCE[track][project.number];
  const deliverables = requiredAdvancedDeliverables(project);
  const revisionRule = project.revision === "One revision"
    ? "One revised submission may be accepted while the stage window remains open. Staff feedback defines the allowed correction; a revision does not reset the clock or repair a safety or integrity failure."
    : "Your first submitted package is final. Use the readiness checklist before submitting; post-submission replacement is not available for this project.";

  return {
    ...seed,
    startHere: [
      "Read the Project brief first, then the Submission contract and Technical assessment contract. Write down the scope boundary and every fail gate.",
      "Download your private assignment overlay and evidence pack. Confirm the filename, participant binding, manifest signature, and SHA-256 before extraction or analysis.",
      "Run the environment preflight and save its output. Do not begin scored work with an unsupported machine, missing license, unsafe network, or unapproved cost.",
      "Create the exact submission-root structure, copy the supplied templates, add your evidence marker, and make the first clean version-control commit.",
      "Run one public fixture through the smallest end-to-end path. Save the machine-readable test report before processing the full case.",
    ],
    summary: {
      build: `A working, tested version of “${project.title}” that processes the assigned inputs without manual answer editing.`,
      prove: `The published tests, hidden transfer fixture, and clean-state rebuild pass, with every central claim linked to raw evidence.`,
      submit: `${deliverables.length} exact named outputs in one view-only, hash-verified package, including the assessment manifest and continuity record.`,
    },
    passRequirements: [
      "Earn at least 70 points out of 100.",
      "Submit a runnable implementation that reproduces the scored outputs from a clean supported environment; otherwise the score is capped at 49.",
      "Pass the published acceptance suite; failure caps the score at 59.",
      "Pass the hidden transfer fixture using the published interface; failure caps the score at 69 and therefore below pass.",
      "Keep every safety, scope, authorship, and evidence-integrity gate. An automatic fail overrides the numeric score.",
    ],
    revisionRule,
    automaticFailureRules: [
      "Unsafe or out-of-scope execution, including testing an unassigned system or exposing an unsafe lab.",
      "Fabricated, altered, borrowed, or untraceable evidence; hidden assistance or another participant's work.",
      "Hard-coded private answers or deliberate concealment of variant identifiers, flags, verdicts, or expected counts.",
      ...project.gates,
    ],
    supportRules: [
      "Before starting: report missing access, insufficient hardware, licensing, unsafe network, or unapproved cost through the official programme support channel shown on your dashboard.",
      "Stop immediately for a hash/signature mismatch, uncertain scope, unexpected live system, credential exposure, malware execution risk, or uncontrolled cloud cost.",
      "Preserve the current state and send the UTC time, stage, environment, exact error, and sanitized logs. Never attach secrets or another participant's pack.",
      "Continue only after written programme disposition when the issue affects scope, safety, assignment identity, evidence integrity, or the controlling brief.",
    ],
  };
}
