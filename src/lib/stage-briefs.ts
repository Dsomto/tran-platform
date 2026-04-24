// Per-stage mission briefs. The in-platform tasks (flags, MCQs, short
// writeups) test comprehension. This brief + practicalTasks + resources is
// the synthesis work — the capstone the intern submits as their folder link.
//
// Design rule: every task must have a browser-only path. Interns on shared
// machines / phones should never be blocked. Anything that benefits from a
// local machine also lists an alternate.
//
// Resource `href` values that start with `/downloads/` are local files the
// admin should drop into /public/downloads/<stage>/ before the cohort opens.

export interface PracticalTask {
  id: string;
  title: string;
  description: string;
  deliverable: string;
  /** If the task *can* be done faster on a local machine, explain the
   *  browser-only fallback here. Leave undefined when the task is already
   *  browser-friendly. */
  alternate?: string;
}

export interface StageResource {
  label: string;
  description?: string;
  href: string;
  kind: "download" | "reading" | "tool";
}

export interface StageBrief {
  label: string;
  subtitle: string;
  /** Multi-paragraph narrative — the "what happened" briefing. */
  missionBrief: string[];
  /** What the intern should deliver in their folder. */
  practicalTasks: PracticalTask[];
  /** Data files, readings, and tools. */
  resources: StageResource[];
  /** Sections the grader expects to see referenced in the executive summary. */
  sections: string[];
}

export const STAGE_BRIEFS: Record<
  "STAGE_0" | "STAGE_1" | "STAGE_2" | "STAGE_3" | "STAGE_4",
  StageBrief
> = {
  // ─────────────────────────────────────────────────────────────
  STAGE_0: {
    label: "Stage 0",
    subtitle: "Foundations — Induction at the Gate",
    missionBrief: [
      "Sankofa Digital is a 600-person Nigerian fintech with a SOC bench of four. Last quarter one of their analysts — the one you are replacing — flagged a login that came from an unusual IP, wrote \"probably nothing\" in the ticket, and closed it. Amaka Eze, Head of Security, does not think it was nothing. She has asked you to read the evidence and tell her whether she should be worried.",
      "Your platform work for this stage has walked you through the basics: the CIA triad, AAA, basic Linux, hashing, encoding, how a SIEM reads logs, and the ISC2 Code of Ethics. This report is where you show you can apply them — not recite them.",
      "You are writing to the Sankofa Digital Incident Committee. Three people. None of them touch a keyboard for a living. Make the report readable in under fifteen minutes.",
    ],
    practicalTasks: [
      {
        id: "log-triage",
        title: "Triage the Q2 auth log",
        description:
          "Open the auth log excerpt in the resources. One of the connections comes from 185.220.101.9 — look that IP up on AbuseIPDB or VirusTotal and record what it is. Then in a Google Doc (or Microsoft Word) build a table listing every line you consider suspicious, one row per line. For each line say why it stands out (wrong time, wrong geo, wrong user, wrong pattern). Rank the rows from most to least concerning. Tables inside a Doc are fine — do not use Google Sheets.",
        deliverable: "auth-log-triage (Google Doc or MS Word, with a table inside)",
      },
      {
        id: "cve-triage",
        title: "CIA-triad triage of 10 CVEs",
        description:
          "Pick any ten recent CVEs from the NVD. For each one, state in one sentence which leg of the CIA triad is primarily violated (Confidentiality, Integrity, Availability, or a combination) and why. Build this as a table inside a Google Doc or a Microsoft Word document.",
        deliverable: "cve-triage (Google Doc or MS Word, table with columns: CVE ID · one-line description · primary CIA leg · reasoning)",
      },
      {
        id: "encoding-decode",
        title: "Decode four encoded strings",
        description:
          "Open CyberChef in the browser. Use it to decode the four strings in the resources (a mix of base64, hex, and URL encoding). Write down the plaintext, the encoding you used, and one sentence on how you figured it out.",
        deliverable: "encoding-walkthrough (Google Doc with the four strings, their plaintexts, and your reasoning)",
      },
      {
        id: "suspicious-login-playbook",
        title: "\"Suspicious login\" mini-playbook",
        description:
          "Write a one-page procedure a new SOC analyst can follow when a SIEM alert fires on an unusual login. Cover: what data to pull, what questions to ask the user, when to escalate, and when to close the ticket. Plain language, step-by-step.",
        deliverable: "suspicious-login-playbook (Google Doc, 1 page max)",
      },
      {
        id: "ethics-stance",
        title: "Ethics stance — the right thing vs the easy thing",
        description:
          "Your manager tells you to \"just close\" an alert that looks real but would create work for a senior VP. Write a 200-word response explaining what you would do, referencing the relevant ISC2 Code of Ethics canon.",
        deliverable: "ethics-stance (Google Doc)",
      },
    ],
    resources: [
      {
        label: "Sample Q2 auth log excerpt",
        description: "Your primary piece of evidence.",
        href: "/downloads/stage-0/auth-log-q2.txt",
        kind: "download",
      },
      {
        label: "Four encoded strings to decode",
        href: "/downloads/stage-0/encoded-strings.txt",
        kind: "download",
      },
      {
        label: "CyberChef — in-browser encoder/decoder",
        description: "No install needed. Use this for every encoding exercise.",
        href: "https://gchq.github.io/CyberChef/",
        kind: "tool",
      },
      {
        label: "ISC2 Code of Ethics (full text)",
        href: "https://www.isc2.org/Ethics",
        kind: "reading",
      },
      {
        label: "NIST National Vulnerability Database",
        description: "Browse recent CVEs for your triage table.",
        href: "https://nvd.nist.gov/vuln/search",
        kind: "tool",
      },
    ],
    sections: [
      "What you observed in the Q2 auth log",
      "What those observations imply about Sankofa's SOC posture",
      "Recommended next steps for the Incident Committee",
    ],
  },

  // ─────────────────────────────────────────────────────────────
  STAGE_1: {
    label: "Stage 1",
    subtitle: "Applied Cryptography — Ciphers & Secrets",
    missionBrief: [
      "Amaka's suspicion was right. The analyst you replaced closed the ticket because they could not read what they were looking at. Tunde, the threat-intel lead, has since pulled a zip off a staging server the attacker (\"The Griot\") abandoned. It contains configs, session tokens, one image, and a handful of \"notes\" files — all either encrypted, encoded, or otherwise obscured. Sloppily, in places.",
      "The board now knows Sankofa was compromised during Q2. They want to know two things. First: what was in the files. Second, and more importantly: which cryptographic decisions inside Sankofa's own stack made this kind of sloppiness survive for three months without detection.",
      "This report is addressed to Amaka and the board. Half of it is a post-mortem of The Griot's choices. Half of it is a control set Sankofa should adopt so the next Griot has no easy layer to hide behind.",
    ],
    practicalTasks: [
      {
        id: "aes-decrypt",
        title: "Decrypt the ciphertext",
        description:
          "Open CyberChef in the browser. Paste in the ciphertext, IV, and key from the resources. Decrypt under AES-CBC. Copy the plaintext into your doc and, in two sentences, explain why AES-ECB would have been worse here.",
        deliverable: "decryption-walkthrough (Google Doc: ciphertext, your CyberChef recipe URL, the plaintext, and the two-sentence ECB note)",
        alternate:
          "If you prefer, run the same decryption in Python with the `cryptography` library and paste the script instead of the CyberChef URL.",
      },
      {
        id: "classical-cipher",
        title: "Identify the classical cipher",
        description:
          "Given the short ciphertext in the resources, identify which classical cipher was used (Caesar / Vigenère / substitution), decrypt it, and explain how you figured out which one. Frequency analysis in your doc is plenty.",
        deliverable: "classical-cipher (Google Doc with plaintext + your reasoning, one page)",
      },
      {
        id: "jwt-audit",
        title: "Audit three JWTs",
        description:
          "Paste each JWT into jwt.io. For each, decode the header and payload and identify at least one red flag (alg=none, weak secret, missing exp, privileged claim, etc.).",
        deliverable: "jwt-audit (Google Doc or MS Word, with a table — one row per token and the specific red flag)",
      },
      {
        id: "hash-vs-encryption",
        title: "Short memo — hash vs encryption",
        description:
          "Write a 300-word memo to a non-technical manager explaining when you hash and when you encrypt, using the Griot's choices as concrete examples.",
        deliverable: "hash-vs-encryption-memo (Google Doc)",
      },
      {
        id: "crypto-controls",
        title: "The five cryptographic controls Sankofa should adopt",
        description:
          "Propose five concrete controls (products, policies, or configurations) Sankofa should adopt. One-sentence justification each. Assume a small team and a tight budget.",
        deliverable: "crypto-controls (Google Doc or MS Word)",
      },
    ],
    resources: [
      {
        label: "The Griot's staging-server bundle",
        description: "Contains the AES ciphertext + IV + key, the classical-cipher sample, and three JWTs.",
        href: "/downloads/stage-1/griot-artefacts.zip",
        kind: "download",
      },
      {
        label: "CyberChef — do every crypto exercise here",
        description: "Runs entirely in the browser. No install.",
        href: "https://gchq.github.io/CyberChef/",
        kind: "tool",
      },
      {
        label: "JWT.io — decoder + reference",
        href: "https://jwt.io/",
        kind: "tool",
      },
      {
        label: "dCode — classical-cipher identifier",
        href: "https://www.dcode.fr/cipher-identifier",
        kind: "tool",
      },
      {
        label: "Crypto 101 — free textbook by lvh",
        href: "https://www.crypto101.io/",
        kind: "reading",
      },
      {
        label: "OWASP Cryptographic Storage Cheat Sheet",
        href: "https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html",
        kind: "reading",
      },
    ],
    sections: [
      "Cryptographic failures observed in The Griot's files",
      "Why modern algorithms alone did not save Sankofa",
      "Five controls the board should approve",
    ],
  },

  // ─────────────────────────────────────────────────────────────
  STAGE_2: {
    label: "Stage 2",
    subtitle: "Web Application Security — The Attack Surface",
    missionBrief: [
      "The decrypted files point at a path: sankofa.internal/legacy-admin/. It is a Django app from 2019 that was supposed to be decommissioned two years ago. Tunde confirms it is still online and publicly reachable.",
      "You are writing a pentest-style findings report for Sankofa's Head of Engineering. The goal is not to showboat — it is to tell the team exactly what's broken, how an attacker would chain the weaknesses, and what to fix first. You have a week. The team has two.",
      "You will not run any scans against real infrastructure. Every weakness you need to analyse is in the source-code snippets, HTTP captures, and sample tokens in the resources. You read them in the browser, no install needed.",
    ],
    practicalTasks: [
      {
        id: "sqli-analysis",
        title: "Find the SQLi in the code",
        description:
          "Read the PHP snippet in the resources. Identify the vulnerable line, the class of injection (in-band / blind / time-based), and write a PoC URL that would demonstrate it. You are not running anything — just describing.",
        deliverable: "sqli-analysis (Google Doc with the vulnerable line quoted, the class, the PoC URL, and the fix)",
      },
      {
        id: "http-capture",
        title: "Trace the attack in the HTTP capture",
        description:
          "Open the HTTP capture (plain text, not a PCAP) in the resources. Identify the sequence of requests the attacker used — from reconnaissance to exploitation. Number them and annotate what each step accomplished.",
        deliverable: "http-trace (Google Doc with the numbered sequence + your annotations)",
      },
      {
        id: "top10-mapping",
        title: "Map the five findings to OWASP Top 10 (2021)",
        description:
          "For each of the five weaknesses you identified, record: OWASP category (e.g. A03 Injection), CVSS 3.1 vector + score (use the FIRST calculator), and a one-sentence business impact.",
        deliverable: "findings-table (Google Doc or MS Word, with a table inside)",
      },
      {
        id: "remediation-order",
        title: "Remediation roadmap in priority order",
        description:
          "List the five weaknesses in the order the Engineering team should fix them, with one-sentence justifications that reference risk reduction per hour of effort (not just severity).",
        deliverable: "remediation-roadmap (Google Doc, 1 page)",
      },
      {
        id: "findings-report",
        title: "The report itself",
        description:
          "Write the finished pentest report: executive summary, scope, methodology (paper-based analysis), findings with severities, remediation order, and appendices.",
        deliverable: "sankofa-pentest-report (Google Doc, 4–6 pages)",
      },
    ],
    resources: [
      {
        label: "Vulnerable PHP snippet (the /legacy-admin/ login handler)",
        href: "/downloads/stage-2/legacy-admin-login.php",
        kind: "download",
      },
      {
        label: "HTTP request/response capture (plain text)",
        description: "The attacker's full session, annotated with timestamps.",
        href: "/downloads/stage-2/attacker-http-capture.txt",
        kind: "download",
      },
      {
        label: "Sample JWTs issued by the app",
        href: "/downloads/stage-2/legacy-admin-tokens.txt",
        kind: "download",
      },
      {
        label: "OWASP Top 10 (2021)",
        href: "https://owasp.org/Top10/",
        kind: "reading",
      },
      {
        label: "PortSwigger Web Security Academy",
        description: "Free. Use the Access Control and Injection modules. No install.",
        href: "https://portswigger.net/web-security",
        kind: "reading",
      },
      {
        label: "CVSS v3.1 calculator (browser)",
        href: "https://www.first.org/cvss/calculator/3.1",
        kind: "tool",
      },
    ],
    sections: [
      "Reconnaissance and initial foothold",
      "The exploit chain — how findings link together",
      "Findings table with CVSS scores",
      "Remediation plan in priority order",
    ],
  },

  // ─────────────────────────────────────────────────────────────
  STAGE_3: {
    label: "Stage 3",
    subtitle: "Incident Response — Inside the Walls",
    missionBrief: [
      "The Griot did get in through /legacy-admin/. They pivoted sideways to a finance analyst's workstation (10.0.1.87) and sat there for 72 hours before Tunde noticed the beacon traffic and quarantined the box.",
      "You have been handed the forensic artefacts: the pre-parsed memory-process listing, a filesystem index, 72 hours of syslog + auth.log, and a SIEM export. Everything is plain text — open it in your editor or Google Docs, no Volatility install required.",
      "Your job is to produce three things the CISO takes to legal tomorrow: a clean incident timeline, an IOC list, and a list of MITRE ATT&CK techniques the adversary used. The timeline is the primary artefact — legal reads it first. Do not invent details. Every sentence traces to a line in the evidence.",
    ],
    practicalTasks: [
      {
        id: "process-triage",
        title: "Process triage from the memory listing",
        description:
          "Read the pre-parsed process listing. Identify the three most suspicious processes on the compromised host, quote the specific line(s) as evidence, and explain in one sentence each how you ruled out false positives.",
        deliverable: "process-triage (Google Doc)",
        alternate:
          "If you have Volatility 3 installed locally and want to re-parse from the raw memory dump yourself, include your command log and compare your findings to the pre-parsed output.",
      },
      {
        id: "timeline",
        title: "The incident timeline",
        description:
          "Build the timeline from the log files. One event per row. Columns: timestamp (UTC) · event · source file · evidence (grep line or process ID). Cover initial access → persistence → lateral movement → exfil attempt → containment.",
        deliverable: "incident-timeline (Google Doc or MS Word, with a table inside)",
      },
      {
        id: "iocs",
        title: "IOC list",
        description:
          "Extract the Indicators of Compromise (IPs, domains, file hashes, user-agent strings, persistence artefacts) and format them in a sheet. If you want to go further, format a subset as a STIX 2.1 bundle and paste the JSON.",
        deliverable: "iocs (Google Doc or MS Word, with a table inside — or .json if you went STIX)",
      },
      {
        id: "attack-mapping",
        title: "MITRE ATT&CK technique map",
        description:
          "For each event in the timeline, map the adversary behaviour to a specific ATT&CK technique ID (and sub-technique where it applies). Browse attack.mitre.org directly in the browser.",
        deliverable: "attack-mapping (Google Doc or MS Word, with a table inside)",
      },
      {
        id: "incident-report",
        title: "The formal incident report",
        description:
          "Write the cover report for the CISO + legal: executive summary, scope, timeline (summary), root cause, what was accessed, containment, eradication, lessons learned, policy changes proposed.",
        deliverable: "incident-report (Google Doc, 5–7 pages)",
      },
    ],
    resources: [
      {
        label: "Forensic artefact bundle (all plain text)",
        description:
          "Pre-parsed memory process listing, filesystem index, 72h of syslog + auth.log, SIEM export. Open in Docs or any editor.",
        href: "/downloads/stage-3/forensic-artefacts.zip",
        kind: "download",
      },
      {
        label: "MITRE ATT&CK — Enterprise Matrix",
        href: "https://attack.mitre.org/matrices/enterprise/",
        kind: "reading",
      },
      {
        label: "GTFOBins — trusted-binary privilege escalation",
        href: "https://gtfobins.github.io/",
        kind: "reading",
      },
      {
        label: "SANS Incident Handler's Handbook (free PDF)",
        href: "https://www.sans.org/white-papers/33901/",
        kind: "reading",
      },
      {
        label: "ATT&CK Navigator (browser)",
        description: "Optional — colour in the techniques you found.",
        href: "https://mitre-attack.github.io/attack-navigator/",
        kind: "tool",
      },
    ],
    sections: [
      "Incident timeline (summarised)",
      "Root cause — how they got in and why they stayed",
      "Containment and eradication actions",
      "Lessons learned and policy changes recommended",
    ],
  },

  // ─────────────────────────────────────────────────────────────
  STAGE_4: {
    label: "Stage 4",
    subtitle: "Governance & Risk — The Debrief",
    missionBrief: [
      "Tomorrow at 09:00 you are in front of Sankofa's board. Three members: the Chair, the CFO, and an independent director who used to chair a bank. They do not care about MITRE ATT&CK technique IDs. They care about three things: did customer PII leave the building, are we in breach of NDPA, and what does the next twelve months of security spend need to look like.",
      "This is the capstone. You are no longer a technical analyst — you are the voice the board hears. Every artefact you submit lives on the record. Every number gets quoted back at you.",
      "When the chair signs off on your package, you are no longer a candidate. You pick your specialist track — SOC, Ethical Hacking, or GRC — and the next chapter of your work is the one you chose.",
    ],
    practicalTasks: [
      {
        id: "risk-register",
        title: "Five-entry risk register",
        description:
          "Build a risk register with five rows. Each row: risk statement, likelihood (1–5), impact (1–5), single concrete control, accountable role. Vague controls (\"improve monitoring\") lose marks — be specific.",
        deliverable: "risk-register (Google Doc or MS Word, with a table inside)",
      },
      {
        id: "ndpa-letter",
        title: "NDPA 72-hour breach notification letter",
        description:
          "Draft the Section 40 notification to the Nigeria Data Protection Commission. State the controller + DPO, category + approximate volume of affected subjects, nature of breach, consequences, containment, remediation roadmap. Use the template in the resources as your starting point.",
        deliverable: "ndpa-notification-letter (Google Doc)",
      },
      {
        id: "nist-mapping",
        title: "Map the incident to NIST CSF 2.0",
        description:
          "For each of the five core functions (Identify, Protect, Detect, Respond, Recover — plus the new Govern), name which subcategory Sankofa failed and the specific evidence that shows the failure.",
        deliverable: "csf-mapping (Google Doc or MS Word)",
      },
      {
        id: "roadmap",
        title: "12-month remediation roadmap",
        description:
          "Build a quarter-by-quarter roadmap (Q1–Q4) with the controls you would implement, rough cost ranges in NGN, and the owner by role. Prioritise by risk reduction per naira.",
        deliverable: "remediation-roadmap (Google Doc, 1–2 pages)",
      },
      {
        id: "track-rationale",
        title: "Track-selection rationale (binding)",
        description:
          "Write the 400-word rationale for your chosen track (SOC / Ethical Hacking / GRC). Cover: the work that clicked for you, the work that did not, one concrete 12-month goal, one 90-day skill gap, and why the other two tracks are not your fit.",
        deliverable: "track-selection (Google Doc)",
      },
    ],
    resources: [
      {
        label: "Nigeria Data Protection Act 2023 (full text)",
        href: "https://ndpc.gov.ng/",
        kind: "reading",
      },
      {
        label: "NIST Cybersecurity Framework 2.0",
        href: "https://www.nist.gov/cyberframework",
        kind: "reading",
      },
      {
        label: "Sample breach notification letter (template)",
        description: "Use as a starting point — do not copy-paste blindly.",
        href: "/downloads/stage-4/breach-notification-template.docx",
        kind: "download",
      },
      {
        label: "NIST SP 800-207 — Zero Trust Architecture",
        href: "https://csrc.nist.gov/publications/detail/sp/800-207/final",
        kind: "reading",
      },
      {
        label: "Minto Pyramid Principle — how to structure a board briefing",
        href: "https://untools.co/minto-pyramid/",
        kind: "reading",
      },
    ],
    sections: [
      "One-paragraph situation summary — what the board reads first",
      "Risk register entries arising from the incident",
      "Control gaps against NIST CSF 2.0",
      "Regulatory position (NDPA) and proposed notification",
      "12-month remediation roadmap",
      "Your track-selection rationale",
    ],
  },
};
