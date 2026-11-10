import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Play } from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { CTA } from "@/components/landing/cta";
import { SiteBackground } from "@/components/landing/site-background";
import { InternFace } from "@/components/landing/intern-face";
import { highlights, spotlightFor } from "../spotlight-data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const spot = await spotlightFor((await params).slug);
  if (!spot) return {};
  return {
    title: `${spot.intern.name} · Intern spotlight`,
    description: spot.project
      ? `${spot.intern.name}, UBI Cohort 1 ${spot.project.track} finalist, built ${spot.project.title}.`
      : `${spot.intern.name}, UBI Cohort 1 intern, in their own words.`,
    alternates: { canonical: `/interns/${spot.intern.slug}` },
  };
}

export default async function InternSpotlightRoute({ params }: Props) {
  const spot = await spotlightFor((await params).slug);
  if (!spot) notFound();
  const { intern, project, story } = spot;
  const points = project ? highlights(project.summary) : [];
  const role = project ? `${project.track} · Cohort 1 finalist` : story?.role || "Cohort 1 intern";

  return (
    <div className="landing-page site min-h-screen bg-background text-foreground">
      <SiteBackground />
      <Navbar />
      <main className="max-w-[72rem] mx-auto px-5 pt-28 pb-16 sm:px-8 lg:pt-32">
        <Link
          href="/interns/board"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Intern board
        </Link>

        <section className="mt-8 grid items-center gap-8 md:grid-cols-[18rem_1fr] md:gap-12">
          <InternFace intern={intern} sizes="288px" className="aspect-[4/5] w-full max-w-[18rem] rounded-[2rem]" />
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm text-foreground-muted">
              <span className="h-2 w-2 rounded-full bg-signal" aria-hidden="true" />
              {role}
            </p>
            <h1 className="mt-5 text-[clamp(2.4rem,5vw,4.25rem)] font-semibold leading-[1] tracking-[-0.045em]">
              {intern.name}
            </h1>
            {project && (
              <p className="mt-4 text-xl text-foreground-muted">
                Built <span className="serif text-sky">{project.title}</span>
              </p>
            )}
          </div>
        </section>

        {project && (
          <>
            {points.length > 0 && (
              <section aria-labelledby="highlights" className="mt-16">
                <h2 id="highlights" className="text-2xl font-semibold tracking-[-0.03em]">
                  Technical highlights
                </h2>
                <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                  {points.map((p) => (
                    <li key={p} className="rounded-2xl border border-border bg-surface/70 p-5 leading-relaxed">
                      {p}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted">In the finalist&apos;s own words, from their project submission.</p>
              </section>
            )}

            <section aria-labelledby="project" className="mt-16 rounded-3xl border border-border bg-surface/70 p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lime">{project.track} project</p>
              <h2 id="project" className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                {project.title}
              </h2>
              <p className="mt-4 max-w-3xl whitespace-pre-line leading-relaxed text-foreground/85">{project.summary}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {project.projectUrl && (
                  <a
                    href={project.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center gap-1.5 rounded-full bg-foreground px-5 text-sm font-semibold text-background transition-colors hover:bg-signal hover:text-ink"
                  >
                    View the code <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                )}
                {project.videoOpenUrl && (
                  <a
                    href={project.videoOpenUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center gap-1.5 rounded-full border border-border px-5 text-sm font-semibold transition-colors hover:border-foreground"
                  >
                    <Play className="h-4 w-4" aria-hidden="true" /> Watch the demo
                  </a>
                )}
              </div>
            </section>
          </>
        )}

        {story && (
          <section aria-labelledby="words" className="mt-16">
            <h2 id="words" className="text-[clamp(2rem,3.6vw,3rem)] font-semibold tracking-[-0.045em]">
              In their <span className="serif font-normal text-sky">words.</span>
            </h2>
            <blockquote className="mt-6 max-w-3xl space-y-4 border-l-2 border-signal pl-6 text-lg leading-relaxed text-foreground/90">
              {story.quote.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </blockquote>
          </section>
        )}
      </main>
      <CTA />
      <Footer />
    </div>
  );
}
