"use client";

import { useState } from "react";
import { InternFace } from "@/components/landing/intern-face";
import { internFor, type Testimonial } from "@/lib/testimonials";

const LONG = 320;

export function StoryCard({ story, index }: { story: Testimonial; index: number }) {
  const long = story.quote.join(" ").length > LONG;
  const [open, setOpen] = useState(false);

  return (
    <figure className="mb-5 break-inside-avoid rounded-3xl border border-border bg-surface/70 p-6 backdrop-blur">
      <blockquote className={long && !open ? "line-clamp-6" : ""}>
        {story.quote.map((p, i) => (
          <p key={i} className="mt-3 first:mt-0 leading-relaxed text-foreground/90">
            {p}
          </p>
        ))}
      </blockquote>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="mt-3 cursor-pointer text-sm font-medium text-lime hover:underline"
        >
          {open ? "Show less" : "Read more"}
        </button>
      )}
      <figcaption className="mt-5 flex items-center gap-3">
        <InternFace intern={internFor(story.name)} index={index} sizes="44px" className="h-11 w-11 shrink-0 rounded-full" />
        <span className="min-w-0">
          <span className="block truncate font-semibold">{story.name}</span>
          {story.role && <span className="block truncate text-sm text-muted">{story.role}</span>}
        </span>
      </figcaption>
    </figure>
  );
}
