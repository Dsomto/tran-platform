"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Is it free?",
    a: "Yes. The entire program is free. No hidden fees, no paywalls. We believe talent shouldn't be gated by finances.",
  },
  {
    q: "Do I need prior experience?",
    a: "You need basic IT literacy — comfort with the command line, networking concepts, and some scripting. This isn't a from-zero program; it assumes you've done at least 6 months of self-study.",
  },
  {
    q: "What happens if I fail a stage?",
    a: "You're eliminated from the program. Each stage has tasks with strict deadlines. If you miss the deadline or don't meet the quality bar, you're out. It's competitive by design.",
  },
  {
    q: "When do I choose a specialization?",
    a: "At Stage 5. Stages 0–4 are general — everyone does the same work. At Stage 5, you choose between SOC Analysis, Ethical Hacking, or GRC based on your interests and strengths.",
  },
  {
    q: "How long does the program take?",
    a: "Approximately 10 weeks — roughly one week per stage. Later stages may take slightly longer due to increased complexity and team projects.",
  },
  {
    q: "Is it fully remote?",
    a: "Yes. UBI is 100% remote. Interns participate from 30+ countries. Team meetings happen via Zoom or Google Meet.",
  },
  {
    q: "Do finalists get hired?",
    a: "Our hiring network includes companies actively recruiting for cybersecurity roles. Finalists get direct access to this network. We can't guarantee an offer, but the odds are strongly in your favor.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="relative py-28 sm:py-36 bg-background bg-scan overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="crosshair top-[12%] right-[18%] hidden lg:block" aria-hidden="true" />
      <div className="crosshair bottom-[10%] left-[15%] hidden lg:block" aria-hidden="true" />
      <div className="orb orb-blue w-[300px] h-[300px] top-[10%] right-[0%] hidden lg:block" aria-hidden="true" />
      <div className="orb orb-violet w-[200px] h-[200px] bottom-[10%] left-[0%] hidden lg:block" style={{ animationDelay: "-4s" }} aria-hidden="true" />
      <div className="absolute top-[30%] left-[8%] w-10 h-10 border border-blue/8 rounded-full float-medium hidden lg:block" aria-hidden="true" />
      <div className="absolute bottom-[35%] right-[10%] w-16 h-16 border border-violet/6 rounded-2xl rotate-12 float-delayed hidden lg:block" aria-hidden="true" />
      <div className="absolute top-[50%] left-[5%] w-2.5 h-2.5 bg-blue/15 rounded-full pulse-glow hidden lg:block" aria-hidden="true" />
      <div className="ring-dashed w-[110px] h-[110px] top-[20%] left-[10%] ring-spin hidden lg:block" aria-hidden="true" />
      <div className="hex-grid" aria-hidden="true" />

      <div className="relative z-[1] max-w-2xl mx-auto px-5 sm:px-8">
        <div data-aos="fade-up">
          <p className="text-xs font-medium text-blue uppercase tracking-[0.15em] mb-3">FAQ</p>
          <h2 id="faq-heading" className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Common questions
          </h2>
        </div>

        <dl className="mt-12 divide-y divide-border/60">
          {faqs.map((faq, i) => (
            <div key={i} className="py-5" data-aos="fade-up" data-aos-delay={i * 50}>
              <dt>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between text-left cursor-pointer group"
                  aria-expanded={open === i}
                  aria-controls={`faq-answer-${i}`}
                >
                  <span className="text-sm font-medium text-foreground group-hover:text-blue transition-colors pr-8">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted shrink-0 transition-transform duration-200 ${open === i ? "rotate-180 text-blue" : ""}`}
                    aria-hidden="true"
                  />
                </button>
              </dt>
              <dd
                id={`faq-answer-${i}`}
                role="region"
                className={`overflow-hidden transition-all duration-200 ${open === i ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"}`}
              >
                <p className="text-sm text-muted leading-relaxed pr-8">{faq.a}</p>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
