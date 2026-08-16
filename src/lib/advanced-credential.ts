/**
 * Credential vocabulary for the advanced programme (Stages 5-9).
 *
 * The core stages (0-4) end in "Cyber Core Associate". The advanced stages
 * each confer their own named standing on top of that, qualified by track.
 *
 * Everything here is resolved per (stage, track) rather than per stage. The
 * three tracks do genuinely different projects — a Stage 6 SOC intern builds a
 * deception sensor pipeline while a Stage 6 GRC intern runs a vendor evidence
 * verification — so a document that only swapped the track's name would be
 * describing work the holder never did. `project` is the real brief title from
 * ADVANCED_PROJECTS; the prose is written against that brief.
 *
 * This module is the single source for what a stage is called, what standing
 * it confers, and what the holder actually proved, so the certificate, letter
 * of achievement, close letter, reference letter and performance record can
 * never drift from each other.
 */
import type { AdvancedTrack } from "./advanced-stage";

export type AdvancedStageKey = "STAGE_5" | "STAGE_6" | "STAGE_7" | "STAGE_8" | "STAGE_9";

export function isAdvancedStage(stage: string): stage is AdvancedStageKey {
  return stage === "STAGE_5" || stage === "STAGE_6" || stage === "STAGE_7"
    || stage === "STAGE_8" || stage === "STAGE_9";
}

export const TRACK_LABEL: Record<AdvancedTrack, string> = {
  SOC_ANALYSIS: "SOC Analysis",
  ETHICAL_HACKING: "Ethical Hacking",
  GRC: "Governance, Risk & Compliance",
};

/** Short form for tight spaces — seals, badges, running heads. */
export const TRACK_SHORT: Record<AdvancedTrack, string> = {
  SOC_ANALYSIS: "SOC",
  ETHICAL_HACKING: "OFFSEC",
  GRC: "GRC",
};

/**
 * What the track as a whole demands, for documents that summarise a career
 * through the programme rather than a single project.
 */
export const TRACK_PROFILE: Record<AdvancedTrack, { discipline: string; summary: string }> = {
  SOC_ANALYSIS: {
    discipline: "detection engineering and incident reconstruction",
    summary:
      "building tested pipelines over hostile-quality telemetry, standing up sensors and " +
      "network ranges as code, writing detections that survive attacker variation, and " +
      "reconstructing multi-host incidents from primary evidence",
  },
  ETHICAL_HACKING: {
    discipline: "offensive security and remediation proof",
    summary:
      "building scope-safe discovery and exploitation tooling, proving exploit chains " +
      "reliably from clean state, modelling attack paths across cloud identity and Active " +
      "Directory, and retesting that patches removed the root cause rather than the payload",
  },
  GRC: {
    discipline: "testable governance and quantified risk",
    summary:
      "turning control requirements into enforceable policy as code, verifying vendor and " +
      "audit claims against technical evidence, quantifying treatment decisions, and " +
      "building jurisdiction-aware regulatory decision logic",
  },
};

export type TrackCredential = {
  /** The real project brief title the intern worked. */
  project: string;
  /** What the holder demonstrated — printed on the certificate face. */
  competencies: string[];
  /** Second person, for the letters written to the intern. */
  narrative: string;
  /** Third person, for the employer-facing reference letter. */
  attestation: string;
};

export type AdvancedCredential = {
  /** Project number within the advanced programme, 1-5. */
  number: 1 | 2 | 3 | 4 | 5;
  /** The stage's own name, e.g. "Exposure". */
  name: string;
  /** Full title used on the certificate face. */
  title: string;
  /** The standing conferred, before the track qualifier. */
  standing: string;
  /** What completing this stage means, track-independent. */
  premise: string;
  /** Why this project matters to an employer. Printed in the dossier. */
  matters: string;
  tracks: Record<AdvancedTrack, TrackCredential>;
};

export const ADVANCED_CREDENTIALS: Record<AdvancedStageKey, AdvancedCredential> = {
  // ── Project 1 — Signal ────────────────────────────────
  STAGE_5: {
    number: 1, name: "Signal", title: "Advanced Stage 5 — Signal",
    standing: "Signal Practitioner",
    matters:
      "Most junior candidates can run a tool. Far fewer can build the pipeline that makes a tool's output trustworthy — handling malformed data, clock skew and duplicate identities without quietly corrupting the result. This project is where that separation happens.",
    premise: "establishing a defensible evidence baseline in their chosen discipline",
    tracks: {
      SOC_ANALYSIS: {
        project: "Build a Production Hunt Engine",
        competencies: [
          "Streaming ingestion & typed normalisation",
          "Schema-drift quarantine with reason codes",
          "Clock-offset inference & correction",
          "Identity and host alias resolution",
          "Reusable hunts with no hard-coded case data",
          "Benchmarked query plans & memory profile",
        ],
        narrative:
          "you engineered a hunt pipeline over a deliberately hostile evidence pack — schema " +
          "drift, duplicate rows, invalid timestamps, clock offsets and aliased identities — " +
          "and correlated auth, web, DNS, firewall and endpoint events into campaign graphs " +
          "without once editing a raw file or hard-coding a case value",
        attestation:
          "engineered a tested detection pipeline over hostile-quality security data, handling " +
          "schema drift, malformed-row quarantine, clock-offset correction and identity " +
          "resolution, and wrote reusable hunt logic that carried no case-specific constants",
      },
      ETHICAL_HACKING: {
        project: "Build a Recon Engine and Earn the Foothold",
        competencies: [
          "Scope enforcement before every network call",
          "DNS wildcard & virtual-host baselining",
          "Bounded concurrency, retries & rate limits",
          "Resumable state without duplicate probing",
          "Multi-format adapters to one versioned schema",
          "Foothold obtained and stopped at proof",
        ],
        narrative:
          "you built a resumable, scope-safe reconnaissance platform that enforced CIDR and " +
          "port scope before every single network call — the out-of-scope decoy drew zero " +
          "packets — then used your own tooling to find a hidden service chain and take the " +
          "foothold, and stopped exactly where the brief said to stop",
        attestation:
          "engineered a resumable reconnaissance platform with scope enforcement applied before " +
          "every network call, wildcard-DNS baselining and deterministic deduplication, then " +
          "used its output to obtain a foothold and halted at the agreed proof rather than " +
          "escalating further",
      },
      GRC: {
        project: "Policy as Code Under Constraint",
        competencies: [
          "Control-outcome mapping corrected at source",
          "Enforceable policy addenda with test methods",
          "OPA/Rego bundles over versioned input schema",
          "Fail-closed exception and expiry handling",
          "Malformed-input and audit-log test coverage",
          "Reports generated from engine output",
        ],
        narrative:
          "you corrected a planted framework mapping rather than quietly substituting an easier " +
          "control, then implemented your assigned control outcomes as an OPA/Rego bundle that " +
          "emits deterministic, machine-readable violations — with expired or incomplete " +
          "exceptions failing closed, which is the part most people get wrong",
        attestation:
          "implemented assigned control outcomes as executable policy in OPA/Rego over a " +
          "versioned input schema, built fail-closed exception handling with owner, approval " +
          "and expiry semantics, and generated compliance reporting from engine output rather " +
          "than by hand",
      },
    },
  },

  // ── Project 2 — Exposure ──────────────────────────────
  STAGE_6: {
    number: 2, name: "Exposure", title: "Advanced Stage 6 — Exposure",
    standing: "Exposure Operator",
    matters:
      "Operating something real is a different skill from analysing something static. This project puts the candidate in charge of a live system, where the consequences of a wrong prioritisation call are theirs to carry rather than a marker's to note.",
    premise: "operating a real system and owning the consequences of their decisions",
    tracks: {
      SOC_ANALYSIS: {
        project: "Engineer a Deception Sensor and Analysis Pipeline",
        competencies: [
          "Sensor boundary controls, failing closed",
          "Sessionisation across reorder & reconnect",
          "Infrastructure and credential clustering",
          "STIX 2.1, Sigma & Suricata content output",
          "Hash-and-metadata payload quarantine",
          "Stable output independent of capture volume",
        ],
        narrative:
          "you stood up and verified a sensor boundary where every RFC1918 and metadata egress " +
          "test had to fail closed, built a pipeline that sessionises reordered and reconnecting " +
          "traffic into clustered infrastructure and credential intelligence, and quarantined " +
          "every captured binary by hash and metadata without ever executing one",
        attestation:
          "built and verified a deception sensor with fail-closed egress controls, then engineered " +
          "an analysis pipeline that sessionises hostile traffic, clusters attacker " +
          "infrastructure and credentials, and emits STIX 2.1 and Sigma or Suricata detection " +
          "content with stable output independent of collection volume",
      },
      ETHICAL_HACKING: {
        project: "Root the Box: Exploit Chain as Code",
        competencies: [
          "Foothold-to-root chain without Metasploit",
          "Preconditions derived from raw evidence",
          "Runtime discovery over embedded values",
          "Reliability measured across clean snapshots",
          "Root-cause patching, not payload blocking",
          "Idempotent cleanup of every artefact",
        ],
        narrative:
          "you wrote a reliable foothold-to-root chain by hand rather than reaching for " +
          "Metasploit, discovered dynamic target values at runtime instead of embedding one " +
          "run's addresses, ran it five times from clean snapshots to prove it actually works, " +
          "then patched both root causes and re-ran your own exploit as a negative test",
        attestation:
          "authored a reliable multi-stage exploit chain without framework tooling, spanning at " +
          "least two distinct vulnerability classes and correctly rejecting a planted " +
          "non-exploitable service, measured its reliability across repeated clean-snapshot " +
          "runs, then patched the root causes and proved removal by negative retest",
      },
      GRC: {
        project: "Verify the Vendor, Then Decide",
        competencies: [
          "Schema validation of vendor technical exports",
          "Claims tested against evidence, with locators",
          "Subprocessor and data-flow graph construction",
          "Control failure separated from missing evidence",
          "Contract redlines & conditions precedent",
          "Executable quarterly verification checks",
        ],
        narrative:
          "you refused to take a vendor's questionnaire at face value: you validated their " +
          "technical exports, found the stale records, the duplicate audit events, the broken " +
          "hash chain and the deletion job that reported success before it finished, and you " +
          "kept 'insufficient' as its own verdict rather than rounding it up to a pass",
        attestation:
          "built an evidence-verification pipeline for a vendor's machine-readable exports, " +
          "reconciled SOC 2 and questionnaire claims against technical evidence with exact " +
          "locators, maintained a strict separation between control failure and missing " +
          "evidence, and issued enforceable commercial conditions backed by runnable checks",
      },
    },
  },

  // ── Project 3 — Architecture ──────────────────────────
  STAGE_7: {
    number: 3, name: "Architecture", title: "Advanced Stage 7 — Architecture",
    standing: "Security Architect",
    matters:
      "Design is where security work either scales or collapses. This project asks for a whole system built under real constraints, with the trade-offs written down and the controls tested rather than assumed — the difference between an architect and someone drawing boxes.",
    premise: "designing, testing and defending a complete security design",
    tracks: {
      SOC_ANALYSIS: {
        project: "Build a Network Detection Range as Code",
        competencies: [
          "Seven-zone routed enterprise range as code",
          "Stateful least-privilege policy in nftables",
          "Positive, negative & return-path testing",
          "Sensor placement without production reach",
          "Fault injection and diagnosis from telemetry",
          "Baseline restored via version control",
        ],
        narrative:
          "you defined a seven-zone routed enterprise entirely as code — no hand-configured " +
          "node anywhere — enforced stateful least privilege so return traffic works while new " +
          "east-west sessions fail loudly, placed the sensor where it sees every scored path " +
          "without being able to originate traffic, then diagnosed injected faults from packets " +
          "and logs and restored the baseline through version control",
        attestation:
          "built a seven-zone routed enterprise network range entirely as code, implemented " +
          "stateful least-privilege segmentation with administrative paths and centralised " +
          "logging, wrote positive, negative, return-path and spoofing tests against a published " +
          "matrix, and diagnosed injected fault conditions from primary telemetry",
      },
      ETHICAL_HACKING: {
        project: "Compromise a Custom AWS IAM Range",
        competencies: [
          "IAM enumeration without walkthrough shortcuts",
          "Trust, boundary & policy-version edge analysis",
          "Effective-permission reasoning over decoys",
          "CloudTrail preserved for decisive API calls",
          "Terraform least-privilege remediation",
          "Cost-SLA teardown with residual verification",
        ],
        narrative:
          "you enumerated a live AWS identity estate without searching for the scenario name, " +
          "traversed real permission edges across trust policies, policy versions and " +
          "boundaries, correctly rejected the action that looked powerful but was neutralised " +
          "by a boundary condition, then patched the Terraform so the attack paths closed while " +
          "the workload's own tests still passed",
        attestation:
          "compromised a custom AWS IAM range by reasoning about effective permissions across " +
          "trust relationships, policy versions and permission boundaries rather than following " +
          "a published walkthrough, preserved CloudTrail evidence for every decisive call, then " +
          "implemented and tested least-privilege remediation that preserved workload function",
      },
      GRC: {
        project: "Automate an ISO 27001 Evidence Audit",
        competencies: [
          "Evidence collector validating hashes & scope",
          "Deterministic, reproducible sample selection",
          "Eighteen documented tests across Annex A",
          "Verdicts generated from traceable results",
          "Stale, duplicate & conflicting evidence caught",
          "Nonconformity register from a frozen result set",
        ],
        narrative:
          "you built a collector that actually verifies evidence — hashes, timestamps, owners, " +
          "scope and age — selected audit samples deterministically so another auditor can " +
          "reproduce them exactly, and caught the broken hash, the stale screenshot and the " +
          "ticket whose status contradicted its own event history, while enforcing that a " +
          "missing required sample cannot become a conforming verdict",
        attestation:
          "built a deterministic evidence collector and verifier for an ISO 27001 audit, " +
          "executed eighteen documented tests across twelve Annex A controls with reproducible " +
          "sampling, and generated verdicts and a nonconformity register from a frozen, " +
          "traceable result set rather than from auditor judgment alone",
      },
    },
  },

  // ── Project 4 — Adversity ─────────────────────────────
  STAGE_8: {
    number: 4, name: "Adversity", title: "Advanced Stage 8 — Adversity",
    standing: "Adversarial Assessor",
    matters:
      "One attempt, no revision, and a reviewer actively looking for the weak point. This project measures composure and judgment under pressure, which is what separates a practitioner who holds up in an incident from one who only performs well with time to spare.",
    premise: "delivering without revision and defending the work under challenge",
    tracks: {
      SOC_ANALYSIS: {
        project: "Detection Engineering Under Adversary Pressure",
        competencies: [
          "Detection-as-code, deployed from clean state",
          "Twelve ATT&CK procedures with benign controls",
          "Semantic variants caught, not exact strings",
          "Multi-event correlation & time-window logic",
          "Automated replay and regression harness",
          "Telemetry failure distinguished from rule miss",
        ],
        narrative:
          "you wrote detections that catch semantic variants rather than the exact Atomic " +
          "command string, held them against mutations, benign lookalikes and deliberate " +
          "telemetry failures, and built a harness that can tell the difference between no " +
          "telemetry, a decoder failure, a rule miss, a suppression and a real alert — all on " +
          "one attempt, with no revision available",
        attestation:
          "built detection-as-code for twelve controlled ATT&CK procedures and passed a " +
          "regression suite spanning attacker mutations, benign lookalikes and telemetry " +
          "failures, with correlation logic across multiple events and a harness that " +
          "distinguishes missing telemetry from decoder failure from rule miss — delivered on a " +
          "single attempt with no revision permitted",
      },
      ETHICAL_HACKING: {
        project: "Own the Forest",
        competencies: [
          "AD enumeration beyond SharpHound defaults",
          "Graph edges validated by direct protocol evidence",
          "Planted stale edge identified and rejected",
          "Two independent domain-control paths proved",
          "Automation with runtime identifier discovery",
          "Windows detections plus remediation retest",
        ],
        narrative:
          "you validated Active Directory attack paths against direct LDAP, SMB and Kerberos " +
          "evidence instead of trusting a graph tool's output, spotted the planted stale edge, " +
          "proved two independent routes to domain control and automated one of them — then " +
          "stopped short of persistence, wrote the detections for the decisive edges, and " +
          "remediated both paths",
        attestation:
          "provisioned and compromised an Active Directory forest, validating at least eight " +
          "attack-graph edges against direct protocol evidence rather than tooling defaults and " +
          "correctly identifying a planted stale edge, proved two independent paths to domain " +
          "control, and authored both the detections and the remediation that closed them",
      },
      GRC: {
        project: "Hardening as Code and Quantified Risk",
        competencies: [
          "Idempotent Ansible role with tested rollback",
          "Scanner delta proved against service tests",
          "False positive identified and argued",
          "Service conflict resolved by parameterisation",
          "Quantified treatment model with sensitivity",
          "Three treatments selected under budget",
        ],
        narrative:
          "you built hardening that is idempotent and reversible — second run reports zero " +
          "changes, rollback restores the baseline hashes — kept every service acceptance test " +
          "green while the scanner delta moved, identified the false positive instead of " +
          "remediating it, and then selected treatments from a quantified model with real loss " +
          "ranges rather than from a severity colour",
        attestation:
          "built an idempotent infrastructure hardening role with tested rollback and service " +
          "acceptance suites, proved a measured scanner delta while identifying a scanner false " +
          "positive, and produced a quantitative risk-treatment model separating asset " +
          "criticality, control effectiveness, loss ranges and residual risk under a fixed budget",
      },
    },
  },

  // ── Project 5 — The Final Case ────────────────────────
  STAGE_9: {
    number: 5, name: "The Final Case", title: "Advanced Stage 9 — The Final Case",
    standing: "Advanced Fellow",
    matters:
      "The terminal project is deliberately ambiguous, the way real cases are. It measures whether the candidate can carry a problem from raw evidence all the way to a decision an executive can act on, and then defend that decision out loud.",
    premise: "leading an ambiguous terminal case and standing behind the result",
    tracks: {
      SOC_ANALYSIS: {
        project: "Full Incident Response",
        competencies: [
          "Verified acquisition & parser-driven timeline",
          "Multi-host intrusion chain reconstructed",
          "Exfiltrated dataset recovered and hashed",
          "Tampered evidence caught by manifest check",
          "Sigma, YARA & Zeek content under fixtures",
          "Containment and recovery automation",
        ],
        narrative:
          "you took a sealed multi-source case with duplicate events, a damaged artefact, two " +
          "source-clock offsets and a tampered evidence item, reconstructed the full chain from " +
          "phishing object to exfiltration across three hosts, rebuilt the stolen archive from " +
          "split sessions and got the exact record and byte counts, then shipped detection " +
          "content and recovery automation that other people can run",
        attestation:
          "resolved a sealed multi-source DFIR case, building a parser-driven super-timeline " +
          "with explicit source clocks and provenance, reconstructing a multi-host intrusion " +
          "from phishing through persistence and lateral movement to exfiltration, recovering " +
          "and hashing the exfiltrated dataset, and shipping tested detection and recovery code",
      },
      ETHICAL_HACKING: {
        project: "Full VAPT and Retest",
        competencies: [
          "Estate mapped under machine-readable RoE",
          "Three-host chain across web, API & infra",
          "Scanner decoy correctly rejected",
          "Deterministic verification test per finding",
          "Full-chain runner with safety & cleanup",
          "Regression caught in the patched release",
        ],
        narrative:
          "you chained three distinct control failures across web, API and infrastructure hosts " +
          "to reach exactly one crown-jewel record — no more — wrote a deterministic " +
          "verification test for every finding you accepted, and then re-ran the whole suite " +
          "against the patched release and told the difference between a payload being blocked " +
          "and a root cause being removed, including the regression nobody flagged for you",
        attestation:
          "completed a full penetration test and retest of a custom web, API and infrastructure " +
          "estate under machine-readable rules of engagement, chained three distinct control " +
          "failures to a single crown-jewel record, wrote deterministic verification tests for " +
          "every accepted finding, and distinguished payload blocking from root-cause removal " +
          "in the patched release while detecting an intentional regression",
      },
      GRC: {
        project: "Build a Breach Governance Engine",
        competencies: [
          "Controlling awareness event established",
          "Affected people deduplicated by overlap group",
          "GDPR 33/34, NDPA s.40 & CCPA clocks modelled",
          "Every statutory deadline computed in WAT/UTC",
          "Jurisdiction rules as data, not case answers",
          "Regulator and subject work items generated",
        ],
        narrative:
          "you built a breach engine that distinguishes event occurrence from detection from " +
          "confirmation from processor notice — the distinction every real breach argument " +
          "turns on — deduplicated affected people through overlap groups, computed every " +
          "statutory deadline across three jurisdictions, and kept the rules as configuration " +
          "so the engine generalises instead of memorising your case",
        attestation:
          "built and tested a jurisdiction-aware breach notification engine covering GDPR " +
          "Articles 33 and 34, Nigeria's section 40 and California's breach statutes, " +
          "establishing the controlling awareness event, deduplicating affected populations " +
          "through overlap groups, computing every statutory deadline, and generating regulator " +
          "and data-subject work items from evidence rather than from hard-coded answers",
      },
    },
  },
};

/** Resolve the per-track content for a stage. */
export function credentialFor(stage: AdvancedStageKey, track: AdvancedTrack): TrackCredential {
  return ADVANCED_CREDENTIALS[stage].tracks[track];
}

/** Full standing including the track qualifier, e.g. "Exposure Operator — SOC Analysis". */
export function standingFor(stage: AdvancedStageKey, track: AdvancedTrack): string {
  return `${ADVANCED_CREDENTIALS[stage].standing} — ${TRACK_LABEL[track]}`;
}
