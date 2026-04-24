"use client";

import { useState } from "react";

const talents = [
  {
    name: "Amara K.",
    track: "SOC Analysis",
    emoji: "🛡️",
    color: "cyan",
    skills: ["SIEM Operations", "Threat Detection", "Incident Response", "Log Analysis", "MITRE ATT&CK"],
  },
  {
    name: "Tunde O.",
    track: "Ethical Hacking",
    emoji: "🎯",
    color: "amber",
    skills: ["Penetration Testing", "Web App Security", "Network Exploitation", "Report Writing", "OSINT"],
  },
  {
    name: "Zainab M.",
    track: "GRC",
    emoji: "📋",
    color: "emerald",
    skills: ["ISO 27001", "Risk Assessment", "Policy Development", "Compliance Auditing", "SOC 2"],
  },
  {
    name: "Emeka D.",
    track: "Ethical Hacking",
    emoji: "🎯",
    color: "amber",
    skills: ["API Security", "Cloud Pentesting", "Vulnerability Assessment", "Exploit Development", "Burp Suite"],
  },
  {
    name: "Fatima B.",
    track: "SOC Analysis",
    emoji: "🛡️",
    color: "cyan",
    skills: ["Splunk", "Threat Hunting", "Malware Triage", "Digital Forensics", "ELK Stack"],
  },
  {
    name: "Kola A.",
    track: "GRC",
    emoji: "📋",
    color: "emerald",
    skills: ["NIST CSF", "Vendor Risk", "Security Awareness", "Data Privacy", "Risk Registers"],
  },
  {
    name: "Ngozi I.",
    track: "SOC Analysis",
    emoji: "🛡️",
    color: "cyan",
    skills: ["CrowdStrike", "Suricata", "Wireshark", "Alert Triage", "Threat Intelligence"],
  },
  {
    name: "Yusuf H.",
    track: "Ethical Hacking",
    emoji: "🎯",
    color: "amber",
    skills: ["Red Teaming", "Active Directory", "Privilege Escalation", "Social Engineering", "Metasploit"],
  },
  {
    name: "Blessing O.",
    track: "GRC",
    emoji: "📋",
    color: "emerald",
    skills: ["PCI DSS", "Audit Planning", "Control Assessment", "GDPR", "Business Continuity"],
  },
];

function toInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/[^A-Za-z]/g, "").charAt(0).toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}

const colorMap: Record<string, { badge: string; badgeText: string; ring: string; tagBg: string; tagText: string }> = {
  cyan: {
    badge: "bg-cyan-light",
    badgeText: "text-cyan-dark",
    ring: "ring-cyan/20",
    tagBg: "bg-cyan/[0.08]",
    tagText: "text-cyan",
  },
  amber: {
    badge: "bg-amber-light",
    badgeText: "text-amber-dark",
    ring: "ring-amber/20",
    tagBg: "bg-amber/[0.08]",
    tagText: "text-amber",
  },
  emerald: {
    badge: "bg-emerald-light",
    badgeText: "text-emerald-dark",
    ring: "ring-emerald/20",
    tagBg: "bg-emerald/[0.08]",
    tagText: "text-emerald",
  },
};

const filters = [
  { label: "All tracks", value: "all", emoji: "✨" },
  { label: "SOC Analysis", value: "SOC Analysis", emoji: "🛡️" },
  { label: "Ethical Hacking", value: "Ethical Hacking", emoji: "🎯" },
  { label: "GRC", value: "GRC", emoji: "📋" },
];

export function TalentGallery() {
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered = activeFilter === "all"
    ? talents
    : talents.filter((t) => t.track === activeFilter);

  return (
    <section
      id="talent"
      aria-labelledby="talent-heading"
      className="relative py-28 sm:py-36 bg-background bg-scan overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="crosshair top-[8%] left-[10%] hidden lg:block" aria-hidden="true" />
      <div className="crosshair bottom-[12%] right-[15%] hidden lg:block" aria-hidden="true" />
      <div className="orb orb-cyan w-[300px] h-[300px] top-[5%] right-[0%] hidden lg:block" aria-hidden="true" />
      <div className="orb orb-amber w-[200px] h-[200px] bottom-[10%] left-[5%] hidden lg:block" style={{ animationDelay: "-8s" }} aria-hidden="true" />
      <div className="absolute top-[20%] right-[8%] w-14 h-14 border border-cyan/8 rounded-full float-medium hidden lg:block" aria-hidden="true" />
      <div className="absolute bottom-[25%] left-[12%] w-3 h-3 bg-amber/15 rounded-full pulse-glow hidden lg:block" aria-hidden="true" />
      <div className="ring-dashed w-[120px] h-[120px] top-[40%] left-[5%] ring-spin hidden lg:block" aria-hidden="true" />
      <div className="hex-grid" aria-hidden="true" />

      <div className="relative z-[1] max-w-6xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div className="max-w-2xl mb-10" data-aos="fade-up">
          <p className="text-xs font-medium text-blue uppercase tracking-[0.15em] mb-3">
            Talent pool
          </p>
          <h2 id="talent-heading" className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Meet our finalists
          </h2>
          <p className="mt-4 text-base text-muted leading-relaxed">
            Each person below completed all 10 stages of the UBI program.
            Filter by specialization to find the right fit for your team.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-2 mb-10" data-aos="fade-up" data-aos-delay="100">
          {filters.map((f) => {
            const isActive = activeFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={`inline-flex items-center gap-2 text-[12px] font-medium px-4 py-2.5 rounded-full border transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue text-white border-transparent shadow-sm shadow-blue/20"
                    : "border-border/60 text-muted hover:text-foreground hover:bg-surface-hover"
                }`}
              >
                <span aria-hidden="true">{f.emoji}</span>
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Gallery grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((person, i) => {
            const c = colorMap[person.color];
            return (
              <article
                key={person.name}
                data-aos="fade-up"
                data-aos-delay={i * 60}
                className="glass-card rounded-2xl p-6 group hover:border-blue/15 transition-colors"
              >
                {/* Profile header */}
                <div className="flex items-center gap-3.5 mb-4">
                  <div
                    className={`w-14 h-14 rounded-full shrink-0 ring-2 ${c.ring} ${c.badge} ${c.badgeText} grid place-items-center text-base font-bold tracking-wide`}
                    aria-hidden="true"
                  >
                    {toInitials(person.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{person.name}</p>
                    <div className={`inline-flex items-center gap-1.5 mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${c.tagBg} ${c.tagText}`}>
                      <span aria-hidden="true">{person.emoji}</span>
                      {person.track}
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {person.skills.map((skill) => (
                    <span
                      key={skill}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-md ${c.badge} ${c.badgeText}`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Status */}
                <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald animate-pulse" aria-hidden="true" />
                    <span className="text-[11px] font-medium text-muted">Available for hire</span>
                  </div>
                  <span className="text-[10px] font-semibold text-foreground/40 uppercase tracking-wider">10/10 stages</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
