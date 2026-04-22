"use client";

import Image from "next/image";

const testimonials = [
  {
    quote:
      "UBI pushed me harder than any bootcamp I've tried. The elimination pressure forced me to level up fast. I landed a SOC analyst role before the program even ended.",
    name: "Aisha O.",
    role: "SOC Analyst",
    track: "SOC Analysis",
    color: "border-l-cyan",
    tagBg: "bg-cyan-light",
    tagText: "text-cyan-dark",
    avatar: "https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?w=120&h=120&fit=crop&crop=faces",
  },
  {
    quote:
      "The ethical hacking track is the real deal. The pentest labs were indistinguishable from actual client environments. This program prepared me for day-one impact.",
    name: "Chidi E.",
    role: "Penetration Tester",
    track: "Ethical Hacking",
    color: "border-l-amber",
    tagBg: "bg-amber-light",
    tagText: "text-amber-dark",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces",
  },
  {
    quote:
      "As someone pivoting from IT to GRC, UBI gave me hands-on compliance experience that no certification could. The team projects were incredibly valuable.",
    name: "Fatima A.",
    role: "GRC Analyst",
    track: "GRC",
    color: "border-l-emerald",
    tagBg: "bg-emerald-light",
    tagText: "text-emerald-dark",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop&crop=faces",
  },
];

export function Testimonials() {
  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="relative py-28 sm:py-36 bg-background bg-scan overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="crosshair top-[10%] right-[15%] hidden lg:block" aria-hidden="true" />
      <div className="crosshair bottom-[12%] left-[10%] hidden lg:block" aria-hidden="true" />
      <div className="orb orb-cyan w-[250px] h-[250px] top-[10%] left-[0%] hidden lg:block" aria-hidden="true" />
      <div className="orb orb-emerald w-[200px] h-[200px] bottom-[5%] right-[5%] hidden lg:block" style={{ animationDelay: "-6s" }} aria-hidden="true" />
      <div className="absolute top-[20%] right-[5%] w-14 h-14 border border-cyan/8 rounded-2xl rotate-12 float-slow hidden lg:block" aria-hidden="true" />
      <div className="absolute bottom-[25%] left-[8%] w-3 h-3 bg-amber/15 rounded-full pulse-glow hidden lg:block" aria-hidden="true" />
      <div className="ring-dashed w-[130px] h-[130px] bottom-[20%] right-[12%] ring-spin hidden lg:block" aria-hidden="true" />
      <div className="hex-grid" aria-hidden="true" />

      <div className="relative z-[1] max-w-6xl mx-auto px-5 sm:px-8">
        <div className="max-w-2xl" data-aos="fade-up">
          <p className="text-xs font-medium text-blue uppercase tracking-[0.15em] mb-3">
            From the network
          </p>
          <h2 id="testimonials-heading" className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            What our graduates say
          </h2>
        </div>

        <div className="mt-16 grid lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <blockquote
              key={i}
              data-aos="fade-up"
              data-aos-delay={i * 100}
              className={`glass-card rounded-2xl p-7 flex flex-col border-l-4 ${t.color}`}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${t.tagBg} ${t.tagText} uppercase tracking-wider`}>
                  {t.track}
                </span>
              </div>
              <span className="text-3xl font-serif text-blue/15 leading-none mb-2" aria-hidden="true">&ldquo;</span>
              <p className="text-sm text-foreground/80 leading-relaxed flex-1">
                {t.quote}
              </p>
              <footer className="mt-6 pt-5 border-t border-border/40">
                <cite className="not-italic flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 ring-2 ring-white">
                    <Image
                      src={t.avatar}
                      alt={t.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted mt-0.5">{t.role}</p>
                  </div>
                </cite>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
