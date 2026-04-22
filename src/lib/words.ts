// CyberWordle — daily cybersecurity word list (4–9 letters)
// Every entry is a genuine cybersecurity term, tool, or concept.

export const WORDS: string[] = [
  // ── 4 letters ──────────────────────────────────────────────
  "HACK", "PORT", "ROOT", "CODE", "FLAG",
  "LOCK", "PING", "RISK", "SCAN", "SPAM",
  "WORM", "LEAK", "HASH", "WIFI", "LOGS",
  "NMAP", "DATA", "FILE", "USER", "PASS",
  "SALT", "PATH", "HOOK", "TOOL", "WIPE",
  "DUMP", "TRAP", "BUGS", "GREP", "BASH",
  "SUDO", "CURL", "HTTP", "FORK", "KILL",
  "DIFF", "EDIT", "KEYS", "PIPE", "EXEC",

  // ── 5 letters ──────────────────────────────────────────────
  "PHISH", "PROXY", "PATCH", "VIRUS", "SPOOF",
  "CRACK", "SHELL", "ADMIN", "TOKEN", "BRUTE",
  "CYBER", "SNORT", "AUDIT", "PIVOT", "RECON",
  "ALERT", "SNIFF", "OSINT", "NONCE", "CRYPT",
  "BLOCK", "FLOOD", "VAULT", "LINUX", "REGEX",
  "WHOIS", "SCADA", "LAYER", "PARSE", "TRACE",
  "PORTS", "SOCKS", "NGINX", "CHMOD", "OAUTH",
  "HTTPS", "SIGMA", "ASSET", "NIKTO", "WAZUH",

  // ── 6 letters ──────────────────────────────────────────────
  "TROJAN", "BOTNET", "CIPHER", "HACKER", "BEACON",
  "DEFCON", "SPLUNK", "SOCKET", "BREACH", "VECTOR",
  "THREAT", "ACCESS", "DOMAIN", "SUBNET", "ROUTER",
  "PACKET", "TUNNEL", "SCRIPT", "KERNEL", "DEAUTH",
  "NESSUS", "COBALT", "DOCKER", "SYSLOG", "BINARY",
  "DENIAL", "INJECT", "POLICY", "BACKUP", "ATTACK",
  "SHIELD", "SECURE", "FILTER", "KIBANA", "ZOMBIE",
  "DAEMON", "REPORT",

  // ── 7 letters ──────────────────────────────────────────────
  "MALWARE", "EXPLOIT", "PAYLOAD", "ENCRYPT", "DECRYPT",
  "ROOTKIT", "SCANNER", "DEFENSE", "HASHCAT", "HASHING",
  "SANDBOX", "PENTEST", "DARKWEB", "SPYWARE", "NETWORK",
  "CRACKER", "TCPDUMP", "STEALTH", "SNIFFER", "LATERAL",
  "HANDLER", "SESSION", "VISHING", "DARKNET", "MASKING",
  "REVERSE", "CAPTURE", "ROUTING", "LOCKOUT", "MONITOR",
  "WEBHOOK", "CALDERA", "CRYPTER", "AUTOPSY", "REDTEAM",

  // ── 8 letters ──────────────────────────────────────────────
  "PHISHING", "FIREWALL", "FORENSIC", "BACKDOOR", "INCIDENT",
  "ENDPOINT", "ANALYSIS", "METADATA", "PROTOCOL", "SCANNING",
  "CRACKING", "SPOOFING", "HONEYPOT", "AIRCRACK", "SNIFFING",
  "HIJACKER", "DEFENDER", "SECURITY", "ATTACKER", "ENCODING",
  "PASSWORD", "BLUETEAM", "SMISHING", "KEYSTORE", "KERBEROS",
  "PIVOTING", "DEEPFAKE", "PATCHING", "ESCALATE", "MIMIKATZ",

  // ── 9 letters ──────────────────────────────────────────────
  "KEYLOGGER", "WIRESHARK", "DECEPTION", "BLACKLIST", "WHITELIST",
  "SHELLCODE", "INTRUSION", "PRIVILEGE", "HARDENING", "OBFUSCATE",
  "CLICKJACK", "PLAINTEXT", "INJECTION", "TUNNELING", "ENCRYPTED",
  "FOOTPRINT", "CERTIFIED", "SYMMETRIC", "MALICIOUS", "ANTIVIRUS",
];

// Derive the daily word deterministically from the date.
// Everyone on the same calendar day gets the same word.
export function getDailyWord(): { word: string; index: number } {
  const epoch = new Date(2026, 0, 1).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayIndex = Math.floor((today.getTime() - epoch) / 86_400_000);
  const idx = ((dayIndex % WORDS.length) + WORDS.length) % WORDS.length;
  return { word: WORDS[idx].toUpperCase(), index: dayIndex };
}

// Daily word filtered to a specific length. Players pick 4, 5, 6, or 7.
// Each length gets its own daily rotation so players can share results
// comparably within a length bucket.
export function getDailyWordByLength(length: number): { word: string; index: number } {
  const pool = WORDS.filter((w) => w.length === length);
  if (pool.length === 0) {
    // Fallback: pick from full pool.
    return getDailyWord();
  }
  const epoch = new Date(2026, 0, 1).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayIndex = Math.floor((today.getTime() - epoch) / 86_400_000);
  const idx = ((dayIndex % pool.length) + pool.length) % pool.length;
  return { word: pool[idx].toUpperCase(), index: dayIndex };
}

// Max tries per word length:
//   4 → 4, 5 → 5, 6 → 6, 7 → 6 (cap)
export function maxGuessesFor(length: number): number {
  if (length <= 5) return length;
  return 6;
}
