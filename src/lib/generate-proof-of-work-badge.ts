function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function dateLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function splitName(fullName: string): string[] {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return ["Ubuntu Bridge Intern"];

  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > 24 && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);

  if (lines.length <= 2) return lines;
  return [lines[0], `${lines.slice(1).join(" ").slice(0, 27).trim()}...`];
}

export function generateProofOfWorkBadge(opts: {
  fullName: string;
  score: number;
  passingScore: number;
  issuedAt: Date;
  badgeId: string;
}): string {
  const { fullName, score, passingScore, issuedAt, badgeId } = opts;
  const nameLines = splitName(fullName).map(escapeXml);
  const issued = escapeXml(dateLabel(issuedAt));
  const badge = escapeXml(badgeId);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200" role="img" aria-labelledby="title desc">
  <title id="title">Ubuntu Bridge Proof of Work Badge</title>
  <desc id="desc">Stage 3 Incident Response proof of work badge for ${escapeXml(fullName)}</desc>
  <defs>
    <linearGradient id="navy" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#06152F"/>
      <stop offset="0.52" stop-color="#0A1F44"/>
      <stop offset="1" stop-color="#12376B"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F3D36B"/>
      <stop offset="0.45" stop-color="#C9A227"/>
      <stop offset="1" stop-color="#7A5E12"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="22" stdDeviation="22" flood-color="#06152F" flood-opacity="0.22"/>
    </filter>
  </defs>
  <rect width="1200" height="1200" fill="#F8FAFC"/>
  <circle cx="600" cy="600" r="500" fill="url(#navy)" filter="url(#softShadow)"/>
  <circle cx="600" cy="600" r="462" fill="none" stroke="url(#gold)" stroke-width="18"/>
  <circle cx="600" cy="600" r="417" fill="none" stroke="#A9BCDE" stroke-width="3" opacity="0.72"/>

  <g fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" text-anchor="middle">
    <text x="600" y="210" font-size="31" font-weight="700" letter-spacing="8">UBUNTU BRIDGE</text>
    <text x="600" y="254" font-size="22" letter-spacing="4" fill="#C3D0E6">CYBERSECURITY INTERNSHIP</text>
    <text x="600" y="350" font-size="54" font-weight="800" letter-spacing="3">PROOF OF WORK</text>
    <text x="600" y="405" font-size="30" font-weight="700" fill="#EBCB63">STAGE 3 · INCIDENT RESPONSE</text>

    <path d="M430 486h340" stroke="#C9A227" stroke-width="5" stroke-linecap="round"/>
    <circle cx="600" cy="486" r="11" fill="#C9A227"/>

    ${nameLines
      .map(
        (line, index) =>
          `<text x="600" y="${565 + index * 58}" font-family="Georgia, 'Times New Roman', serif" font-size="48" font-weight="700">${line}</text>`
      )
      .join("\n    ")}

    <text x="600" y="718" font-size="25" fill="#DCE8FF">verified practical incident response work</text>
    <text x="600" y="764" font-size="23" fill="#DCE8FF">timeline, IOC analysis, MITRE ATT&amp;CK mapping, and executive reporting</text>
  </g>

  <g transform="translate(355 812)">
    <rect x="0" y="0" width="490" height="130" rx="18" fill="#FFFFFF" opacity="0.96"/>
    <g font-family="Arial, Helvetica, sans-serif" text-anchor="middle">
      <text x="122" y="52" font-size="19" font-weight="700" fill="#64748B" letter-spacing="2">SCORE</text>
      <text x="122" y="97" font-size="42" font-weight="800" fill="#047857">${score}</text>
      <text x="245" y="52" font-size="19" font-weight="700" fill="#64748B" letter-spacing="2">PASS</text>
      <text x="245" y="97" font-size="42" font-weight="800" fill="#0A1F44">${passingScore}</text>
      <text x="368" y="52" font-size="19" font-weight="700" fill="#64748B" letter-spacing="2">ISSUED</text>
      <text x="368" y="92" font-size="24" font-weight="800" fill="#0A1F44">${issued}</text>
    </g>
  </g>

  <g font-family="Arial, Helvetica, sans-serif" text-anchor="middle">
    <text x="600" y="1000" font-size="22" fill="#C3D0E6">Badge ID ${badge}</text>
    <text x="600" y="1038" font-size="18" fill="#94A3B8">ubuntubridgeinitiatives.org · Cohort 1</text>
  </g>
</svg>`;
}
