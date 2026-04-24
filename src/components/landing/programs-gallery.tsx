"use client";

import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    src: "/images/programs/mentorship.jpg",
    title: "Cybersecurity Mentorship",
    caption: "Practitioners walking new analysts through their first real investigations.",
  },
  {
    src: "/images/programs/ubuntu-bridge.jpg",
    title: "Ubuntu Bridge Initiative",
    caption: "Powering through the training from anywhere — data, laptops, and hardware where it is needed.",
  },
  {
    src: "/images/programs/school-tour.jpg",
    title: "Cybersecurity Educational School Tour",
    caption: "Taking cybersecurity directly into secondary schools across Nigeria.",
  },
  {
    src: "/images/programs/workshops.jpg",
    title: "Community Cybersafe Workshops",
    caption: "Hands-on workshops for neighbourhoods that normally never get the invite.",
  },
  {
    src: "/images/programs/street-evangelism.png",
    title: "Street Cyber Evangelism",
    caption: "Face-to-face conversations — meeting people where they already are.",
  },
  {
    src: "/images/programs/tech-spotlight.jpg",
    title: "Tech Spotlight Sunday",
    caption: "Every Sunday, one builder, one story, one lesson you can use on Monday.",
  },
];

const AUTOPLAY_MS = 4500;

export function ProgramsGallery() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setI((v) => (v + 1) % slides.length), []);
  const prev = useCallback(() => setI((v) => (v - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(next, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [next, paused]);

  return (
    <section
      id="programs"
      aria-labelledby="programs-heading"
      className="relative py-24 sm:py-32 bg-background bg-scan overflow-hidden"
    >
      <div className="orb orb-blue w-[280px] h-[280px] top-[8%] left-[4%] hidden lg:block" aria-hidden="true" />
      <div className="orb orb-cyan w-[220px] h-[220px] bottom-[12%] right-[6%] hidden lg:block" style={{ animationDelay: "-6s" }} aria-hidden="true" />
      <div className="hex-grid" aria-hidden="true" />

      <div className="relative z-[1] max-w-6xl mx-auto px-5 sm:px-8">
        <div className="max-w-2xl mb-10" data-aos="fade-up">
          <p className="text-xs font-medium text-blue uppercase tracking-[0.15em] mb-3">
            Part of a bigger network
          </p>
          <h2
            id="programs-heading"
            className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground"
          >
            UBI is one of several programmes we run
          </h2>
          <p className="mt-4 text-base text-muted leading-relaxed">
            The Root Access Network builds pipelines into cybersecurity across Nigeria —
            from schoolyards to community halls to this programme. A look at the work.
          </p>
        </div>

        <div
          className="relative glass-card-elevated rounded-3xl overflow-hidden group"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          data-aos="fade-up"
          data-aos-delay="100"
        >
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-black/20">
            {slides.map((s, idx) => (
              <div
                key={s.src}
                aria-hidden={idx !== i}
                className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                  idx === i ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <Image
                  src={s.src}
                  alt={s.title}
                  fill
                  sizes="(min-width: 1024px) 1100px, 100vw"
                  className="object-cover"
                  priority={idx === 0}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pt-14 pb-6 px-6 sm:px-8">
                  <p className="text-xs font-medium text-white/70 uppercase tracking-[0.18em]">
                    {String(idx + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                  </p>
                  <h3 className="text-lg sm:text-2xl font-bold text-white mt-1">{s.title}</h3>
                  <p className="text-sm text-white/80 mt-1.5 max-w-2xl">{s.caption}</p>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={prev}
              aria-label="Previous programme"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 backdrop-blur hover:bg-white/30 text-white grid place-items-center transition opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next programme"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 backdrop-blur hover:bg-white/30 text-white grid place-items-center transition opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 py-4 bg-white/70 backdrop-blur">
            {slides.map((s, idx) => (
              <button
                key={s.src}
                type="button"
                onClick={() => setI(idx)}
                aria-label={`Go to ${s.title}`}
                aria-current={idx === i}
                className={`h-1.5 rounded-full transition-all ${
                  idx === i ? "w-8 bg-blue" : "w-1.5 bg-muted/40 hover:bg-muted/60"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
