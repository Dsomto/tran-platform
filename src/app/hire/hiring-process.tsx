"use client";

import { ArrowRight } from "lucide-react";

export function HiringProcess() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="relative py-28 sm:py-36 bg-background bg-scan overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="crosshair top-[15%] right-[10%] hidden lg:block" aria-hidden="true" />
      <div className="crosshair bottom-[18%] left-[12%] hidden lg:block" aria-hidden="true" />
      <div className="orb orb-blue w-[300px] h-[300px] top-[10%] left-[0%] hidden lg:block" aria-hidden="true" />
      <div className="orb orb-violet w-[200px] h-[200px] bottom-[5%] right-[5%] hidden lg:block" style={{ animationDelay: "-4s" }} aria-hidden="true" />
      <div className="absolute top-[25%] left-[8%] w-12 h-12 border border-blue/8 rounded-full float-medium hidden lg:block" aria-hidden="true" />
      <div className="absolute bottom-[30%] right-[10%] w-16 h-16 border border-violet/6 rounded-2xl -rotate-12 float-slow hidden lg:block" aria-hidden="true" />
      <div className="absolute top-[50%] right-[5%] w-2.5 h-2.5 bg-violet/15 rounded-full pulse-glow hidden lg:block" aria-hidden="true" />
      <div className="ring-dashed w-[110px] h-[110px] bottom-[20%] left-[15%] ring-spin hidden lg:block" aria-hidden="true" />
      <div className="hex-grid" aria-hidden="true" />

      <div className="relative z-[1] max-w-6xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left — copy + how it works */}
          <div>
            <div data-aos="fade-up">
              <p className="text-xs font-medium text-violet uppercase tracking-[0.15em] mb-3">
                Get started
              </p>
              <h2 id="contact-heading" className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Looking for top security talent? Start here
              </h2>
              <p className="mt-4 text-base text-muted leading-relaxed">
                Fill in the form and our team will reach out within 24 hours
                with matched candidates from our verified talent pool.
              </p>
            </div>

            {/* Steps */}
            <div className="mt-12 space-y-6" data-aos="fade-up" data-aos-delay="100">
              {[
                {
                  num: "1",
                  emoji: "📝",
                  title: "Tell us what you need",
                  desc: "Fill the form with your requirements — roles, team size, and timeline.",
                },
                {
                  num: "2",
                  emoji: "🤝",
                  title: "We match candidates",
                  desc: "Our team reviews the pool and shortlists candidates that fit your criteria.",
                },
                {
                  num: "3",
                  emoji: "🚀",
                  title: "Interview and hire",
                  desc: "Meet your candidates, review their project work, and make your offer directly.",
                },
              ].map((step, i) => (
                <div key={step.num} className="flex gap-4" data-aos="fade-up" data-aos-delay={150 + i * 80}>
                  <div className="flex flex-col items-center">
                    <span className="text-2xl" aria-hidden="true">{step.emoji}</span>
                    {i < 2 && <div className="w-px h-full bg-border/50 mt-2" aria-hidden="true" />}
                  </div>
                  <div className="pb-2">
                    <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                    <p className="text-sm text-muted leading-relaxed mt-1">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — contact form */}
          <div data-aos="fade-left" data-aos-delay="200">
            <form
              className="glass-card rounded-2xl p-7 sm:p-8 space-y-5"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first-name" className="block text-[12px] font-medium text-foreground mb-1.5">
                    First name
                  </label>
                  <input
                    id="first-name"
                    type="text"
                    placeholder="Jane"
                    className="w-full text-sm px-4 py-2.5 rounded-lg border border-border/60 bg-white text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue/40 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="last-name" className="block text-[12px] font-medium text-foreground mb-1.5">
                    Last name
                  </label>
                  <input
                    id="last-name"
                    type="text"
                    placeholder="Doe"
                    className="w-full text-sm px-4 py-2.5 rounded-lg border border-border/60 bg-white text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue/40 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="company-email" className="block text-[12px] font-medium text-foreground mb-1.5">
                  Company email
                </label>
                <input
                  id="company-email"
                  type="email"
                  placeholder="jane@company.com"
                  className="w-full text-sm px-4 py-2.5 rounded-lg border border-border/60 bg-white text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue/40 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="company-size" className="block text-[12px] font-medium text-foreground mb-1.5">
                  Company size
                </label>
                <select
                  id="company-size"
                  className="w-full text-sm px-4 py-2.5 rounded-lg border border-border/60 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue/40 transition-colors appearance-none"
                  defaultValue=""
                >
                  <option value="" disabled>Select company size</option>
                  <option value="1-10">1–10 employees</option>
                  <option value="11-50">11–50 employees</option>
                  <option value="51-200">51–200 employees</option>
                  <option value="201-500">201–500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
              </div>

              <div>
                <label htmlFor="roles-needed" className="block text-[12px] font-medium text-foreground mb-1.5">
                  What roles are you hiring for?
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    { label: "🛡️ SOC Analyst", value: "soc" },
                    { label: "🎯 Pentester", value: "pentester" },
                    { label: "📋 GRC Analyst", value: "grc" },
                  ].map((role) => (
                    <label key={role.value} className="cursor-pointer">
                      <input type="checkbox" className="peer sr-only" name="roles" value={role.value} />
                      <span className="inline-flex items-center text-[11px] font-medium px-3 py-1.5 rounded-full border border-border/60 text-muted peer-checked:bg-blue peer-checked:text-white peer-checked:border-transparent transition-all hover:bg-surface-hover">
                        {role.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-[12px] font-medium text-foreground mb-1.5">
                  Anything else? <span className="text-muted font-normal">(optional)</span>
                </label>
                <textarea
                  id="message"
                  rows={3}
                  placeholder="Timeline, skill preferences, team context..."
                  className="w-full text-sm px-4 py-2.5 rounded-lg border border-border/60 bg-white text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue/40 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="group w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-blue px-7 py-3.5 rounded-full hover:bg-blue-dark transition-all hover:shadow-lg hover:shadow-blue/20 cursor-pointer"
              >
                Submit request
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </button>

              <p className="text-[11px] text-muted text-center">
                We&apos;ll respond within 24 hours. No spam, no sales calls.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
