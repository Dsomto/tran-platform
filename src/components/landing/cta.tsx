"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Track-coloured markers stand in for the cohort — mix of SOC/EH/GRC to
// telegraph that the programme covers all three specialisations.
const markers = [
  { emoji: "🛡️", bg: "bg-cyan-light", text: "text-cyan-dark", track: "SOC Analysis" },
  { emoji: "🎯", bg: "bg-amber-light", text: "text-amber-dark", track: "Ethical Hacking" },
  { emoji: "📋", bg: "bg-emerald-light", text: "text-emerald-dark", track: "GRC" },
  { emoji: "🛡️", bg: "bg-cyan-light", text: "text-cyan-dark", track: "SOC Analysis" },
  { emoji: "🎯", bg: "bg-amber-light", text: "text-amber-dark", track: "Ethical Hacking" },
];

export function CTA() {
  return (
    <section
      aria-labelledby="cta-heading"
      className="relative py-28 sm:py-36 bg-background bg-scan overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="crosshair bottom-[15%] left-[8%] hidden lg:block" aria-hidden="true" />
      <div className="crosshair top-[20%] right-[12%] hidden lg:block" aria-hidden="true" />
      <div className="orb orb-blue w-[400px] h-[400px] top-[20%] left-[30%] hidden lg:block" aria-hidden="true" />
      <div className="orb orb-cyan w-[200px] h-[200px] top-[10%] right-[10%] hidden lg:block" style={{ animationDelay: "-5s" }} aria-hidden="true" />
      <div className="orb orb-violet w-[180px] h-[180px] bottom-[10%] left-[10%] hidden lg:block" style={{ animationDelay: "-9s" }} aria-hidden="true" />
      <div className="absolute top-[15%] left-[10%] w-16 h-16 border border-blue/8 rounded-2xl -rotate-12 float-slow hidden lg:block" aria-hidden="true" />
      <div className="absolute bottom-[20%] right-[8%] w-12 h-12 border border-cyan/8 rounded-full float-medium hidden lg:block" aria-hidden="true" />
      <div className="absolute top-[40%] right-[15%] w-3 h-3 bg-blue/15 rounded-full pulse-glow hidden lg:block" aria-hidden="true" />
      <div className="ring-dashed w-[150px] h-[150px] top-[25%] left-[15%] ring-spin hidden lg:block" aria-hidden="true" />
      <div className="hex-grid" aria-hidden="true" />

      {/* Constellation SVG */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <svg className="absolute top-0 right-0 w-[45%] h-full opacity-50 hidden lg:block" viewBox="0 0 600 600" fill="none">
          <line x1="100" y1="100" x2="300" y2="200" stroke="rgba(37,99,235,0.1)" strokeWidth="1" />
          <line x1="300" y1="200" x2="450" y2="150" stroke="rgba(37,99,235,0.08)" strokeWidth="1" />
          <line x1="300" y1="200" x2="250" y2="380" stroke="rgba(37,99,235,0.1)" strokeWidth="1" />
          <line x1="250" y1="380" x2="420" y2="420" stroke="rgba(8,145,178,0.08)" strokeWidth="1" />
          <path d="M100,100 L300,200 L250,380 L420,420" stroke="rgba(37,99,235,0.15)" strokeWidth="1.5" strokeDasharray="5 5">
            <animate attributeName="stroke-dashoffset" values="0;-20" dur="4s" repeatCount="indefinite" />
          </path>
          <circle cx="100" cy="100" r="3" fill="#2563EB" opacity="0.2" />
          <circle cx="300" cy="200" r="4" fill="#2563EB" opacity="0.3">
            <animate attributeName="opacity" values="0.3;0.5;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="250" cy="380" r="3" fill="#0891B2" opacity="0.25" />
          <circle cx="420" cy="420" r="2.5" fill="#0891B2" opacity="0.2" />
        </svg>
      </div>

      <div className="relative z-[1] max-w-2xl mx-auto px-5 sm:px-8 text-center">
        {/* Cohort marker stack — anonymous, track-coloured */}
        <div className="flex justify-center mb-8" data-aos="fade-up">
          <div className="flex -space-x-3">
            {markers.map((m, i) => (
              <div
                key={i}
                className={`w-10 h-10 rounded-full ring-2 ring-white grid place-items-center text-base ${m.bg} ${m.text}`}
                style={{ zIndex: markers.length - i }}
                aria-label={`Cohort member — ${m.track} track`}
                role="img"
              >
                <span aria-hidden="true">{m.emoji}</span>
              </div>
            ))}
          </div>
        </div>

        <div data-aos="fade-up" data-aos-delay="100">
          <p className="text-xs font-medium text-blue uppercase tracking-[0.15em] mb-3">
            2026 Cohort
          </p>
          <h2 id="cta-heading" className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Apply. Earn your place.
          </h2>
        </div>
        <p className="mt-4 text-base text-muted leading-relaxed" data-aos="fade-up" data-aos-delay="150">
          Applications take about fifteen minutes. We read every one. If you make it
          through screening, we will send you your first stage within the week.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center" data-aos="fade-up" data-aos-delay="200">
          <Link
            href="/apply"
            className="group inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-blue px-8 py-3.5 rounded-full hover:bg-blue-dark transition-all hover:shadow-lg hover:shadow-blue/20"
          >
            Apply now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center text-sm font-medium text-foreground border border-border px-8 py-3.5 rounded-full hover:bg-surface-hover transition-colors"
          >
            Already applied? Log in
          </Link>
        </div>
      </div>
    </section>
  );
}
