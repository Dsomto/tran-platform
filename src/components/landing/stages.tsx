"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const stages = [
  { num: 0, title: "Onboarding", image: "/images/hero-1.jpg" },
  { num: 1, title: "Security Mindset", image: "/images/stock/coding-monitors.jpg" },
  { num: 2, title: "Core Infrastructure", image: "/images/stock/server-room-analyst.jpg" },
  { num: 3, title: "Attack & Defence Basics", image: "/images/tracks/soc-analyst.jpg" },
  { num: 4, title: "Real-World Simulation", image: "/images/programs/workshops.jpg" },
  { num: 5, title: "Choose Your Track", image: "/images/stock/team-coding.jpg" },
  { num: 6, title: "Deep Dive", image: "/images/tracks/ethical-hacking.jpg" },
  { num: 7, title: "Advanced Operations", image: "/images/tracks/grc.png" },
  { num: 8, title: "Team Project", image: "/images/programs/mentorship.jpg" },
  { num: 9, title: "Capstone", image: "/images/programs/tech-spotlight.jpg" },
];

/**
 * On desktop the section pins while vertical scroll drives the stage track
 * sideways. The card nearest the centre of the screen lights up and the dot
 * rail below follows it. On small screens it is a plain list.
 */
export function Stages() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const [distance, setDistance] = useState(0);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;

    const measure = () => {
      const track = trackRef.current;
      if (!track || !desktop.matches || reduce.matches) {
        setDistance(0);
        return;
      }
      setDistance(Math.max(0, track.scrollWidth - window.innerWidth));
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const section = sectionRef.current;
        const track = trackRef.current;
        if (!section || !track) return;
        const pinned = desktop.matches && !reduce.matches;
        const max = section.offsetHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, Math.max(0, -section.getBoundingClientRect().top / max)) : 0;
        section.style.setProperty("--p", p.toFixed(4));
        track.style.transform = pinned ? `translate3d(${-p * Math.max(0, track.scrollWidth - window.innerWidth)}px,0,0)` : "";

        // Pinned: scroll progress picks the card, so the last stage is reached
        // at the end on any screen width. Otherwise: the card nearest mid-screen.
        const cy = window.innerHeight / 2;
        const cards = track.querySelectorAll<HTMLElement>("[data-stage]");
        let best = 0;
        if (pinned) {
          best = Math.round(p * (cards.length - 1));
        } else {
          let bestDist = Infinity;
          cards.forEach((card, i) => {
            const r = card.getBoundingClientRect();
            const d = Math.abs(r.top + r.height / 2 - cy);
            if (d < bestDist) {
              bestDist = d;
              best = i;
            }
          });
        }
        cards.forEach((card, i) => {
          card.dataset.active = String(i === best);
        });
        setActive(best);
      });
    };

    raf = requestAnimationFrame(() => {
      measure();
      onScroll();
    });
    // Re-measure whenever the track's size settles (styles, fonts, images),
    // not just on first paint, or a too-early read leaves it unpinned.
    const observer = new ResizeObserver(() => {
      measure();
      onScroll();
    });
    if (trackRef.current) observer.observe(trackRef.current);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    desktop.addEventListener("change", measure);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      desktop.removeEventListener("change", measure);
    };
  }, []);

  const pinned = distance > 0;

  return (
    <section
      ref={sectionRef}
      id="stages"
      aria-labelledby="stages-heading"
      className="relative scroll-mt-20"
      style={pinned ? { height: `calc(100vh + ${distance}px)` } : undefined}
    >
      <div className={pinned ? "sticky top-0 flex h-screen flex-col justify-center overflow-hidden pt-16" : "overflow-x-auto py-16"}>
        {pinned && (
          // Background driven by scroll progress (--p, 0 to 1): a dot field drifting
          // slower than the cards, and the active stage as a giant outlined numeral.
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "radial-gradient(color-mix(in oklab, var(--foreground) 16%, transparent) 1px, transparent 1.6px)",
                backgroundSize: "28px 28px",
                backgroundPositionX: "calc(var(--p, 0) * -640px)",
                maskImage: "radial-gradient(ellipse 75% 60% at 50% 55%, #000 25%, transparent 75%)",
              }}
            />
            <span
              key={active}
              className="stage-ghost absolute right-[3vw] top-1/2 -translate-y-[46%] select-none text-[70vh] font-semibold leading-none tracking-[-0.08em] text-transparent"
              style={{ WebkitTextStroke: "2px color-mix(in oklab, var(--foreground) 11%, transparent)" }}
            >
              {active}
            </span>
          </div>
        )}
        <ol
          ref={trackRef}
          className="relative z-[1] flex flex-col gap-4 px-5 sm:px-8 lg:w-max lg:flex-row lg:items-center lg:gap-5 lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))] lg:pr-[max(2rem,calc((100vw-80rem)/2+2rem))] will-change-transform"
          role="list"
        >
          <li className="mb-10 flex max-w-xl flex-col justify-center lg:mb-0 lg:w-[24rem] lg:shrink-0 lg:pr-8">
            <h2 className="sr-only">The journey</h2>
            <p
              id="stages-heading"
              className="text-[clamp(2.25rem,4.2vw,3.75rem)] font-semibold leading-[1] tracking-[-0.045em] text-foreground"
            >
              10 stages. <span className="serif font-normal text-sky">One at a time.</span>
            </p>
            <p className="mt-5 text-lg text-muted">Pass a stage to unlock the next.</p>
            {pinned && <p className="mt-8 text-sm text-muted">Keep scrolling →</p>}
          </li>

          {stages.map((s) => {
            const track = s.num >= 5;
            return (
              <li
                key={s.num}
                data-stage
                data-active="false"
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-surface/80 p-3 backdrop-blur transition-all duration-500 ease-out data-[active=true]:-translate-y-2 data-[active=true]:border-lime/50 data-[active=true]:shadow-[0_30px_60px_-30px_rgba(59,108,255,.45)] lg:w-[17rem] lg:shrink-0"
              >
                <div className="relative h-44 overflow-hidden rounded-2xl">
                  <Image
                    src={s.image}
                    alt=""
                    fill
                    sizes="272px"
                    className="object-cover grayscale-[70%] transition duration-700 group-data-[active=true]:scale-110 group-data-[active=true]:grayscale-0"
                  />
                  <span
                    className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur ${
                      track ? "bg-signal text-ink" : "bg-white/85 text-ink"
                    }`}
                  >
                    {s.num === 5 ? "Pick your track" : track ? "Your track" : "The basics"}
                  </span>
                </div>
                <div className="flex items-end justify-between gap-3 px-3 pb-3 pt-4">
                  <h3 className="text-lg font-semibold leading-tight tracking-tight">
                    <span className="sr-only">Stage {s.num}: </span>
                    {s.title}
                  </h3>
                  <span
                    className="text-6xl font-semibold leading-none tracking-[-0.06em] text-foreground/15 transition-colors duration-500 group-data-[active=true]:text-lime"
                    aria-hidden="true"
                  >
                    {s.num}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>

        {pinned && (
          <div className="relative z-[1] mx-auto mt-12 w-full max-w-[80rem] px-8" aria-hidden="true">
            <div className="relative flex items-center justify-between">
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
              <div
                className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-lime transition-[width] duration-500"
                style={{ width: `${(active / (stages.length - 1)) * 100}%` }}
              />
              {stages.map((s, i) => (
                <span
                  key={s.num}
                  className={`relative grid place-items-center rounded-full text-xs font-semibold transition-all duration-500 ${
                    i === active
                      ? "h-9 w-9 bg-signal text-ink shadow-[0_0_0_6px_rgba(198,242,78,.2)]"
                      : i < active
                        ? "h-3 w-3 bg-lime"
                        : "h-3 w-3 bg-border"
                  }`}
                >
                  {i === active ? s.num : ""}
                </span>
              ))}
            </div>
            <div className="mt-4 flex justify-between text-xs text-muted">
              <span>The basics · 0–4</span>
              <span>Your track · 5–9</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
