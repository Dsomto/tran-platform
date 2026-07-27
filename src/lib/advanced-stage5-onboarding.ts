import type { AdvancedTrack } from "./advanced-stage";

export type StageFiveCommandGroup = {
  label: string;
  commands: string[];
  expected: string;
};

export type StageFiveMachinePath = {
  title: string;
  badge: string;
  summary: string;
  important?: string;
  commandGroups: StageFiveCommandGroup[];
};

export type StageFiveStartStep = {
  title: string;
  instruction: string;
  commands: string[];
  windowsCommands?: string[];
  expected: string;
};

export type StageFiveReportGuide = {
  purpose: string;
  files: Array<{
    name: string;
    role: string;
  }>;
  sections: Array<{
    title: string;
    mustExplain: string;
  }>;
  writingRules: string[];
  finalCheck: string;
};

export type StageFiveOnboarding = {
  oneSentence: string;
  jobParts: string[];
  notTheTask: string;
  downloadItems: string[];
  machinePaths: StageFiveMachinePath[];
  startSteps: StageFiveStartStep[];
  reportGuide: StageFiveReportGuide;
  firstMilestone: string;
};

const ONBOARDING: Record<AdvancedTrack, StageFiveOnboarding> = {
  SOC_ANALYSIS: {
    oneSentence:
      "You are building a small application that reads five messy log sources, cleans and joins them, finds three connected attacks, and explains which of your 96 assigned alerts are harmless or need escalation.",
    jobParts: [
      "Load every auth, web, DNS, firewall, and endpoint row without changing the original files. Every row must end as accepted, duplicated, or quarantined with a reason.",
      "Turn the different source formats into one consistent event format. Correct clocks and identity aliases through rules that also work on unseen data.",
      "Write reusable hunt queries that connect activity across at least two independent sources. Do not put the known IPs, people, times, campaign names, or expected counts into your code.",
      "Check each of your 96 review IDs against the raw event and its change record, then produce a repeatable evidence-backed verdict and the required submission files.",
    ],
    notTheTask:
      "This is not a request to grep for suspicious strings, manually edit a spreadsheet, or write a report first. The main product is a tested program that rebuilds the database and results from untouched input files.",
    downloadItems: [
      "Your shared artifact: soc-analysis-stage-5-shared-b1.tar.gz.",
      "Your private assignment overlay PDF and your private Stage 5 discrepancy JSON. The discrepancy file belongs only to your account.",
      "Project brief, Submission contract, Technical assessment contract, and Stage integrity attestation.",
      "Public schema fixtures, DuckDB starter, Hunt templates, evidence-index template, assessment-manifest template, and continuity record.",
    ],
    machinePaths: [
      {
        title: "Host computer: macOS or Linux",
        badge: "Use this if it already works",
        summary:
          "Use your normal computer when it has Python 3.11 or newer, at least 8 GB RAM, and enough disk. You do not need a VM for this project.",
        commandGroups: [
          {
            label: "Create the workspace and move the archive",
            commands: [
              "mkdir -p ~/ubi-stage5-soc/downloads ~/ubi-stage5-soc/project/{raw,work,src,tests/fixtures,queries,outputs,evidence}",
              "cd ~/ubi-stage5-soc",
              "cp ~/Downloads/soc-analysis-stage-5-shared-b1.tar.gz downloads/",
            ],
            expected: "The workspace contains downloads/ and project/; the issued archive is inside downloads/.",
          },
          {
            label: "Verify and extract the issued archive",
            commands: [
              "shasum -a 256 downloads/soc-analysis-stage-5-shared-b1.tar.gz  # macOS",
              "sha256sum downloads/soc-analysis-stage-5-shared-b1.tar.gz     # Linux",
              "tar -xzf downloads/soc-analysis-stage-5-shared-b1.tar.gz -C project/raw",
              "chmod -R a-w project/raw/evidence",
            ],
            expected: "Use only the hash command for your OS. Its value matches the case desk and project/raw/evidence contains five source files plus the manifests.",
          },
          {
            label: "Create the Python environment",
            commands: [
              "python3 --version",
              "python3 -m venv .venv",
              "source .venv/bin/activate",
              "python -m pip install --upgrade pip",
              "python -m pip install duckdb pytest",
              "python -m pip freeze > requirements.txt",
            ],
            expected: "Python reports 3.11 or newer; DuckDB and pytest install only inside .venv.",
          },
        ],
      },
      {
        title: "Host computer: Windows PowerShell",
        badge: "No VM required",
        summary:
          "Use PowerShell on Windows when Python 3.11 or newer is installed. Run these commands in PowerShell, not Command Prompt.",
        commandGroups: [
          {
            label: "Create the workspace and copy the archive",
            commands: [
              "$Root = \"$HOME\\ubi-stage5-soc\"",
              "New-Item -ItemType Directory -Force -Path \"$Root\\downloads\", \"$Root\\project\\raw\", \"$Root\\project\\work\", \"$Root\\project\\src\", \"$Root\\project\\tests\\fixtures\", \"$Root\\project\\queries\", \"$Root\\project\\outputs\", \"$Root\\project\\evidence\"",
              "Copy-Item \"$HOME\\Downloads\\soc-analysis-stage-5-shared-b1.tar.gz\" \"$Root\\downloads\\\"",
              "Set-Location $Root",
            ],
            expected: "The archive exists at downloads\\soc-analysis-stage-5-shared-b1.tar.gz.",
          },
          {
            label: "Verify and extract the issued archive",
            commands: [
              "Get-FileHash .\\downloads\\soc-analysis-stage-5-shared-b1.tar.gz -Algorithm SHA256",
              "tar -xzf .\\downloads\\soc-analysis-stage-5-shared-b1.tar.gz -C .\\project\\raw",
              "Get-ChildItem .\\project\\raw\\evidence -Recurse -File | ForEach-Object { $_.IsReadOnly = $true }",
            ],
            expected: "The SHA256 value matches the case desk and project\\raw\\evidence contains the untouched pack.",
          },
          {
            label: "Create the Python environment",
            commands: [
              "py -3.11 --version",
              "py -3.11 -m venv .venv",
              "Set-ExecutionPolicy -Scope Process Bypass",
              ". .\\.venv\\Scripts\\Activate.ps1",
              "python -m pip install --upgrade pip",
              "python -m pip install duckdb pytest",
              "python -m pip freeze | Set-Content requirements.txt",
            ],
            expected: "The prompt shows (.venv), and python can import DuckDB and run pytest.",
          },
        ],
      },
      {
        title: "Ubuntu Linux VM",
        badge: "Clean fallback",
        summary:
          "Choose this if your host Python setup is unreliable. Give the VM 4 vCPU, 8 GB RAM, and at least 20 GB disk, then download or copy the archive into the VM.",
        important:
          "Do all coding, extraction, testing, and benchmarking inside the VM. Do not keep the raw pack on the host while running the pipeline in the VM through a slow shared folder.",
        commandGroups: [
          {
            label: "Install the small toolchain",
            commands: [
              "sudo apt update",
              "sudo apt install -y python3 python3-venv python3-pip git make",
              "python3 --version",
            ],
            expected: "Python is 3.11 or newer and git plus make are available.",
          },
          {
            label: "Create, verify, and prepare the project",
            commands: [
              "mkdir -p ~/ubi-stage5-soc/downloads ~/ubi-stage5-soc/project/{raw,work,src,tests/fixtures,queries,outputs,evidence}",
              "cp ~/Downloads/soc-analysis-stage-5-shared-b1.tar.gz ~/ubi-stage5-soc/downloads/",
              "cd ~/ubi-stage5-soc",
              "sha256sum downloads/soc-analysis-stage-5-shared-b1.tar.gz",
              "tar -xzf downloads/soc-analysis-stage-5-shared-b1.tar.gz -C project/raw",
              "chmod -R a-w project/raw/evidence",
              "python3 -m venv .venv && source .venv/bin/activate",
              "python -m pip install duckdb pytest",
              "python -m pip freeze > requirements.txt",
            ],
            expected: "The hash matches, raw evidence is read-only, and the isolated Python environment is ready.",
          },
        ],
      },
    ],
    startSteps: [
      {
        title: "Put the private files and public fixture in the workspace",
        instruction:
          "Copy your downloaded discrepancy JSON into project/raw/private and the public schema fixture into project/tests/fixtures. Keep the original filenames.",
        commands: [
          "mkdir -p project/raw/private",
          "cp downloads/*discrepancy.json project/raw/private/",
          "cp downloads/schema-fixtures.json project/tests/fixtures/",
          "ls -l project/raw/private project/tests/fixtures",
        ],
        windowsCommands: [
          "New-Item -ItemType Directory -Force -Path .\\project\\raw\\private",
          "Copy-Item .\\downloads\\*discrepancy.json .\\project\\raw\\private\\",
          "Copy-Item .\\downloads\\schema-fixtures.json .\\project\\tests\\fixtures\\",
          "Get-ChildItem .\\project\\raw\\private, .\\project\\tests\\fixtures",
        ],
        expected: "There is one private discrepancy JSON and one schema-fixtures.json. Do not use another intern's discrepancy file.",
      },
      {
        title: "Inventory the pack before writing hunt logic",
        instruction:
          "Read the source manifest, list the five source files, and count physical lines. Record these observations in project/evidence/source-inventory.csv; do not change the supplied manifest.",
        commands: [
          "head -n 10 project/raw/evidence/source-manifest.csv",
          "find project/raw/evidence/source -maxdepth 1 -type f -print | sort",
          "wc -l project/raw/evidence/source/*.jsonl",
          "python -m json.tool project/tests/fixtures/schema-fixtures.json > /dev/null",
        ],
        windowsCommands: [
          "Get-Content .\\project\\raw\\evidence\\source-manifest.csv -TotalCount 10",
          "Get-ChildItem .\\project\\raw\\evidence\\source\\*.jsonl | Sort-Object Name",
          "Get-ChildItem .\\project\\raw\\evidence\\source\\*.jsonl | ForEach-Object { \"$($_.Name): $((Get-Content $_.FullName | Measure-Object -Line).Lines)\" }",
          "python -m json.tool .\\project\\tests\\fixtures\\schema-fixtures.json > $null",
        ],
        expected: "You can name all five sources, the fixture JSON is valid, and you have recorded the baseline counts before processing.",
      },
      {
        title: "Make one normalization test fail, then pass",
        instruction:
          "Create tests/test_normalization.py. Start with one AUTH fixture. Assert the normalized time, identity, and event type shown by the public fixture; then write only enough normalizer code to pass that test.",
        commands: [
          "pytest -q project/tests/test_normalization.py",
          "pytest -q project/tests/test_normalization.py -vv",
        ],
        windowsCommands: [
          "pytest -q .\\project\\tests\\test_normalization.py",
          "pytest -q .\\project\\tests\\test_normalization.py -vv",
        ],
        expected: "The test fails before implementation and passes after your AUTH adapter works. Your adapter reads fixture data; it does not embed AUTH-V1's answer as a special case.",
      },
      {
        title: "Create the final build interface early",
        instruction:
          "Add a Makefile with the two required entry points. At first, make test may run only your small test and make build may be incomplete; keep extending the same commands instead of inventing a second manual process.",
        commands: [
          "make test",
          "rm -rf project/work/*",
          "make build INPUT=project/raw/evidence",
        ],
        windowsCommands: [
          "pytest -q .\\project\\tests",
          "Remove-Item .\\project\\work\\* -Recurse -Force -ErrorAction SilentlyContinue",
          "python -m hunt_engine.cli build --input .\\project\\raw\\evidence --work .\\project\\work",
          "Get-Content .\\Makefile",
        ],
        expected: "make test is the single unattended test command. By submission, make build from the empty work directory creates clean.db, results.json, quarantine.csv, and reconciliation.json.",
      },
    ],
    reportGuide: {
      purpose:
        "The report tells a reviewer what you built, how the pipeline reached its conclusions, what the evidence proves, and how to reproduce the work. It must interpret the machine outputs rather than repeat them.",
      files: [
        {
          name: "hunt-investigation-report.pdf",
          role: "The required human-readable investigation and engineering report for your complete SOC Stage 5 work.",
        },
      ],
      sections: [
        {
          title: "Executive result",
          mustExplain: "State the investigation objective, the main campaign conclusions, the disposition of the 96 assigned reviews, and the most important operational recommendation in language a SOC lead can understand.",
        },
        {
          title: "Environment and reproduction",
          mustExplain: "State the operating system, Python and DuckDB versions, repository commit, input archive hash, private discrepancy filename, exact make test and make build commands, runtime, and peak memory.",
        },
        {
          title: "Data handling and quality",
          mustExplain: "Describe each source, schema versions, row accounting, quarantine reasons, duplicate logic, timestamp correction, equal-time ordering, and identity or host alias resolution. Explain why the raw files remained untouched.",
        },
        {
          title: "Hunt method and campaign findings",
          mustExplain: "For each campaign, explain the hypothesis, correlation method, sequence of activity, at least two independent source locators per decisive edge, confidence, one rejected alternative, and the next collection action.",
        },
        {
          title: "Review-case reconciliation",
          mustExplain: "Explain the decision rule used for all 96 assigned review IDs, how raw activity was matched to asset, actor, approval, status, and time window, the aggregate outcome, and representative examples linked to tp-fp-table.csv.",
        },
        {
          title: "Testing, limitations, and recommendations",
          mustExplain: "Summarize public fixture coverage, clean rebuild and determinism results, benchmark results, known limitations, unresolved uncertainty, and concrete detection or collection improvements.",
        },
      ],
      writingRules: [
        "Write in your own words and describe the work you actually performed. Do not paste terminal output or generated tool text as the explanation.",
        "Every material claim must point to evidence-index.csv and include an exact raw locator, generated output locator, or query name.",
        "Use tables and small diagrams when they clarify a timeline, data flow, campaign relationship, or reconciliation rule; screenshots are supporting orientation only.",
        "Keep secrets and private overlay facts inside the submitted private folder. Do not publish another intern's discrepancy data or your report publicly.",
        "Ensure every number and verdict in the PDF matches the final CSV, JSON, database, test, and benchmark outputs.",
      ],
      finalCheck:
        "A reviewer who reads the PDF and follows its locators must be able to understand the investigation, find the underlying evidence quickly, and reproduce the results with the submitted commands. There is no supplied report template.",
    },
    firstMilestone:
      "Stop the setup phase when the archive hash matches, raw files are read-only, all downloads are present, one public AUTH fixture passes through your own adapter, and make test runs that check. Only then load the complete pack.",
  },

  ETHICAL_HACKING: {
    oneSentence:
      "You are building your own safe reconnaissance program, using it only against a practice target running on your computer, following the clues between two allowed local services, reading user.txt, and stopping there.",
    jobParts: [
      "Start the supplied local target with your room marker. It creates fresh ports, a scope file, and an entry URL every time it starts.",
      "Build a recon CLI that rejects anything outside scope before opening a socket, keeps a request budget, saves raw output, and normalizes observations.",
      "Handle ordinary HTTP, a line-oriented service, wildcard responses, virtual-host differences, interruption, and a missing optional adapter through tested modules.",
      "Use your program's observations to reach the issued user.txt foothold. Preserve the request chain and target ledger, then stop without privilege escalation.",
    ],
    notTheTask:
      "This is not permission to scan the internet, your home network, another VM, or the OUT decoy. It is also not a Metasploit or exploitation task. The target is local, the discovery engine is the main product, and user.txt is the hard stop.",
    downloadItems: [
      "Your shared artifact: ethical-hacking-stage-5-shared-b1.tar.gz. It contains START-HERE.md, local_lab.py, parser fixtures, the rules of engagement, and the tool interface.",
      "Your private assignment overlay PDF. Copy the exact UBI-A5-... evidence marker from it; the marker is not the foothold flag.",
      "Project brief, Submission contract, Technical assessment contract, and Stage integrity attestation.",
      "Evidence-index template, assessment-manifest template, defense-readiness guide, and continuity record.",
    ],
    machinePaths: [
      {
        title: "Host computer: macOS or Linux",
        badge: "Recommended",
        summary:
          "This is the simplest path. The lab uses Python's standard library, binds only to 127.0.0.1, and requires no Docker, VPN, cloud account, or third-party target.",
        commandGroups: [
          {
            label: "Create and verify the workspace",
            commands: [
              "mkdir -p ~/ubi-stage5-eh/{downloads,lab,lab-runtime,recon-engine/{recon_engine,tests/fixtures,run/raw,run/normalized,evidence}}",
              "cd ~/ubi-stage5-eh",
              "cp ~/Downloads/ethical-hacking-stage-5-shared-b1.tar.gz downloads/",
              "shasum -a 256 downloads/ethical-hacking-stage-5-shared-b1.tar.gz  # macOS",
              "sha256sum downloads/ethical-hacking-stage-5-shared-b1.tar.gz     # Linux",
              "tar -xzf downloads/ethical-hacking-stage-5-shared-b1.tar.gz -C lab",
              "python3 --version",
            ],
            expected: "Use only your OS hash command. The hash matches the room, Python is 3.11 or newer, and lab/evidence/local_lab.py exists.",
          },
          {
            label: "Start the local target in Terminal A",
            commands: [
              "cd ~/ubi-stage5-eh",
              "python3 lab/evidence/local_lab.py --marker <ROOM_MARKER> --output lab-runtime",
            ],
            expected: "The terminal says the target started, names assignment.json and scope.csv, and confirms every service is bound to 127.0.0.1. Leave Terminal A open.",
          },
          {
            label: "Inspect scope in Terminal B before sending traffic",
            commands: [
              "cd ~/ubi-stage5-eh",
              "python3 -m json.tool lab-runtime/assignment.json",
              "cat lab-runtime/scope.csv",
            ],
            expected: "You see two IN loopback endpoints, one OUT decoy, an entry_url, request budget 240, and maximum rate 25. Do not connect to the OUT port.",
          },
        ],
      },
      {
        title: "Host computer: Windows PowerShell",
        badge: "No VM required",
        summary:
          "Windows can run the same self-contained lab. Use two PowerShell windows: one keeps the target running and the second runs your checks and recon engine.",
        commandGroups: [
          {
            label: "Create, verify, and extract",
            commands: [
              "$Root = \"$HOME\\ubi-stage5-eh\"",
              "New-Item -ItemType Directory -Force -Path \"$Root\\downloads\", \"$Root\\lab\", \"$Root\\lab-runtime\", \"$Root\\recon-engine\\recon_engine\", \"$Root\\recon-engine\\tests\\fixtures\", \"$Root\\recon-engine\\run\\raw\", \"$Root\\recon-engine\\run\\normalized\", \"$Root\\recon-engine\\evidence\"",
              "Copy-Item \"$HOME\\Downloads\\ethical-hacking-stage-5-shared-b1.tar.gz\" \"$Root\\downloads\\\"",
              "Set-Location $Root",
              "Get-FileHash .\\downloads\\ethical-hacking-stage-5-shared-b1.tar.gz -Algorithm SHA256",
              "tar -xzf .\\downloads\\ethical-hacking-stage-5-shared-b1.tar.gz -C .\\lab",
              "py -3.11 --version",
            ],
            expected: "The hash matches, Python is 3.11 or newer, and lab\\evidence\\local_lab.py exists.",
          },
          {
            label: "Start the target in PowerShell A",
            commands: [
              "Set-Location \"$HOME\\ubi-stage5-eh\"",
              "py -3.11 .\\lab\\evidence\\local_lab.py --marker <ROOM_MARKER> --output .\\lab-runtime",
            ],
            expected: "The target remains running and states that all services bind to 127.0.0.1.",
          },
          {
            label: "Inspect scope in PowerShell B",
            commands: [
              "Set-Location \"$HOME\\ubi-stage5-eh\"",
              "Get-Content .\\lab-runtime\\assignment.json",
              "Import-Csv .\\lab-runtime\\scope.csv | Format-Table",
            ],
            expected: "You can identify the two IN endpoints and the OUT decoy before your code opens any socket.",
          },
        ],
      },
      {
        title: "Ubuntu Linux VM",
        badge: "Optional isolation",
        summary:
          "Use a VM only if you want a clean Linux workspace. Give it 2 vCPU, 4 GB RAM, and 10 GB disk. The assignment does not require Kali.",
        important:
          "Run both local_lab.py and your recon engine inside the same VM. A target on the host's 127.0.0.1 is not reachable as 127.0.0.1 from the VM, and exposing the target to bridge that gap is prohibited.",
        commandGroups: [
          {
            label: "Install Python and create the workspace",
            commands: [
              "sudo apt update",
              "sudo apt install -y python3 python3-venv git make",
              "mkdir -p ~/ubi-stage5-eh/{downloads,lab,lab-runtime,recon-engine/{recon_engine,tests/fixtures,run/raw,run/normalized,evidence}}",
              "cp ~/Downloads/ethical-hacking-stage-5-shared-b1.tar.gz ~/ubi-stage5-eh/downloads/",
              "cd ~/ubi-stage5-eh",
              "sha256sum downloads/ethical-hacking-stage-5-shared-b1.tar.gz",
              "tar -xzf downloads/ethical-hacking-stage-5-shared-b1.tar.gz -C lab",
            ],
            expected: "The archive is verified and extracted inside the VM; local_lab.py and the engine workspace are on the same VM filesystem.",
          },
          {
            label: "Start and inspect the VM-local target",
            commands: [
              "python3 lab/evidence/local_lab.py --marker <ROOM_MARKER> --output lab-runtime",
              "python3 -m json.tool lab-runtime/assignment.json  # run in a second VM terminal",
              "cat lab-runtime/scope.csv                         # run in a second VM terminal",
            ],
            expected: "Both IN services are VM-local loopback endpoints and the OUT decoy is clearly listed before testing begins.",
          },
        ],
      },
    ],
    startSteps: [
      {
        title: "Copy the contracts and fixtures into your engine project",
        instruction:
          "Keep the supplied files unchanged. Sign the rules of engagement and copy the parser fixture into your test fixture directory.",
        commands: [
          "cp lab/evidence/parser-fixtures.json recon-engine/tests/fixtures/",
          "cp lab/evidence/tool-interface.md recon-engine/",
          "cp lab/evidence/rules-of-engagement.md recon-engine/",
          "python3 -m json.tool recon-engine/tests/fixtures/parser-fixtures.json > /dev/null",
        ],
        windowsCommands: [
          "Copy-Item .\\lab\\evidence\\parser-fixtures.json .\\recon-engine\\tests\\fixtures\\",
          "Copy-Item .\\lab\\evidence\\tool-interface.md .\\recon-engine\\",
          "Copy-Item .\\lab\\evidence\\rules-of-engagement.md .\\recon-engine\\",
          "py -3.11 -m json.tool .\\recon-engine\\tests\\fixtures\\parser-fixtures.json > $null",
        ],
        expected: "The fixture is valid JSON and the engine workspace contains the controlling interface and signed scope rules.",
      },
      {
        title: "Build the scope guard before the scanner",
        instruction:
          "Write tests that load scope.csv and reject the OUT port, a non-loopback address, an unlisted port, and a request after the budget. Your network code must call this guard before any socket or HTTP request.",
        commands: [
          "cd recon-engine",
          "python3 -m unittest discover -s tests -v",
        ],
        windowsCommands: [
          "Set-Location .\\recon-engine",
          "py -3.11 -m unittest discover -s tests -v",
        ],
        expected: "The rejection tests pass without sending traffic. lab-runtime/target-request-ledger.jsonl remains empty while you test rejected destinations.",
      },
      {
        title: "Create the required CLI shape",
        instruction:
          "Create a Python package and CLI with --target, --scope, --output, and --rate. At this point it may only validate arguments and scope; it must fail clearly on missing or unsafe values.",
        commands: [
          "python3 -m recon_engine.cli --help",
          "python3 -m recon_engine.cli --target 127.0.0.1 --scope ../lab-runtime/scope.csv --output run --rate 25",
        ],
        windowsCommands: [
          "py -3.11 -m recon_engine.cli --help",
          "py -3.11 -m recon_engine.cli --target 127.0.0.1 --scope ..\\lab-runtime\\scope.csv --output run --rate 25",
        ],
        expected: "--help lists all four required options. A safe run creates its output directory and an unsafe target is rejected before network activity.",
      },
      {
        title: "Make one allowed observation end to end",
        instruction:
          "Use the entry target from assignment.json. Save the unedited response in run/raw, convert it into the required normalized schema, and record the request in your own request ledger. Do not probe the OUT endpoint.",
        commands: [
          "python3 -m recon_engine.cli --target 127.0.0.1 --scope ../lab-runtime/scope.csv --output run --rate 25",
          "python3 -m json.tool run/run.json",
          "wc -l run/normalized/assets.jsonl ../lab-runtime/target-request-ledger.jsonl",
        ],
        windowsCommands: [
          "py -3.11 -m recon_engine.cli --target 127.0.0.1 --scope ..\\lab-runtime\\scope.csv --output run --rate 25",
          "py -3.11 -m json.tool .\\run\\run.json",
          "(Get-Content .\\run\\normalized\\assets.jsonl | Measure-Object -Line).Lines",
          "(Get-Content ..\\lab-runtime\\target-request-ledger.jsonl | Measure-Object -Line).Lines",
        ],
        expected: "One allowed request appears in both ledgers, at least one normalized observation points to its raw file, and the OUT endpoint still has zero requests.",
      },
    ],
    reportGuide: {
      purpose:
        "The report explains the authorized attack surface, the recon engine you built, the discovery path your evidence supports, and why the foothold proof is trustworthy and within scope. Scanner output by itself is not the report.",
      files: [
        {
          name: "attack-surface-report.pdf",
          role: "The required technical report covering the engine, discovered services, validated foothold path, testing, safety, and recommendations.",
        },
      ],
      sections: [
        {
          title: "Executive result and authorization",
          mustExplain: "State the assessment objective, runtime ID, exact authorized boundary, proof limit, high-level result, and the fact that testing stopped after the assigned user.txt foothold.",
        },
        {
          title: "Environment and engine design",
          mustExplain: "State the operating system and Python version, repository commit, artifact hash, exact commands, CLI interface, module boundaries, normalized schema, request budget, rate handling, timeouts, retries, resume design, and fallback behavior.",
        },
        {
          title: "Scope enforcement and safety proof",
          mustExplain: "Explain how host, port, CIDR, and budget checks occur before network activity. Reconcile the candidate request ledger with the target ledger and prove the OUT decoy and every non-loopback destination received zero requests.",
        },
        {
          title: "Discovery methodology and attack surface",
          mustExplain: "Describe the sequence of observations, wildcard or virtual-host baselining, protocol fingerprinting, validation method, discovered services, and why each reported service is real rather than a scanner guess.",
        },
        {
          title: "Foothold evidence chain",
          mustExplain: "Trace the authorized path from entry observation through the line protocol, route or host evidence, credential discovery, and user.txt retrieval. Cite raw responses, normalized records, and request IDs; refer to foothold-evidence.txt instead of unnecessarily repeating credentials in the narrative.",
        },
        {
          title: "Testing, cleanup, limitations, and recommendations",
          mustExplain: "Report parser, scope, malformed-input, wildcard, interruption, resume, fallback, deduplication, and empty-result tests; then state cleanup performed, limitations, false leads, and improvements for the next assessment.",
        },
      ],
      writingRules: [
        "Write a reasoned assessment, not a chronological dump of commands. Explain why each probe or conclusion was necessary.",
        "Every finding must link to raw-output, normalized.json, request-ledger.csv, and an exact target-ledger locator where applicable.",
        "Sanitize credentials from explanatory screenshots and prose. Keep required private proof in foothold-evidence.txt inside the restricted submission folder.",
        "Clearly distinguish observed fact, analyst inference, rejected explanation, and recommendation.",
        "The PDF, engine output, scope register, ledgers, test results, and foothold evidence must describe the same run and runtime ID.",
      ],
      finalCheck:
        "A reviewer must be able to verify scope compliance, follow the complete evidence chain, understand the engine design, and reproduce the allowed run without guessing. There is no supplied report template.",
    },
    firstMilestone:
      "Stop the setup phase when the local target is running, you can explain every scope.csv row, rejected destinations produce no packets, the CLI exposes the required interface, and one allowed observation is preserved raw and normalized. Do not chase user.txt until this foundation works.",
  },

  GRC: {
    oneSentence:
      "A company can fund exactly three security improvements, and your job is to express those assigned improvements as clear written rules and as executable OPA policies that consistently pass or fail infrastructure evidence.",
    jobParts: [
      "Read the company evidence and your private board overlay. Identify the exact three outcomes assigned to you; you are not allowed to swap them for easier controls.",
      "Separate policy gaps, implementation gaps, process gaps, and weak or missing evidence. Correct the planted bad framework mapping without copying licensed ISO text.",
      "Write Rego policies for the three assigned outcomes. Missing, malformed, incomplete, and expired exception data must fail closed with a reason code.",
      "Run the public fixtures, generate machine-readable decisions and reports, and prove that every written clause maps to evidence, a policy rule, and a test result.",
    ],
    notTheTask:
      "This is not a policy essay or a request to choose any three risks you like. A document-only submission cannot pass. The written addendum and board decision must be generated from and reconciled with the executable control logic.",
    downloadItems: [
      "Your shared artifact: grc-stage-5-shared-b1.tar.gz and your private assignment overlay PDF.",
      "Project brief, Submission contract, Technical assessment contract, and Stage integrity attestation.",
      "Public policy fixtures, Evidence pack, Control-state fixture, and Control map.",
      "Evidence-index template, assessment-manifest template, defense-readiness guide, and continuity record.",
    ],
    machinePaths: [
      {
        title: "Host computer: macOS or Linux",
        badge: "Recommended",
        summary:
          "Use your host when Python 3.11 and OPA run normally. This project needs no VM, cloud account, or production system.",
        commandGroups: [
          {
            label: "Create, verify, and extract the workspace",
            commands: [
              "mkdir -p ~/ubi-stage5-grc/{downloads,project/{input,policy-bundle,schemas,tests,generated,reports,evidence}}",
              "cd ~/ubi-stage5-grc",
              "cp ~/Downloads/grc-stage-5-shared-b1.tar.gz downloads/",
              "shasum -a 256 downloads/grc-stage-5-shared-b1.tar.gz  # macOS",
              "sha256sum downloads/grc-stage-5-shared-b1.tar.gz     # Linux",
              "tar -xzf downloads/grc-stage-5-shared-b1.tar.gz -C project/input",
              "chmod -R a-w project/input/evidence",
            ],
            expected: "Use only your OS hash command. The hash matches the room and the issued shared files are read-only under project/input/evidence.",
          },
          {
            label: "Install or verify OPA",
            commands: [
              "brew install opa  # macOS with Homebrew; skip if already installed",
              "curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64  # Linux amd64",
              "chmod 755 ./opa && mkdir -p ~/bin && mv ./opa ~/bin/opa                   # Linux amd64",
              "export PATH=\"$HOME/bin:$PATH\"",
              "opa version",
            ],
            expected: "Run only the commands for your OS. opa version prints successfully; use the matching arm64 binary from the official OPA install page when your Linux machine is ARM.",
          },
          {
            label: "Create the Python test environment",
            commands: [
              "python3 --version",
              "python3 -m venv .venv",
              "source .venv/bin/activate",
              "python -m pip install --upgrade pip pytest",
              "python -m pip freeze > requirements.txt",
            ],
            expected: "Python is 3.11 or newer and pytest runs inside .venv.",
          },
        ],
      },
      {
        title: "Host computer: Windows PowerShell",
        badge: "No VM required",
        summary:
          "Use PowerShell when Python 3.11 or newer is installed. OPA is a single executable and does not require Docker.",
        commandGroups: [
          {
            label: "Create, verify, and extract",
            commands: [
              "$Root = \"$HOME\\ubi-stage5-grc\"",
              "New-Item -ItemType Directory -Force -Path \"$Root\\downloads\", \"$Root\\project\\input\", \"$Root\\project\\policy-bundle\", \"$Root\\project\\schemas\", \"$Root\\project\\tests\", \"$Root\\project\\generated\", \"$Root\\project\\reports\", \"$Root\\project\\evidence\", \"$Root\\tools\"",
              "Copy-Item \"$HOME\\Downloads\\grc-stage-5-shared-b1.tar.gz\" \"$Root\\downloads\\\"",
              "Set-Location $Root",
              "Get-FileHash .\\downloads\\grc-stage-5-shared-b1.tar.gz -Algorithm SHA256",
              "tar -xzf .\\downloads\\grc-stage-5-shared-b1.tar.gz -C .\\project\\input",
              "Get-ChildItem .\\project\\input\\evidence -Recurse -File | ForEach-Object { $_.IsReadOnly = $true }",
            ],
            expected: "The hash matches and the issued files are extracted without modification.",
          },
          {
            label: "Install OPA for the current workspace",
            commands: [
              "Invoke-WebRequest -Uri \"https://openpolicyagent.org/downloads/latest/opa_windows_amd64.exe\" -OutFile \"$Root\\tools\\opa.exe\"",
              "$env:Path = \"$Root\\tools;$env:Path\"",
              "opa version",
            ],
            expected: "opa version prints successfully from PowerShell.",
          },
          {
            label: "Create the Python environment",
            commands: [
              "py -3.11 -m venv .venv",
              "Set-ExecutionPolicy -Scope Process Bypass",
              ". .\\.venv\\Scripts\\Activate.ps1",
              "python -m pip install --upgrade pip pytest",
              "python -m pip freeze | Set-Content requirements.txt",
            ],
            expected: "The prompt shows (.venv), OPA runs, and pytest is available.",
          },
        ],
      },
      {
        title: "Ubuntu Linux VM",
        badge: "Clean fallback",
        summary:
          "Choose this if you want a predictable Linux environment. Give the VM 2 vCPU, 4 GB RAM, and 10 GB disk. Download all case-desk files inside the VM or copy them once before starting.",
        important:
          "The VM is only a clean workspace. Do not connect it to employer systems or collect real company evidence; every assessment input is synthetic and supplied in the room.",
        commandGroups: [
          {
            label: "Install Python, OPA, and create the workspace",
            commands: [
              "sudo apt update",
              "sudo apt install -y python3 python3-venv python3-pip git make curl",
              "curl -L -o /tmp/opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64",
              "chmod 755 /tmp/opa && sudo mv /tmp/opa /usr/local/bin/opa",
              "opa version",
              "mkdir -p ~/ubi-stage5-grc/{downloads,project/{input,policy-bundle,schemas,tests,generated,reports,evidence}}",
            ],
            expected: "OPA, Python, git, and make are available inside the VM.",
          },
          {
            label: "Verify, extract, and isolate dependencies",
            commands: [
              "cp ~/Downloads/grc-stage-5-shared-b1.tar.gz ~/ubi-stage5-grc/downloads/",
              "cd ~/ubi-stage5-grc",
              "sha256sum downloads/grc-stage-5-shared-b1.tar.gz",
              "tar -xzf downloads/grc-stage-5-shared-b1.tar.gz -C project/input",
              "chmod -R a-w project/input/evidence",
              "python3 -m venv .venv && source .venv/bin/activate",
              "python -m pip install pytest",
              "python -m pip freeze > requirements.txt",
            ],
            expected: "The hash matches, issued inputs are read-only, and the project has an isolated Python environment.",
          },
        ],
      },
    ],
    startSteps: [
      {
        title: "Place every issued input under project/input",
        instruction:
          "Copy the separately downloaded evidence pack, control-state JSON, public fixtures, control map, and private overlay into the workspace. Keep an untouched copy of each.",
        commands: [
          "cp downloads/control-state.json project/input/",
          "cp downloads/public-fixtures.json project/input/",
          "cp downloads/control-mapping.csv project/input/",
          "python -m json.tool project/input/control-state.json > /dev/null",
          "python -m json.tool project/input/public-fixtures.json > /dev/null",
        ],
        windowsCommands: [
          "Copy-Item .\\downloads\\control-state.json .\\project\\input\\",
          "Copy-Item .\\downloads\\public-fixtures.json .\\project\\input\\",
          "Copy-Item .\\downloads\\control-mapping.csv .\\project\\input\\",
          "python -m json.tool .\\project\\input\\control-state.json > $null",
          "python -m json.tool .\\project\\input\\public-fixtures.json > $null",
        ],
        expected: "Both JSON files parse and the workspace contains the board facts, evidence, state, fixtures, and mapping template.",
      },
      {
        title: "Write down the three assigned outcomes before coding",
        instruction:
          "Read the private overlay and control-state input. Put the exact three assigned outcome IDs, board capacity, deadline, applicability facts, and every other material risk disposition in decision-log.md.",
        commands: [
          "python -m json.tool project/input/control-state.json",
          "grep -n \"assigned_control_outcomes\" project/input/control-state.json",
          "test -f project/decision-log.md && sed -n '1,80p' project/decision-log.md",
        ],
        windowsCommands: [
          "python -m json.tool .\\project\\input\\control-state.json",
          "Select-String -Path .\\project\\input\\control-state.json -Pattern \"assigned_control_outcomes\"",
          "if (Test-Path .\\project\\decision-log.md) { Get-Content .\\project\\decision-log.md -TotalCount 80 }",
        ],
        expected: "decision-log.md names exactly three assigned outcomes. It does not replace them with controls you prefer.",
      },
      {
        title: "Create one failing public policy test",
        instruction:
          "Create one Rego package and one _test.rego file. Begin with one published fixture and assert its documented allow/deny, control ID, resource ID, and violation code.",
        commands: [
          "opa fmt --fail project/policy-bundle",
          "opa test project/policy-bundle -v",
        ],
        windowsCommands: [
          "opa fmt --fail .\\project\\policy-bundle",
          "opa test .\\project\\policy-bundle -v",
        ],
        expected: "The test fails before the rule exists, then passes after your generic rule handles the fixture. Do not special-case its asset ID or case ID.",
      },
      {
        title: "Evaluate the supplied state through the same package",
        instruction:
          "After the first generic rule passes its public tests, run OPA against control-state.json and save machine-readable output. Replace <your_package> with the Rego package path you created.",
        commands: [
          "opa eval --format=json --data project/policy-bundle --input project/input/control-state.json 'data.<your_package>.decisions' > project/generated/opa-decisions.json",
          "python -m json.tool project/generated/opa-decisions.json > /dev/null",
        ],
        windowsCommands: [
          "opa eval --format=json --data .\\project\\policy-bundle --input .\\project\\input\\control-state.json 'data.<your_package>.decisions' | Set-Content .\\project\\generated\\opa-decisions.json",
          "python -m json.tool .\\project\\generated\\opa-decisions.json > $null",
        ],
        expected: "opa-decisions.json is valid JSON and every decision includes a policy ID, resource locator, allow/deny, violation code, and evidence locator.",
      },
    ],
    reportGuide: {
      purpose:
        "GRC submits two connected PDFs: one explains the evidence, gaps, mapping, and three-control decision; the other states the enforceable policy language. Both must reconcile with the OPA decisions and tests.",
      files: [
        {
          name: "policy-gap-report.pdf",
          role: "The analytical report explaining the evidence reviewed, gap classification, corrected mapping, exactly three assigned outcomes, deferrals, and implementation decision.",
        },
        {
          name: "policy-addendum.pdf",
          role: "The concise two-page policy instrument stating enforceable requirements for only the three assigned outcomes.",
        },
      ],
      sections: [
        {
          title: "Policy-gap report: executive decision",
          mustExplain: "State the organisation context, board constraint, exactly three assigned outcomes, overall recommendation, implementation sequence, owners, deadline, and the material risks that are deferred, accepted, transferred, or already reduced.",
        },
        {
          title: "Policy-gap report: evidence and gap analysis",
          mustExplain: "Classify each issue as policy, implementation, process, or evidence gap. Grade what each artifact proves and does not prove, address the stale MDM screenshot, and separate unsupported assertions from confirmed control failures.",
        },
        {
          title: "Policy-gap report: mapping and stakeholder judgment",
          mustExplain: "Show the corrected NIST CSF and ISO Annex A identifiers, explain the planted bad mapping, address Engineering and Legal concerns, state legal assumptions and the NDPA source, and avoid reproducing licensed ISO text.",
        },
        {
          title: "Policy-gap report: executable verification",
          mustExplain: "Explain the input schema, Rego package structure, exception fields, fail-closed behavior, violation codes, public-test coverage, generated compliance result, limitations, and exact reproduction commands.",
        },
        {
          title: "Policy addendum: enforceable clauses",
          mustExplain: "For each of the three assigned outcomes, state owner, scope, mandatory requirement, trigger, exception request and approval route, expiry, compensating control, enforcement evidence, non-compliance response, and review cadence.",
        },
        {
          title: "Cross-file reconciliation",
          mustExplain: "Show how each report conclusion and addendum clause maps to a control ID, source evidence, Rego decision, public test, compliance-report.json result, evidence-index locator, and decision-log entry.",
        },
      ],
      writingRules: [
        "The policy-gap report explains judgment and evidence. The policy addendum states requirements; do not turn the addendum into another analysis report.",
        "Implement and report exactly the three assigned outcomes. Additional material risks receive an explicit disposition, owner, and review trigger instead of a fourth control.",
        "Use concise professional language and cite valid framework identifiers and the authoritative NDPA source. Do not copy licensed ISO clauses.",
        "Label assumptions, insufficient evidence, stakeholder constraints, and legal uncertainty instead of presenting them as proven facts.",
        "Every written conclusion must match compliance-report.json, control-mapping.csv, decision-log.md, the Rego bundle, and test results.",
      ],
      finalCheck:
        "A board reader must understand why these three outcomes were selected and how they will be enforced; a technical reviewer must be able to trace every claim into OPA and evidence. No report or policy-addendum template is supplied.",
    },
    firstMilestone:
      "Stop the setup phase when all issued inputs are present and unchanged, the three assigned outcomes are frozen in decision-log.md, OPA and pytest run, one public fixture passes through a generic Rego rule, and a machine-readable decision file can be generated.",
  },
};

export function advancedStageFiveOnboarding(track: AdvancedTrack): StageFiveOnboarding {
  return ONBOARDING[track];
}
