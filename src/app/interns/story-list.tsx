"use client";

import { useState } from "react";
import type { Testimonial } from "@/lib/testimonials";
import { StoryCard } from "./story-card";

const FIRST = 9;

export function StoryList({ stories }: { stories: Testimonial[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? stories : stories.slice(0, FIRST);

  return (
    <>
      <div className="mt-10 columns-1 gap-5 md:columns-2 lg:columns-3">
        {shown.map((t, i) => (
          <StoryCard key={t.name + i} story={t} index={i} />
        ))}
      </div>
      {stories.length > FIRST && (
        <button
          type="button"
          onClick={() => setAll((a) => !a)}
          className="mt-4 inline-flex h-12 cursor-pointer items-center rounded-full border border-border px-6 text-[15px] font-semibold transition-colors hover:border-foreground"
        >
          {all ? "Show fewer stories" : `Show all ${stories.length} stories`}
        </button>
      )}
    </>
  );
}
