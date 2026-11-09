"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

const faqs = [
  { q: "Is it free?", a: "Yes. 100% free. No hidden fees." },
  {
    q: "Do I need experience?",
    a: "Some basics help: networking, the command line and a little coding. About 6 months of self-study is a good start.",
  },
  { q: "What if I fail a stage?", a: "You leave the programme. Each stage has a deadline and a quality bar." },
  { q: "When do I pick a track?", a: "At Stage 5. Before that, everyone does the same work." },
  { q: "How long is it?", a: "About 10 weeks. Roughly one week per stage." },
  { q: "Is it online?", a: "Yes, fully online. Interns join from over 30 countries." },
  { q: "Will I get a job?", a: "We can't promise one, but finalists meet companies that are hiring." },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-20 py-16 sm:py-20">
      <div className="max-w-[80rem] mx-auto px-5 sm:px-8 grid gap-12 lg:grid-cols-12">
        <h2
          id="faq-heading"
          data-reveal
          className="lg:col-span-4 text-[clamp(2.25rem,4.2vw,3.75rem)] font-semibold leading-[1] tracking-[-0.045em]"
        >
          Got <span className="serif font-normal text-sky">questions?</span>
        </h2>

        <dl className="lg:col-span-8 space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={`rounded-2xl border transition-colors duration-300 ${isOpen ? "border-signal/40 bg-surface" : "border-border bg-surface/60 hover:bg-surface"}`}
              >
                <dt>
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left cursor-pointer"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${i}`}
                  >
                    <span className="text-lg font-semibold tracking-tight">{faq.q}</span>
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition-transform duration-300 ${
                        isOpen ? "rotate-45 bg-signal text-ink" : "bg-surface-hover text-foreground"
                      }`}
                      aria-hidden="true"
                    >
                      <Plus className="h-5 w-5" />
                    </span>
                  </button>
                </dt>
                <dd
                  id={`faq-answer-${i}`}
                  role="region"
                  className={`grid transition-all duration-500 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <p className="overflow-hidden">
                    <span className="block px-6 pb-6 text-muted">{faq.a}</span>
                  </p>
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
