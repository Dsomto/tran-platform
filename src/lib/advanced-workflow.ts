import type { AdvancedProject, AdvancedTrack } from "./advanced-stage";

export type AdvancedWorkflowStep = {
  when: string;
  title: string;
  actions: string[];
  checkpoint: string;
};

export type AdvancedProjectWorkflow = {
  intro: string;
  firstHour: {
    actions: string[];
    commands: string[];
    readyWhen: string;
  };
  steps: AdvancedWorkflowStep[];
};

type ProjectNumber = AdvancedProject["number"];

function step(
  when: string,
  title: string,
  actions: string[],
  checkpoint: string,
): AdvancedWorkflowStep {
  return { when, title, actions, checkpoint };
}

const WORKFLOWS: Record<
  AdvancedTrack,
  Record<ProjectNumber, Omit<AdvancedProjectWorkflow, "firstHour">>
> = {
  SOC_ANALYSIS: {
    1: {
      intro:
        "Treat this as a data-engineering project first and a threat hunt second. Build trustworthy ingestion and source accounting before drawing conclusions from the logs.",
      steps: [
        step(
          "Monday morning",
          "Freeze and inventory the evidence",
          [
            "Verify the archive and private-overlay hashes, preserve the originals read-only, and record every source file, format version, timezone, and row count.",
            "Read the schema fixtures and create a source contract for authentication, web, DNS, firewall, and endpoint records before loading the full pack.",
          ],
          "You have an immutable raw directory and a source inventory whose row totals can be checked later.",
        ),
        step(
          "Monday afternoon",
          "Build the smallest complete ingest path",
          [
            "Create typed adapters, a normalized event schema, quarantine reason codes, deduplication keys, and explicit clock-correction rules.",
            "Run one public fixture through raw input, normalization, quarantine, DuckDB storage, and export; add tests for malformed rows and empty input.",
          ],
          "One command ingests a public fixture without editing source data and accounts for accepted, duplicate, and quarantined rows.",
        ),
        step(
          "Tuesday to Wednesday",
          "Resolve entities and write reusable hunts",
          [
            "Create identity and host alias tables, then express correlations as joins, windows, and relationship rules instead of case-specific values.",
            "Build campaign edges only when each edge can retain two independent raw locators and the normalized event IDs that produced it.",
            "Keep hunt definitions separate from expected campaign names, addresses, usernames, timestamps, and counts.",
          ],
          "The CLI generates a normalized timeline and candidate campaign graph from a clean database.",
        ),
        step(
          "Thursday",
          "Reconcile the discrepancy set and challenge your hypotheses",
          [
            "Resolve all 96 assigned cases against their raw activity and controlling change record; record classification, rationale, and locators.",
            "Test benign explanations and competing campaign interpretations before accepting a suspicious-looking event as malicious.",
            "Run data-quality tests for aliases, duplicate events, clock offsets, schema drift, and silent row loss.",
          ],
          "Every discrepancy has an evidence-backed disposition and every campaign edge survives an alternative-hypothesis review.",
        ),
        step(
          "Friday morning",
          "Run the clean benchmark and acceptance suite",
          [
            "Delete generated state, rebuild from raw evidence, run all hunts twice, and compare output hashes for determinism.",
            "Capture runtime, peak memory, row accounting, query plans, test results, and the exact command used on the supported resource limit.",
          ],
          "The complete runner finishes inside the published limit and two clean runs produce identical scored outputs.",
        ),
        step(
          "Friday before 18:10 WAT",
          "Package a traceable investigation",
          [
            "Populate the evidence index so each central claim points from report to generated result, normalized event, and raw locator.",
            "Verify every required filename, regenerate manifest.sha256 last, test the Drive folder in an incognito window, and submit the single folder URL.",
          ],
          "A grader can clone the package, run one command, and reproduce every scored table without manual SQL or hidden files.",
        ),
      ],
    },
    2: {
      intro:
        "Separate the sensor boundary from the analysis pipeline. The sealed replay is the scored source, so prove isolation and deterministic analysis before considering optional live exposure.",
      steps: [
        step(
          "Monday morning",
          "Establish the safe boundary",
          [
            "Verify the replay and boundary-source hashes, read the prohibited egress and management rules, and diagram collection, management, analysis, and quarantine zones.",
            "Decide whether to attempt the optional live sensor; the mandatory path must remain complete without it.",
          ],
          "The allowed ingress, denied egress, management source, private ranges, and metadata endpoints are written as testable rules.",
        ),
        step(
          "Monday afternoon",
          "Test isolation before processing attacks",
          [
            "Build the candidate-owned boundary source and machine-readable tests for allowed and denied paths.",
            "Prove management is restricted and forbidden egress, RFC1918 destinations, and metadata services fail closed.",
          ],
          "isolation-results.json records each viewpoint, expected verdict, observed verdict, and evidence locator.",
        ),
        step(
          "Tuesday to Wednesday",
          "Normalize and sessionize the replay",
          [
            "Place each source format behind an adapter that emits one versioned session schema.",
            "Implement bounded session windows, reordered-event handling, reconnect logic, payload hashing, and quarantine without executing captured content.",
            "Generate sessions, clusters, credential or infrastructure relationships, STIX objects, and detection content from that normalized model.",
          ],
          "A single pipeline command converts the sealed replay into sessions.parquet, clusters.json, STIX, detections, and a hash ledger.",
        ),
        step(
          "Thursday",
          "Prove provenance and analytical restraint",
          [
            "Trace representative raw events through normalization, session membership, cluster membership, and each derived object.",
            "Test out-of-order events, repeated credentials, protocol changes, malformed payload metadata, and benign shared infrastructure.",
          ],
          "Every conclusion has raw-to-derived lineage and the analysis does not depend on attacker volume.",
        ),
        step(
          "Friday morning",
          "Rebuild and run holdout-style checks",
          [
            "Recreate the analysis environment from dependency locks and rerun the full replay without programme services.",
            "Compare exact counts and hashes, run all isolation and pipeline tests, and reconstruct one supported protocol session byte-for-byte.",
          ],
          "The clean run produces stable session, cluster, payload, STIX, and detection outputs with all tests green.",
        ),
        step(
          "Friday before 18:10 WAT",
          "Submit the sensor and analysis evidence separately",
          [
            "Keep infrastructure, raw export, quarantine metadata, derived analysis, tests, and report evidence in distinct directories.",
            "Regenerate the evidence index and manifest, test folder permissions, and submit one view-only Drive root.",
          ],
          "Staff can assess isolation and analytical depth independently, even if no optional live traffic was collected.",
        ),
      ],
    },
    3: {
      intro:
        "Build the range as reproducible infrastructure, not as a diagram. Establish a green baseline, inject each required fault, diagnose it from evidence, and return to green through version-controlled fixes.",
      steps: [
        step(
          "Monday morning",
          "Preflight the host and translate the matrix",
          [
            "Verify Docker, containerlab, FRRouting, nftables, sensor tooling, disk, and nested-virtualization requirements before creating the range.",
            "Translate every published zone-to-zone rule into an explicit positive or negative assertion, including return traffic and management paths.",
          ],
          "You have a requirements matrix where every row names source, destination, service, expected verdict, and planned evidence.",
        ),
        step(
          "Monday afternoon",
          "Create the topology and one working path",
          [
            "Put addressing and variant values in structured configuration, then define all seven zones, gateways, services, and routes as code.",
            "Make one allowed path and one denied path observable end to end before scaling to the full matrix.",
          ],
          "make clean and make lab create a reachable baseline with no post-build shell edits.",
        ),
        step(
          "Tuesday to Wednesday",
          "Implement policy, dependencies, and telemetry",
          [
            "Add stateful least privilege, NAT, administrative paths, DNS/NTP dependencies, centralized logs, and the mirrored sensor path.",
            "Write tests for allowed, denied, return-state, spoofed-source, management, asymmetric, and logging behavior.",
            "Attach firewall counters, sensor events, or packet evidence to negative assertions so a failed ping is never the only proof.",
          ],
          "make test produces a machine-readable report for at least 30 assertions and identifies the policy object behind each verdict.",
        ),
        step(
          "Thursday",
          "Run the fault-recovery cycle",
          [
            "Create a clean Git checkpoint, inject each published fault and the private condition one at a time, and preserve the resulting failing test.",
            "Diagnose from packets, routes, counters, and logs; commit the smallest correction and rerun the relevant test before the full suite.",
          ],
          "The Git history and fault-recovery log show fault, failure, diagnosis, fix, and green retest for every assigned condition.",
        ),
        step(
          "Friday morning",
          "Rebuild from zero and vary the inputs",
          [
            "Destroy the range, rebuild from repository files, and execute the complete path and telemetry suite unattended.",
            "Change only the structured variant file to a second addressing plan and confirm tests contain no embedded addresses.",
          ],
          "A clean rebuild and configuration-only address change both complete without manual repair.",
        ),
        step(
          "Friday before 18:10 WAT",
          "Package code, tests, and decisive packets",
          [
            "Export topology, container hashes, test-results.xml, fault log, selected packet captures, and evidence locators tied to the final commit.",
            "Regenerate the manifest, verify the Drive root anonymously, and submit the single folder URL.",
          ],
          "A grader can rebuild the exact topology commit and reproduce both allowed and denied behavior.",
        ),
      ],
    },
    4: {
      intro:
        "Build a detection test laboratory before writing many rules. For each assigned behavior, preserve the source event, normalized representation, verdict, and benign control so tuning remains measurable.",
      steps: [
        step(
          "Monday morning",
          "Verify and isolate the signed replay",
          [
            "Verify the B2 archive and every sealed replay item against the published manifests; keep the source read-only.",
            "Create separate source, normalized, decision, test, and evidence directories plus one unattended replay command.",
          ],
          "The health check accounts for every source item and records Python, fixture, schema, and content hashes.",
        ),
        step(
          "Monday afternoon",
          "Prove one source-normalized-alert triple",
          [
            "Run one canonical procedure and one benign lookalike, then capture the original event, decoded fields, and final alert or no-alert verdict.",
            "Automate replay and assertion for that pair before adding more techniques.",
          ],
          "One test fails when the rule is absent, passes when the intended behavior alerts, and keeps the benign control quiet.",
        ),
        step(
          "Tuesday to Wednesday",
          "Build semantic detections and coverage",
          [
            "Work through all assigned procedures and benign controls, updating coverage-matrix.csv as each triple becomes reproducible.",
            "Use stable fields, relationships, sequences, thresholds, and windows; do not match Atomic IDs, fixture IDs, or exact command literals.",
            "Keep fixture generation, replay, rule loading, and result assertions separate so failures can be localized.",
          ],
          "All canonical fixtures have explicit expected verdicts and all rules load without errors.",
        ),
        step(
          "Thursday",
          "Mutate telemetry and tune false positives",
          [
            "Test renamed binaries, encoded commands, and one removed telemetry field; record whether failure is collection, decoding, matching, or suppression.",
            "Run the full benign set after each tuning change and document blind spots rather than broadening rules without evidence.",
          ],
          "The regression report shows canonical, mutation, and benign performance with traceable reasons for misses.",
        ),
        step(
          "Friday morning",
          "Rehearse the no-revision defense",
          [
            "Check out the clean candidate commit, redeploy, run the complete regression suite unattended, and preserve machine-readable output.",
            "Rehearse tracing a randomly selected fixture from raw event to normalized fields and matching rule logic.",
          ],
          "The clean commit reproduces coverage without UI-only steps and the defense can explain one mutation precisely.",
        ),
        step(
          "Friday before 18:10 WAT",
          "Freeze rules, fixtures, evidence, and recording",
          [
            "Confirm the coverage matrix, raw events, alerts, regression XML, video URL, and manifest all refer to the same final commit.",
            "Test the view-only folder without authentication and submit once; this stage has no replacement submission.",
          ],
          "Every detection claim is reproducible and every benign claim has an explicit no-alert result.",
        ),
      ],
    },
    5: {
      intro:
        "Approach the sealed incident as evidence preservation, parser construction, hypothesis testing, recovery, and defense. Do not begin by writing the narrative you expect to find.",
      steps: [
        step(
          "Monday morning",
          "Preserve and triage the case",
          [
            "Verify acquisition hashes, isolate the tampered item as an integrity finding, create working copies, and record parser versions and source clocks.",
            "Inventory hosts, identities, evidence types, time ranges, and known gaps without deciding the attack story yet.",
          ],
          "The acquisition ledger distinguishes original, working, derived, damaged, and excluded evidence.",
        ),
        step(
          "Monday afternoon",
          "Build a multi-source timeline skeleton",
          [
            "Implement parsers for at least four evidence types that emit one normalized event schema with raw locators and clock assumptions.",
            "Add duplicate, damaged-record, timezone, and ordering tests before processing the full package.",
          ],
          "The timeline builder creates a deterministic preliminary timeline and a parser-error register.",
        ),
        step(
          "Tuesday to Wednesday",
          "Reconstruct and test the incident chain",
          [
            "Trace phishing, execution, persistence, credentials, privilege, lateral movement, staging, C2, and exfiltration across the relevant hosts.",
            "Maintain confirmed, inferred, contradicted, and unknown states; test the benign administrative sequence as a competing explanation.",
            "Link each timeline conclusion to its source record and preserve any clock correction separately from the raw timestamp.",
          ],
          "The chain is supported by cross-source evidence and the impact boundary states what is and is not proven.",
        ),
        step(
          "Thursday",
          "Recover the archive and build response content",
          [
            "Reconstruct the synthetic stolen archive from fragments, verify ordering, and calculate exact hash, file, record, and byte counts.",
            "Write Sigma, YARA, or Zeek content from observed behavior and test it against supplied positive and negative fixtures.",
            "Create containment and recovery actions that preserve evidence and can be run or verified safely.",
          ],
          "Recovered content and detection results are reproducible from raw evidence, not copied into the report manually.",
        ),
        step(
          "Friday morning",
          "Perform a clean reconstruction and defense rehearsal",
          [
            "Rebuild the timeline and recovered output in a clean environment, compare hashes, and account for every parser warning.",
            "Rehearse two raw-evidence extractions, a timeline query, a detection test, and an explanation of the controlling clock.",
          ],
          "The final case outputs reproduce without hand-edited timeline rows and the defense commands are known.",
        ),
        step(
          "Friday before 18:10 WAT",
          "Freeze the case record",
          [
            "Ensure incident and executive reports use only claims present in the evidence index and frozen timeline result.",
            "Verify recovered files, tests, queries, video URL, and manifest; test the Drive link anonymously before the one-shot submission.",
          ],
          "A reviewer can move from each report claim back to raw evidence and reproduce the decisive extraction.",
        ),
      ],
    },
  },
  ETHICAL_HACKING: {
    1: {
      intro:
        "Treat scope enforcement as part of the recon engine, not as a note in the report. Build one safe discovery path end to end, then add adapters and depth without crossing the foothold stop point.",
      steps: [
        step(
          "Monday morning",
          "Start the local target and freeze scope",
          [
            "Verify the shared pack and overlay, start the loopback lab with your marker, and preserve its generated scope profile.",
            "Translate allowed CIDRs, hostnames, ports, rates, and the out-of-scope decoy into pre-request validation tests.",
          ],
          "The target is reachable locally and a unit test proves an unapproved destination is rejected before any socket call.",
        ),
        step(
          "Monday afternoon",
          "Build one complete discovery adapter",
          [
            "Implement request scheduling, bounded timeout, retries, rate accounting, raw capture, normalization, and deterministic output for one protocol.",
            "Write the request ledger before adding concurrency so every attempt has purpose, target, result, and scope verdict.",
          ],
          "One command discovers and normalizes a permitted service while target and engine ledgers reconcile.",
        ),
        step(
          "Tuesday to Wednesday",
          "Expand discovery and handle deceptive services",
          [
            "Add DNS and wildcard baselines, HTTP probing, TLS/SNI, virtual hosts, service scanning, and fingerprint adapters behind common interfaces.",
            "Implement bounded concurrency, resumable checkpoints, deduplication, and fallback when one optional adapter is unavailable.",
            "Keep raw evidence immutable and separate from normalized records and report generation.",
          ],
          "The engine finds the assigned service set within the request budget and records zero requests to the decoy.",
        ),
        step(
          "Thursday",
          "Use evidence to obtain only the foothold proof",
          [
            "Follow the normalized service and virtual-host evidence to the explicitly authorized foothold request.",
            "Capture the multi-protocol response chain and fresh user flag, then stop; do not launch generic exploitation or pursue privilege escalation.",
          ],
          "The flag, raw responses, normalized record, and target ledger all prove the same authorized action.",
        ),
        step(
          "Friday morning",
          "Test interruption, fallback, and a clean profile",
          [
            "Interrupt a run, resume it, disable one adapter, and confirm completed requests are not repeated or duplicated.",
            "Restart the target under another profile and measure recall, scope violations, request count, and normalized hash stability.",
          ],
          "Published tests pass with zero out-of-scope requests and the fallback/resume paths produce the expected normalized result.",
        ),
        step(
          "Friday before 18:10 WAT",
          "Package the engine, not just scanner output",
          [
            "Include source, tests, schemas, commit history, raw output, normalized output, ledgers, foothold evidence, and the report.",
            "Regenerate manifest.sha256, verify the Drive root anonymously, and submit one folder URL.",
          ],
          "Staff can run the candidate-authored engine from a clean checkout and audit every request it makes.",
        ),
      ],
    },
    2: {
      intro:
        "Work from preconditions and protocol evidence. First make the chain reliable against clean snapshots, then patch root causes and use the same automation as the negative retest.",
      steps: [
        step(
          "Monday morning",
          "Build and isolate the range",
          [
            "Verify the Vagrant source, create the host-only attacker/target network, build vulnerable and patched targets, and take a named clean snapshot.",
            "Record authorized addresses and confirm the attacker cannot route into production or public networks.",
          ],
          "The clean snapshot and range health checks are reproducible, isolated, and hash-recorded.",
        ),
        step(
          "Monday afternoon",
          "Enumerate and write preconditions",
          [
            "Collect ports, banners, application behavior, files, permissions, processes, and privilege boundaries as raw evidence.",
            "Write each proposed chain edge as a precondition, action, expected result, failure result, and cleanup obligation before coding it.",
          ],
          "The chosen foothold and privilege path is evidence-backed, while the planted rabbit hole has a documented rejection test.",
        ),
        step(
          "Tuesday to Wednesday",
          "Implement the chain as tested code",
          [
            "Write candidate-authored Python or Go with explicit protocol handling, runtime discovery, configuration, bounded timeouts, safe failure, and no embedded run-specific values.",
            "Implement preflight and cleanup first, then automate foothold, flag collection, privilege escalation, root proof, and cleanup one edge at a time.",
            "Add tests for partial failure, interruption, repeated cleanup, and absent preconditions.",
          ],
          "One command moves from clean target to both private flags and returns the target to the declared clean state.",
        ),
        step(
          "Thursday",
          "Measure reliability and fix root causes",
          [
            "Restore the clean snapshot before each of five runs and capture success, duration, discovered values, flags, and cleanup results.",
            "Patch the minimum root cause for each exploited weakness in the supplied source, then rebuild the patched target.",
          ],
          "Five of five runs pass within the limit, and the patch diff changes the vulnerable condition rather than filtering one payload.",
        ),
        step(
          "Friday morning",
          "Run negative and positive retests",
          [
            "Run the original chain against the patched target and verify it fails at the intended precondition.",
            "Run all supplied service acceptance tests and cleanup tests to prove intended behavior remains available.",
          ],
          "negative-retest.xml shows the attack blocked at root cause while positive service tests remain green.",
        ),
        step(
          "Friday before 18:10 WAT",
          "Submit a reproducible exploit-and-fix record",
          [
            "Package code, tests, patch diffs, five transcripts, reliability data, rabbit-hole analysis, cleanup, and negative retest evidence.",
            "Regenerate the manifest, inspect the folder anonymously, and submit the single view-only root.",
          ],
          "A grader can restore a snapshot, execute the chain, apply the patch, and observe the exact expected failure.",
        ),
      ],
    },
    3: {
      intro:
        "Cost and teardown controls come before IAM testing. Model effective permissions as a graph, preserve CloudTrail for every edge, then patch the infrastructure source and prove both business behavior and attack prevention.",
      steps: [
        step(
          "Monday morning",
          "Create cost and identity guardrails",
          [
            "Use a dedicated lab account, secure the root user with MFA, create the required budgets and alerts, and configure the Budget Action or equivalent deny control.",
            "Record the starting identity, account, assigned region, test window, teardown deadline, and forbidden actions.",
          ],
          "The cost-guardrail evidence proves alerts and automated restriction exist before deployment.",
        ),
        step(
          "Monday afternoon",
          "Deploy and inventory the range",
          [
            "Deploy only the supplied CloudGoat/Terraform scenario and save plan, apply, state, resource inventory, and start time.",
            "Enable or verify CloudTrail coverage, then enumerate the starting principal, policies, versions, trusts, boundaries, and effective permissions.",
          ],
          "The initial inventory matches the release manifest and decisive API activity is being logged.",
        ),
        step(
          "Tuesday to Wednesday",
          "Build and validate the permission graph",
          [
            "Represent each possible edge with source principal, policy statement, trust or boundary interaction, required API call, and expected new capability.",
            "Traverse only the scored path, preserving ordered CloudTrail event IDs and stopping after retrieving the assigned synthetic secret.",
            "Reject apparent edges that do not survive effective-permission validation.",
          ],
          "attack-path.json contains at least four validated edges from the starting identity to the assigned secret.",
        ),
        step(
          "Thursday",
          "Remediate with least privilege",
          [
            "Patch the supplied Terraform and IAM definitions at the responsible policies, trusts, versions, or boundaries.",
            "Redeploy, run positive business tests, and run negative tests for every former attack edge.",
          ],
          "Business tests pass, attack tests fail at intended edges, and the remediation diff is explainable statement by statement.",
        ),
        step(
          "Friday morning",
          "Destroy and prove zero residuals",
          [
            "Destroy the range inside the four-hour and same-UTC-day SLA, preserving destroy output and final cost.",
            "Independently query IAM, STS, Lambda, Secrets Manager, S3, EC2, CloudFormation, and Terraform state for residuals.",
          ],
          "Residual checks match the empty baseline and no billed or privileged resource remains.",
        ),
        step(
          "Friday before 18:10 WAT",
          "Freeze the graph, trail, patch, and teardown proof",
          [
            "Package enumeration, graph, CloudTrail, remediation, tests, guardrails, destroy proof, residual inventory, and manifest.",
            "Remove secrets from the submitted evidence, test folder permissions anonymously, and submit one Drive root.",
          ],
          "The submission proves the path, the least-privilege fix, and complete cleanup without exposing credentials.",
        ),
      ],
    },
    4: {
      intro:
        "Build the issued candidate-bound directory control plane, validate graph edges directly, automate one bounded path, then add detection and remediation. Graph visualization alone is not proof.",
      steps: [
        step(
          "Monday morning",
          "Build and checkpoint the portable range",
          [
            "Download your authenticated candidate JSON, verify its binding, build the portable range, and run the health command.",
            "Preserve the untouched assignment and clean range hash before enumeration; use no real directory, network, or credentials.",
          ],
          "The health suite is green and a forced rebuild restores the exact clean-state hash.",
        ),
        step(
          "Monday afternoon",
          "Collect and challenge the identity graph",
          [
            "Parse the supplied object, relation, ACL, session, group, and delegation records into one effective-rights graph.",
            "For each candidate edge, record the graph claim and the exact raw record plus independent effective-rights check needed to validate it.",
          ],
          "At least eight edges have direct evidence and the planted stale edge is identified as unsupported.",
        ),
        step(
          "Tuesday to Wednesday",
          "Prove two bounded control paths",
          [
            "Build two independent paths from validated edges, recording preconditions, commands, resulting privileges, cleanup, and stop conditions.",
            "Execute only in the offline range, capture both candidate-bound proofs, stop at the stated proof, and do not add persistence.",
            "Implement one path as candidate-authored automation with runtime discovery and safe failure.",
          ],
          "Both paths are evidence-backed and the automated path succeeds from a restored clean checkpoint.",
        ),
        step(
          "Thursday",
          "Add detection, cleanup, and remediation",
          [
            "Export the range event ledger, then create two detections for decisive path edges with benign controls.",
            "Remediate the responsible permissions or configuration, rerun the negative path tests, and verify range health remains green.",
            "Repeat the automated path three times from clean checkpoints with cleanup after each run.",
          ],
          "Three automation runs pass before remediation; both intended edges fail afterward; both detections pass positive and benign tests.",
        ),
        step(
          "Friday morning",
          "Rehearse the clean-state defense",
          [
            "Restore the clean checkpoint and reproduce a staff-selectable edge using submitted scripts and direct evidence.",
            "Practice explaining why the stale edge is false, how credential material was handled, and where each path is broken by remediation.",
          ],
          "The defense can reproduce one edge and trace its event, detection, cleanup, and remediation evidence without improvisation.",
        ),
        step(
          "Friday before 18:10 WAT",
          "Package the range evidence and one-shot defense",
          [
            "Align graph, direct-edge evidence, flags, automation transcripts, Windows events, detections, remediation, tests, video URL, and manifest to one commit.",
            "Verify the view-only folder anonymously and submit once; this stage has no revision.",
          ],
          "Staff can distinguish validated edges from graph suggestions and reproduce the submitted automation safely.",
        ),
      ],
    },
    5: {
      intro:
        "Run this as a professional engagement: scope, inventory, testable findings, bounded chain, cleanup, remediation, and retest. The crown-jewel record is proof of impact, not permission to collect more data.",
      steps: [
        step(
          "Monday morning",
          "Sign scope and baseline both releases",
          [
            "Verify the vulnerable and patched estate sources, sign the rules of engagement, and convert targets, ports, methods, rates, data limits, and stop conditions into machine-readable policy.",
            "Build both releases on the dedicated local network and save health checks and clean snapshots.",
          ],
          "The engagement runner refuses an out-of-scope target and both clean estates pass baseline service checks.",
        ),
        step(
          "Monday afternoon",
          "Map the estate and evidence ledger",
          [
            "Use the Stage 5 discovery patterns to inventory web, API, records, and infrastructure attack surfaces without generic exploitation.",
            "Create a ledger for every request, target transition, finding hypothesis, raw response, and cleanup action.",
          ],
          "The attack-surface map is complete enough to select tests and reconciles with the rules of engagement.",
        ),
        step(
          "Tuesday to Wednesday",
          "Verify findings and assemble the chain",
          [
            "Turn each accepted finding into a deterministic positive test with exact vulnerable-state evidence and a root-cause hypothesis.",
            "Select at least three distinct control failures across the required services and build a bounded chain runner with preflight, rate, safety, and cleanup controls.",
            "Retrieve exactly one synthetic crown-jewel record, preserve the flag and edge evidence, then stop.",
          ],
          "The full chain succeeds from a clean snapshot and every edge also has an independent finding test.",
        ),
        step(
          "Thursday",
          "Retest the patched estate",
          [
            "Run the same finding tests and chain runner against the patched release without weakening assertions.",
            "Classify each result as root-cause fixed, payload blocked, still vulnerable, or regression; investigate the intentionally planted regression.",
            "Repeat the vulnerable full chain three times with cleanup and scope assertions.",
          ],
          "Three vulnerable runs succeed cleanly, patched results match expected controls, and the regression appears in the retest matrix.",
        ),
        step(
          "Friday morning",
          "Write findings from tests and rehearse defense",
          [
            "Generate technical findings from the frozen evidence and test results, then rewrite the selected issue for executive decision-making.",
            "Restore clean snapshots and rehearse reproducing a random finding plus one full-chain edge using submitted code.",
          ],
          "Report severity, impact, cause, remediation, and retest status all agree with machine-readable evidence.",
        ),
        step(
          "Friday before 18:10 WAT",
          "Submit one internally consistent engagement record",
          [
            "Package the RoE, reports, evidence, tests, chain runner, vulnerable and patched XML, retest matrix, cleanup logs, video URL, and manifest.",
            "Remove credentials, verify the folder anonymously, and submit the single root before the no-revision deadline.",
          ],
          "A reviewer can reproduce two selected tests and verify that exactly one synthetic record was retrieved.",
        ),
      ],
    },
  },
  GRC: {
    1: {
      intro:
        "Start from evidence gaps and control outcomes, then express policy as testable decisions. The written addendum, Rego bundle, fixtures, and generated compliance report must all describe the same rules.",
      steps: [
        step(
          "Monday morning",
          "Inventory evidence and correct the mapping",
          [
            "Verify the pack and overlay, list each assigned evidence gap, and identify the three controlling outcomes from the authorized framework sources.",
            "Correct the planted mapping without substituting easier controls; record why each evidence item does or does not support the outcome.",
          ],
          "control-mapping.csv has one defensible evidence-gap-to-control chain for each assigned outcome.",
        ),
        step(
          "Monday afternoon",
          "Define executable policy decisions",
          [
            "For each control, define inputs, owner, trigger, required state, violation code, exception authority, expiry, evidence source, and test method.",
            "Create JSON schemas for identity, endpoint, storage, logging, resource, and exception state before writing Rego.",
          ],
          "A decision table predicts allow, deny, malformed, and expired-exception behavior before implementation.",
        ),
        step(
          "Tuesday to Wednesday",
          "Implement the Rego bundle test-first",
          [
            "Write one failing fixture per decision, implement the smallest Rego rule, then add positive, negative, missing-field, malformed, and exception-expiry cases.",
            "Emit deterministic control and violation IDs; keep asset names, ordering, and expected fixture answers out of policy source.",
            "Generate compliance JSON and CSV from OPA output rather than manually copying verdicts.",
          ],
          "All 18 public fixtures pass and every generated verdict traces to policy input, rule, and test.",
        ),
        step(
          "Thursday",
          "Align governance documents with engine behavior",
          [
            "Write the policy addendum using the same owners, triggers, exceptions, evidence, and tests enforced by the bundle.",
            "Use the gap report and decision log to explain constraints, rejected alternatives, implementation sequence, and unresolved risk.",
          ],
          "No statement in the addendum or report promises behavior that the Rego bundle cannot test.",
        ),
        step(
          "Friday morning",
          "Run clean, malformed, and changed-resource checks",
          [
            "Recreate the environment, run opa test and pytest, generate reports twice, and compare hashes.",
            "Add a new resource and exception through input data only and confirm policy and report outputs update without source edits.",
          ],
          "The clean suite, coverage report, deterministic outputs, and input-only change all pass.",
        ),
        step(
          "Friday before 18:10 WAT",
          "Package one policy system",
          [
            "Verify the bundle, schemas, tests, generated report, policy documents, mapping, decision log, evidence index, and manifest agree.",
            "Test the Drive root in an incognito window and submit the single view-only folder URL.",
          ],
          "A reviewer can change state JSON, run one command, and observe the documented policy decision and evidence trail.",
        ),
      ],
    },
    2: {
      intro:
        "Do not score the questionnaire by confidence or prose quality. Define evidence tests, validate technical exports, map data and subprocessors, then let the verified contradictions drive the commercial decision.",
      steps: [
        step(
          "Monday morning",
          "Build the claim and evidence inventory",
          [
            "Verify the due-diligence pack, list each vendor claim, required contract outcome, supplied export, data class, role, region, and subprocessor.",
            "For every claim, define what would prove, disprove, or leave it insufficient before examining the result.",
          ],
          "The contradiction matrix has a testable evidence requirement and locator field for every material claim.",
        ),
        step(
          "Monday afternoon",
          "Create schemas and evidence validators",
          [
            "Model SSO, TLS, audit, deletion, backup, and subprocessor exports with types, required fields, timestamps, scope, retention, owners, and hashes.",
            "Write validator fixtures for valid, invalid, stale, malformed, wrong-scope, and unverifiable evidence.",
          ],
          "One command validates a public fixture and emits pass, fail, or insufficient with exact reason and locator.",
        ),
        step(
          "Tuesday to Wednesday",
          "Reconcile claims and construct the data-flow graph",
          [
            "Run technical evidence through validators and connect each result to the questionnaire claim it tests.",
            "Build subprocessor and data-flow nodes and edges for datasets, roles, regions, transfers, contracts, and controls.",
            "Add cycle, orphan, missing-owner, and unsupported-claim checks; preserve contradictions instead of averaging them away.",
          ],
          "evidence-verdicts.json and data-flow.graphml account for every supplied export and subprocessor edge.",
        ),
        step(
          "Thursday",
          "Make the commercial decision executable",
          [
            "Choose approve, conditionally approve, or reject from verified evidence and business constraints, recording alternatives and residual risk.",
            "Map every redline or condition precedent to an owner, deadline, executable monitor, failure action, and evidence source.",
            "Generate the risk register and memo from the frozen verdict and graph results.",
          ],
          "Every commercial condition has a runnable quarterly check and a declared consequence for failure.",
        ),
        step(
          "Friday morning",
          "Run fixtures and replacement-export rehearsal",
          [
            "Run all public validator and graph tests from a clean environment and regenerate the complete decision package.",
            "Replace one export through the published interface and verify verdicts, monitors, register, and memo update without validator edits.",
          ],
          "The clean run is deterministic and the replacement export flows through to the final decision within the stated process.",
        ),
        step(
          "Friday before 18:10 WAT",
          "Submit evidence, decision, and monitoring as one chain",
          [
            "Package verifier source, schemas, tests, verdicts, graph, matrix, register, memo, redlines, monitoring plan, and manifest.",
            "Verify no fictional-vendor contact or unsupported evidence is claimed, test Drive access anonymously, and submit one root URL.",
          ],
          "A reviewer can trace any redline backward to a failed or insufficient evidence test and forward to a monitoring command.",
        ),
      ],
    },
    3: {
      intro:
        "Build the audit engine before writing the report. Scope, evidence quality, deterministic sampling, test execution, prior-finding retest, and nonconformity classification must be reproducible from the frozen result set.",
      steps: [
        step(
          "Monday morning",
          "Freeze scope, criteria, and evidence custody",
          [
            "Verify pack hashes and inventory policies, exports, tickets, interviews, screenshots, populations, prior findings, owners, dates, and scope.",
            "Define the audit objective, criteria, period, entities, control set, evidence-age rules, and limits before grading evidence.",
          ],
          "The evidence register states what each item can prove and flags missing date, scope, owner, or integrity information.",
        ),
        step(
          "Monday afternoon",
          "Implement collection and deterministic sampling",
          [
            "Write collectors that validate file hash, schema, timestamp, owner, scope, evidence age, and population completeness.",
            "Implement marker-seeded sampling for access, training, vulnerability, backup, and change populations with a saved algorithm version.",
          ],
          "The same marker produces the same sample IDs and sample-manifest hash on repeated runs.",
        ),
        step(
          "Tuesday to Wednesday",
          "Execute the eighteen audit tests",
          [
            "For each test, record criterion, objective, population, sample, procedure, evidence locator, exception, and verdict.",
            "Emit evidence grades and verdicts through code, keeping missing evidence, failed control, and insufficient evidence distinct.",
            "Apply the published severity precedence mechanically and test stale, contradictory, and claimed-but-not-implemented cases.",
          ],
          "The audit test sheet and evidence-verdicts JSON contain eighteen reproducible records with no manually substituted samples.",
        ),
        step(
          "Thursday",
          "Retest prior findings and freeze conclusions",
          [
            "Test each prior finding against objective closure evidence and record closed, open, partially closed, or unverifiable with reasons.",
            "Freeze the machine-readable result set, then generate nonconformities, the internal report, and management letter from it.",
          ],
          "Every report conclusion is derived from a frozen test or prior-finding result and uses the published severity rules.",
        ),
        step(
          "Friday morning",
          "Run public and holdout-style evidence checks",
          [
            "Rebuild the engine, run all collector and sampling fixtures, and compare sample, verdict, and evidence-index hashes.",
            "Process the mandatory holdout evidence pack without code changes and verify expected nonconformity identifiers and classifications.",
          ],
          "The clean and holdout runs are deterministic, complete, and explain every rejected evidence item.",
        ),
        step(
          "Friday before 18:10 WAT",
          "Package the auditable audit",
          [
            "Include engine, schemas, tests, sample manifest, verdicts, test sheet, reports, registers, tracker, evidence index, and manifest.",
            "Check that licensed standards text is not reproduced improperly, test Drive access anonymously, and submit one root.",
          ],
          "A second auditor can rerun the samples and reach the same evidence grades, findings, and severity decisions.",
        ),
      ],
    },
    4: {
      intro:
        "Keep hardening proof and risk selection connected but independently testable. Establish a service-safe baseline, automate reversible remediation, measure the delta, then fund exactly three treatments through the tested model.",
      steps: [
        step(
          "Monday morning",
          "Build and baseline the portable host",
          [
            "Verify the B2 archive, build the unprivileged configuration sandbox, inventory its service contract, and preserve the clean-state hash.",
            "Run baseline security, service, vulnerability-import, and configuration checks without changing the sandbox.",
          ],
          "The before directory contains raw checks, service results, hashes, and an inventory tied to the reproducible clean state.",
        ),
        step(
          "Monday afternoon",
          "Design reversible controls",
          [
            "For each candidate remediation, define finding, desired state, precheck, change, handler, service risk, rollback, and test.",
            "Separate the known false positive and the service-conflicting remediation before implementing changes.",
          ],
          "At least eight scored remediations have explicit acceptance and rollback criteria in structured data.",
        ),
        step(
          "Tuesday to Wednesday",
          "Implement and test the control compiler",
          [
            "Build schema validation, planning, prechecks, apply, verification, and rollback entirely as code; do not repair generated state manually.",
            "Run apply, service tests, second-run idempotence, rollback, baseline verification, reapply, and service tests.",
            "Parameterize the conflicting control so the declared service remains available and document why the false positive is not remediated.",
          ],
          "The compiler applies cleanly, reports zero changes on the second run, rolls back, reapplies, and keeps all service tests green.",
        ),
        step(
          "Thursday",
          "Measure delta and build the risk model",
          [
            "Run after-scans and calculate expected finding, configuration, and test deltas without claiming certification from scanner output.",
            "Implement the published loss-range, control-effectiveness, dependency, residual-risk, sensitivity, budget, and tie-break rules in code.",
            "Import the supplied assets and findings, then select exactly three treatments under the private budget.",
          ],
          "The before/after evidence shows measurable hardening and the model reproduces public calculations and a three-treatment portfolio.",
        ),
        step(
          "Friday morning",
          "Run the unattended lifecycle and defense change",
          [
            "Rebuild the clean sandbox and run baseline, apply, idempotence, services, rollback, and reapply without intervention.",
            "Run a changed budget or asset fixture and rehearse implementing one staff-selected submitted control with its test.",
          ],
          "The full lifecycle is green and the risk model adapts to input changes without source edits.",
        ),
        step(
          "Friday before 18:10 WAT",
          "Freeze technical and investment evidence",
          [
            "Align compiler, tests, rollback, before/after checks, idempotence result, risk model, register, memo, video URL, and manifest.",
            "Test the Drive root anonymously and submit once; this stage has no revision.",
          ],
          "A reviewer can reproduce both the host-state delta and the exact three-treatment decision from submitted inputs.",
        ),
      ],
    },
    5: {
      intro:
        "Build one frozen facts-to-decision pipeline. Keep occurrence, awareness, processor, regulator, subject, and Attorney General clocks separate; generate notices and work items from tested rule output, not from manually chosen dates.",
      steps: [
        step(
          "Monday morning",
          "Freeze facts, sources, roles, and clocks",
          [
            "Verify the evidence pack, inventory data sets, jurisdictions, controllers, processors, subjects, contracts, encryption facts, and source timestamps.",
            "Create separate fields for occurrence, detection, confirmation or awareness, processor notice, regulator, consumer, and AG-sample clocks in UTC and WAT.",
          ],
          "The fact register distinguishes confirmed, disputed, unknown, and derived facts with exact source locators.",
        ),
        step(
          "Monday afternoon",
          "Define schemas and jurisdiction decision tables",
          [
            "Model incidents, people, overlap groups, datasets, geography, encryption, awareness events, rules, deadlines, owners, and work items.",
            "Translate the supplied authoritative rule contract into trigger, exception, dependency, clock, output, and citation rows for each jurisdiction.",
          ],
          "A human-readable decision table predicts every V1-V6 snapshot before engine implementation.",
        ),
        step(
          "Tuesday to Wednesday",
          "Implement population, trigger, and deadline engines",
          [
            "Parse and validate evidence, deduplicate people through overlap groups, exclude network-disproved datasets, and retain row-level reasons.",
            "Implement GDPR, Nigeria section 40, and California section 1798.82/SB 446 rules as configuration-driven decisions with distinct clocks.",
            "Emit confirmed, lower, and upper populations; trigger results; UTC/WAT deadlines; owners; dependencies; and machine-readable work items.",
          ],
          "All V1-V6 snapshots match exact trigger, deadline, population, and work-item expectations.",
        ),
        step(
          "Thursday",
          "Generate notices and governance outputs",
          [
            "Generate regulator notifications, subject notice, deadline ledger, board tables, and roadmap from one frozen engine result.",
            "Preserve uncertainty and legal-source versions; do not turn California into a generic 72-hour rule or collapse separate clocks.",
            "Trace every notice statement to a fact, rule ID, population result, deadline, and owner.",
          ],
          "All human documents agree with work-items.json and contain no hand-entered trigger, date, or count that bypasses the engine.",
        ),
        step(
          "Friday morning",
          "Run changed-fact fixtures and rehearse defense",
          [
            "Run the complete suite with changed awareness time, key status, overlap groups, and California count without editing source.",
            "Rehearse tracing two fixtures from source row through schema, population, rule ID, clock, deadline, and generated notice action.",
          ],
          "Snapshot tests remain green and every changed input produces the expected controlled downstream change.",
        ),
        step(
          "Friday before 18:10 WAT",
          "Freeze the defensible breach record",
          [
            "Package engine, rules, schemas, tests, snapshots, ledger, population calculation, work items, notices, board memo, roadmap, video URL, and manifest.",
            "Verify citations and source versions, test the Drive root anonymously, and submit once before the no-revision deadline.",
          ],
          "A reviewer can reproduce each obligation, deadline, count, and notice from the submitted evidence and rules.",
        ),
      ],
    },
  },
};

const FIRST_HOUR: Record<
  AdvancedTrack,
  Record<ProjectNumber, AdvancedProjectWorkflow["firstHour"]>
> = {
  SOC_ANALYSIS: {
    1: {
      actions: [
        "Download the project brief, submission contract, technical contract, shared SOC archive, private assignment overlay, and private discrepancy JSON from this room.",
        "Create separate raw, working, source-code, test, output, and evidence directories. Put the issued archive and discrepancy file in raw and never edit them.",
        "Copy the SHA-256 shown beside the issued archive, verify it, then record source filenames and compressed sizes in evidence/source-inventory.csv.",
        "Create a Python virtual environment, confirm DuckDB and pytest work, and run the smallest public schema fixture before opening the full logs.",
      ],
      commands: [
        "mkdir -p soc-stage5/{raw,work,src,tests,outputs,evidence}",
        "shasum -a 256 <issued-soc-archive.tar.gz>",
        "python3 -m venv .venv && source .venv/bin/activate",
        "python -c \"import duckdb; print(duckdb.__version__)\" && pytest --version",
      ],
      readyWhen:
        "The downloaded hash matches the room, raw files are read-only, DuckDB opens, pytest runs, and one public fixture can be loaded without touching the full pack.",
    },
    2: {
      actions: [
        "Download the brief, sealed replay, boundary source, isolation matrix, overlay, and submission contracts. Do not provision a public sensor yet.",
        "Create boundary, replay, pipeline, quarantine, derived, tests, and evidence directories; preserve the replay unchanged in replay/raw.",
        "Read every row of isolation-tests.csv and mark the management source, prohibited egress, private ranges, and metadata targets in your own boundary table.",
        "Start with the sealed replay path. Treat a live T-Pot deployment as optional until all mandatory replay and isolation tests pass.",
      ],
      commands: [
        "mkdir -p soc-stage6/{boundary,replay/raw,pipeline,quarantine,derived,tests,evidence}",
        "shasum -a 256 <issued-replay-archive.tar.gz>",
        "python3 -m venv .venv && source .venv/bin/activate",
        "make test",
      ],
      readyWhen:
        "The replay hash matches, the scored path runs locally, and you can state exactly which management and egress connections must pass or fail.",
    },
    3: {
      actions: [
        "Download the brief, assignment overlay, topology source, policy matrix, variant file, and contracts before starting containers.",
        "Run tool-version and virtualization preflights. Stop if Docker, containerlab, FRRouting images, nftables, or the sensor cannot run on the host.",
        "Create a requirements table from the published matrix; one row must equal one future automated assertion.",
        "Build only one allowed path and one denied path first. Add the rest of the zones after both paths produce usable telemetry.",
      ],
      commands: [
        "docker version",
        "containerlab version",
        "mkdir -p soc-stage7/{configs,services,detections,tests,pcaps,evidence}",
        "make clean && make lab && make test",
      ],
      readyWhen:
        "The host passes preflight, the topology builds from files, and one allowed plus one denied path has a test and packet or firewall evidence.",
    },
    4: {
      actions: [
        "Download the brief, signed replay, source manifest, technique matrix, public fixtures, overlay, and contracts.",
        "Verify the replay and preserve it read-only. Create separate source, normalized, decisions, mutations, tests, and evidence directories.",
        "Parse one source record into a versioned schema while retaining its exact source locator and original fields.",
        "Complete one attack fixture and one benign lookalike as a full automated test before expanding the remaining matrix rows.",
      ],
      commands: [
        "mkdir -p soc-stage8/{rules,decoders,tests,fixtures,raw-events,alerts,evidence}",
        "python3 --version",
        "shasum -a 256 <issued-stage8-archive>",
        "python3 -m unittest discover -v",
      ],
      readyWhen:
        "The replay is verified and immutable, one record has traceable normalization, and one attack/benign pair has an automated expected verdict.",
    },
    5: {
      actions: [
        "Download the sealed case, manifest, brief, overlay, contracts, and templates. Do not open evidence before verifying and recording its hashes.",
        "Create original, working-copy, parsed, timeline, recovered, detections, tests, queries, and evidence directories. Keep original evidence read-only.",
        "Inventory every evidence file, expected parser, source timezone, and acquisition hash. Record the manifest-tampered item as a finding rather than repairing it.",
        "Parse one small source into a common timeline schema with raw locator, original timestamp, normalized UTC time, host, identity, event type, and parser status.",
      ],
      commands: [
        "mkdir -p soc-stage9/{original,working,parsed,timeline-builder,recovered,detections,tests,queries,evidence}",
        "shasum -a 256 <sealed-case-archive>",
        "python3 -m venv .venv && source .venv/bin/activate",
        "zeek --version && python --version",
      ],
      readyWhen:
        "Acquisition hashes are recorded, originals are untouched, source clocks are listed, and one parser produces traceable normalized events.",
    },
  },
  ETHICAL_HACKING: {
    1: {
      actions: [
        "Download the brief, shared loopback lab, parser fixtures, assignment overlay, and contracts. Use no public target, VPN, or internet host.",
        "Extract the lab, copy the exact evidence marker from this room, and start local_lab.py with that marker and a new lab-runtime directory.",
        "Open the generated scope.csv before scanning. Convert every IN row and the OUT decoy into automated pre-request scope tests.",
        "Create the CLI skeleton with --target, --scope, --output, and --rate, then make one permitted request and write it to request-ledger.csv.",
      ],
      commands: [
        "mkdir -p eh-stage5/{recon-engine,tests,schemas,raw-output,evidence,lab-runtime}",
        "python3 local_lab.py --marker <ROOM_MARKER> --output lab-runtime",
        "sed -n '1,20p' lab-runtime/scope.csv",
        "python3 -m pytest -q",
      ],
      readyWhen:
        "The target binds only to loopback, scope.csv is understood, the OUT decoy has zero requests, and one IN request appears in both engine and target ledgers.",
    },
    2: {
      actions: [
        "Download the vulnerable and patched Vagrant source, assignment overlay, service contract, brief, and submission contracts.",
        "Create a host-only network, bring up the vulnerable target and Kali attacker, run health checks, and save a clean named target snapshot.",
        "Create a scope file with only the assigned target addresses and prove neither VM routes to production or public targets.",
        "Enumerate into raw transcripts first. Write foothold and privilege-escalation preconditions before writing exploit code.",
      ],
      commands: [
        "mkdir -p eh-stage6/{exploit-chain,tests,patches,transcripts,evidence}",
        "vagrant up",
        "vagrant snapshot save clean-start",
        "python3 -m pytest -q",
      ],
      readyWhen:
        "The isolated range is healthy, clean-start restores successfully, scope is explicit, and the selected path has evidence-backed preconditions.",
    },
    3: {
      actions: [
        "Download the brief, private overlay, Terraform/CloudGoat source, business tests, release manifest, and contracts before creating cloud resources.",
        "Use a dedicated lab account, enable root MFA, create USD 3 and USD 4 alerts plus the required budget restriction, and save proof.",
        "Confirm the active account, role, and assigned region. Stop immediately if the identity is not the dedicated lab principal.",
        "Run Terraform plan and inspect every proposed service class before apply; record the teardown deadline at deployment time.",
      ],
      commands: [
        "aws sts get-caller-identity",
        "aws configure get region",
        "terraform version",
        "terraform plan -out=tfplan",
      ],
      readyWhen:
        "The account and region are correct, MFA and cost controls are proven, the plan contains only assigned resources, and CloudTrail coverage is ready.",
    },
    4: {
      actions: [
        "Download the brief, shared B2 archive, private candidate JSON, public edge fixtures, cleanup interface, and contracts.",
        "Generate only your assigned portable range and record the initial manifest and health output.",
        "Parse source-records.json into your own versioned graph without embedding names, SIDs, proof values, or expected paths.",
        "Choose one candidate edge and validate it directly against its primary object, ACL, membership, SPN, or event record.",
      ],
      commands: [
        "mkdir -p eh-stage8/{ad-range,enumeration,automation,tests,windows-events,detections,remediation,evidence}",
        "python3 portable_range.py build --assignment candidate.json --out ad-range",
        "python3 portable_range.py health --root ad-range",
        "shasum -a 256 candidate.json ad-range/manifest.json",
      ],
      readyWhen:
        "The candidate binding is correct, portable range health is green, a clean rebuild works, and one graph edge has direct source evidence.",
    },
    5: {
      actions: [
        "Download the vulnerable and patched estate, private target overlay, machine-readable RoE, brief, contracts, and report templates.",
        "Sign the RoE, start both estates only on the dedicated local Docker network, and record clean health-check results.",
        "Write a scope-enforcement test before running discovery: unlisted host, port, method, excessive rate, and bulk-record requests must be rejected.",
        "Use your recon engine to create a service inventory and request ledger. Validate one finding manually before building the full chain.",
      ],
      commands: [
        "mkdir -p eh-stage9/{engagement-suite,evidence,finding-tests,chain-runner,reports,results}",
        "docker compose up -d",
        "docker compose ps",
        "python3 -m pytest -q finding-tests",
      ],
      readyWhen:
        "Both releases are healthy, scope tests fail closed, the service inventory is complete, and one finding has reproducible raw evidence.",
    },
  },
  GRC: {
    1: {
      actions: [
        "Download the evidence pack, control-state JSON, public fixtures, mapping draft, private board overlay, brief, and contracts.",
        "Create evidence, policy-bundle, schemas, tests, generated, and reports directories. Preserve the supplied evidence unchanged.",
        "Write the three assigned control outcomes, board capacity, deadline, and constraints at the top of decision-log.md before reviewing solutions.",
        "Run OPA and pytest version checks, then copy one public fixture into tests without changing its expected result.",
      ],
      commands: [
        "mkdir -p grc-stage5/{evidence,policy-bundle,schemas,tests,generated,reports}",
        "opa version",
        "python3 -m venv .venv && source .venv/bin/activate",
        "opa test ./policy-bundle -v",
      ],
      readyWhen:
        "Exactly three outcomes and all constraints are recorded, OPA runs, the input schema is identified, and one public fixture is ready for test-first implementation.",
    },
    2: {
      actions: [
        "Download the due-diligence pack, technical exports, public fixtures, data-flow inputs, private overlay, brief, and contracts.",
        "Create immutable input, schemas, validators, tests, generated verdicts, graph, decision, and evidence directories.",
        "List every questionnaire claim and pair it with the exact evidence that would prove, disprove, or leave the claim insufficient.",
        "Choose one export format, write its JSON Schema and one valid plus one invalid fixture, then produce a reason-coded verdict.",
      ],
      commands: [
        "mkdir -p grc-stage6/{input,schemas,vendor-verifier,tests,generated,graph,decision,evidence}",
        "shasum -a 256 <issued-vendor-pack>",
        "python3 -m venv .venv && source .venv/bin/activate",
        "pytest -q",
      ],
      readyWhen:
        "Inputs are immutable, the claim-evidence matrix exists, and one technical export produces pass/fail/insufficient/malformed with an exact locator.",
    },
    3: {
      actions: [
        "Download the audit evidence pack, populations, severity rules, prior findings, public fixtures, private overlay, brief, and contracts.",
        "Create immutable evidence, populations, schemas, audit-engine, tests, generated, reports, and evidence-index directories.",
        "Write the audit scope, period, criteria, entities, controls, evidence-age rule, and exclusions before evaluating any item.",
        "Verify one evidence hash and run one marker-seeded sample twice; save both sample outputs and compare them.",
      ],
      commands: [
        "mkdir -p grc-stage7/{evidence,populations,schemas,audit-engine,tests,generated,reports}",
        "shasum -a 256 <issued-audit-pack>",
        "python3 -m venv .venv && source .venv/bin/activate",
        "pytest -q",
      ],
      readyWhen:
        "Scope and criteria are frozen, evidence integrity is being checked, and the same marker produces the same sample IDs twice.",
    },
    4: {
      actions: [
        "Download the portable host sandbox, vulnerability export, service contract, risk fixtures, brief, and private budget overlay.",
        "Generate a clean sandbox and record its baseline manifest, configuration inventory, security failures, and green service assertions.",
        "Define a versioned control schema containing preconditions, ordered changes, validation, rollback, dependencies, and reason codes.",
        "Select one control and write its exact change, service risk, rollback, and expected test before implementing the compiler.",
      ],
      commands: [
        "mkdir -p grc-stage8/{hardening-role,tests,rollback,before,after,risk-model,evidence}",
        "python3 portable_host.py build --out portable-host",
        "python3 portable_host.py check --root portable-host",
        "shasum -a 256 portable-host/baseline-manifest.json",
        "python3 -m unittest discover -v",
      ],
      readyWhen:
        "The immutable baseline exists, service tests pass, all initial security failures are recorded, and one control has a written rollback and acceptance test.",
    },
    5: {
      actions: [
        "Download the breach evidence, data inventory, overlap groups, jurisdiction snapshots, authority configuration, private overlay, brief, and contracts.",
        "Create immutable input, schemas, rules, engine, tests, snapshots, generated notices, board outputs, and evidence directories.",
        "Create separate columns for occurrence, detection, awareness, processor notice, regulator notice, consumer notice, and AG sample notice in UTC and WAT.",
        "Take one V1-V6 fixture and manually predict trigger, controlling clock, deadline, population, and work item before writing engine code.",
      ],
      commands: [
        "mkdir -p grc-stage9/{input,schemas,rules,breach-engine,tests,variant-snapshots,generated,evidence}",
        "shasum -a 256 <issued-breach-pack>",
        "python3 -m venv .venv && source .venv/bin/activate",
        "pytest -q",
      ],
      readyWhen:
        "Inputs are frozen, all clocks are distinct, source authorities and versions are recorded, and one fixture has a written expected result ready for a test.",
    },
  },
};

export function advancedProjectWorkflow(
  track: AdvancedTrack,
  project: AdvancedProject,
): AdvancedProjectWorkflow {
  return {
    ...WORKFLOWS[track][project.number],
    firstHour: FIRST_HOUR[track][project.number],
  };
}
