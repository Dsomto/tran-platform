// Per-stage mission briefs. The in-platform tasks (flags, MCQs, short
// writeups) test comprehension. This brief + practicalTasks + resources is
// the synthesis work — the capstone the intern submits as their folder link.
//
// Design rule: every task must have a browser-only path. Interns on shared
// machines / phones should never be blocked. Anything that benefits from a
// local machine also lists an alternate.
//
// Each stage has a `resourcesDriveUrl` — a Google Drive folder (or file)
// holding the stage's data artefacts. The MissionBrief and PDF render that
// link as the primary CTA. Tool/reading items in `resources` are external
// public URLs (CyberChef, OWASP, NIST, etc.) the intern can hit any time.

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

export type BulletinKind =
  | "news"      // company / industry
  | "meeting"   // a thing happening at a time
  | "gossip"    // interpersonal, low stakes
  | "notice"    // something factual the intern needs to know
  | "alert"     // something time-sensitive
  | "joke";     // inside-joke flavour

export interface BulletinItem {
  kind: BulletinKind;
  text: string;
  /** Optional small caption — meeting time, source, who pinned it. */
  meta?: string;
}

export interface CastMember {
  name: string;
  role: string;
  /** One-sentence backstory shown on the character card. */
  bio: string;
  /** Whether this person is on your side, an adversary, or a peer. Used for
   *  card colour. */
  alignment: "ally" | "peer" | "adversary" | "external";
  /** Optional pithy tag shown beneath the role, like "your direct mentor". */
  tag?: string;
  /** A one-line greeting / line of dialogue shown when the carousel lands on
   *  this character. Quoted as if they're speaking to the intern directly. */
  greeting?: string;
}

export interface StageBrief {
  label: string;
  subtitle: string;
  /** Multi-paragraph narrative — the "what happened" briefing. */
  missionBrief: string[];
  /** Characters the intern will work with / against in this stage. */
  cast: CastMember[];
  /** Plain-language org policies shown as a static block on the landing. */
  termsAndPolicies: string[];
  /** Slack-style intranet feed — gossip, news, meetings, notices. Adds the
   *  texture of working inside a real company. */
  bulletin: BulletinItem[];
  /** What the intern should deliver in their folder. */
  practicalTasks: PracticalTask[];
  /** Google Drive folder (or shared file) holding the stage's data artefacts.
   *  All download-kind resources live here — referenced as one prominent link
   *  on the landing page and inside the PDF brief. */
  resourcesDriveUrl: string;
  /** Tools and readings — public web links the intern can hit any time. */
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
    cast: [
      {
        name: "Amaka Eze",
        role: "Head of Security",
        tag: "Your direct mentor",
        bio: "Ten years across SOCs in Lagos, Joburg, and London. Hates ceremony, loves evidence. Will read your report twice and ask one question that proves you didn't.",
        alignment: "ally",
        greeting: "I'll be reading your reports. Make them sharp.",
      },
      {
        name: "Tunde Afolabi",
        role: "Threat Intel Lead",
        tag: "He hands you the artefacts",
        bio: "Ex-military signals. Pulls the logs, runs the captures, has a side hobby tracking the Griot's infrastructure. Quiet until something doesn't add up.",
        alignment: "ally",
        greeting: "Whatever I pull, you read carefully. I don't pull noise.",
      },
      {
        name: "Adaeze Okonkwo",
        role: "Chief Executive Officer",
        tag: "Sets the tone for the company",
        bio: "Founded Sankofa eight years ago. Believes the company's licence to operate depends on customer trust. Will personally read the Incident Committee summary.",
        alignment: "external",
        greeting: "Welcome. Our customers' trust is the only thing we trade in.",
      },
      {
        name: "Olu Adegoke",
        role: "Finance Analyst",
        tag: "His account is in the log",
        bio: "On the finance team. His login appears in the Q2 auth log at 02:07 UTC — except he was on annual leave that week. He doesn't know yet.",
        alignment: "peer",
        greeting: "Hi. I'm new to all of this — what's a SOC again?",
      },
      {
        name: "Chinwe Eze",
        role: "SOC Tier 2 Analyst",
        tag: "Your peer on the bench",
        bio: "Started the same week as the analyst you are replacing. Will be the first person to read your draft. Pushy in the right way.",
        alignment: "peer",
        greeting: "Coffee's by the kettle. Don't let Amaka catch you reading docs at 11pm.",
      },
      {
        name: "The Griot",
        role: "Unknown adversary",
        tag: "Faceless, for now",
        bio: "A handle that turned up in a regional threat-intel feed three months ago. Nobody knows the operator. Sankofa has been quietly mapped.",
        alignment: "adversary",
        greeting: "...",
      },
    ],
    termsAndPolicies: [
      "All access to Sankofa systems is logged. By proceeding, you accept that your activity in this stage is recorded for audit.",
      "The Q2 auth log and any other artefact you receive are property of Sankofa Digital. Do not redistribute, screenshot to the public internet, or post to social media.",
      "You will not use any technique you learn here against any system you do not own or have written permission to test. ISC2 Code of Ethics applies in full.",
      "Findings stay inside the programme until the Incident Committee releases them. \"Inside the programme\" includes your peers in the cohort.",
      "If something looks wrong, slow down and escalate. Speed without judgement is a liability.",
    ],
    bulletin: [
      {
        kind: "news",
        text: "Sankofa just signed a 3-year processing deal with Lagos Microfinance. Press release Friday — Comms wants nothing weird in the news cycle.",
        meta: "internal note · 2 days ago",
      },
      {
        kind: "meeting",
        text: "Daily SOC standup: 09:30 in the Crow Lobby. Attendance optional, Amaka notices.",
        meta: "Mon–Fri",
      },
      {
        kind: "notice",
        text: "Sankofa account 1234567890 (Polaris) is petty cash only. The Operating account ends in 4523 — never confuse them. Ifeoma will personally find you.",
        meta: "pinned by #finance-help",
      },
      {
        kind: "joke",
        text: "If Tunde says \"interesting\", he means concerning. If Amaka says \"interesting\", she means impressive. Calibrate accordingly.",
        meta: "from the new-hire wiki",
      },
      {
        kind: "gossip",
        text: "Kofi from Engineering brought jollof to the office party. Marketing brought their own. Verdict still pending. Truce holding.",
        meta: "#offsite-2024",
      },
      {
        kind: "meeting",
        text: "Company offsite: 22 March, Lekki. RSVP via #offsite-2024. Yes, the badge says \"intern\" and that's fine.",
        meta: "1 month away",
      },
      {
        kind: "alert",
        text: "Q2 ticket #SD-40812 has been re-opened by Amaka. The ticket you replaced left it closed — that is the ticket you're walking into.",
        meta: "your queue",
      },
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
    resourcesDriveUrl:
      "https://drive.google.com/drive/folders/1xtbdjXFxReUcqaHp_eEMyoFpHCQ9gYYm?usp=drive_link",
    resources: [
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
    cast: [
      {
        name: "Amaka Eze",
        role: "Head of Security",
        tag: "Reads your report end to end",
        bio: "Carries this case. Wants the post-mortem clean and the controls list short. Don't pad.",
        alignment: "ally",
        greeting: "Five controls. Concrete. Don't give me \"improve hygiene.\"",
      },
      {
        name: "Tunde Afolabi",
        role: "Threat Intel Lead",
        tag: "Pulled the staging-server zip",
        bio: "Caught the Griot's beacon three days late. Treats every hour after that as borrowed.",
        alignment: "ally",
        greeting: "We were three days late. Don't make it five.",
      },
      {
        name: "Dr. Folake Bello",
        role: "External cryptography consultant",
        tag: "Brought in for the audit",
        bio: "Spent eight years at the central bank's CSO office. Has seen every variant of \"we used AES so we're fine\" — and most of them were wrong.",
        alignment: "ally",
        greeting: "AES is not a control. The way you use it is.",
      },
      {
        name: "Bayo Ogunyemi",
        role: "Head of Engineering",
        tag: "Owns the systems with the bad crypto",
        bio: "Ships fast. Does not ship safely. Will push back on every control you propose unless you make the cost of *not* doing it concrete.",
        alignment: "peer",
        greeting: "If it's expensive and not urgent, I'll find a reason to say no.",
      },
      {
        name: "The Griot",
        role: "Adversary",
        tag: "Made a habit of cutting corners",
        bio: "Reused IVs. Used HS256 with a five-character secret. Did all of it intentionally — to look amateur and stay under the model the SOC was watching for.",
        alignment: "adversary",
        greeting: "...",
      },
    ],
    termsAndPolicies: [
      "All cryptographic artefacts in this stage are simulations. They are not pulled from real Sankofa production data.",
      "Do not paste these ciphertexts, JWTs, or keys into any third-party service that retains data. CyberChef and jwt.io run client-side and are safe.",
      "Any control you recommend must be specific enough to procure or build. Vague guidance (\"improve crypto hygiene\") will not be accepted.",
      "Findings are confidential to Sankofa Digital and the programme. Do not share screenshots in the cohort group.",
    ],
    bulletin: [
      {
        kind: "news",
        text: "Sankofa's customer-trust score dropped 4 points after the Q2 disclosure leaked on Twitter. Comms is in the war room. Adaeze pulled the Friday all-hands forward.",
        meta: "yesterday",
      },
      {
        kind: "meeting",
        text: "Crypto controls review: Friday 14:00, Blue Room (level 6). Dr. Folake Bello presenting. Bayo \"will try to make it\".",
        meta: "this Friday",
      },
      {
        kind: "gossip",
        text: "Bayo and Ngozi haven't spoken since the post-mortem. Standup is awkward. Bring snacks.",
        meta: "from #soc-bench",
      },
      {
        kind: "joke",
        text: "Bayo's pinned PR comment from 2019: \"we'll fix the JWT thing later\". It's been five years. We are now in \"later\".",
        meta: "PR #1488 · still open",
      },
      {
        kind: "notice",
        text: "Treasury reminder: any control you propose with a cost must reference the Operating account (ends 4523). Quotes go in the spend tracker, not in DMs.",
        meta: "pinned by Babatunde",
      },
      {
        kind: "alert",
        text: "External counsel asked whether the Q2 incident triggers Section 40 NDPA notification. Counsel Ifeoma says \"not yet — but the clock starts the moment we confirm PII left.\" Don't confirm anything you can't evidence.",
        meta: "from legal · today",
      },
      {
        kind: "meeting",
        text: "Optional: Tunde's threat-intel office hours, Wednesdays 16:00. He brings coffee. Ask any question.",
        meta: "weekly",
      },
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
    resourcesDriveUrl:
      "https://drive.google.com/drive/folders/1-nWE7vQj-RN80m7o6UGcT7bZIZDJApgJ?usp=sharing",
    resources: [
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
    cast: [
      {
        name: "Bayo Ogunyemi",
        role: "Head of Engineering",
        tag: "The person your report is for",
        bio: "Has a backlog the size of a small library. Will only act on findings he can prioritise against business risk. Speak that language.",
        alignment: "peer",
        greeting: "Tell me what's broken, what it costs, and what to fix first.",
      },
      {
        name: "Ngozi Ojukwu",
        role: "DevSecOps Lead",
        tag: "Will own the fixes",
        bio: "Joined six months ago. Inherited the legacy-admin app. Wanted to kill it on day one but lost the politics. Now she has the receipts.",
        alignment: "ally",
        greeting: "I told them this app was a liability. Say it again, louder.",
      },
      {
        name: "Amaka Eze",
        role: "Head of Security",
        tag: "Co-signs the report",
        bio: "Will read your remediation order before it goes to engineering. She has political capital — spend it on the things that actually matter.",
        alignment: "ally",
        greeting: "I'll defend whatever order you justify. Justify it well.",
      },
      {
        name: "Tunde Afolabi",
        role: "Threat Intel Lead",
        tag: "Provided the HTTP capture",
        bio: "Pulled the attacker's full session off the edge proxy. Will help you label the parts of the chain that look familiar.",
        alignment: "ally",
        greeting: "The capture is annotated. Read every line.",
      },
      {
        name: "The Griot",
        role: "Adversary",
        tag: "Walked through five doors",
        bio: "Found the legacy admin in three minutes, the SQLi in five, and the open redirect in seven. Knew where to look — that is its own clue.",
        alignment: "adversary",
        greeting: "...",
      },
    ],
    termsAndPolicies: [
      "You will not run scans, fuzzers, or any automated probe against any real Sankofa endpoint. The exercise is paper-based.",
      "All code, capture, and token samples are property of Sankofa Digital and are confidential to this stage.",
      "When you write CVSS scores, show the vector string. Numbers without vectors do not get accepted.",
      "Remediation order should be argued by risk reduction per hour of effort, not severity alone.",
    ],
    bulletin: [
      {
        kind: "news",
        text: "Sankofa is launching BoltCash in 6 weeks. Marketing wants the legacy admin fixed BEFORE launch. Bayo wants it fixed AFTER. Adaeze will pick a side this Friday.",
        meta: "internal · 3 days ago",
      },
      {
        kind: "gossip",
        text: "Ngozi (DevSecOps) signed an offer at OpenSec. Starts next quarter. Bayo doesn't know yet. Don't be the one who tells him.",
        meta: "from #insiders · today",
      },
      {
        kind: "meeting",
        text: "Sprint planning: Tuesday 09:00. Bayo will not stay if you talk legacy-admin for more than five minutes. Be efficient.",
        meta: "this Tuesday",
      },
      {
        kind: "notice",
        text: "All e2e tests use the format e2e-XXX@sankofa.dev. Do not test against admin@sankofa.com — that account belongs to the actual admin and your test will be on his desk by Tuesday.",
        meta: "pinned by #qa",
      },
      {
        kind: "joke",
        text: "Sankofa pentest etiquette: if you find something, write it up. If you can exploit it from your phone in a meeting, you must immediately stop and write it up. Discipline.",
        meta: "wiki: pentester-handbook",
      },
      {
        kind: "alert",
        text: "/legacy-admin/ is publicly reachable. The web team disagrees on whether to take it down today (Ngozi: yes) or stage a soft retire (Bayo: yes). Until they decide, treat it as a live target you are not allowed to touch.",
        meta: "from #incident-q2",
      },
      {
        kind: "meeting",
        text: "Engineering retro: Thursday 15:30. Optional, but it's where the post-mortem of /legacy-admin/ will be done. Bring your remediation order if you want it heard.",
        meta: "this Thursday",
      },
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
    resourcesDriveUrl:
      "https://drive.google.com/drive/folders/1fCAmCkT_LyPElXMJvH-zeH9XttYkVy5r?usp=sharing",
    resources: [
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
    cast: [
      {
        name: "Damilola \"Dami\" Akande",
        role: "DFIR Specialist",
        tag: "Brought in to lead the investigation",
        bio: "Twelve years of incident response. Will check your timeline against the raw artefacts and tell you which sentences don't have evidence.",
        alignment: "ally",
        greeting: "Every sentence in your timeline traces to a line in the evidence. Or it doesn't go in.",
      },
      {
        name: "Counsel Ifeoma Okeke",
        role: "Internal Legal",
        tag: "Reads the timeline first",
        bio: "Cares about what was accessed, by whom, when, and what the company is obligated to disclose. Will quote your timeline back to you in the regulator's office.",
        alignment: "ally",
        greeting: "Anything you write here, I might have to read aloud one day. Write it like that.",
      },
      {
        name: "Olu Adegoke",
        role: "Finance Analyst",
        tag: "His workstation was the foothold",
        bio: "On leave when the breach happened. Now back, embarrassed, cooperative. Available for interview if your timeline needs his side.",
        alignment: "peer",
        greeting: "I wasn't even in the country. Whatever you need from me, I'll give.",
      },
      {
        name: "Tunde Afolabi",
        role: "Threat Intel Lead",
        tag: "Caught the beacon",
        bio: "Spotted the outbound traffic to 185.220.101.9 on hour 71 of the dwell. Quarantined the box at hour 72. Wrote the first line of your timeline.",
        alignment: "ally",
        greeting: "Hour 71 was the beacon. Start there.",
      },
      {
        name: "Amaka Eze",
        role: "Head of Security",
        tag: "Sponsors the investigation",
        bio: "Will defend the team's work to the board. Needs the report to be defensible, not heroic.",
        alignment: "ally",
        greeting: "Be boring. Be right. The board will believe boring.",
      },
      {
        name: "The Griot",
        role: "Adversary",
        tag: "Quiet for 30 days, then loud",
        bio: "Left a note on the workstation: \"foothold: o.adegoke. exfil: /tmp/exfil.tgz -> 185.220.101.9. quiet for 30 days, then loud.\" Took the data and waited.",
        alignment: "adversary",
        greeting: "...",
      },
    ],
    termsAndPolicies: [
      "Forensic artefacts are evidence. Do not modify them. Work from copies; record the SHA-256 of every file you analyse.",
      "Every claim in the timeline must cite a line in the evidence. Inventing facts is a hard fail.",
      "Until legal releases otherwise, the names of affected individuals stay inside the investigation. Use roles in your report, not names.",
      "The incident report goes to the CISO and Counsel. It will be discoverable in any subsequent action — write accordingly.",
    ],
    bulletin: [
      {
        kind: "alert",
        text: "Workstation 10.0.1.87 is in the safe. Do NOT touch. The serial is 08-17-AHF7-22. Tunde has the access log. Counsel knows the chain of custody count.",
        meta: "from Dami · this morning",
      },
      {
        kind: "news",
        text: "Olu Adegoke is back from leave. Confused about why his desk has a \"do not touch\" sign and why Counsel wants a 30-min sit-down.",
        meta: "today · 09:14",
      },
      {
        kind: "meeting",
        text: "Investigation sync: 07:00 daily, Crow War Room. Coffee non-negotiable. Counsel attends every other one.",
        meta: "Mon–Fri",
      },
      {
        kind: "gossip",
        text: "Dami brought her own keyboard. It clicks. Open-plan office is mildly hostile about it. She does not care.",
        meta: "from #ir-team",
      },
      {
        kind: "notice",
        text: "72-hour clock for NDPA notification started at 04:12 UTC on 2024-06-08. Counsel knows the exact second. If you reference \"the clock\" in your report, that's what you mean.",
        meta: "pinned by Counsel Ifeoma",
      },
      {
        kind: "joke",
        text: "Dami's three rules of forensics, posted above her desk: 1) Don't touch it. 2) Hash everything. 3) When in doubt, hash again.",
        meta: "Dami's whiteboard",
      },
      {
        kind: "meeting",
        text: "Olu's voluntary interview: Wednesday 14:00, with Counsel and Dami present. Optional for the SOC bench but useful for your timeline.",
        meta: "Wednesday",
      },
      {
        kind: "alert",
        text: "Beacon to 185.220.101.9 was last seen at 03:14 UTC. The Griot is quiet. Tunde says \"quiet does not mean gone\".",
        meta: "from threat-intel · 1h ago",
      },
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
    resourcesDriveUrl:
      "https://drive.google.com/drive/folders/1TEmB738rloEW6IYlLRNpW_wTg681O3n0?usp=sharing",
    resources: [
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
    cast: [
      {
        name: "Adaeze Okonkwo",
        role: "Chair & CEO",
        tag: "Reads the cover letter first",
        bio: "Wants three sentences before she wants any number. If your executive summary buries the answer, she stops reading.",
        alignment: "external",
        greeting: "First three sentences. Tell me what happened, what it costs, what we do.",
      },
      {
        name: "Babatunde Olawale",
        role: "Chief Financial Officer",
        tag: "Will price every recommendation",
        bio: "Sees security spend as insurance. Will fund what you can quantify, will cut what you can't. Round numbers in NGN are fine — sources required.",
        alignment: "external",
        greeting: "Show me the number. Show me the source. I'll fund it.",
      },
      {
        name: "Chief Wale Adekunle",
        role: "Independent Director",
        tag: "Ex-chair of a Tier 1 bank",
        bio: "Has sat through six breach briefings in his career. Knows the difference between a contained incident and a buried one. Asks the questions you don't want.",
        alignment: "external",
        greeting: "I've heard this story before. Tell it differently.",
      },
      {
        name: "Counsel Ifeoma Okeke",
        role: "General Counsel",
        tag: "Sits beside you at the table",
        bio: "Briefs the board on regulatory exposure. Your NDPA letter and her draft go in together. Reconcile them before the meeting.",
        alignment: "ally",
        greeting: "We submit one letter. Reconcile your draft with mine before nine.",
      },
      {
        name: "Adaobi Nnamdi",
        role: "Liaison, Nigeria Data Protection Commission",
        tag: "Receives the 72-hour notification",
        bio: "Will read the Section 40 letter twice — once for what it says, once for what it doesn't. She has seen worse, and she has seen better. Be neither.",
        alignment: "external",
        greeting: "Be plain. Be specific. We'll get along.",
      },
      {
        name: "Amaka Eze",
        role: "Head of Security",
        tag: "Hands you the floor",
        bio: "Sits at the back. Will not speak unless asked. The room learns from how she reacts to your answers — make sure those reactions match what you intend.",
        alignment: "ally",
        greeting: "Take the floor. I'm not rescuing you.",
      },
    ],
    termsAndPolicies: [
      "Every artefact you submit becomes part of the board record. Treat it like a document a court might read.",
      "The NDPA notification letter is a regulated submission. Names, dates, and counts must be defensible against the evidence in Stages 0-3.",
      "Track selection is binding. Once the chair signs off, the choice is in the record.",
      "If a number you cite cannot be traced back to evidence in the platform, do not cite it.",
    ],
    bulletin: [
      {
        kind: "news",
        text: "Sankofa's quarterly revenue printed 12% above forecast. Some board members will be in good moods. Some will not be — Chief Wale read the Q2 disclosure on the way in.",
        meta: "from #leadership · 04:30 today",
      },
      {
        kind: "meeting",
        text: "Board sits 09:00 sharp. Pre-meeting with Counsel at 08:00 in her office. Coffee from the espresso machine on level 9 — the lobby one is still broken.",
        meta: "tomorrow",
      },
      {
        kind: "joke",
        text: "Chief Wale Adekunle is famously polite to people he is about to dismantle. The polite questions are the dangerous ones. \"Can you walk me through that one more time?\" is not casual.",
        meta: "wiki: how-the-board-works",
      },
      {
        kind: "alert",
        text: "Babatunde will ask \"what is the worst case?\" three separate times during your briefing. Each time, give a different defensible answer. The same answer twice is taken as evasion.",
        meta: "Counsel's pre-brief notes",
      },
      {
        kind: "notice",
        text: "Sankofa Digital Limited · RC 1234567 · Operating account: Polaris Bank, ending 4523. Use this number for the cost figures in your roadmap. NOT 1234567890 (petty cash). NOT 0009-XX-VERIFY (test account).",
        meta: "pinned by Treasury",
      },
      {
        kind: "gossip",
        text: "Adaobi Nnamdi (NDPC liaison) was at university with Counsel Ifeoma. They are friendly. Don't mistake friendly for lenient.",
        meta: "from Counsel · in confidence",
      },
      {
        kind: "meeting",
        text: "Post-board debrief: 13:00, Crow War Room. Whoever is left standing.",
        meta: "tomorrow afternoon",
      },
      {
        kind: "alert",
        text: "Cohort milestone: track selection becomes binding the moment the Chair signs off. There is no \"I changed my mind\" after this stage.",
        meta: "Programme team",
      },
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
    resourcesDriveUrl:
      "https://drive.google.com/file/d/1jnE_K-pSscbZzBDJjsMN1e3PWu81ov8N/view?usp=sharing",
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
