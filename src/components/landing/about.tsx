"use client";

import Image from "next/image";


const features = [
  {
    emoji: "⚡",
    title: "You either do the work or you're out",
    desc: "Every stage ends with a report. If the grader passes you, you move on. If not, you revise until the deadline. No participation trophies.",
    color: "blue",
  },
  {
    emoji: "👥",
    title: "Graded by real people",
    desc: "Not a quiz engine. Real cybersecurity practitioners read your reports and give you the kind of feedback you'd get in a working SOC.",
    color: "cyan",
  },
  {
    emoji: "🏆",
    title: "Proof you can show an employer",
    desc: "Every stage produces an artefact — a writeup, a forensic report, a pentest finding. By Stage 5 you have a portfolio, not just a certificate.",
    color: "amber",
  },
  {
    emoji: "💼",
    title: "We pay for your certs",
    desc: "Make it to Stage 5 and we cover your Security+ or ISO 27001 voucher. Weekly data credits too, if cost is what's in your way.",
    color: "emerald",
  },
];

export function About() {
  return (
    <section
      id="program"
      aria-labelledby="program-heading"
      className="relative py-28 sm:py-36 bg-background bg-scan overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="crosshair bottom-[15%] right-[12%] hidden lg:block" aria-hidden="true" />
      <div className="crosshair top-[20%] left-[8%] hidden lg:block" aria-hidden="true" />
      <div className="orb orb-blue w-[350px] h-[350px] top-[5%] right-[0%] hidden lg:block" aria-hidden="true" />
      <div className="orb orb-cyan w-[200px] h-[200px] bottom-[10%] left-[5%] hidden lg:block" style={{ animationDelay: "-8s" }} aria-hidden="true" />
      <div className="absolute top-[30%] right-[6%] w-14 h-14 border border-blue/8 rounded-full float-medium hidden lg:block" aria-hidden="true" />
      <div className="absolute bottom-[20%] left-[12%] w-3 h-3 bg-amber/20 rounded-full pulse-glow hidden lg:block" aria-hidden="true" />
      <div className="ring-dashed w-[120px] h-[120px] top-[15%] right-[20%] ring-spin hidden lg:block" aria-hidden="true" />
      <div className="hex-grid" aria-hidden="true" />

      <div className="relative z-[1] max-w-6xl mx-auto px-5 sm:px-8">
        {/* Header with image */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div data-aos="fade-up">
            <p className="text-xs font-medium text-blue uppercase tracking-[0.15em] mb-3">
              How it works
            </p>
            <h2 id="program-heading" className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              This is not a course. It is an internship.
            </h2>
            <p className="mt-4 text-base text-muted leading-relaxed">
              You will not sit through lectures. You will investigate a simulated
              breach, find the flaws, write the report, and defend it. Most people
              who start don&apos;t finish. The ones who do have something real to show.
            </p>
          </div>

          <div className="hidden lg:block" data-aos="fade-left" data-aos-delay="200">
            <div className="relative rounded-2xl overflow-hidden glass-card-elevated glass-shine h-[280px]">
              <Image
                src="/images/hero-3.jpg"
                alt="Young African professionals building careers"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 500px, 0px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {features.map((f, i) => (
            <article
              key={f.title}
              data-aos="fade-up"
              data-aos-delay={i * 100}
              className="glass-card glass-shine rounded-2xl p-7 group"
            >
              <span className="text-3xl block mb-4" aria-hidden="true">{f.emoji}</span>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
