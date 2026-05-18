// Transparent multi-metric scoring for the "Recommended" tab.
//
// This is a heuristic ranking, NOT a language model — it scores signals that
// are present in the application text. It surfaces the strongest applications
// first; it is a decision-support tool, not the decision.
//
// The target profile (from the programme team): someone who has genuinely
// put in the work but is still emerging — NOT a total beginner, NOT
// over-experienced, writing a real application rather than a one-liner.

export interface ScoreInput {
  experience: string | null;
  whyPickYou: string | null;
  goals: string | null;
  dedication: string | null;
  ageRange: string | null;
  currentStatus: string | null;
}

export interface ScoredApplication {
  score: number; // 0-100
  reasons: string[]; // human-readable, positives first then flags
}

// Hands-on practice platforms, tools, practical work and learning signals.
// Each distinct hit is evidence the applicant has actually done something.
const HANDS_ON: { term: string; label: string }[] = [
  { term: "tryhackme", label: "TryHackMe" },
  { term: "try hack me", label: "TryHackMe" },
  { term: "hack the box", label: "Hack The Box" },
  { term: "hackthebox", label: "Hack The Box" },
  { term: "htb", label: "Hack The Box" },
  { term: "picoctf", label: "picoCTF" },
  { term: "ctf", label: "CTF" },
  { term: "overthewire", label: "OverTheWire" },
  { term: "letsdefend", label: "LetsDefend" },
  { term: "blue team labs", label: "Blue Team Labs" },
  { term: "rangeforce", label: "RangeForce" },
  { term: "hackerone", label: "HackerOne" },
  { term: "bugcrowd", label: "Bugcrowd" },
  { term: "wireshark", label: "Wireshark" },
  { term: "burp", label: "Burp Suite" },
  { term: "nmap", label: "Nmap" },
  { term: "metasploit", label: "Metasploit" },
  { term: "splunk", label: "Splunk" },
  { term: "nessus", label: "Nessus" },
  { term: "openvas", label: "OpenVAS" },
  { term: "kali", label: "Kali Linux" },
  { term: "volatility", label: "Volatility" },
  { term: "autopsy", label: "Autopsy" },
  { term: "ghidra", label: "Ghidra" },
  { term: "wireguard", label: "networking" },
  { term: "flare-vm", label: "FLARE-VM" },
  { term: "flarevm", label: "FLARE-VM" },
  { term: "snort", label: "Snort" },
  { term: "sentinel", label: "Microsoft Sentinel" },
  { term: "hashcat", label: "Hashcat" },
  { term: "maltego", label: "Maltego" },
  { term: "home lab", label: "home lab" },
  { term: "homelab", label: "home lab" },
  { term: "hands-on", label: "hands-on work" },
  { term: "hands on", label: "hands-on work" },
  { term: "capstone", label: "a capstone project" },
  { term: "internship", label: "an internship" },
  { term: "vapt", label: "VAPT" },
  { term: "penetration test", label: "penetration testing" },
  { term: "pentest", label: "penetration testing" },
  { term: "incident response", label: "incident response" },
  { term: "threat intel", label: "threat intelligence" },
  { term: "malware analysis", label: "malware analysis" },
  { term: "comptia", label: "CompTIA" },
  { term: "security+", label: "Security+" },
  { term: "sec+", label: "Security+" },
  { term: "isc2", label: "ISC2" },
  { term: "isc²", label: "ISC2" },
  { term: "certified in cybersecurity", label: "ISC2 CC" },
  { term: "google cybersecurity", label: "Google Cybersecurity cert" },
  { term: "networking academy", label: "Cisco Networking Academy" },
  { term: "cisco", label: "Cisco training" },
  { term: "alx", label: "ALX" },
  { term: "bootcamp", label: "a bootcamp" },
  { term: "cysa", label: "CySA+" },
];

// Reads as someone with no foundation at all.
const BEGINNER_HARD = [
  "complete beginner",
  "total beginner",
  "absolute beginner",
  "no knowledge",
  "no experience",
  "no prior experience",
  "just starting",
  "just started",
  "newbie",
  "i am new to",
  "i'm new to",
  "no background",
];

// Reads as a senior professional who does not need a foundation programme.
const OVER_EXPERIENCED = [
  "senior ",
  "team lead",
  "tech lead",
  "head of",
  "cissp",
  "cism",
  "architect",
  "principal ",
  "over a decade",
  "many years of experience",
];

// Generic, hollow vocabulary that clusters in machine-written copy.
const AI_VOCAB = [
  "delve",
  "leverage",
  "elevate",
  "ever-evolving",
  "ever evolving",
  "rapidly evolving",
  "fast-paced world",
  "in today's digital",
  "tapestry",
  "underscore",
  "testament to",
  "realm of",
  "landscape of",
  "cutting-edge",
  "seamless",
  "navigating the",
  "embark on",
  "honed my",
];

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// Concrete cybersecurity concepts/terms — distinct from the hands-on list.
// Used only to confirm an applicant shows SOME prior knowledge; the bare
// word "cybersecurity" is deliberately excluded (everyone applying says it).
const CYBER_KNOWLEDGE = [
  ...HANDS_ON.map((h) => h.term),
  "network", "linux", "phishing", "firewall", "encryption", "cryptograph",
  "vulnerab", "threat", "siem", "soc analy", "owasp", "penetration",
  "malware", "incident", "risk management", "iso 27001", "iso27001",
  "cia triad", "ethical hack", "forensic", "nist", "grc", "vapt",
  "red team", "blue team", "active directory", "phishing", "ransomware",
];

export interface DisqualifyInput {
  fullName: string | null;
  experience: string | null;
  whyPickYou: string | null;
  goals: string | null;
}

/**
 * Hard gates for the Recommended list — non-negotiable rules applied on top
 * of the score. Returns a short reason if the applicant fails a gate, or
 * null if they pass. Disqualified applicants are excluded from the
 * recommendations regardless of how highly they scored.
 */
export function disqualifier(a: DisqualifyInput): string | null {
  // 1. A real, complete full name — at least two proper alphabetic parts.
  const nameParts = (a.fullName ?? "")
    .trim()
    .split(/\s+/)
    .filter(
      (p) =>
        /^[\p{L}][\p{L}'.-]*$/u.test(p) &&
        p.replace(/[^\p{L}]/gu, "").length >= 2
    );
  if (nameParts.length < 2) return "No real full name";

  const why = (a.whyPickYou ?? "").trim();
  const free = `${a.experience ?? ""} ${why} ${a.goals ?? ""}`;
  const totalWords = free.trim().split(/\s+/).filter(Boolean).length;
  const whyWords = why.split(/\s+/).filter(Boolean).length;

  // 2. Not a one/two-liner — both overall, and on the key "why pick you".
  if (totalWords < 50) return "One/two-line application — too thin";
  if (whyWords < 12) return "One-line answer to 'why pick you'";

  // 3. Must show some prior cybersecurity knowledge — a real concept, tool,
  //    platform, certification or course, not just "I want to learn".
  const lc = free.toLowerCase();
  if (!CYBER_KNOWLEDGE.some((t) => lc.includes(t))) {
    return "No prior cybersecurity knowledge shown";
  }

  return null;
}

export function scoreApplication(a: ScoreInput): ScoredApplication {
  const experience = a.experience ?? "";
  const whyPickYou = a.whyPickYou ?? "";
  const goals = a.goals ?? "";
  // NOTE: dedication is deliberately excluded from the AI / em-dash scan —
  // its canned answer ("Yes — I'm fully committed…") itself contains an
  // em-dash, so scanning it would falsely flag every applicant.
  const free = `${experience}  ${whyPickYou}  ${goals}`;
  const lc = free.toLowerCase();
  const totalWords = free.trim().split(/\s+/).filter(Boolean).length;

  const reasons: string[] = [];

  // ── 1. Evidence of real, hands-on work (0–34) ──────────────────────
  const matchedLabels = new Set<string>();
  for (const { term, label } of HANDS_ON) {
    if (lc.includes(term)) matchedLabels.add(label);
  }
  const hits = matchedLabels.size;
  const realWork = clamp(hits * 4.5, 0, 34);
  if (hits >= 2) {
    reasons.push(
      `Real hands-on signals: ${[...matchedLabels].slice(0, 5).join(", ")}`
    );
  } else if (hits === 0) {
    reasons.push("No concrete hands-on work mentioned");
  }

  // ── 2. Effort in the application (0–24) ────────────────────────────
  // One-liners score near zero; a genuine effort scores full.
  const effort = clamp(((totalWords - 40) / (250 - 40)) * 24, 0, 24);
  if (totalWords < 55) {
    reasons.push(`Very thin application (~${totalWords} words)`);
  } else if (totalWords >= 180) {
    reasons.push(`Detailed, considered application (~${totalWords} words)`);
  }

  // ── 3. Sweet-spot experience (0–22) — non-monotonic ────────────────
  const isOverExperienced =
    OVER_EXPERIENCED.some((t) => lc.includes(t)) ||
    (() => {
      const m = lc.match(/(\d+)\s*\+?\s*years?/);
      return m ? Number(m[1]) >= 6 : false;
    })();
  const beginnerHard = BEGINNER_HARD.some((t) => lc.includes(t));

  let sweetSpot: number;
  if (isOverExperienced) {
    sweetSpot = 6;
    reasons.push("Looks over-experienced for a foundation programme");
  } else if (beginnerHard && hits < 2) {
    sweetSpot = 5;
    reasons.push("Reads as a complete beginner with no foundation yet");
  } else if (hits >= 2) {
    sweetSpot = 22;
    reasons.push("Emerging — has done the work, still has room to grow");
  } else {
    sweetSpot = 14;
  }

  // ── 4. Commitment (0–10) — from the dedication pick ────────────────
  const ded = (a.dedication ?? "").toLowerCase();
  let commitment = 5;
  if (ded.includes("fully committed")) commitment = 10;
  else if (ded.includes("try my best")) commitment = 4;
  else if (ded.includes("not sure")) commitment = 1;

  // ── 5. Age fit (0–5) — mild, favours the early-career band ─────────
  const age = a.ageRange ?? "";
  let ageFit = 3;
  if (age.includes("20") || age.includes("25")) ageFit = 5;
  else if (age.includes("16")) ageFit = 4;
  else if (age.includes("31")) ageFit = 3;
  else if (age.includes("36")) {
    ageFit = 1;
    reasons.push("Outside the typical early-career age band");
  }

  // ── 6. Employment factor (−4–0) — full-time work limits time ───────
  let employment = 0;
  if ((a.currentStatus ?? "").toLowerCase().includes("full-time")) {
    employment = -4;
    reasons.push("In full-time employment — limited time to commit");
  }

  // ── 7. AI-likely penalty (0 to −16) ────────────────────────────────
  let aiHits = 0;
  for (const t of AI_VOCAB) if (lc.includes(t)) aiHits++;
  const emDashes = (free.match(/—/g) || []).length;
  let aiPenalty = clamp(aiHits * 2.5, 0, 12);
  if (emDashes >= 6) aiPenalty += 4;
  else if (emDashes >= 3) aiPenalty += 2;
  aiPenalty = clamp(aiPenalty, 0, 16);
  if (aiPenalty >= 6) {
    reasons.push("Possible AI-generated phrasing (generic vocabulary)");
  }

  const score = clamp(
    realWork + effort + sweetSpot + commitment + ageFit + employment - aiPenalty,
    0,
    100
  );

  return { score: Math.round(score), reasons: reasons.slice(0, 5) };
}
