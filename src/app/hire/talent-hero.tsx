"use client";

import { ArrowRight } from "lucide-react";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

export function TalentHero() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: "ease-out-cubic",
      once: true,
      offset: 60,
    });
  }, []);

  return (
    <section
      aria-labelledby="hire-heading"
      className="relative min-h-[90svh] flex items-center bg-background bg-scan overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="crosshair top-[18%] right-[12%] hidden lg:block" aria-hidden="true" />
      <div className="crosshair bottom-[25%] left-[8%] hidden lg:block" aria-hidden="true" />
      <div className="orb orb-violet w-[400px] h-[400px] top-[10%] right-[15%] hidden lg:block" aria-hidden="true" />
      <div className="orb orb-blue w-[250px] h-[250px] bottom-[15%] left-[5%] hidden lg:block" style={{ animationDelay: "-6s" }} aria-hidden="true" />
      <div className="absolute top-[20%] right-[8%] w-16 h-16 border border-violet/8 rounded-2xl rotate-12 float-slow hidden lg:block" aria-hidden="true" />
      <div className="absolute bottom-[20%] left-[12%] w-3 h-3 bg-blue/15 rounded-full pulse-glow hidden lg:block" aria-hidden="true" />
      <div className="ring-dashed w-[140px] h-[140px] top-[55%] right-[20%] ring-spin hidden lg:block" aria-hidden="true" />
      <div className="absolute top-[35%] left-[15%] w-20 h-20 border border-blue/6 rounded-full float-medium hidden lg:block" aria-hidden="true" />
      <div className="hex-grid" aria-hidden="true" />

      {/* Constellation SVG */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <svg className="absolute top-0 right-0 w-[50%] h-full opacity-60 hidden lg:block" viewBox="0 0 600 800" fill="none">
          <line x1="150" y1="100" x2="350" y2="200" stroke="rgba(124,58,237,0.1)" strokeWidth="1" />
          <line x1="350" y1="200" x2="480" y2="150" stroke="rgba(124,58,237,0.08)" strokeWidth="1" />
          <line x1="350" y1="200" x2="280" y2="380" stroke="rgba(37,99,235,0.1)" strokeWidth="1" />
          <line x1="280" y1="380" x2="450" y2="450" stroke="rgba(37,99,235,0.08)" strokeWidth="1" />
          <line x1="450" y1="450" x2="380" y2="600" stroke="rgba(124,58,237,0.08)" strokeWidth="1" />
          <line x1="280" y1="380" x2="130" y2="500" stroke="rgba(37,99,235,0.08)" strokeWidth="1" />
          <path d="M150,100 L350,200 L280,380 L450,450 L380,600" stroke="rgba(124,58,237,0.15)" strokeWidth="1.5" strokeDasharray="5 5">
            <animate attributeName="stroke-dashoffset" values="0;-20" dur="4s" repeatCount="indefinite" />
          </path>
          <circle cx="150" cy="100" r="3" fill="#7C3AED" opacity="0.2" />
          <circle cx="350" cy="200" r="4" fill="#7C3AED" opacity="0.3">
            <animate attributeName="opacity" values="0.3;0.5;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="350" cy="200" r="14" stroke="#7C3AED" strokeWidth="1" fill="none" opacity="0.08">
            <animate attributeName="r" values="14;20;14" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="280" cy="380" r="3" fill="#2563EB" opacity="0.25" />
          <circle cx="450" cy="450" r="3.5" fill="#2563EB" opacity="0.2">
            <animate attributeName="opacity" values="0.2;0.4;0.2" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="130" cy="500" r="2.5" fill="#7C3AED" opacity="0.15" />
          <circle cx="380" cy="600" r="3" fill="#7C3AED" opacity="0.2" />
        </svg>
      </div>

      <div className="relative z-[1] max-w-6xl mx-auto px-5 sm:px-8 pt-28 pb-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — copy */}
          <div>
            <div data-aos="fade-up">
              <span className="inline-flex items-center gap-2.5 text-xs font-medium text-violet tracking-[0.15em] uppercase mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-violet animate-pulse" aria-hidden="true" />
                For employers
              </span>
            </div>

            <h1
              id="hire-heading"
              data-aos="fade-up"
              data-aos-delay="100"
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.08] text-foreground"
            >
              Hire the best talent in <span className="text-blue">cybersecurity</span>
            </h1>

            <p
              data-aos="fade-up"
              data-aos-delay="200"
              className="mt-6 text-base sm:text-lg text-muted leading-relaxed max-w-xl"
            >
              Skip months of screening. Every candidate in our pool survived
              10 stages of real-world elimination — they&apos;ve already proven
              they can deliver under pressure.
            </p>

            <div data-aos="fade-up" data-aos-delay="300" className="mt-10 flex flex-wrap gap-3">
              <a
                href="#contact"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue px-7 py-3.5 rounded-full hover:bg-blue-dark transition-all hover:shadow-lg hover:shadow-blue/20"
              >
                Start hiring
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </a>
              <a
                href="#talent"
                className="inline-flex items-center text-sm font-medium text-foreground border border-border px-7 py-3.5 rounded-full hover:bg-surface-hover transition-colors"
              >
                Browse talent
              </a>
            </div>

            {/* Stats — big numbers, no icons */}
            <div
              data-aos="fade-up"
              data-aos-delay="400"
              className="mt-16 flex flex-wrap gap-x-10 gap-y-4"
              role="list"
              aria-label="Hiring statistics"
            >
              {[
                ["1,000+", "Members screened"],
                ["3", "Specializations"],
                ["30+", "Countries"],
              ].map(([val, label]) => (
                <div key={label} role="listitem" className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{val}</span>
                  <span className="text-xs text-muted font-medium uppercase tracking-wider">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — specialization preview cards */}
          <div className="hidden lg:block" data-aos="fade-left" data-aos-delay="300">
            <div className="space-y-4">
              {[
                {
                  emoji: "🛡️",
                  name: "SOC Analysts",
                  count: "20+",
                  skills: ["Splunk", "SIEM", "Threat Detection", "Incident Response"],
                  color: "cyan",
                  border: "border-l-cyan",
                },
                {
                  emoji: "🎯",
                  name: "Ethical Hackers",
                  count: "20+",
                  skills: ["Burp Suite", "Pentesting", "OSINT", "Web App Security"],
                  color: "amber",
                  border: "border-l-amber",
                },
                {
                  emoji: "📋",
                  name: "GRC Specialists",
                  count: "20+",
                  skills: ["ISO 27001", "NIST CSF", "Risk Assessment", "SOC 2"],
                  color: "emerald",
                  border: "border-l-emerald",
                },
              ].map((track) => (
                <a
                  key={track.name}
                  href="#talent"
                  className={`glass-card rounded-2xl p-5 flex items-center gap-5 border-l-4 ${track.border} group hover:border-l-blue/30 transition-colors cursor-pointer`}
                >
                  <span className="text-3xl" aria-hidden="true">{track.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-foreground">{track.name}</h3>
                      <span className="text-[11px] font-bold text-blue">{track.count} available</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {track.skills.map((s) => (
                        <span key={s} className="text-[10px] font-medium text-muted bg-background px-2 py-0.5 rounded border border-border/50">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted group-hover:text-blue group-hover:translate-x-0.5 transition-all shrink-0" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
