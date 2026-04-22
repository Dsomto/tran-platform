"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const faces = [
  { src: "https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?w=80&h=80&fit=crop&crop=faces", alt: "Member 1" },
  { src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces", alt: "Member 2" },
  { src: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&crop=faces", alt: "Member 3" },
  { src: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&crop=faces", alt: "Member 4" },
  { src: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=80&h=80&fit=crop&crop=faces", alt: "Member 5" },
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
        {/* Avatar stack */}
        <div className="flex justify-center mb-8" data-aos="fade-up">
          <div className="flex -space-x-3">
            {faces.map((face, i) => (
              <div key={i} className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-white" style={{ zIndex: faces.length - i }}>
                <Image
                  src={face.src}
                  alt={face.alt}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
            ))}
          </div>
        </div>

        <div data-aos="fade-up" data-aos-delay="100">
          <p className="text-xs font-medium text-blue uppercase tracking-[0.15em] mb-3">
            Join the network
          </p>
          <h2 id="cta-heading" className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Ready to prove yourself?
          </h2>
        </div>
        <p className="mt-4 text-base text-muted leading-relaxed" data-aos="fade-up" data-aos-delay="150">
          Applications for Cohort 1 are open. Limited spots. If you have the skill
          and the grit, we want you on UBI.
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
