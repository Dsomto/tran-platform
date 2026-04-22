// CyberWordle — daily cybersecurity word list (5–9 letters)
// Every entry is a genuine cybersecurity term, tool, or concept.

export const WORDS: string[] = [
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
