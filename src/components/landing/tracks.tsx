import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const tracks = [
  {
    verb: "Defend",
    name: "SOC Analysis",
    slug: "soc",
    line: "Spot attacks and stop them.",
    image: "/images/tracks/soc-analyst.jpg",
    dot: "bg-blue",
  },
  {
    verb: "Attack",
    name: "Ethical Hacking",
    slug: "ethical-hacking",
    line: "Hack legally to find weak spots.",
    image: "/images/tracks/ethical-hacking.jpg",
    dot: "bg-signal",
  },
  {
    verb: "Govern",
    name: "GRC",
    slug: "grc",
    line: "Help companies manage risk.",
    image: "/images/tracks/grc.png",
    dot: "bg-foreground",
  },
];

export function Tracks() {
  return (
    <section id="tracks" aria-labelledby="tracks-heading" className="scroll-mt-20 py-16 sm:py-20">
      <div className="max-w-[80rem] mx-auto px-5 sm:px-8">
        <h2
          id="tracks-heading"
          data-reveal
          className="text-[clamp(2.25rem,4.2vw,3.75rem)] font-semibold leading-[1] tracking-[-0.045em]"
        >
          Pick your <span className="serif font-normal text-sky">track.</span>
        </h2>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {tracks.map((track, i) => (
            <Link
              key={track.slug}
              href={`/tracks/${track.slug}`}
              data-reveal
              style={{ "--d": i } as React.CSSProperties}
              className="group block overflow-hidden rounded-3xl border border-border bg-surface/70 backdrop-blur transition-transform duration-500 hover:-translate-y-1"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={track.image}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 30vw, 90vw"
                  className="object-cover transition duration-700 group-hover:scale-110"
                />
              </div>
              <div className="flex items-end justify-between gap-4 p-6">
                <div>
                  <p className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
                    <span className={`h-2.5 w-2.5 rounded-full ${track.dot}`} aria-hidden="true" />
                    {track.verb}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {track.name} · {track.line}
                  </p>
                </div>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-border transition-transform duration-500 group-hover:rotate-45">
                  <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
