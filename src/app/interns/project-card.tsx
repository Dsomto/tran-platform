"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";
import { InternFace } from "@/components/landing/intern-face";
import type { Intern } from "@/lib/interns";

export type ProjectView = {
  slug: string;
  track: string;
  title: string;
  summary: string;
  projectUrl: string | null;
  videoOpenUrl: string | null;
  intern: Intern;
};

const LONG = 300;

export function ProjectCard({ project, index }: { project: ProjectView; index: number }) {
  const long = project.summary.length > LONG;
  const [open, setOpen] = useState(false);

  return (
    <article data-reveal className="grid overflow-hidden rounded-3xl border border-border bg-surface/70 backdrop-blur sm:grid-cols-[13rem_1fr]">
      <Link href={`/interns/${project.intern.slug}`} aria-label={`${project.intern.name}: spotlight`} className="block">
        <InternFace
          intern={project.intern}
          index={index}
          sizes="(min-width: 640px) 208px, 100vw"
          className="aspect-[4/3] h-full sm:aspect-auto sm:min-h-full"
        />
      </Link>
      <div className="flex flex-col p-6">
        <h4 className="text-xl font-semibold leading-snug tracking-tight">{project.title}</h4>
        <p className="mt-1 text-sm text-muted">
          by{" "}
          <Link href={`/interns/${project.intern.slug}`} className="font-medium text-foreground/80 underline-offset-2 hover:underline">
            {project.intern.name}
          </Link>
        </p>
        <p className={`mt-4 whitespace-pre-line leading-relaxed text-foreground/85 ${long && !open ? "line-clamp-5" : ""}`}>
          {project.summary}
        </p>
        {long && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="mt-2 self-start cursor-pointer text-sm font-medium text-lime hover:underline"
          >
            {open ? "Show less" : "Read more"}
          </button>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-6">
          {project.projectUrl && (
            <a
              href={project.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-semibold text-background transition-colors hover:bg-signal hover:text-ink"
            >
              View the code <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
          <Link
            href={`/interns/${project.intern.slug}`}
            className="inline-flex h-10 items-center px-2 text-sm font-semibold text-lime hover:underline"
          >
            Technical details
          </Link>
          {project.videoOpenUrl && (
            <a
              href={project.videoOpenUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold transition-colors hover:border-foreground"
            >
              <Play className="h-4 w-4" aria-hidden="true" /> Watch the demo
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
