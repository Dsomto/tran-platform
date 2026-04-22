"use client";

import { Eye, Crosshair, FileCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const tracks = [
  {
    icon: Eye,
    name: "SOC Analysis",
    slug: "soc",
    color: "cyan",
    image: "/images/tracks/soc-analyst.jpg",
    description:
      "Monitor, detect, and respond to security incidents in real-time. Master SIEM tools and incident playbooks.",
    tools: ["Splunk", "ELK Stack", "YARA", "MITRE ATT&CK"],
    roles: ["SOC Analyst", "Threat Hunter", "Incident Responder"],
  },
  {
    icon: Crosshair,
    name: "Ethical Hacking",
    slug: "ethical-hacking",
    color: "amber",
    image: "/images/tracks/ethical-hacking.jpg",
    description:
      "Think like an attacker. Perform penetration tests, exploit vulnerabilities, and write professional reports.",
    tools: ["Burp Suite", "Metasploit", "Nmap", "Kali Linux"],
    roles: ["Penetration Tester", "Red Team Operator", "Security Researcher"],
  },
  {
    icon: FileCheck,
    name: "GRC",
    slug: "grc",
    color: "emerald",
    image: "/images/tracks/grc.png",
    description:
      "Governance, Risk & Compliance. Build security policies, run risk assessments, and drive compliance.",
    tools: ["ISO 27001", "NIST CSF", "SOC 2", "Risk Registers"],
    roles: ["GRC Analyst", "Compliance Officer", "Risk Manager"],
  },
];

const colorMap: Record<string, { bg: string; bgHover: string; text: string; border: string; badge: string; badgeText: string; orb: string }> = {
  cyan: {
    bg: "bg-cyan/[0.07]",
    bgHover: "group-hover:bg-cyan/[0.15]",
    text: "text-cyan",
    border: "hover:border-cyan/20",
    badge: "bg-cyan-light",
    badgeText: "text-cyan-dark",
    orb: "orb-cyan",
  },
  amber: {
    bg: "bg-amber/[0.07]",
    bgHover: "group-hover:bg-amber/[0.15]",
    text: "text-amber",
    border: "hover:border-amber/20",
    badge: "bg-amber-light",
    badgeText: "text-amber-dark",
    orb: "orb-amber",
  },
  emerald: {
    bg: "bg-emerald/[0.07]",
    bgHover: "group-hover:bg-emerald/[0.15]",
    text: "text-emerald",
    border: "hover:border-emerald/20",
    badge: "bg-emerald-light",
    badgeText: "text-emerald-dark",
    orb: "orb-emerald",
  },
};

export function Tracks() {
  return (
    <section
      id="tracks"
      aria-labelledby="tracks-heading"
      className="relative py-28 sm:py-36 bg-background bg-scan overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="crosshair top-[12%] right-[10%] hidden lg:block" aria-hidden="true" />
      <div className="crosshair bottom-[20%] left-[5%] hidden lg:block" aria-hidden="true" />
      <div className="orb orb-cyan w-[300px] h-[300px] top-[10%] right-[5%] hidden lg:block" aria-hidden="true" />
      <div className="orb orb-amber w-[250px] h-[250px] bottom-[15%] left-[10%] hidden lg:block" style={{ animationDelay: "-5s" }} aria-hidden="true" />
      <div className="absolute top-[20%] left-[15%] w-20 h-20 border border-cyan/8 rounded-2xl rotate-12 float-slow hidden lg:block" aria-hidden="true" />
      <div className="absolute bottom-[25%] right-[8%] w-4 h-4 bg-emerald/15 rounded-full pulse-glow hidden lg:block" aria-hidden="true" />
      <div className="ring-dashed w-[140px] h-[140px] top-[60%] right-[18%] ring-spin hidden lg:block" aria-hidden="true" />
      <div className="hex-grid" aria-hidden="true" />

      <div className="relative z-[1] max-w-6xl mx-auto px-5 sm:px-8">
        <div className="max-w-2xl" data-aos="fade-up">
          <p className="text-xs font-medium text-blue uppercase tracking-[0.15em] mb-3">
            Specializations
          </p>
          <h2 id="tracks-heading" className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Choose your track at Stage 5
          </h2>
          <p className="mt-4 text-base text-muted leading-relaxed">
            After completing the general foundation, you specialize in the domain
            that matches your career goals.
          </p>
        </div>

        <div className="mt-16 grid lg:grid-cols-3 gap-5">
          {tracks.map((track, i) => {
            const c = colorMap[track.color];
            return (
              <Link
                key={track.slug}
                href={`/tracks/${track.slug}`}
                data-aos="fade-up"
                data-aos-delay={i * 100}
                className={`glass-card rounded-2xl overflow-hidden flex flex-col group cursor-pointer ${c.border}`}
              >
                <div className="relative w-full aspect-[16/10] overflow-hidden">
                  <Image
                    src={track.image}
                    alt={track.name}
                    fill
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-transparent" />
                </div>
                <div className="p-7 flex flex-col flex-1">
                <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center mb-5 ${c.bgHover} transition-colors`}>
                  <track.icon className={`w-5 h-5 ${c.text}`} aria-hidden="true" />
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2">{track.name}</h3>
                <p className="text-sm text-muted leading-relaxed mb-5 flex-1">{track.description}</p>

                <div className="flex flex-wrap gap-1.5 mb-5">
                  {track.tools.map((tool) => (
                    <span key={tool} className={`text-[11px] font-medium px-2.5 py-1 rounded-md ${c.badge} ${c.badgeText}`}>
                      {tool}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5 mb-5 pt-4 border-t border-border/40">
                  {track.roles.map((role) => (
                    <span key={role} className="text-[11px] font-medium text-muted bg-background px-2.5 py-1 rounded-full border border-border/60">
                      {role}
                    </span>
                  ))}
                </div>

                <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${c.text} group-hover:gap-2.5 transition-all`}>
                  Explore this track
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
