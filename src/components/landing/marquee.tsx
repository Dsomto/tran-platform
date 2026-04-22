"use client";

const items = [
  { text: "SOC Analysis", color: "bg-cyan/40" },
  { text: "Ethical Hacking", color: "bg-amber/40" },
  { text: "GRC", color: "bg-emerald/40" },
  { text: "Penetration Testing", color: "bg-amber/40" },
  { text: "Threat Intelligence", color: "bg-cyan/40" },
  { text: "Incident Response", color: "bg-blue/30" },
  { text: "SIEM", color: "bg-cyan/40" },
  { text: "Network Security", color: "bg-blue/30" },
  { text: "OWASP Top 10", color: "bg-amber/40" },
  { text: "Digital Forensics", color: "bg-violet/30" },
  { text: "Risk Assessment", color: "bg-emerald/40" },
  { text: "Compliance", color: "bg-emerald/40" },
];

export function Marquee() {
  const repeated = [...items, ...items];

  return (
    <div className="py-5 border-y border-border/40 bg-white/60 overflow-hidden" aria-hidden="true">
      <div className="marquee-track">
        <div className="marquee-content">
          {repeated.map((item, i) => (
            <span key={i} className="inline-flex items-center mx-8">
              <span className={`w-1.5 h-1.5 rounded-full ${item.color} mr-5`} />
              <span className="text-[11px] font-medium text-muted uppercase tracking-[0.15em]">
                {item.text}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
