"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function TalentCTA() {
  return (
    <section
      aria-labelledby="hire-cta-heading"
      className="relative py-28 sm:py-36 bg-background bg-scan overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="crosshair bottom-[15%] left-[8%] hidden lg:block" aria-hidden="true" />
      <div className="crosshair top-[20%] right-[12%] hidden lg:block" aria-hidden="true" />
      <div className="orb orb-violet w-[350px] h-[350px] top-[20%] left-[30%] hidden lg:block" aria-hidden="true" />
      <div className="orb orb-blue w-[200px] h-[200px] top-[10%] right-[10%] hidden lg:block" style={{ animationDelay: "-5s" }} aria-hidden="true" />
      <div className="absolute top-[15%] left-[10%] w-16 h-16 border border-violet/8 rounded-2xl -rotate-12 float-slow hidden lg:block" aria-hidden="true" />
      <div className="absolute bottom-[20%] right-[8%] w-12 h-12 border border-blue/8 rounded-full float-medium hidden lg:block" aria-hidden="true" />
      <div className="absolute top-[40%] right-[15%] w-3 h-3 bg-violet/15 rounded-full pulse-glow hidden lg:block" aria-hidden="true" />
      <div className="ring-dashed w-[130px] h-[130px] top-[25%] left-[15%] ring-spin hidden lg:block" aria-hidden="true" />
      <div className="hex-grid" aria-hidden="true" />

      <div className="relative z-[1] max-w-2xl mx-auto px-5 sm:px-8 text-center">
        <div data-aos="fade-up">
          <span className="text-5xl mb-6 block" aria-hidden="true">🔐</span>
        </div>

        <div data-aos="fade-up" data-aos-delay="100">
          <h2 id="hire-cta-heading" className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Your next security hire is already on UBI
          </h2>
        </div>

        <p className="mt-4 text-base text-muted leading-relaxed" data-aos="fade-up" data-aos-delay="150">
          Stop sifting through unvetted resumes. Our finalists have already
          proven themselves through 10 stages of real-world challenges.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center" data-aos="fade-up" data-aos-delay="200">
          <a
            href="#contact"
            className="group inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-blue px-8 py-3.5 rounded-full hover:bg-blue-dark transition-all hover:shadow-lg hover:shadow-blue/20"
          >
            Start hiring now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </a>
          <Link
            href="/"
            className="inline-flex items-center justify-center text-sm font-medium text-foreground border border-border px-8 py-3.5 rounded-full hover:bg-surface-hover transition-colors"
          >
            Learn about UBI
          </Link>
        </div>
      </div>
    </section>
  );
}
