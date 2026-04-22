"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { ArrowRight } from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";

const games = [
  {
    slug: "cyberwordle",
    emoji: "🔐",
    name: "CyberWordle",
    tagline: "Daily word puzzle",
    description: "Guess the cybersecurity term of the day. A new 5–9 letter word every 24 hours.",
    color: "blue",
    badge: "Daily",
  },
  {
    slug: "sudoku",
    emoji: "🧩",
    name: "Sudoku",
    tagline: "Classic number puzzle",
    description: "Fill the 9×9 grid so every row, column, and box contains 1–9. Three difficulty levels.",
    color: "emerald",
    badge: "Unlimited",
  },
  {
    slug: "trivia",
    emoji: "⚡",
    name: "CyberTrivia",
    tagline: "Test your knowledge",
    description: "Rapid-fire cybersecurity questions. How many can you get right before time runs out?",
    color: "amber",
    badge: "Unlimited",
  },
  {
    slug: "memory",
    emoji: "🧠",
    name: "Threat Match",
    tagline: "Memory card game",
    description: "Flip cards and match cybersecurity terms to their meanings. Train your recall under pressure.",
    color: "cyan",
    badge: "Unlimited",
  },
  {
    slug: "crossword",
    emoji: "📰",
    name: "CyberCrossword",
    tagline: "Classic crossword puzzle",
    description: "Fill in cybersecurity terms across and down using the clues. A new puzzle every time you play.",
    color: "violet",
    badge: "Unlimited",
  },
];

const colorMap: Record<string, { card: string; badge: string; badgeText: string; arrow: string }> = {
  blue: { card: "hover:border-blue/20", badge: "bg-blue/10", badgeText: "text-blue", arrow: "text-blue" },
  emerald: { card: "hover:border-emerald/20", badge: "bg-emerald/10", badgeText: "text-emerald", arrow: "text-emerald" },
  amber: { card: "hover:border-amber/20", badge: "bg-amber/10", badgeText: "text-amber", arrow: "text-amber" },
  cyan: { card: "hover:border-cyan/20", badge: "bg-cyan/10", badgeText: "text-cyan", arrow: "text-cyan" },
  violet: { card: "hover:border-violet-500/20", badge: "bg-violet-500/10", badgeText: "text-violet-500", arrow: "text-violet-500" },
};

export default function PlayHub() {
  useEffect(() => {
    AOS.init({ duration: 800, easing: "ease-out-cubic", once: true, offset: 60 });
  }, []);

  return (
    <>
      <Navbar />
      <main id="main-content">
        {/* Hero */}
        <section className="relative min-h-[55svh] flex items-center bg-background bg-scan overflow-hidden">
          <div className="crosshair top-[20%] left-[12%] hidden lg:block" aria-hidden="true" />
          <div className="crosshair bottom-[25%] right-[10%] hidden lg:block" aria-hidden="true" />
          <div className="orb orb-blue w-[300px] h-[300px] top-[5%] right-[10%] hidden lg:block" aria-hidden="true" />
          <div className="orb orb-amber w-[200px] h-[200px] bottom-[10%] left-[5%] hidden lg:block" style={{ animationDelay: "-5s" }} aria-hidden="true" />
          <div className="orb orb-cyan w-[160px] h-[160px] top-[40%] left-[30%] hidden lg:block" style={{ animationDelay: "-10s" }} aria-hidden="true" />
          <div className="ring-dashed w-[120px] h-[120px] bottom-[20%] right-[15%] ring-spin hidden lg:block" aria-hidden="true" />
          <div className="absolute top-[15%] right-[8%] w-14 h-14 border border-blue/8 rounded-2xl rotate-12 float-slow hidden lg:block" aria-hidden="true" />
          <div className="hex-grid" aria-hidden="true" />

          <div className="relative z-[1] max-w-3xl mx-auto px-5 sm:px-8 pt-28 pb-12 w-full text-center">
            <div data-aos="fade-up">
              <span className="inline-flex items-center gap-2 text-xs font-medium text-blue tracking-[0.15em] uppercase mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-blue animate-pulse" aria-hidden="true" />
                Fun zone
              </span>
            </div>
            <h1 data-aos="fade-up" data-aos-delay="100" className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.08] text-foreground">
              Take a <span className="text-blue">break</span>. Play a game.
            </h1>
            <p data-aos="fade-up" data-aos-delay="200" className="mt-5 text-base sm:text-lg text-muted leading-relaxed max-w-xl mx-auto">
              Sharpen your mind with cybersecurity-themed puzzles and challenges. No login required — just pick a game and play.
            </p>
          </div>
        </section>

        {/* Games grid */}
        <section className="relative py-16 sm:py-24 bg-background bg-scan overflow-hidden">
          <div className="hex-grid" aria-hidden="true" />

          <div className="relative z-[1] max-w-5xl mx-auto px-5 sm:px-8">
            <div className="grid sm:grid-cols-2 gap-5">
              {games.map((game, i) => {
                const c = colorMap[game.color];
                return (
                  <Link
                    key={game.slug}
                    href={`/play/${game.slug}`}
                    data-aos="fade-up"
                    data-aos-delay={i * 80}
                    className={`glass-card glass-shine rounded-2xl p-7 group ${c.card} transition-all`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-4xl" aria-hidden="true">{game.emoji}</span>
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${c.badge} ${c.badgeText} uppercase tracking-wider`}>
                        {game.badge}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-foreground mb-1">{game.name}</h2>
                    <p className="text-[12px] font-medium text-muted mb-3">{game.tagline}</p>
                    <p className="text-sm text-muted leading-relaxed mb-5">{game.description}</p>
                    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${c.arrow} group-hover:gap-2.5 transition-all`}>
                      Play now
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
