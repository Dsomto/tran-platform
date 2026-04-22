"use client";

const general = [
  { num: 0, title: "Onboarding", desc: "Set up your environment, meet your cohort, complete your first security challenge." },
  { num: 1, title: "Security Mindset", desc: "Think like a defender and an attacker. Risk thinking, threat modeling, attack surfaces." },
  { num: 2, title: "Core Infrastructure", desc: "Networks, systems, cloud — understand the environments you'll be protecting or testing." },
  { num: 3, title: "Offensive & Defensive Basics", desc: "Vulnerability scanning, log analysis, basic exploitation. See both sides of the coin." },
  { num: 4, title: "Real-World Simulation", desc: "A cross-domain scenario that tests everything. Defend, attack, document, report." },
];

const specialized = [
  { num: 5, title: "Choose Your Track", desc: "SOC, Ethical Hacking, or GRC — pick the domain that matches your career goals." },
  { num: 6, title: "Domain Deep-Dive", desc: "Hands-on labs with industry-standard tools specific to your chosen track." },
  { num: 7, title: "Advanced Operations", desc: "Complex scenarios that push your expertise — no hand-holding, just execution." },
  { num: 8, title: "Team Engagement", desc: "Work cross-functionally. Build, break, or audit real systems with your team." },
  { num: 9, title: "Capstone", desc: "Final project judged by industry professionals. Prove you're ready." },
];

function StageItem({ s, i, variant }: { s: typeof general[0]; i: number; variant: "blue" | "dark" }) {
  const isBlue = variant === "blue";
  return (
    <li
      data-aos="fade-up"
      data-aos-delay={i * 80}
      className="flex gap-5 group"
    >
      <div className="relative flex flex-col items-center shrink-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${
          isBlue
            ? "bg-blue/[0.07] text-blue group-hover:bg-blue group-hover:text-white"
            : "bg-amber/[0.07] text-amber group-hover:bg-amber group-hover:text-white"
        }`}>
          {s.num}
        </div>
        <div className={`w-px flex-1 mt-2 ${isBlue ? "bg-blue/10" : "bg-amber/10"}`} />
      </div>
      <div className="pb-8 pt-1">
        <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
        <p className="text-sm text-muted mt-1 leading-relaxed">{s.desc}</p>
      </div>
    </li>
  );
}

export function Stages() {
  return (
    <section
      id="stages"
      aria-labelledby="stages-heading"
      className="relative py-28 sm:py-36 bg-background bg-scan overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="crosshair top-[10%] left-[12%] hidden lg:block" aria-hidden="true" />
      <div className="crosshair bottom-[15%] right-[10%] hidden lg:block" aria-hidden="true" />
      <div className="orb orb-blue w-[300px] h-[300px] top-[0%] left-[50%] hidden lg:block" aria-hidden="true" />
      <div className="orb orb-amber w-[250px] h-[250px] bottom-[5%] right-[0%] hidden lg:block" style={{ animationDelay: "-7s" }} aria-hidden="true" />
      <div className="absolute top-[15%] right-[8%] w-12 h-12 border border-amber/10 rounded-xl rotate-45 float-delayed hidden lg:block" aria-hidden="true" />
      <div className="absolute bottom-[20%] left-[6%] w-3 h-3 bg-blue/15 rounded-full pulse-glow hidden lg:block" aria-hidden="true" />
      <div className="ring-dashed w-[100px] h-[100px] top-[50%] left-[48%] ring-spin hidden lg:block" aria-hidden="true" />
      <div className="hex-grid" aria-hidden="true" />

      <div className="relative z-[1] max-w-6xl mx-auto px-5 sm:px-8">
        <div className="max-w-2xl" data-aos="fade-up">
          <p className="text-xs font-medium text-blue uppercase tracking-[0.15em] mb-3">
            The journey
          </p>
          <h2 id="stages-heading" className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            10 stages. Two phases.
          </h2>
          <p className="mt-4 text-base text-muted leading-relaxed">
            Stages 0–4 build your security foundation across all domains. At Stage 5, you
            choose a specialization and go deep.
          </p>
        </div>

        <div className="mt-16 grid lg:grid-cols-2 gap-12 lg:gap-16">
          <div>
            <div className="flex items-center gap-3 mb-8" data-aos="fade-up">
              <span className="text-xs font-semibold text-white bg-blue px-3.5 py-1.5 rounded-full">Phase 1</span>
              <span className="text-sm font-medium text-foreground">General Foundation</span>
            </div>
            <ol className="relative" role="list" aria-label="General stages">
              {general.map((s, i) => <StageItem key={s.num} s={s} i={i} variant="blue" />)}
            </ol>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-8" data-aos="fade-up" data-aos-delay="100">
              <span className="text-xs font-semibold text-white bg-amber px-3.5 py-1.5 rounded-full">Phase 2</span>
              <span className="text-sm font-medium text-foreground">Specialization</span>
            </div>
            <ol className="relative" role="list" aria-label="Specialized stages">
              {specialized.map((s, i) => <StageItem key={s.num} s={s} i={i} variant="dark" />)}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
