import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { SiteBackground } from "@/components/landing/site-background";
import { InternFace } from "@/components/landing/intern-face";
import { interns, internsPhotoFirst } from "@/lib/interns";
import { spotlightSlugs } from "../spotlight-data";

export const metadata: Metadata = {
  title: "Intern board",
  description: "Every Ubuntu Bridge Initiative Cohort 1 intern, on one board.",
  alternates: { canonical: "/interns/board" },
};

// Small alternating tilts so the board reads as pinned photos, not a table.
const tilt = [-2, 1.5, -1, 2, 0.5, -1.5, 1, -0.5];

export default async function InternBoardRoute() {
  const linked = await spotlightSlugs();
  return (
    <div className="landing-page site min-h-screen bg-background text-foreground">
      <SiteBackground />
      <ScrollReveal />
      <Navbar />
      <main className="max-w-[80rem] mx-auto px-5 pt-28 pb-20 sm:px-8 lg:pt-32">
        <Link
          href="/interns"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to interns
        </Link>
        <h1 className="mt-6 text-[clamp(2.6rem,5.5vw,5rem)] font-semibold leading-[0.98] tracking-[-0.045em]">
          The intern <span className="serif font-normal text-sky">board.</span>
        </h1>
        <p className="mt-4 max-w-md text-lg text-foreground-muted">
          All {interns.length} interns of Cohort 1, side by side. Tap anyone marked “View spotlight” to see their work and story.
        </p>

        <ul role="list" className="mt-12 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {internsPhotoFirst.map((intern, i) => (
            <li
              key={intern.slug}
              data-reveal
              style={{ rotate: `${tilt[i % tilt.length]}deg` }}
              className="rounded-2xl bg-surface p-2.5 pb-3 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)] ring-1 ring-border transition-[rotate,translate] duration-300 hover:-translate-y-1 hover:!rotate-0"
            >
              {linked.has(intern.slug) ? (
                <Link href={`/interns/${intern.slug}`} className="group block">
                  <InternFace
                    intern={intern}
                    index={i}
                    sizes="(min-width: 1024px) 180px, (min-width: 640px) 30vw, 45vw"
                    className="aspect-[4/5] rounded-xl"
                  />
                  <p className="mt-2.5 text-center text-[13px] font-semibold leading-tight group-hover:underline">{intern.name}</p>
                  <p className="mt-1 text-center text-[11px] font-medium text-lime">View spotlight</p>
                </Link>
              ) : (
                <>
                  <InternFace
                    intern={intern}
                    index={i}
                    sizes="(min-width: 1024px) 180px, (min-width: 640px) 30vw, 45vw"
                    className="aspect-[4/5] rounded-xl"
                  />
                  <p className="mt-2.5 text-center text-[13px] font-medium leading-tight text-foreground/85">{intern.name}</p>
                </>
              )}
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
