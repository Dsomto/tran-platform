import { unstable_cache } from "next/cache";
import { loadPublicEntries } from "@/lib/showcase-entries";
import { SHOWCASE_TRACKS, TRACK_LABEL } from "@/lib/showcase-public";
import { getShowcaseSettings, votingPhase } from "@/lib/showcase-vote";
import { internFor, testimonials, type Testimonial } from "@/lib/testimonials";
import type { Intern } from "@/lib/interns";
import type { ProjectView } from "./project-card";

// Same consented, published entries as the showcase; votes are never read here.
export const loadProjects = unstable_cache(
  async () => {
    const settings = await getShowcaseSettings();
    if (!settings.published) return { projects: [] as ProjectView[], votingOpen: false };
    const entries = await loadPublicEntries();
    const projects: ProjectView[] = entries
      .sort((a, b) => SHOWCASE_TRACKS.indexOf(a.track) - SHOWCASE_TRACKS.indexOf(b.track) || a.finalistName.localeCompare(b.finalistName))
      .map((e) => ({
        slug: e.slug,
        track: TRACK_LABEL[e.track],
        title: e.projectTitle,
        summary: e.projectSummary,
        projectUrl: e.projectUrl,
        videoOpenUrl: e.videoOpenUrl,
        intern: internFor(e.finalistName),
      }));
    return { projects, votingOpen: votingPhase(settings) === "OPEN" };
  },
  ["public-projects"],
  { revalidate: 600 },
);

export type Spotlight = { intern: Intern; project: ProjectView | null; story: Testimonial | null };

const storyBySlug = new Map(testimonials.map((t) => [internFor(t.name).slug, t]));

/** Slugs that have a spotlight page: a published project or a consented testimonial. */
export async function spotlightSlugs(): Promise<Set<string>> {
  const { projects } = await loadProjects();
  return new Set([...storyBySlug.keys(), ...projects.map((p) => p.intern.slug)]);
}

export async function spotlightFor(slug: string): Promise<Spotlight | null> {
  const { projects } = await loadProjects();
  const project = projects.find((p) => p.intern.slug === slug) ?? null;
  const story = storyBySlug.get(slug) ?? null;
  if (!project && !story) return null;
  return { intern: project?.intern ?? internFor(story!.name), project, story };
}

/** Sentences from the finalist's own summary that state a measurable result. */
export function highlights(summary: string): string[] {
  return summary
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .filter((s) => /\d/.test(s) && s.length > 30 && s.length < 320)
    .slice(0, 4);
}
