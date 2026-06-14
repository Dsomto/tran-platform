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

/** A single message in the channel-style thread that opens Stage 1+ landings.
 *  Renders as a Slack-style entry: name, role, timestamp, body. Each entry
 *  feels like a colleague reacting to the intern's prior-chapter work. */
export interface CommsMessage {
  /** Display name (e.g., "Amaka Eze"). */
  from: string;
  /** Role (shown muted under the name, e.g., "Head of Security"). */
  role: string;
  /** Relative timestamp string ("Mon 09:14"). */
  time: string;
  /** Paragraphs — single-string or array. May contain {firstName}. */
  body: string;
  /** Optional alignment for left-rule colour: ally/peer/adversary/external. */
  alignment?: "ally" | "peer" | "adversary" | "external";
  /** "pinned" floats to the top with a pin icon. "redacted" renders the body
   *  in a grey muted style with a redacted note. "regular" is the default. */
  kind?: "pinned" | "regular" | "redacted";
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
  /** Channel-style messages the intern sees at the top of the landing.
   *  Stage 0 omits it (no prior chapter to react to). Stage 1+ uses it to
   *  acknowledge the intern's prior work, set the personal stakes, and
   *  seed cliffhangers for the next chapter. Undefined = section hidden. */
  commsThread?: CommsMessage[];
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
      "Sankofa Digital is a 600-person fintech with a SOC bench of four. Last quarter one of their analysts — the one you are replacing — flagged a login that came from an unusual IP, wrote \"probably nothing\" in the ticket, and closed it. Amaka Eze, Head of Security, does not think it was nothing. She has asked you to read the evidence and tell her whether she should be worried.",
      "Your platform work for this stage has walked you through the basics: the CIA triad, AAA, basic Linux, hashing, encoding, how a SIEM reads logs, and the ISC2 Code of Ethics. This report is where you show you can apply them — not recite them.",
      "You are writing to the Sankofa Digital Incident Committee. Three people. None of them touch a keyboard for a living. Make the report readable in under fifteen minutes.",
      "Your evidence pack has four files. auth-log-q2.txt is the gateway-01 SSH log from 3–5 June; somewhere in it is the login that should have been escalated. encoded-strings.txt is a forwarded message with four encoded payloads; one of them names the threat actor. tier-1-ticket-history.csv is sixteen Q2 SOC tickets showing how the alerts around the breach were closed — the dismissal pattern is what re-opened the case. sankofa-roster.csv is the staff directory with leave and offboarding dates; use it to test whether suspicious activity matches real staff availability.",
    ],
    cast: [
      {
        name: "Amaka Eze",
        role: "Head of Security",
        tag: "Your direct mentor",
        bio: "Ten years across SOCs on three continents. Hates ceremony, loves evidence. Will read your report twice and ask one question that proves you didn't.",
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
        text: "Sankofa just signed a 3-year processing deal with a major microfinance partner. Press release Friday — Comms wants nothing weird in the news cycle.",
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
        id: "d1-evidence-table",
        title: "D1 — Suspicious-login evidence table",
        description:
          "3–5 pages. Page 1 is methodology + your H/M/L confidence definitions (one example each). Pages 2–4 are the table itself — 8–12 rows, one per suspicious event, each citing ≥ 2 corroborating files, with one short paragraph of analyst commentary under every row. Mandatory rows: the SD-40812 publickey accept from 185.220.101.9, the next-day repeat (SD-40835), one row that names the threat actor (decoded from encoded-strings.txt), and the a.eze account appearing post-offboarding. Page 5 = pattern summary, the row a grader should reread first, and your next investigative step. Full structure inside the mission brief PDF.",
        deliverable: "D1 — Suspicious-login evidence table (PDF or DOCX, 3–5 pages, table inside)",
      },
      {
        id: "d2-dismissal-pattern",
        title: "D2 — Tier-1 dismissal pattern analysis",
        description:
          "3–5 pages. Name the pattern that ties SD-40812 to ≥ 3 other Q2 tickets in tier-1-ticket-history.csv. Quote each dismissed ticket's `disposition` and `notes` columns verbatim. Per-ticket walkthrough across 2 pages — what SIEM raised, what the dismissal said, what was missed, what it cost. Root-cause page names the single-analyst-coverage problem with column evidence. Close with Tunde's escalation (SD-40866) as the break-point, and ONE concrete procedural recommendation — e.g., dual signature within 4 hours for any MEDIUM+ dismissed as resolved-by-reference. Full structure inside the mission brief PDF.",
        deliverable: "D2 — Tier-1 dismissal pattern (PDF or DOCX, 3–5 pages)",
      },
      {
        id: "d3-business-impact",
        title: "D3 — Business impact and next steps",
        description:
          "3–5 pages addressed to three non-technical executives. Page 1: headline finding (\"Sankofa Digital was compromised in Q2 2024 by…\") + a one-paragraph situation summary the chair will quote back. Page 2: what's at risk, what we know about the attacker, what we cannot yet rule out — plus one external reference (NIST CSF function, MITRE technique by name, ISO control area). Pages 3–4: three 72-hour actions, one paragraph each (verb-first, owner role, hour-precise deadline, ≥ 2 evidence cites, the one risk it does NOT close). Page 5: systemic recommendation (policy / process, not tools or hiring) + evidence appendix. Full structure inside the mission brief PDF.",
        deliverable: "D3 — Business impact + next steps (PDF or DOCX, 3–5 pages)",
      },
      {
        id: "d4-judgment-essay",
        title: "D4 — Judgment essay (the AI-proof one)",
        description:
          "Exactly 2 pages. Two prompts. Neither has a single correct answer — both ask for YOUR judgment. Part A (1 pg, 350–450 words) — Ethics. Your manager says: \"Just close the ticket. The senior VP whose account is involved is in board meetings all week and we are not spoiling his quarter.\" Write your response: what you would do, what you would NOT do, the ISC2 Code of Ethics canon (by name) that applies, and who you would escalate to next and in what order. Part B (1 pg, 300–400 words) — Scenario. At 04:47 WAT you receive a SIEM alert for o.adegoke (Ops Manager, offboarding pending, key revocation pending) authenticating via publickey from a Lagos residential ISP. 30 minutes before handover. What do you do? Walk through investigation order, escalation timing, what you chose NOT to do, and your handover note. Two graders flag generic / AI-traceable answers as not submitted.",
        deliverable: "D4 — Judgment essay (PDF or DOCX, exactly 2 pages)",
      },
    ],
    resourcesDriveUrl: "/dashboard/reports/STAGE_0",
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
      "D1 — Suspicious-login evidence table: 8–12 rows, each citing ≥ 2 files; threat actor named",
      "D2 — Tier-1 dismissal pattern: SD-40812 plus ≥ 3 other ticket IDs, with verbatim disposition + notes quotes",
      "D3 — Business impact + next steps: headline finding, three 72-hour actions, one systemic policy recommendation",
      "D4 — Judgment essay: an ethics call (manager pressuring you to drop the case) + an open-ended SIEM alert scenario, both AI-resistant",
      "Citation discipline: every claim ties to a file / line / ticket plus an external reference (NIST, MITRE, ISO, CVE, ISC2, NDPA) where research applies",
    ],
  },

  // ─────────────────────────────────────────────────────────────
  STAGE_1: {
    label: "Stage 1",
    subtitle: "Applied Cryptography — Ciphers & Secrets",
    missionBrief: [
      "Your Stage 0 report changed something. Amaka took the dismissal-pattern argument from your D2 straight to the board on Friday morning. The board approved an emergency cryptography audit before lunch on the same day. That audit is this stage. You are the analyst they want reading the artefacts because you are the one who proved the SOC was looking at the wrong slice of the problem.",
      "Tunde lifted a zip off a staging server The Griot abandoned forty-eight hours after the public-IP block went live. The Griot moved fast and left things sloppy on the way out: an AES-CBC ciphertext with the key sitting in the same staging config, an HS256 JWT signed with what looks like a five-character secret, a classical-cipher note to themselves, three operational session tokens (each broken in a different way), and a three-layer encoded reconnaissance memo. None of it is hard. All of it tells you something about how the attacker thinks.",
      "The board wants two answers from this chapter. First, what was in those files — the desk tasks walk you through the decryptions one at a time. Second, and this is the report that goes to Amaka and the board: which cryptographic decisions inside Sankofa's own stack let The Griot's sloppiness survive three months unread. The post-mortem half of your capstone names the rot. The controls half names five things Sankofa must change so the next Griot does not get a soft landing.",
      "Dr. Folake Bello arrived on Tuesday. The board brought her in specifically because your D3 systemic recommendation about quarterly access reviews matched what she would have proposed. She wants your second opinion on the controls list, not the other way around. Bayo Ogunyemi is the engineer whose systems carry most of the bad crypto. He will push back on every control you propose unless you make the cost of NOT doing it concrete. He owes you drinks; he already said so.",
      "Your evidence pack has five files. 01-aes-ciphertext.txt is an AES-CBC ciphertext with the key and IV the Griot left in the staging config — decrypt to recover the target name. 02-classical-cipher.txt is a Griot note to themselves; identify the cipher and decode it. 03-jwts.txt is three session tokens — each has a different failure (alg, lifecycle, privilege). 04-weak-jwt-hmac.txt is an HS256 token signed with the legacy admin's hard-coded secret; crack it offline and forge a token. 05-layered-recon-note.txt is a three-layer encoded reconnaissance memo; peel each layer and report the intermediate plaintext at every step. One of these decryptions points specifically at a system that should have died two years ago. The cliffhanger to Chapter 3 is in that pointer; you will find it when you find it.",
    ],
    commsThread: [
      {
        from: "Amaka Eze",
        role: "Head of Security",
        time: "Mon 09:14",
        kind: "pinned",
        alignment: "ally",
        body: "{firstName} — formal note. Your Stage 0 report is in the case file. SD-40812 is now logged as a confirmed Q2 breach event, not a 'probably nothing'. Every artefact you flag from this chapter on will be treated as actionable evidence. Thank you for the work. You earned this seat.",
      },
      {
        from: "Tunde Afolabi",
        role: "Threat Intel Lead",
        time: "Mon 11:02",
        alignment: "ally",
        body: "{firstName} — Tunde. Your D2 walkthrough of the single-analyst pattern got read out loud in the board meeting yesterday. Bayo was not happy. Good. We needed that. I pulled The Griot's staging zip overnight; it is on the shared drive. You are the one reading it. Brief incoming.",
      },
      {
        from: "Dr. Folake Bello",
        role: "External cryptography consultant",
        time: "Tue 08:41",
        alignment: "external",
        body: "Dr. Folake Bello. Eight years at the central bank's CSO office. The board brought me in this morning because your D3 systemic recommendation about quarterly access reviews mapped exactly to what I would have written. I read your report on the flight. I want your second opinion on the controls list, not the other way around. We meet Friday.",
      },
      {
        from: "Bayo Ogunyemi",
        role: "Head of Engineering",
        time: "Tue 16:30",
        alignment: "peer",
        body: "I disagree with your D2 dismissal-pattern recommendation. I will implement it. You owe me drinks. Welcome to Floor 6 — desk is the one with the bad chair.",
      },
      {
        from: "Adaeze Eze",
        role: "Comms",
        time: "Wed 07:55",
        alignment: "external",
        body: "FYI — the Q2 disclosure ran on TechCabal and Zikoko Money this morning. Customer-trust score dropped four points overnight. Friday all-hands has been pulled forward. Whatever you are about to write, it lands in front of the board with that context.",
      },
      {
        from: "intercepted-archive",
        role: "from SD-40912 attachment, sender unverified",
        time: "Wed 23:58",
        kind: "redacted",
        alignment: "adversary",
        body: "[message body redacted by security per SD-40912 — re-opened by Amaka pending crypto audit. See Chapter 3.]",
      },
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
        text: "External counsel asked whether the Q2 incident triggers Article 33 GDPR notification. Counsel Ifeoma says \"not yet — but the clock starts the moment we confirm PII left.\" Don't confirm anything you can't evidence.",
        meta: "from legal · today",
      },
      {
        kind: "meeting",
        text: "Optional: Tunde's threat-intel office hours, Wednesdays 16:00. He brings coffee. Ask any question.",
        meta: "weekly",
      },
    ],
    // The four documents the intern submits. The desk tasks on the board
    // (decrypt, identify cipher, audit JWTs, etc.) are the lab work that feeds
    // these — they are folded into the deliverable descriptions below so the
    // folder, the report editor, and the FAQ all describe the same four docs.
    practicalTasks: [
      {
        id: "d1-crypto-failure-mapping",
        title: "D1 — Crypto failure mapping",
        description:
          "The post-mortem. One table (or row-per-finding list) naming every cryptographic failure in The Griot's artefacts: the AES key and IV left in the same staging config, the reused IV, the HS256 token signed with a five-character secret, and each of the three session-token failures (alg, lifecycle, privilege). Every finding cites the specific evidence-pack file it came from AND one external standard by section number (RFC, NIST SP, or FIPS). Open with two or three sentences on hash vs encryption — when the Griot should have hashed and when they should have encrypted — using their own choices as the example.",
        deliverable: "D1 — Crypto failure mapping (Google Doc or DOCX; every finding cites the artefact file + one external standard by section number)",
      },
      {
        id: "d2-decoded-artefact-appendix",
        title: "D2 — Decoded artefact appendix",
        description:
          "The working. For each artefact: the recovered plaintext, the method you used, and the intermediate outputs where a file has layers. AES-CBC (01): paste the plaintext and your CyberChef recipe URL. Classical cipher (02): name the cipher, show the plaintext, one sentence on how you identified it — frequency analysis is plenty. Three JWTs (03): a table, one row per token, header + payload decoded and the specific red flag. Layered recon memo (05): peel base64 → ROT13 → substitution and paste every intermediate output plus the final plaintext.",
        deliverable: "D2 — Decoded artefact appendix (Google Doc or DOCX; plaintext + method + intermediate outputs per artefact, JWT table inside)",
        alternate:
          "Prefer code? Run the AES-CBC decryption in Python with the `cryptography` library and paste the script instead of the CyberChef URL — either is full credit.",
      },
      {
        id: "d3-five-controls",
        title: "D3 — Five controls the board should approve",
        description:
          "Five concrete controls (products, policies, or configurations) Sankofa should adopt — one short justification each, and each control mapping to at least two of the failures you named in D1. Specific enough that someone else could go and implement it: 'rotate to AES-GCM with a managed KMS key' is a control; 'improve crypto hygiene' is not. Assume a small team and a tight budget — Bayo will say no to anything whose cost you can't make concrete.",
        deliverable: "D3 — Five controls the board should approve (Google Doc or DOCX; each control maps to ≥ 2 failures from D1)",
      },
      {
        id: "d4-ethics-stance",
        title: "D4 — Ethics stance: the Ethnos Cyber call",
        description:
          "300–500 words, your own writing — the AI-detect signal on this one is high. A senior contact at Ethnos Cyber (your cohort's sponsor and a major regional security firm) reaches out privately, asking you to forward the decoded artefacts and your control recommendations to them ahead of the formal Sankofa board briefing. They call it 'ecosystem visibility' and hint that interns who help are remembered when full-time roles open. Address: who you would consult before deciding, what you would and would not share and why, how you square loyalty to the sponsor against your obligations to Sankofa, and one concrete action you would take regardless of what your manager says. Cite at least one clause of the ISC2 Code of Ethics by number.",
        deliverable: "D4 — Ethics stance (Google Doc or DOCX, 300–500 words, your own writing; cites the ISC2 canon by number)",
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
      "D1 — Crypto failure mapping: every finding cites the artefact file plus one external standard by section number (RFC, NIST, or FIPS)",
      "D2 — Decoded artefact appendix: plaintext, method, and intermediate outputs for every artefact (JWT findings in a table)",
      "D3 — Five controls the board should approve: each control maps to at least two failures named in D1",
      "D4 — Ethics stance (the Ethnos Cyber call): 300–500 words, your own writing, references the ISC2 canon by number",
    ],
  },

  // ─────────────────────────────────────────────────────────────
  STAGE_2: {
    label: "Stage 2",
    subtitle: "Web Application Security — The Attack Surface",
    missionBrief: [
      "The decrypted files point at a path: sankofa.internal/legacy-admin/. It is a Django app from 2019 that was supposed to be decommissioned two years ago. Tunde confirms it is still online and publicly reachable — and as of this morning, the press knows it too.",
      "You are writing the pentest-style findings report Bayo, the Head of Engineering, will actually act on. Nobody is going to tell you what is wrong with this app — finding it is the job. Prove each weakness from the evidence, rank it by business risk, tell the team what to fix first, and tell them what to watch while the holes are still open. You have a week. The team has two, and they no longer have the luxury of arguing about it.",
      "You will not run any scans against real infrastructure. Every weakness you need is already sitting in the source, the captures, and the sample tokens. You read them in the browser, no install needed.",
      "Your evidence pack: the recovered login source, an edge-proxy capture of the attacker's 02:14–02:31 UTC session with the analyst annotations stripped off — you reconstruct the path yourself — the three JWTs the app handed out, an XML import body the attacker submitted, and a redacted twenty-row sample of what left the building (you'll quantify impact from it here, and it feeds the NDPA letter in Stage 4). The recovered source still carries the original developer's comments. Some of them flag a bug honestly; some flag nothing while the bug sits two lines down. Trust the code, not the margin. What is wrong, how many, and how they chain is for you to discover.",
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
        text: "It's public. TechCabal ran \"Lagos fintech Sankofa confirms data incident\" at 07:40. The support queue is on fire and Legal is already citing the report you haven't finished. No comment to anyone outside this building — not even the friend who DMs you about it.",
        meta: "breaking · this morning",
      },
      {
        kind: "alert",
        text: "Word out of the all-hands: someone senior is going to take the fall for /legacy-admin/ outliving its kill date by two years. Two names in the corridor. Neither is Ngozi — she filed her objection in writing six months ago and kept the receipt.",
        meta: "from #insiders · 1 hour ago",
      },
      {
        kind: "news",
        text: "BoltCash still ships in 6 weeks. Marketing wanted legacy-admin fixed BEFORE launch, Bayo wanted it AFTER — after this morning that fight is over, but the clock didn't move. You cannot fix everything in time. Part of the job is saying what to watch instead.",
        meta: "internal · updated today",
      },
      {
        kind: "gossip",
        text: "Ngozi's OpenSec offer is still on the table. Read the room: the one person who tried to kill this app is the one holding an exit. Bayo doesn't know yet. Don't be the one who tells him.",
        meta: "from #insiders · today",
      },
      {
        kind: "notice",
        text: "All e2e tests use the format e2e-XXX@sankofa.dev. Do not test against admin@sankofa.com — that account belongs to the actual admin and your test will be on his desk by Tuesday.",
        meta: "pinned by #qa",
      },
      {
        kind: "meeting",
        text: "Post-mortem moved up to Thursday 15:30, now mandatory. The /legacy-admin/ timeline gets read into the record. Bring your remediation order and your CVSS vectors, or don't bring an opinion.",
        meta: "this Thursday",
      },
      {
        kind: "joke",
        text: "Sankofa pentest etiquette: if you find something, write it up. If you can exploit it from your phone during the post-mortem, you must stop, put the phone down, and write it up. Discipline.",
        meta: "wiki: pentester-handbook",
      },
    ],
    practicalTasks: [
      {
        id: "findings-catalogue",
        title: "Find what's wrong — we're not telling you",
        description:
          "Read the recovered source, the three tokens, and the XML import. We have not told you what is broken or how many findings there are — that is the work. Catalogue every distinct weakness you can substantiate, and for each one quote the exact line or request that proves it, name the class, and rate your confidence. The dev's own comments flag some bugs and stay silent on others — treat an unflagged line with the same suspicion as a flagged one. Missing the obvious ones shows; finding the quiet ones is how you stand out.",
        deliverable: "findings-catalogue (Google Doc — one row per finding: class, exact evidence line/request, confidence)",
      },
      {
        id: "decoy-adjudication",
        title: "Decide the one that looks worse than it is",
        description:
          "One construct in the source looks hand-rolled and dangerous, and it will tempt you to flag it critical. Decide whether it is actually exploitable. If it is, show the exploit. If it is not, prove why — name the exact mechanism that saves it. A false positive in a real report costs the team a sprint, so we score a clean disproof as hard as a finding.",
        deliverable: "decoy-adjudication (Google Doc — the construct, your verdict, and the proof either way)",
      },
      {
        id: "exploit-chain",
        title: "Rebuild the attacker's path — annotations removed",
        description:
          "The capture's analyst notes were stripped before it reached you. Reconstruct the attacker's session yourself, from first contact to exfiltration, as one chain: initial access, authentication forgery, the XML file-read, and what they walked out with. For every hop give a concrete, reproducible PoC — the exact request, the exact forged token header and payload, the exact XML body — not a description. The chain has to explain how an unauthenticated outsider reaches the data in 05-exfil-sample.csv.",
        deliverable: "exploit-chain (Google Doc — numbered hops, each with a working PoC and the capture line it matches)",
      },
      {
        id: "cvss-and-impact",
        title: "Score it, and put a number on the damage",
        description:
          "Give every substantiated finding a CVSS 3.1 vector — the vector string is mandatory, a bare number is rejected — and quantify business impact in customers and naira using the exfil sample and the BoltCash launch timeline. Where two weaknesses only matter once chained, score the chain, not just the isolated parts.",
        deliverable: "findings-table (Google Doc or MS Word — table inside: finding, OWASP category, CVSS vector, chained-with, quantified impact)",
      },
      {
        id: "detection-stopgap",
        title: "Tell them what to watch while it bleeds",
        description:
          "Engineering cannot fix everything before BoltCash ships. For the two findings you rank most dangerous, write a detection that would have caught The Griot in the act — a concrete SIEM/log query or WAF rule, naming the exact field or pattern it keys on and the false-positive rate you would expect. A stopgap they can deploy today beats a fix they land next quarter.",
        deliverable: "detection-stopgap (Google Doc — two rules, each with the trigger logic and expected noise)",
      },
      {
        id: "findings-report",
        title: "The report Bayo acts on",
        description:
          "Write the finished pentest report: an executive summary a CFO understands, a short threat model, the substantiated findings tied to evidence, the decoy you disproved (state it — it buys trust), the exploit chain, CVSS plus money impact, a remediation order argued by risk reduction per hour of effort, and the detection stopgaps. 6–8 pages. If a finding is not tied to a line of evidence, cut it.",
        deliverable: "sankofa-pentest-report (Google Doc, 6–8 pages)",
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
      "A findings catalogue the intern discovered unaided — each weakness citing the exact source line, token, or capture request that proves it, with a confidence rating",
      "The disproved decoy, stated explicitly, with the mechanism that makes it safe (a clean false-positive call, scored as hard as a finding)",
      "An end-to-end exploit chain with a reproducible PoC per hop, reconciled to the un-annotated HTTP capture and ending at the exfil sample",
      "A findings table with OWASP category, CVSS vector, chained-with, and quantified business impact in customers and naira",
      "A remediation plan in priority order (risk reduction per hour of effort) plus two deployable detection stopgaps for what cannot be fixed before BoltCash ships",
    ],
    commsThread: [
      {
        from: "Amaka Eze",
        role: "Head of Security",
        time: "Mon 07:52",
        body: "It's public, {firstName}. TechCabal ran the incident at 07:40. We do not comment — not to press, not in group chats, not to the friend who DMs you about it. The cleaner your findings, the faster we close this. Heads down.",
        alignment: "ally",
        kind: "pinned",
      },
      {
        from: "Ngozi Ojukwu",
        role: "DevSecOps Lead",
        time: "Mon 08:10",
        body: "Six months ago I wrote that this app would do exactly this. Nobody listened. Now your CVSS vectors are the board's evidence — so make them airtight. Rank the findings the way Bayo thinks: business risk, not severity.",
        alignment: "ally",
      },
      {
        from: "Tunde Afolabi",
        role: "Threat Intel Lead",
        time: "Mon 08:31",
        body: "I had to strip my annotations off the capture before it reached you — Counsel's call, chain-of-custody now that this is a filing. You rebuild the attacker path clean. It's harder. It's also better for the record. Read every line.",
        alignment: "ally",
      },
      {
        from: "Office of the General Counsel",
        role: "Legal",
        time: "Mon 09:03",
        body: "Message removed pending a personnel matter. Do not forward speculation about Floor 5 staffing; anything you heard in the all-hands stays out of writing.",
        alignment: "external",
        kind: "redacted",
      },
      {
        from: "Bayo Ogunyemi",
        role: "Head of Engineering",
        time: "Mon 09:20",
        body: "Whatever you put in that report, I'm the one answering for it Thursday — possibly for more than the app. Make it defensible, make it ordered, and tell me what I can ship a watch on before BoltCash. No theatre.",
        alignment: "peer",
      },
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
      "Your evidence pack has six files. 01-process-listing.txt is Volatility 3 linux.pslist output from 10.0.1.87; find the persistence chain (.bashrc → .helper → curl beacon to 185.220.101.9). 02-filesystem-index.txt is every file modified since rebuild — includes the rogue sudoers entry and the Griot's internal memo. 03-syslog.txt is 72 hours of syslog with EXECVE audit, sudo less invocations, the cron RELOAD trick, and the tar+scp exfil. 04-siem-export.csv is nine ranked SIEM alerts; triage by severity and attach each rule to the artefact that proves it. 05-memory-strings.txt is pre-parsed strings from the memory dump — environment variables, command fragments, encoded chunks, and a lot of noise to filter through. 06-netflow.csv is netflow records around the breach window; separate the beacons and the scp transfer from DNS, NTP, and unrelated lateral traffic.",
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
        text: "72-hour clock for GDPR notification started at 04:12 UTC on 2024-06-08. Counsel knows the exact second. If you reference \"the clock\" in your report, that's what you mean.",
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
      "Incident timeline (every event row cites at least two of: process listing, syslog, SIEM CSV, netflow, memory strings; each row includes confidence H/M/L with rationale)",
      "Root cause and persistence chain (cross-correlate login, process, filesystem, memory, and network evidence)",
      "Containment, eradication, and IOC list (each IOC cites at least two independent artefacts where available)",
      "Lessons learned and policy changes recommended (tie each change to a timeline failure and an evidence file)",
    ],
  },

  // ─────────────────────────────────────────────────────────────
  STAGE_4: {
    label: "Stage 4",
    subtitle: "Governance & Risk — The Debrief",
    missionBrief: [
      "Tomorrow at 09:00 you are in front of Sankofa's board. Three members: the Chair, the CFO, and an independent director who used to chair a bank. They do not care about MITRE ATT&CK technique IDs. They care about three things: did customer PII leave the building, are we in breach of GDPR/NDPA, and what does the next twelve months of security spend need to look like.",
      "This is the capstone. You are no longer a technical analyst — you are the voice the board hears. Every artefact you submit lives on the record. Every number gets quoted back at you.",
      "When the chair signs off on your package, you are no longer a candidate. You pick your specialist track — SOC, Ethical Hacking, or GRC — and the next chapter of your work is the one you chose.",
      "Your evidence pack has seven files. Five are templates you complete: breach-notification-template.md (NDPA Section 40 skeleton with bracketed fields), risk-register-template.csv (five-row register with NIST CSF 2.0 + ISO 27001:2022 Annex A columns; R-001 worked as an example), board-memo-template.md (one-page slide memo — title, three numbers, ask, tradeoff), 30-60-90-roadmap-template.md (nine-row roadmap plus a mandatory deferral list), and control-mapping-skeleton.csv (eight-row mapping across NIST CSF 2.0, ISO 27001:2022 Annex A, and MITRE D3FEND). Two are inputs you must explicitly respond to: 06-external-audit-findings.md (three KPMG-style findings on the IR response — accept, dispute, or defer each), and 07-board-minutes-excerpt.md (board questions you must answer head-on in the memo and the NDPA letter).",
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
        bio: "Sees security spend as insurance. Will fund what you can quantify, will cut what you can't. Round numbers in USD are fine — sources required.",
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
        bio: "Briefs the board on regulatory exposure. Your GDPR notification letter and her draft go in together. Reconcile them before the meeting.",
        alignment: "ally",
        greeting: "We submit one letter. Reconcile your draft with mine before nine.",
      },
      {
        name: "Adaobi Nnamdi",
        role: "Liaison, Data Protection Authority",
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
      "The GDPR Article 33 notification letter is a regulated submission. Names, dates, and counts must be defensible against the evidence in Stages 0-3.",
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
        text: "Adaobi Nnamdi (DPA liaison) was at university with Counsel Ifeoma. They are friendly. Don't mistake friendly for lenient.",
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
        id: "gdpr-notification-letter",
        title: "GDPR 72-hour breach notification letter",
        description:
          "Draft the Article 33 notification to the supervisory authority under GDPR. State the controller + DPO, category + approximate volume of affected subjects, nature of breach, consequences, containment, remediation roadmap. Use the template in the resources as your starting point.",
        deliverable: "gdpr-notification-letter (Google Doc)",
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
          "Build a quarter-by-quarter roadmap (Q1–Q4) with the controls you would implement, rough cost ranges in USD, and the owner by role. Prioritise by risk reduction per dollar.",
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
        label: "General Data Protection Regulation (GDPR) (full text)",
        href: "https://gdpr-info.eu/",
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
      "One-paragraph situation summary - what the board reads first, with counts tied to Stage 2 and Stage 3 evidence",
      "Regulatory + governance synthesis (NDPA letter cites the external audit findings and board minutes)",
      "Risk register entries arising from the incident (row 1 must respond to board open question Q3)",
      "Control gaps against NIST CSF 2.0 and ISO 27001:2022, with evidence from at least two stages per gap",
      "12-month remediation roadmap tied to board questions, audit recommendations, owners, and cost bands",
      "Your track-selection rationale, grounded in the evidence work you performed across all stages",
    ],
  },
};
