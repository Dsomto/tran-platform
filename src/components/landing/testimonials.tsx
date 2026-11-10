"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { featuredTestimonials as quotes, internFor, testimonials } from "@/lib/testimonials";
import { InternFace } from "./intern-face";

const ROTATE_MS = 8000;

export function Testimonials() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => setActive((a) => (a + 1) % quotes.length), ROTATE_MS);
    return () => window.clearTimeout(id);
  }, [active, paused]);

  const t = quotes[active];

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="scroll-mt-20 py-16 sm:py-20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="max-w-[80rem] mx-auto px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2
            id="testimonials-heading"
            data-reveal
            className="text-[clamp(2.25rem,4.2vw,3.75rem)] font-semibold tracking-[-0.045em]"
          >
            In their <span className="serif font-normal text-sky">words.</span>
          </h2>
          <Link
            href="/interns#stories"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            Read all {testimonials.length} stories
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" aria-hidden="true" />
          </Link>
        </div>

        <figure
          data-reveal
          aria-live="polite"
          className="relative mt-10 grid gap-8 overflow-hidden rounded-3xl border border-border bg-surface/70 p-6 backdrop-blur sm:p-10 md:grid-cols-[13rem_1fr] md:items-center"
        >
          <InternFace
            key={`face-${active}`}
            intern={internFor(t.name)}
            index={active}
            sizes="208px"
            className="pop aspect-square w-32 rounded-t-[6rem] rounded-b-3xl md:w-full"
          />
          <div className="relative">
            <span className="absolute -top-14 -left-2 text-[8rem] font-semibold leading-none text-lime/25" aria-hidden="true">
              &ldquo;
            </span>
            <blockquote key={active} className="rise relative">
              <p className="text-[clamp(1.15rem,1.8vw,1.6rem)] font-medium leading-snug tracking-tight">
                {t.quote.join(" ")}
              </p>
            </blockquote>
            <figcaption className="mt-6">
              <span className="block font-semibold">{t.name}</span>
              {t.role && <span className="block text-sm text-muted">{t.role}</span>}
            </figcaption>
          </div>
        </figure>

        <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Interns">
          {quotes.map((q, i) => (
            <button
              key={q.name}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={q.name}
              onClick={() => setActive(i)}
              className={`cursor-pointer rounded-full p-0.5 transition-all ${
                i === active ? "ring-2 ring-lime" : "opacity-60 hover:opacity-100"
              }`}
            >
              <InternFace intern={internFor(q.name)} index={i} sizes="44px" className="h-11 w-11 rounded-full" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
