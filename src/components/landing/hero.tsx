import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { LandingStats } from "@/lib/landing-stats";
import { CountUp } from "./count-up";

const words = ["Learn by doing", "Expert feedback", "Free certification", "Fully online", "Real portfolio"];

export function Hero({ stats }: { stats: LandingStats }) {
  return (
    <section aria-labelledby="hero-heading" className="overflow-hidden">
      <div className="max-w-[80rem] mx-auto grid items-center gap-10 px-5 pt-28 pb-12 sm:px-8 lg:grid-cols-2 lg:pt-32">
        <div>
          <p className="rise inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm text-foreground-muted">
            <span className="h-2 w-2 rounded-full bg-signal" aria-hidden="true" />
            Cohort 2026 · Applications open
          </p>
          <h1
            id="hero-heading"
            className="mt-6 text-[clamp(2.8rem,6vw,5.75rem)] font-semibold leading-[0.98] tracking-[-0.045em]"
          >
            <span className="line-mask"><span>Learn</span></span>
            <span className="line-mask">
              <span style={{ animationDelay: ".08s" }}>
                <span className="rounded-2xl bg-signal px-3 text-ink">cyber</span>security
              </span>
            </span>
            <span className="line-mask">
              <span style={{ animationDelay: ".16s" }}>
                for <span className="serif font-normal text-sky">free.</span>
              </span>
            </span>
          </h1>
          <p className="rise rise-2 mt-6 max-w-sm text-lg text-foreground-muted">
            A free online internship. Learn by doing.
          </p>
          <div className="rise rise-3 mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/apply"
              className="group inline-flex h-14 items-center gap-2 rounded-full bg-foreground px-8 text-[15px] font-semibold text-background transition-colors hover:bg-signal hover:text-ink"
            >
              Apply now
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" aria-hidden="true" />
            </Link>
            <a
              href="#program"
              className="inline-flex h-14 items-center rounded-full border border-border px-7 text-[15px] text-foreground transition-colors hover:bg-surface"
            >
              How it works
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 grid-rows-[repeat(3,8rem)] gap-3 sm:grid-rows-[repeat(3,9.5rem)]">
          <div className="pop group row-span-2 relative overflow-hidden rounded-t-[10rem] rounded-b-3xl">
            <Image
              src="/images/hero-1.jpg"
              alt="UBI interns collaborating with laptops"
              fill
              priority
              sizes="(min-width: 1024px) 320px, 50vw"
              className="object-cover transition duration-700 group-hover:scale-105"
            />
          </div>
          <div className="pop pop-2 flex flex-col items-center justify-center rounded-3xl bg-signal text-ink">
            <span className="text-4xl font-semibold tracking-tight sm:text-5xl">Free</span>
            <span className="text-sm">always</span>
          </div>
          <div className="pop pop-3 group relative overflow-hidden rounded-3xl">
            <Image
              src="/images/programs/mentorship.jpg"
              alt="Cybersecurity mentorship session"
              fill
              sizes="240px"
              className="object-cover transition duration-700 group-hover:scale-105"
            />
          </div>
          <div className="pop pop-2 flex flex-col items-center justify-center rounded-3xl bg-blue text-white">
            <span className="text-4xl font-semibold tracking-tight sm:text-5xl">
              <CountUp value={stats.applicants} />
            </span>
            <span className="text-sm text-white/80">applied</span>
          </div>
          <div className="pop pop-3 group relative overflow-hidden rounded-3xl">
            <Image
              src="/images/stock/server-room-analyst.jpg"
              alt="Analyst checking systems in a server room"
              fill
              sizes="240px"
              className="object-cover transition duration-700 group-hover:scale-105"
            />
          </div>
        </div>
      </div>

      <div className="border-y border-border/70 py-4 overflow-hidden" aria-hidden="true">
        <div className="film flex w-max gap-8 whitespace-nowrap text-lg font-medium text-muted" style={{ animationDuration: "40s" }}>
          {[0, 1].flatMap((k) =>
            [...words, ...words, ...words].map((w, i) => (
              <span key={`${k}-${i}`} className="inline-flex items-center gap-8">
                {w} <span className="h-1.5 w-1.5 rounded-full bg-signal" />
              </span>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
