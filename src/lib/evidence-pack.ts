import { STAGE_BRIEFS } from "@/lib/stage-briefs";

type StageKey = keyof typeof STAGE_BRIEFS;

export interface EvidenceFile {
  filename: string;
  /** URL the file is served from. Use `/capstone/stage-N/<file>` for the
   *  in-app downloads we host under public/. */
  url: string;
  /** One-line description of what this file contains and what the intern
   *  is expected to do with it. */
  description: string;
  /** Bytes — display only. Optional. */
  bytes?: number;
}

// Stage capstone evidence packs — files hosted in /public/capstone/ and
// served by Vercel as direct downloads. Filenames here must match the
// committed files in public/capstone/stage-N/*. To add a file: drop it
// in public/capstone/stage-N/ and append a row here.
export const EVIDENCE_PACK: Record<StageKey, EvidenceFile[]> = {
  STAGE_0: [
    {
      filename: "00-mission-brief.pdf",
      url: "/capstone/stage-0/00-mission-brief.pdf",
      description:
        "READ THIS FIRST. Stage 0 capstone brief — four deliverables: D1 evidence table, D2 dismissal pattern, D3 business impact (each 3–5 pages), plus D4 judgment essay (an ethics call + an open-ended SIEM-alert scenario, 2 pages). Citation bar and submission instructions included. 9 pages.",
      bytes: 16033,
    },
    {
      filename: "auth-log-q2.txt",
      url: "/capstone/stage-0/auth-log-q2.txt",
      description:
        "Sankofa gateway-01 /var/log/auth.log excerpt, 2024-06-03 → 06-05 UTC. The Q2 ticket Tier 1 closed as 'probably nothing' — find why Amaka re-opened it.",
      bytes: 4400,
    },
    {
      filename: "encoded-strings.txt",
      url: "/capstone/stage-0/encoded-strings.txt",
      description:
        "Four encoded strings from a forwarded message. Decode each, name the encoding, write down the plaintext. One of them names the threat actor.",
      bytes: 844,
    },
    {
      filename: "tier-1-ticket-history.csv",
      url: "/capstone/stage-0/tier-1-ticket-history.csv",
      description:
        "Q2 SOC ticket history showing how SD-40812 was closed and which nearby alerts should have been correlated before dismissal.",
      bytes: 3374,
    },
    {
      filename: "sankofa-roster.csv",
      url: "/capstone/stage-0/sankofa-roster.csv",
      description:
        "Employee roster with leave and offboarding dates; use it to test whether suspicious logins match real staff availability.",
      bytes: 1323,
    },
  ],
  STAGE_1: [
    {
      filename: "01-aes-ciphertext.txt",
      url: "/capstone/stage-1/01-aes-ciphertext.txt",
      description:
        "AES-CBC ciphertext + the key/IV the Griot left in config. Decrypt it with CyberChef (AES Decrypt → CBC) and recover the plaintext that names what they were after.",
      bytes: 950,
    },
    {
      filename: "02-classical-cipher.txt",
      url: "/capstone/stage-1/02-classical-cipher.txt",
      description:
        "Classical-cipher note Griot wrote to themselves. Identify the cipher, decrypt, write both the cipher name and the plaintext.",
      bytes: 365,
    },
    {
      filename: "03-jwts.txt",
      url: "/capstone/stage-1/03-jwts.txt",
      description:
        "Three session tokens lifted from the staging server. Decode header + payload, identify at least one red flag per token (alg / lifecycle / privilege).",
      bytes: 1200,
    },
    {
      filename: "04-weak-jwt-hmac.txt",
      url: "/capstone/stage-1/04-weak-jwt-hmac.txt",
      description:
        "HS256 token signed with the legacy admin hard-coded secret; crack it offline, forge the requested token, and cite the command you used.",
      bytes: 1604,
    },
    {
      filename: "05-layered-recon-note.txt",
      url: "/capstone/stage-1/05-layered-recon-note.txt",
      description:
        "Three-layer encoded reconnaissance memo; peel base64, ROT13, and substitution layers, then report each intermediate output.",
      bytes: 880,
    },
  ],
  STAGE_2: [
    {
      filename: "01-legacy-admin-login.php",
      url: "/capstone/stage-2/01-legacy-admin-login.php",
      description:
        "/legacy-admin/login.php source recovered from prod. SQLi + MD5 password storage + open redirect + hand-rolled JWT scheme with alg:none honoured.",
      bytes: 1700,
    },
    {
      filename: "02-attacker-http-capture.txt",
      url: "/capstone/stage-2/02-attacker-http-capture.txt",
      description:
        "Edge-proxy HTTP capture of the attacker's 02:14–02:31 UTC session. Map each request to the bug class in the PHP source. Tor exit 185.220.101.9.",
      bytes: 2900,
    },
    {
      filename: "03-legacy-admin-tokens.txt",
      url: "/capstone/stage-2/03-legacy-admin-tokens.txt",
      description:
        "Three JWTs captured from /legacy-admin/. Decode each, name the lifecycle / trust / signing failure. uid=1004 matches o.adegoke from Stage 0 / 3.",
      bytes: 1100,
    },
    {
      filename: "04-import-xxe.xml",
      url: "/capstone/stage-2/04-import-xxe.xml",
      description:
        "Recovered XML import body containing an XXE file-read attempt; connect the parser flaw to the matching HTTP capture behaviour.",
      bytes: 1134,
    },
    {
      filename: "05-exfil-sample.csv",
      url: "/capstone/stage-2/05-exfil-sample.csv",
      description:
        "Redacted 20-row customer_pii export sample with placeholder identities and the affected-row count needed for impact statements.",
      bytes: 2215,
    },
  ],
  STAGE_3: [
    {
      filename: "01-process-listing.txt",
      url: "/capstone/stage-3/01-process-listing.txt",
      description:
        "Volatility 3 linux.pslist output from workstation 10.0.1.87. Find the persistence chain (.bashrc → .helper → curl beacon to 185.220.101.9).",
      bytes: 2700,
    },
    {
      filename: "02-filesystem-index.txt",
      url: "/capstone/stage-3/02-filesystem-index.txt",
      description:
        "find / -newer baseline output. Every file modified since rebuild — includes the rogue sudoers entry and the Griot's internal memo.",
      bytes: 1700,
    },
    {
      filename: "03-syslog.txt",
      url: "/capstone/stage-3/03-syslog.txt",
      description:
        "/var/log/syslog covering 72h around the breach. EXECVE audit, sudo less invocations, cron RELOAD, tar + scp exfil to attacker@185.220.101.9.",
      bytes: 1900,
    },
    {
      filename: "04-siem-export.csv",
      url: "/capstone/stage-3/04-siem-export.csv",
      description:
        "9 ranked SIEM alerts on 10.0.1.87. Triage by severity, attach each rule to the matching artefact in the other three Stage 3 files.",
      bytes: 1200,
    },
    {
      filename: "05-memory-strings.txt",
      url: "/capstone/stage-3/05-memory-strings.txt",
      description:
        "Pre-parsed memory strings with environment variables, command fragments, encoded chunks, and red herrings to cross-check against the timeline.",
      bytes: 2406,
    },
    {
      filename: "06-netflow.csv",
      url: "/capstone/stage-3/06-netflow.csv",
      description:
        "Netflow window around the breach; separate beacons and the scp transfer from DNS, NTP, and unrelated lateral traffic.",
      bytes: 1989,
    },
  ],
  STAGE_4: [
    {
      filename: "stage-4-submission-guide.html",
      url: "/capstone/stage-4/stage-4-submission-guide.html",
      description:
        "HOW TO SUBMIT — read before you hand in. The folder template (which six docs go where), the step-by-step submission, and a pre-submit checklist. Stage 4 is ONE folder at Dashboard → Reports → Stage 4, not six separate task submissions.",
      bytes: 13985,
    },
    {
      filename: "stage-4-artefacts.html",
      url: "/capstone/stage-4/stage-4-artefacts.html",
      description:
        "Every Stage 4 artefact, template, and input in one readable document (open in a browser, print to PDF if you want a copy).",
      bytes: 31066,
    },
    {
      filename: "00-stage-4-evidence-pack.md",
      url: "/capstone/stage-4/00-stage-4-evidence-pack.md",
      description:
        "Same all-in-one pack in plain Markdown, if you prefer the raw text.",
      bytes: 21016,
    },
    {
      filename: "breach-notification-template.md",
      url: "/capstone/stage-4/breach-notification-template.md",
      description:
        "GDPR Article 33 breach-notification skeleton. Fill every [BRACKETED] field from evidence collected across Stages 0–3.",
      bytes: 3285,
    },
    {
      filename: "risk-register-template.csv",
      url: "/capstone/stage-4/risk-register-template.csv",
      description:
        "5-row risk register skeleton with residual risk, NIST CSF 2.0, and ISO 27001:2022 Annex A columns. R-001 pre-filled as the worked example.",
    },
    {
      filename: "board-memo-template.md",
      url: "/capstone/stage-4/board-memo-template.md",
      description:
        "One-page board memo skeleton — title, three numbers, chart description, ask, speaking notes, anticipated questions, tradeoff decision.",
    },
    {
      filename: "30-60-90-roadmap-template.md",
      url: "/capstone/stage-4/30-60-90-roadmap-template.md",
      description:
        "30/60/90 remediation roadmap skeleton — action / owner / budget tier / dependencies / acceptance criteria / evidence / CSF 2.0 / ISO 27001 columns + deferral list.",
    },
    {
      filename: "control-mapping-skeleton.csv",
      url: "/capstone/stage-4/control-mapping-skeleton.csv",
      description:
        "8-row control-mapping skeleton — each observed weakness from Stages 1–3 mapped to NIST CSF 2.0 + ISO 27001:2022 Annex A + MITRE D3FEND.",
    },
    {
      filename: "06-external-audit-findings.md",
      url: "/capstone/stage-4/06-external-audit-findings.md",
      description:
        "External audit excerpt with three findings; accept, dispute, or defer each owner line using evidence from earlier stages.",
      bytes: 1981,
    },
    {
      filename: "07-board-minutes-excerpt.md",
      url: "/capstone/stage-4/07-board-minutes-excerpt.md",
      description:
        "Board minutes excerpt listing resolved and open questions your memo, notification letter, and roadmap must anticipate.",
      bytes: 1607,
    },
    {
      filename: "08-front-page-amaka.md",
      url: "/capstone/stage-4/08-front-page-amaka.md",
      description:
        "Plain-text transcript of the Lagos Ledger front page alleging Amaka Eze was The Griot; includes the breadcrumb trail back through Stages 0–3.",
      bytes: 6961,
    },
    {
      filename: "08-front-page-amaka.html",
      url: "/capstone/stage-4/08-front-page-amaka.html",
      description:
        "Designed newspaper-cover version of the Amaka reveal; use it for the press-risk, insider-risk, and ethics judgement calls.",
      bytes: 10401,
    },
  ],
};
