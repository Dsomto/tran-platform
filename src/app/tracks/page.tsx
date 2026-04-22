"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { ArrowRight } from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";

const tracks = [
  {
    emoji: "🛡️",
    name: "SOC Analysis",
    slug: "soc",
    tagline: "Be the first line of defense",
    description: "Monitor, detect, and respond to security incidents in real-time. Master SIEM tools, threat hunting, and incident playbooks used by enterprise SOC teams worldwide.",
    color: "cyan",
    tools: ["Splunk", "ELK Stack", "YARA", "MITRE ATT&CK", "Wireshark", "CrowdStrike"],
    roles: ["SOC Analyst", "Threat Hunter", "Incident Responder"],
    image: "/images/track-soc.jpg",
  },
  {
    emoji: "🎯",
    name: "Ethical Hacking",
    slug: "ethical-hacking",
    tagline: "Think like an attacker",
    description: "Perform penetration tests, exploit vulnerabilities, and write professional security reports. Build offensive security skills that companies pay top dollar for.",
    color: "amber",
    tools: ["Burp Suite", "Metasploit", "Nmap", "Kali Linux", "Hashcat", "Gobuster"],
    roles: ["Penetration Tester", "Red Team Operator", "Security Researcher"],
    image: "/images/track-ethical-hacking.jpg",
  },
  {
    emoji: "📋",
    name: "GRC",
    slug: "grc",
    tagline: "Governance, Risk & Compliance",
    description: "Build security policies, run risk assessments, and drive compliance across organizations. The strategic side of cybersecurity that every company needs.",
    color: "emerald",
    tools: ["ISO 27001", "NIST CSF", "SOC 2", "Risk Registers", "PCI DSS", "GDPR"],
    roles: ["GRC Analyst", "Compliance Officer", "Risk Manager"],
    image: "/images/track-grc.png",
  },
];

const colorMap: Record<string, { badge: string; badgeText: string; border: string; hoverBorder: string; tag: string; tagText: string }> = {
  cyan: {
    badge: "bg-cyan-light",
    badgeText: "text-cyan-dark",
    border: "border-l-cyan",
    hoverBorder: "hover:border-cyan/20",
    tag: "bg-cyan/[0.08]",
    tagText: "text-cyan",
  },
  amber: {
    badge: "bg-amber-light",
    badgeText: "text-amber-dark",
    border: "border-l-amber",
    hoverBorder: "hover:border-amber/20",
    tag: "bg-amber/[0.08]",
    tagText: "text-amber",
  },
  emerald: {
    badge: "bg-emerald-light",
    badgeText: "text-emerald-dark",
    border: "border-l-emerald",
    hoverBorder: "hover:border-emerald/20",
    tag: "bg-emerald/[0.08]",
    tagText: "text-emerald",
  },
};

export default function TracksPage() {
  useEffect(() => {
    AOS.init({ duration: 800, easing: "ease-out-cubic", once: true, offset: 60 });
  }, []);

  return (
    <>
      <Navbar />
      <main id="main-content">
        {/* Hero */}
        <section className="relative min-h-[60svh] flex items-center bg-background bg-scan overflow-hidden">
          <div className="crosshair top-[20%] left-[10%] hidden lg:block" aria-hidden="true" />
          <div className="crosshair bottom-[25%] right-[15%] hidden lg:block" aria-hidden="true" />
          <div className="orb orb-cyan w-[350px] h-[350px] top-[10%] right-[5%] hidden lg:block" aria-hidden="true" />
          <div className="orb orb-amber w-[200px] h-[200px] bottom-[15%] left-[10%] hidden lg:block" style={{ animationDelay: "-5s" }} aria-hidden="true" />
          <div className="orb orb-emerald w-[180px] h-[180px] top-[30%] left-[30%] hidden lg:block" style={{ animationDelay: "-10s" }} aria-hidden="true" />
          <div className="absolute top-[15%] right-[8%] w-16 h-16 border border-cyan/8 rounded-2xl rotate-12 float-slow hidden lg:block" aria-hidden="true" />
          <div className="ring-dashed w-[130px] h-[130px] bottom-[20%] right-[20%] ring-spin hidden lg:block" aria-hidden="true" />
          <div className="hex-grid" aria-hidden="true" />

          <div className="relative z-[1] max-w-6xl mx-auto px-5 sm:px-8 pt-28 pb-16 w-full">
            <div className="max-w-3xl mx-auto text-center">
              <div data-aos="fade-up">
                <span className="inline-flex items-center gap-2 text-xs font-medium text-blue tracking-[0.15em] uppercase mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue animate-pulse" aria-hidden="true" />
                  Choose your path
                </span>
              </div>
              <h1 data-aos="fade-up" data-aos-delay="100" className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.08] text-foreground">
                Three tracks. One mission.
              </h1>
              <p data-aos="fade-up" data-aos-delay="200" className="mt-6 text-base sm:text-lg text-muted leading-relaxed max-w-2xl mx-auto">
                At Stage 5, you choose your specialization. Each track has its own
                curriculum, tools, and career outcomes. Pick the one that matches
                your ambition.
              </p>

              {/* Track quick-nav */}
              <div data-aos="fade-up" data-aos-delay="300" className="mt-10 flex flex-wrap justify-center gap-3">
                {tracks.map((t) => {
                  const c = colorMap[t.color];
                  return (
                    <a
                      key={t.slug}
                      href={`#${t.slug}`}
                      className={`inline-flex items-center gap-2 text-sm font-medium ${c.tag} ${c.tagText} px-5 py-2.5 rounded-full hover:opacity-80 transition-opacity`}
                    >
                      <span aria-hidden="true">{t.emoji}</span>
                      {t.name}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Track sections — each one full-width with alternating layout */}
        {tracks.map((track, idx) => {
          const c = colorMap[track.color];
          const isReversed = idx % 2 === 1;

          return (
            <section
              key={track.slug}
              id={track.slug}
              className="relative py-28 sm:py-36 bg-background bg-scan overflow-hidden"
            >
              <div className="hex-grid" aria-hidden="true" />
              <div className={`orb orb-${track.color} w-[300px] h-[300px] ${isReversed ? "top-[5%] left-[0%]" : "top-[5%] right-[0%]"} hidden lg:block`} aria-hidden="true" />
              <div className="crosshair top-[15%] right-[12%] hidden lg:block" aria-hidden="true" />
              <div className="absolute bottom-[20%] left-[8%] w-3 h-3 bg-blue/15 rounded-full pulse-glow hidden lg:block" aria-hidden="true" />

              <div className="relative z-[1] max-w-6xl mx-auto px-5 sm:px-8">
                <div className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${isReversed ? "lg:direction-rtl" : ""}`}>
                  {/* Image side */}
                  <div className={`${isReversed ? "lg:order-2" : ""}`} data-aos={isReversed ? "fade-right" : "fade-left"} data-aos-delay="200">
                    <div className={`relative rounded-2xl overflow-hidden glass-card h-[350px] border-l-4 ${c.border}`}>
                      <Image
                        src={track.image}
                        alt={`${track.name} track`}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 500px, 100vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      <div className="absolute bottom-5 left-5 right-5">
                        <div className="flex flex-wrap gap-1.5">
                          {track.roles.map((role) => (
                            <span key={role} className="text-[11px] font-medium text-white/90 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content side */}
                  <div className={`${isReversed ? "lg:order-1" : ""}`}>
                    <div data-aos="fade-up">
                      <span className="text-4xl block mb-4" aria-hidden="true">{track.emoji}</span>
                      <span className={`inline-flex text-[11px] font-semibold px-3 py-1 rounded-full ${c.badge} ${c.badgeText} uppercase tracking-wider mb-4`}>
                        {track.tagline}
                      </span>
                      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
                        {track.name}
                      </h2>
                      <p className="text-base text-muted leading-relaxed mb-8">
                        {track.description}
                      </p>
                    </div>

                    {/* Tools */}
                    <div data-aos="fade-up" data-aos-delay="100" className="mb-8">
                      <p className="text-[11px] font-semibold text-foreground/40 uppercase tracking-wider mb-3">Tools you&apos;ll master</p>
                      <div className="flex flex-wrap gap-2">
                        {track.tools.map((tool) => (
                          <span key={tool} className={`text-[12px] font-medium px-3 py-1.5 rounded-lg ${c.badge} ${c.badgeText}`}>
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div data-aos="fade-up" data-aos-delay="150">
                      <Link
                        href={`/tracks/${track.slug}`}
                        className={`group inline-flex items-center gap-2 text-sm font-semibold ${c.tagText} hover:opacity-80 transition-opacity`}
                      >
                        View full curriculum
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        {/* Comparison bar */}
        <section className="relative py-20 bg-background bg-scan overflow-hidden">
          <div className="hex-grid" aria-hidden="true" />
          <div className="relative z-[1] max-w-6xl mx-auto px-5 sm:px-8">
            <h2 data-aos="fade-up" className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground text-center mb-12">
              Not sure which track? Compare them.
            </h2>

            <div className="grid sm:grid-cols-3 gap-5">
              {tracks.map((track, i) => {
                const c = colorMap[track.color];
                return (
                  <Link
                    key={track.slug}
                    href={`/tracks/${track.slug}`}
                    data-aos="fade-up"
                    data-aos-delay={i * 100}
                    className={`glass-card rounded-2xl p-6 text-center group ${c.hoverBorder} transition-colors`}
                  >
                    <span className="text-4xl block mb-3" aria-hidden="true">{track.emoji}</span>
                    <h3 className="text-base font-semibold text-foreground mb-2">{track.name}</h3>
                    <div className="space-y-2 mb-5">
                      {track.roles.map((role) => (
                        <p key={role} className="text-[12px] text-muted">{role}</p>
                      ))}
                    </div>
                    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${c.tagText} group-hover:gap-2.5 transition-all`}>
                      Explore
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="relative py-28 sm:py-36 bg-background bg-scan overflow-hidden">
          <div className="orb orb-blue w-[350px] h-[350px] top-[20%] left-[30%] hidden lg:block" aria-hidden="true" />
          <div className="hex-grid" aria-hidden="true" />

          <div className="relative z-[1] max-w-2xl mx-auto px-5 sm:px-8 text-center">
            <span className="text-5xl block mb-6" data-aos="fade-up" aria-hidden="true">🚀</span>
            <h2 data-aos="fade-up" data-aos-delay="100" className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Ready to choose your path?
            </h2>
            <p data-aos="fade-up" data-aos-delay="150" className="mt-4 text-base text-muted leading-relaxed">
              You don&apos;t pick a track until Stage 5. Start with the foundation
              — your specialization decision comes later.
            </p>
            <div data-aos="fade-up" data-aos-delay="200" className="mt-8">
              <Link
                href="/apply"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue px-8 py-3.5 rounded-full hover:bg-blue-dark transition-all hover:shadow-lg hover:shadow-blue/20"
              >
                Start your application
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
