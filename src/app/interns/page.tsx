import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { CTA } from "@/components/landing/cta";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { SiteBackground } from "@/components/landing/site-background";
import { InternFace } from "@/components/landing/intern-face";
import { interns, internsPhotoFirst } from "@/lib/interns";
import { testimonials } from "@/lib/testimonials";
import { StoryList } from "./story-list";
import { InternWall } from "@/components/landing/intern-wall";
import { ProjectsSection } from "./projects-section";

export const metadata: Metadata = {
  title: "Meet the interns",
  description: "The people of Ubuntu Bridge Initiative Cohort 1, and their stories in their own words.",
  alternates: { canonical: "/interns" },
};

// Hero mosaic: faces in mixed shapes around two coloured number tiles.
const mosaic = [
  "row-span-2 rounded-t-[8rem] rounded-b-3xl",
  "rounded-3xl",
  "rounded-full",
  "rounded-3xl",
  "row-span-2 rounded-b-[8rem] rounded-t-3xl",
  "rounded-3xl",
];

export default function InternsRoute() {
  const faces = internsPhotoFirst.slice(0, mosaic.length);

  return (
    <div className="landing-page site min-h-screen bg-background text-foreground">
      <SiteBackground />
      <ScrollReveal />
      <Navbar />
      <main>
        <section aria-labelledby="interns-hero" className="max-w-[80rem] mx-auto grid items-center gap-10 px-5 pt-28 pb-12 sm:px-8 lg:grid-cols-2 lg:pt-32">
          <div>
            <p className="rise inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm text-foreground-muted">
              <span className="h-2 w-2 rounded-full bg-signal" aria-hidden="true" />
              Cohort 1
            </p>
            <h1
              id="interns-hero"
              className="mt-6 text-[clamp(2.8rem,6vw,5.5rem)] font-semibold leading-[0.98] tracking-[-0.045em]"
            >
              <span className="line-mask"><span>Meet the</span></span>
              <span className="line-mask">
                <span style={{ animationDelay: ".08s" }}>
                  <span className="serif font-normal text-sky">interns.</span>
                </span>
              </span>
            </h1>
            <p className="rise rise-2 mt-6 max-w-sm text-lg text-foreground-muted">
              Real people. Real work. Their stories, in their own words.
            </p>
            <div className="rise rise-3 mt-8 flex flex-wrap gap-3">
              <a
                href="#stories"
                className="inline-flex h-14 items-center rounded-full bg-foreground px-8 text-[15px] font-semibold text-background transition-colors hover:bg-signal hover:text-ink"
              >
                Read their stories
              </a>
              <a
                href="#projects"
                className="inline-flex h-14 items-center rounded-full border border-border px-8 text-[15px] font-semibold transition-colors hover:border-foreground"
              >
                See what they built
              </a>
            </div>
          </div>

          <div className="grid grid-cols-3 grid-rows-[repeat(3,7.5rem)] gap-3 sm:grid-rows-[repeat(3,9rem)]">
            <InternFace intern={faces[0]} index={0} sizes="200px" className={`pop ${mosaic[0]}`} />
            <div className="pop pop-2 flex flex-col items-center justify-center rounded-3xl bg-signal text-ink">
              <span className="text-4xl font-semibold tracking-tight sm:text-5xl">{interns.length}</span>
              <span className="text-sm">interns</span>
            </div>
            <InternFace intern={faces[1]} index={1} sizes="200px" className={`pop pop-3 ${mosaic[1]}`} />
            <InternFace intern={faces[2]} index={2} sizes="200px" className={`pop pop-2 ${mosaic[2]}`} />
            <InternFace intern={faces[4]} index={3} sizes="200px" className={`pop pop-3 ${mosaic[4]}`} />
            <InternFace intern={faces[3]} index={4} sizes="200px" className={`pop pop-2 ${mosaic[3]}`} />
            <div className="pop pop-3 flex flex-col items-center justify-center rounded-3xl bg-blue text-white">
              <span className="text-4xl font-semibold tracking-tight sm:text-5xl">{testimonials.length}</span>
              <span className="text-sm text-white/80">stories</span>
            </div>
          </div>
        </section>

        <ProjectsSection />

        <section id="stories" aria-labelledby="stories-heading" className="scroll-mt-24 max-w-[80rem] mx-auto px-5 py-16 sm:px-8">
          <h2
            id="stories-heading"
            data-reveal
            className="text-[clamp(2.25rem,4.2vw,3.75rem)] font-semibold tracking-[-0.045em]"
          >
            In their <span className="serif font-normal text-sky">words.</span>
          </h2>
          <StoryList stories={testimonials} />
        </section>

        <InternWall
          link={{ href: "/interns/board", label: "Open the intern board" }}
          heading={
            <>
              All {interns.length}, <span className="serif font-normal text-sky">one cohort.</span>
            </>
          }
        />

        <CTA />
      </main>
      <Footer />
    </div>
  );
}
