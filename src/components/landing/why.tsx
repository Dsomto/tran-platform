"use client";

const reasons = [
  {
    emoji: "🔥",
    title: "Pressure builds talent",
    desc: "The elimination format mirrors real industry pressure — survive UBI, and you're ready for anything.",
  },
  {
    emoji: "🛡️",
    title: "The skills gap is real",
    desc: "3.5 million cybersecurity jobs are unfilled globally. Employers want proof — not just certifications.",
  },
  {
    emoji: "🌍",
    title: "No barriers",
    desc: "Fully remote, fully free. Interns join from 30+ countries. Your talent matters — not your zip code.",
  },
  {
    emoji: "🧪",
    title: "We test, not teach",
    desc: "Real challenges, real deadlines. We drop you into scenarios and see if you can deliver under pressure.",
  },
  {
    emoji: "🚀",
    title: "Fast-track to career",
    desc: "Companies recruit directly from our finalist pool. No resume spam — your work speaks for itself.",
  },
  {
    emoji: "❤️",
    title: "Community that lasts",
    desc: "Alumni hire each other, mentor the next cohort, and stay connected. A career network, not a course.",
  },
];

export function Why() {
  return (
    <section
      id="why"
      aria-labelledby="why-heading"
      className="relative py-28 sm:py-36 bg-background bg-scan overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="crosshair top-[14%] left-[10%] hidden lg:block" aria-hidden="true" />
      <div className="crosshair bottom-[18%] right-[8%] hidden lg:block" aria-hidden="true" />
      <div className="orb orb-violet w-[280px] h-[280px] top-[5%] left-[0%] hidden lg:block" aria-hidden="true" />
      <div className="orb orb-rose w-[220px] h-[220px] bottom-[10%] right-[5%] hidden lg:block" style={{ animationDelay: "-10s" }} aria-hidden="true" />
      <div className="orb orb-amber w-[180px] h-[180px] top-[50%] right-[30%] hidden lg:block" style={{ animationDelay: "-3s" }} aria-hidden="true" />
      <div className="absolute top-[25%] right-[8%] w-16 h-16 border border-violet/8 rounded-2xl -rotate-12 float-slow hidden lg:block" aria-hidden="true" />
      <div className="absolute bottom-[30%] left-[15%] w-3.5 h-3.5 bg-rose/15 rounded-full pulse-glow hidden lg:block" aria-hidden="true" />
      <div className="absolute top-[60%] right-[12%] w-2.5 h-2.5 bg-cyan/20 rounded-full pulse-glow hidden lg:block" style={{ animationDelay: "-1.5s" }} aria-hidden="true" />
      <div className="ring-dashed w-[160px] h-[160px] bottom-[25%] left-[6%] ring-spin hidden lg:block" aria-hidden="true" />
      <div className="absolute top-[40%] left-[25%] w-8 h-8 border border-amber/10 rounded-full float-medium hidden lg:block" aria-hidden="true" />
      <div className="hex-grid" aria-hidden="true" />

      {/* Constellation SVG — left side */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <svg className="absolute top-0 left-0 w-[40%] h-full opacity-60 hidden lg:block" viewBox="0 0 500 900" fill="none">
          <line x1="80" y1="200" x2="200" y2="350" stroke="rgba(124,58,237,0.1)" strokeWidth="1" />
          <line x1="200" y1="350" x2="150" y2="500" stroke="rgba(124,58,237,0.08)" strokeWidth="1" />
          <line x1="150" y1="500" x2="300" y2="600" stroke="rgba(8,145,178,0.1)" strokeWidth="1" />
          <line x1="300" y1="600" x2="250" y2="750" stroke="rgba(8,145,178,0.08)" strokeWidth="1" />
          <circle cx="80" cy="200" r="2.5" fill="#7C3AED" opacity="0.2" />
          <circle cx="200" cy="350" r="3" fill="#7C3AED" opacity="0.25">
            <animate attributeName="opacity" values="0.25;0.45;0.25" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="150" cy="500" r="2" fill="#0891B2" opacity="0.2" />
          <circle cx="300" cy="600" r="3" fill="#0891B2" opacity="0.25">
            <animate attributeName="opacity" values="0.25;0.4;0.25" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="250" cy="750" r="2" fill="#0891B2" opacity="0.15" />
        </svg>
      </div>

      <div className="relative z-[1] max-w-6xl mx-auto px-5 sm:px-8">
        <div className="max-w-2xl" data-aos="fade-up">
          <p className="text-xs font-medium text-blue uppercase tracking-[0.15em] mb-3">
            Why UBI
          </p>
          <h2 id="why-heading" className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Why we built this
          </h2>
          <p className="mt-4 text-base text-muted leading-relaxed">
            The cybersecurity industry has a problem: too many openings, not enough
            battle-tested talent. We&apos;re fixing that.
          </p>
        </div>

        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reasons.map((r, i) => (
            <article
              key={r.title}
              data-aos="fade-up"
              data-aos-delay={i * 80}
              className="glass-card glass-shine rounded-2xl p-7 group"
            >
              <span className="text-3xl block mb-4" aria-hidden="true">{r.emoji}</span>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">{r.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{r.desc}</p>
            </article>
          ))}
        </div>

        {/* Big stat callout */}
        <div className="mt-16 glass-card-elevated rounded-2xl p-8 sm:p-10" data-aos="fade-up" data-aos-delay="200">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { val: "3.5M", label: "Unfilled cyber jobs", emoji: "📊" },
              { val: "Free", label: "Cost to participate", emoji: "✅" },
              { val: "30+", label: "Countries", emoji: "🌍" },
            ].map((stat) => (
              <div key={stat.label}>
                <span className="text-2xl block mb-2" aria-hidden="true">{stat.emoji}</span>
                <p className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">{stat.val}</p>
                <p className="text-xs text-muted mt-1 font-medium uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
