import { getLandingStats } from "@/lib/landing-stats";

export async function StatsDashboard() {
  const { applicants, interns, passedStage1, tracks } = await getLandingStats();

  const cards = [
    {
      emoji: "📨",
      value: applicants.toLocaleString(),
      label: "Applicants",
      caption: "applications received",
      featured: false,
    },
    {
      emoji: "🎓",
      value: interns.toLocaleString(),
      label: "Interns",
      caption: "selected into Cohort 1",
      featured: false,
    },
    {
      emoji: "🚀",
      value: passedStage1.toLocaleString(),
      label: "Passed Stage 1",
      caption: "advanced to Stage 2",
      featured: true,
    },
    {
      emoji: "🎯",
      value: tracks.toLocaleString(),
      label: "Tracks",
      caption: "SOC · Ethical Hacking · GRC",
      featured: false,
    },
  ];

  return (
    <section
      aria-labelledby="numbers-heading"
      className="relative py-28 sm:py-36 bg-background bg-scan overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="crosshair top-[18%] right-[10%] hidden lg:block" aria-hidden="true" />
      <div className="orb orb-blue w-[350px] h-[350px] top-[5%] left-[0%] hidden lg:block" aria-hidden="true" />
      <div className="orb orb-cyan w-[200px] h-[200px] bottom-[10%] right-[5%] hidden lg:block" style={{ animationDelay: "-6s" }} aria-hidden="true" />
      <div className="ring-dashed w-[120px] h-[120px] bottom-[15%] left-[12%] ring-spin hidden lg:block" aria-hidden="true" />
      <div className="hex-grid" aria-hidden="true" />

      <div className="relative z-[1] max-w-6xl mx-auto px-5 sm:px-8">
        <div className="max-w-2xl mb-14" data-aos="fade-up">
          <p className="text-xs font-medium text-blue uppercase tracking-[0.15em] mb-3">
            By the numbers
          </p>
          <h2 id="numbers-heading" className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Cohort 1 — by the numbers
          </h2>
          <p className="mt-4 text-base text-muted leading-relaxed">
            Thousands applied. A few hundred made the cut. These are the people
            who showed up and did the work.
          </p>
        </div>

        <ul
          role="list"
          aria-label="Cohort 1 statistics"
          className="grid grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {cards.map((c, i) => (
            <li
              key={c.label}
              data-aos="fade-up"
              data-aos-delay={i * 100}
              className={
                c.featured
                  ? "glass-card-elevated glass-shine rounded-2xl p-7 ring-1 ring-blue/30 bg-gradient-to-br from-blue/[0.08] to-transparent"
                  : "glass-card glass-shine rounded-2xl p-7"
              }
            >
              <span className="text-3xl block mb-4" aria-hidden="true">{c.emoji}</span>
              <span
                className={
                  c.featured
                    ? "block text-4xl sm:text-5xl font-bold tracking-tight text-blue leading-none"
                    : "block text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-none"
                }
              >
                {c.value}
              </span>
              <span className="mt-3 block text-sm font-semibold text-foreground">
                {c.label}
              </span>
              <span className="mt-1 block text-xs text-muted leading-relaxed">
                {c.caption}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
