"use client";

import { useEffect, useState } from "react";

const testimonials = [
  {
    quote:
      "UBI pushed me harder than any bootcamp I've tried. The elimination pressure forced me to level up fast. I landed a SOC analyst role before the program even ended.",
    name: "Aisha O.",
    role: "SOC Analyst",
    track: "SOC Analysis",
  },
  {
    quote:
      "The ethical hacking track is the real deal. The pentest labs were indistinguishable from actual client environments. This program prepared me for day-one impact.",
    name: "Chidi E.",
    role: "Penetration Tester",
    track: "Ethical Hacking",
  },
  {
    quote:
      "As someone pivoting from IT to GRC, UBI gave me hands-on compliance experience that no certification could. The team projects were incredibly valuable.",
    name: "Fatima A.",
    role: "GRC Analyst",
    track: "GRC",
  },
];

const ROTATE_MS = 8000;

export function Testimonials() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => setActive((a) => (a + 1) % testimonials.length), ROTATE_MS);
    return () => window.clearTimeout(id);
  }, [active, paused]);

  const t = testimonials[active];

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="scroll-mt-20 py-16 sm:py-20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="max-w-[80rem] mx-auto px-5 sm:px-8">
        <h2
          id="testimonials-heading"
          data-reveal
          className="text-[clamp(2.25rem,4.2vw,3.75rem)] font-semibold tracking-[-0.045em]"
        >
          In their <span className="serif font-normal text-sky">words.</span>
        </h2>

        <figure
          data-reveal
          aria-live="polite"
          className="relative mt-10 overflow-hidden rounded-3xl border border-border bg-surface/70 p-8 backdrop-blur sm:p-12"
        >
          <span className="absolute -top-8 right-8 text-[10rem] font-semibold leading-none text-lime/20" aria-hidden="true">
            &ldquo;
          </span>
          <blockquote key={active} className="rise relative max-w-4xl">
            <p className="text-[clamp(1.25rem,2vw,1.85rem)] font-medium leading-snug tracking-tight">{t.quote}</p>
          </blockquote>
          <figcaption className="relative mt-10 flex flex-wrap items-center justify-between gap-6">
            <span className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-signal text-lg font-semibold text-ink" aria-hidden="true">
                {t.name.charAt(0)}
              </span>
              <span>
                <span className="block font-semibold">{t.name}</span>
                <span className="block text-sm text-muted">{t.role} · {t.track}</span>
              </span>
            </span>
            <span className="flex gap-2" role="tablist" aria-label="Graduates">
              {testimonials.map((item, i) => (
                <button
                  key={item.name}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={item.name}
                  onClick={() => setActive(i)}
                  className={`h-3 rounded-full transition-all cursor-pointer ${i === active ? "w-10 bg-signal" : "w-3 bg-foreground/25"}`}
                />
              ))}
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
