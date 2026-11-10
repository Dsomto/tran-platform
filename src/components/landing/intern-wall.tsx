import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { interns, internsPhotoFirst } from "@/lib/interns";
import { InternFace } from "./intern-face";

// Two rows of faces drifting in opposite directions.
const rows = [internsPhotoFirst.filter((_, i) => i % 2 === 0), internsPhotoFirst.filter((_, i) => i % 2 === 1)];

export function InternWall({
  heading = (
    <>
      Meet the <span className="serif font-normal text-sky">interns.</span>
    </>
  ),
  link = { href: "/interns", label: `See all ${interns.length}` },
}: { heading?: ReactNode; link?: { href: string; label: string } }) {
  return (
    <section aria-labelledby="interns-heading" className="overflow-hidden py-16 sm:py-20">
      <div className="max-w-[80rem] mx-auto flex flex-wrap items-end justify-between gap-4 px-5 sm:px-8">
        <h2
          id="interns-heading"
          data-reveal
          className="text-[clamp(2.25rem,4.2vw,3.75rem)] font-semibold tracking-[-0.045em]"
        >
          {heading}
        </h2>
        <Link
          href={link.href}
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          {link.label}
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-10 space-y-4" aria-hidden="true">
        {rows.map((row, r) => (
          <ul
            key={r}
            className="film flex w-max gap-4"
            style={{ animationDuration: "90s", animationDirection: r ? "reverse" : "normal" }}
          >
            {[...row, ...row].map((intern, i) => (
              <li key={i} className="group relative shrink-0">
                <InternFace
                  intern={intern}
                  index={i + r}
                  className={`h-36 w-28 sm:h-44 sm:w-36 ${i % 3 === 0 ? "rounded-t-[5rem] rounded-b-2xl" : "rounded-2xl"}`}
                />
                <span className="pointer-events-none absolute inset-x-2 bottom-2 truncate rounded-full bg-black/55 px-2.5 py-1 text-center text-[11px] font-medium text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                  {intern.name.split(" ").slice(0, 2).join(" ")}
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
