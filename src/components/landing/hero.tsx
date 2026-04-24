"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

const allHeroImages = [
  {
    src: "/images/hero-1.jpg",
    alt: "UBI interns collaborating with laptops",
  },
  {
    src: "/images/hero-2.jpg",
    alt: "Nigerian youth passionate about tech and change",
  },
  {
    src: "/images/hero-4.jpg",
    alt: "Young Nigerians ready to break into cybersecurity",
  },
  {
    src: "/images/hero-5.avif",
    alt: "Group of African tech enthusiasts together",
  },
  {
    src: "/images/hero-6.avif",
    alt: "Nigerian friends pursuing careers in tech",
  },
  // The Root Access Network programme photos — added to the rotation so the
  // hero surfaces the real work UBI is part of, not just stock imagery.
  {
    src: "/images/programs/mentorship.jpg",
    alt: "Cybersecurity mentorship session",
  },
  {
    src: "/images/programs/ubuntu-bridge.jpg",
    alt: "Ubuntu Bridge Initiative — powering interns through the training",
  },
  {
    src: "/images/programs/school-tour.jpg",
    alt: "Cybersecurity Educational School Tour in Nigerian secondary schools",
  },
  {
    src: "/images/programs/workshops.jpg",
    alt: "Community Cybersafe Workshops — hands-on training",
  },
  {
    src: "/images/programs/street-evangelism.png",
    alt: "Street Cyber Evangelism — meeting people where they are",
  },
  {
    src: "/images/programs/tech-spotlight.jpg",
    alt: "Tech Spotlight Sunday — builders and their stories",
  },
];

function shuffleAndPick(arr: typeof allHeroImages, count: number) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function Hero() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [heroImages, setHeroImages] = useState(allHeroImages.slice(0, 3));
  const [layoutVariant, setLayoutVariant] = useState(0);

  useEffect(() => {
    setHeroImages(shuffleAndPick(allHeroImages, 3));
    setLayoutVariant(Math.floor(Math.random() * 3));
  }, []);

  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: "ease-out-cubic",
      once: true,
      offset: 60,
    });

    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} aria-hidden="true" />

      <section
        aria-labelledby="hero-heading"
        className="relative min-h-[100svh] flex items-center bg-background bg-scan overflow-hidden"
      >
        {/* Crosshair accents */}
        <div className="crosshair top-[18%] right-[15%] hidden lg:block" aria-hidden="true" />
        <div className="crosshair bottom-[22%] right-[25%] hidden lg:block" aria-hidden="true" />

        {/* Orbs */}
        <div className="orb orb-blue w-[400px] h-[400px] top-[10%] right-[20%] hidden lg:block" aria-hidden="true" />
        <div className="orb orb-cyan w-[200px] h-[200px] bottom-[15%] left-[5%] hidden lg:block" style={{ animationDelay: "-5s" }} aria-hidden="true" />

        {/* Floating shapes */}
        <div className="absolute top-[15%] right-[10%] w-16 h-16 border border-blue/8 rounded-2xl rotate-12 float-slow hidden lg:block" aria-hidden="true" />
        <div className="absolute bottom-[25%] left-[6%] w-3 h-3 bg-blue/15 rounded-full pulse-glow hidden lg:block" aria-hidden="true" />
        <div className="ring-dashed w-[120px] h-[120px] top-[60%] left-[10%] ring-spin hidden lg:block" aria-hidden="true" />

        {/* Constellation network */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <svg className="absolute top-0 right-0 w-[55%] h-full opacity-70 hidden lg:block" viewBox="0 0 700 900" fill="none">
            <line x1="180" y1="120" x2="380" y2="220" stroke="rgba(37,99,235,0.12)" strokeWidth="1" />
            <line x1="380" y1="220" x2="550" y2="150" stroke="rgba(37,99,235,0.08)" strokeWidth="1" />
            <line x1="380" y1="220" x2="320" y2="400" stroke="rgba(37,99,235,0.12)" strokeWidth="1" />
            <line x1="320" y1="400" x2="500" y2="350" stroke="rgba(37,99,235,0.08)" strokeWidth="1" />
            <line x1="500" y1="350" x2="580" y2="500" stroke="rgba(37,99,235,0.1)" strokeWidth="1" />
            <line x1="320" y1="400" x2="180" y2="520" stroke="rgba(37,99,235,0.08)" strokeWidth="1" />
            <line x1="180" y1="520" x2="280" y2="650" stroke="rgba(37,99,235,0.1)" strokeWidth="1" />
            <line x1="280" y1="650" x2="460" y2="580" stroke="rgba(37,99,235,0.08)" strokeWidth="1" />
            <line x1="460" y1="580" x2="580" y2="500" stroke="rgba(37,99,235,0.1)" strokeWidth="1" />
            <line x1="550" y1="150" x2="620" y2="300" stroke="rgba(37,99,235,0.08)" strokeWidth="1" />
            <line x1="620" y1="300" x2="500" y2="350" stroke="rgba(37,99,235,0.1)" strokeWidth="1" />

            <path d="M180,120 L380,220 L500,350 L580,500 L460,580" stroke="rgba(37,99,235,0.18)" strokeWidth="1.5" strokeDasharray="5 5">
              <animate attributeName="stroke-dashoffset" values="0;-20" dur="4s" repeatCount="indefinite" />
            </path>

            <circle cx="180" cy="120" r="3" fill="#2563EB" opacity="0.25" />
            <circle cx="380" cy="220" r="4" fill="#2563EB" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.5;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="380" cy="220" r="14" stroke="#2563EB" strokeWidth="1" fill="none" opacity="0.08">
              <animate attributeName="r" values="14;20;14" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.08;0.03;0.08" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="550" cy="150" r="2.5" fill="#2563EB" opacity="0.2" />
            <circle cx="320" cy="400" r="3.5" fill="#2563EB" opacity="0.25">
              <animate attributeName="opacity" values="0.25;0.45;0.25" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="500" cy="350" r="2.5" fill="#2563EB" opacity="0.2" />
            <circle cx="580" cy="500" r="4" fill="#2563EB" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.5;0.3" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="580" cy="500" r="16" stroke="#2563EB" strokeWidth="1" fill="none" opacity="0.06">
              <animate attributeName="r" values="16;24;16" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="180" cy="520" r="2.5" fill="#2563EB" opacity="0.15" />
            <circle cx="280" cy="650" r="3" fill="#2563EB" opacity="0.2" />
            <circle cx="460" cy="580" r="2.5" fill="#2563EB" opacity="0.15" />
            <circle cx="620" cy="300" r="2.5" fill="#2563EB" opacity="0.2" />
          </svg>
        </div>

        <div className="hex-grid" aria-hidden="true" />

        <div className="relative z-[1] max-w-6xl mx-auto px-5 sm:px-8 pt-28 pb-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Text content */}
            <div>
              <div data-aos="fade-up">
                <span className="inline-flex items-center gap-2 text-xs font-medium text-blue tracking-[0.15em] uppercase mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue animate-pulse" aria-hidden="true" />
                  2026 Cohort — Applications open
                </span>
              </div>

              <h1 id="hero-heading" data-aos="fade-up" data-aos-delay="100" className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.08] text-foreground">
                Break into <span className="text-blue">cybersecurity</span> without paying for it.
              </h1>

              <p data-aos="fade-up" data-aos-delay="200" className="mt-6 text-base sm:text-lg text-muted leading-relaxed max-w-xl">
                A free, selective internship for young Africans who are ready to do the
                work. Five foundation stages, then one specialist track. Real breaches
                to investigate — not videos to watch. You pay nothing. Ever.
              </p>

              <div data-aos="fade-up" data-aos-delay="300" className="mt-10 flex flex-wrap gap-3">
                <Link
                  href="/apply"
                  className="group inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue px-7 py-3.5 rounded-full hover:bg-blue-dark transition-all hover:shadow-lg hover:shadow-blue/20"
                >
                  Start your application
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                </Link>
                <a href="#program" className="inline-flex items-center text-sm font-medium text-foreground border border-border px-7 py-3.5 rounded-full hover:bg-surface-hover transition-colors">
                  How it works
                </a>
              </div>

              <div data-aos="fade-up" data-aos-delay="400" className="mt-14 flex flex-wrap gap-3" role="list" aria-label="Program statistics">
                {[["10", "Stages", "⚡"], ["3", "Tracks", "🎯"], ["1,000+", "Members", "🌍"]].map(([val, label, emoji]) => (
                  <div key={label} role="listitem" className="glass-card rounded-xl px-5 py-3 flex items-center gap-3">
                    <span className="text-lg" aria-hidden="true">{emoji}</span>
                    <div>
                      <span className="text-lg font-bold text-foreground tracking-tight block leading-tight">{val}</span>
                      <span className="text-[10px] text-muted font-medium uppercase tracking-wider">{label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Photo grid — layout randomized on each load */}
            <div className="hidden lg:block" data-aos="fade-left" data-aos-delay="300">
              {layoutVariant === 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1 row-span-2 relative rounded-2xl overflow-hidden glass-card-elevated h-[416px]">
                    <Image src={heroImages[0].src} alt={heroImages[0].alt} fill className="object-cover" sizes="(min-width: 1024px) 280px, 0px" priority />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  <div className="relative rounded-2xl overflow-hidden glass-card-elevated h-[200px]">
                    <Image src={heroImages[1].src} alt={heroImages[1].alt} fill className="object-cover" sizes="(min-width: 1024px) 280px, 0px" priority />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  <div className="relative rounded-2xl overflow-hidden glass-card-elevated h-[200px]">
                    <Image src={heroImages[2].src} alt={heroImages[2].alt} fill className="object-cover" sizes="(min-width: 1024px) 280px, 0px" priority />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                </div>
              )}
              {layoutVariant === 1 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative rounded-2xl overflow-hidden glass-card-elevated h-[200px]">
                    <Image src={heroImages[0].src} alt={heroImages[0].alt} fill className="object-cover" sizes="(min-width: 1024px) 280px, 0px" priority />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  <div className="col-span-1 row-span-2 relative rounded-2xl overflow-hidden glass-card-elevated h-[416px]">
                    <Image src={heroImages[1].src} alt={heroImages[1].alt} fill className="object-cover" sizes="(min-width: 1024px) 280px, 0px" priority />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  <div className="relative rounded-2xl overflow-hidden glass-card-elevated h-[200px]">
                    <Image src={heroImages[2].src} alt={heroImages[2].alt} fill className="object-cover" sizes="(min-width: 1024px) 280px, 0px" priority />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                </div>
              )}
              {layoutVariant === 2 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative rounded-2xl overflow-hidden glass-card-elevated h-[200px]">
                    <Image src={heroImages[0].src} alt={heroImages[0].alt} fill className="object-cover" sizes="(min-width: 1024px) 280px, 0px" priority />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  <div className="relative rounded-2xl overflow-hidden glass-card-elevated h-[200px]">
                    <Image src={heroImages[1].src} alt={heroImages[1].alt} fill className="object-cover" sizes="(min-width: 1024px) 280px, 0px" priority />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  <div className="col-span-2 relative rounded-2xl overflow-hidden glass-card-elevated h-[200px]">
                    <Image
                      src={heroImages[2].src}
                      alt={heroImages[2].alt}
                      fill
                      className="object-cover object-[center_30%]"
                      sizes="(min-width: 1024px) 560px, 0px"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-[1]" data-aos="fade-up" data-aos-delay="500">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted font-medium">Scroll</span>
          <ChevronDown className="w-4 h-4 text-muted animate-bounce" aria-hidden="true" />
        </div>
      </section>
    </>
  );
}
