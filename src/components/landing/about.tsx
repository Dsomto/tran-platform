import Image from "next/image";

const steps = [
  {
    title: "Do real work",
    desc: "Investigate attacks. Write reports.",
    image: "/images/tracks/soc-analyst.jpg",
  },
  {
    title: "Get expert feedback",
    desc: "Real security pros check your work.",
    image: "/images/programs/mentorship.jpg",
  },
  {
    title: "Earn free certs",
    desc: "Reach Stage 5 and we pay for your exam.",
    image: "/images/programs/tech-spotlight.jpg",
  },
];

export function About() {
  return (
    <section id="program" aria-labelledby="program-heading" className="scroll-mt-20 py-16 sm:py-20">
      <div className="max-w-[80rem] mx-auto px-5 sm:px-8">
        <h2
          id="program-heading"
          data-reveal
          className="text-[clamp(2.25rem,4.2vw,3.75rem)] font-semibold leading-[1] tracking-[-0.045em]"
        >
          Not a course. <span className="serif font-normal text-sky">A real internship.</span>
        </h2>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((step, i) => (
            <article
              key={step.title}
              data-reveal
              style={{ "--d": i } as React.CSSProperties}
              className="group flex flex-col rounded-3xl border border-border bg-surface/70 p-4 backdrop-blur transition-transform duration-500 hover:-translate-y-1"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image
                  src={step.image}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 30vw, 90vw"
                  className="object-cover transition duration-700 group-hover:scale-110"
                />
              </div>
              <div className="px-2 pb-2 pt-5">
                <span className="text-sm font-semibold text-lime">0{i + 1}</span>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-1 text-muted">{step.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
