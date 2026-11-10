import { SHOWCASE_PATH } from "@/lib/showcase-public";
import { ProjectCard } from "./project-card";
import { loadProjects } from "./spotlight-data";

export async function ProjectsSection() {
  const { projects, votingOpen } = await loadProjects();
  if (projects.length === 0) return null;
  const tracks = [...new Set(projects.map((p) => p.track))];

  return (
    <section id="projects" aria-labelledby="projects-heading" className="scroll-mt-24 max-w-[80rem] mx-auto px-5 py-16 sm:px-8">
      <div data-reveal className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h2 id="projects-heading" className="text-[clamp(2.25rem,4.2vw,3.75rem)] font-semibold tracking-[-0.045em]">
            What they <span className="serif font-normal text-sky">built.</span>
          </h2>
          <p className="mt-4 max-w-xl text-lg text-foreground-muted">
            After nine stages of hands-on labs, our {projects.length} finalists each shipped a real security project:
            tools, frameworks and engines you can open, run and read.
          </p>
        </div>
        {votingOpen && (
          <a
            href={SHOWCASE_PATH}
            className="inline-flex h-12 items-center rounded-full bg-foreground px-6 text-[15px] font-semibold text-background transition-colors hover:bg-signal hover:text-ink"
          >
            Watch the showcase &amp; vote
          </a>
        )}
      </div>

      {tracks.map((track) => (
        <div key={track} className="mt-12">
          <h3 data-reveal className="text-2xl font-semibold tracking-[-0.03em]">
            {track}
          </h3>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {projects
              .filter((p) => p.track === track)
              .map((p) => (
                <ProjectCard key={p.slug} project={p} index={projects.indexOf(p)} />
              ))}
          </div>
        </div>
      ))}
    </section>
  );
}
