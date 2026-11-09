import Image from "next/image";

const photos = [
  { src: "/images/programs/ubuntu-bridge.jpg", alt: "Ubuntu Bridge Initiative — powering interns through the training" },
  { src: "/images/hero-2.jpg", alt: "Young people passionate about tech and change" },
  { src: "/images/programs/school-tour.jpg", alt: "Cybersecurity Educational School Tour in secondary schools" },
  { src: "/images/hero-4.jpg", alt: "Young learners ready to break into cybersecurity" },
  { src: "/images/stock/team-coding.jpg", alt: "A team coding together at laptops" },
  { src: "/images/programs/street-evangelism.png", alt: "Street Cyber Evangelism — meeting people where they are" },
  { src: "/images/programs/tech-spotlight.jpg", alt: "Tech Spotlight Sunday — builders and their stories" },
  { src: "/images/hero-3.jpg", alt: "Young professionals building careers" },
  { src: "/images/programs/workshops.jpg", alt: "Community Cybersafe Workshops — hands-on training" },
];

// Varied widths keep the strip from looking like a uniform carousel.
const shapes = ["h-56 w-72 rounded-3xl", "h-56 w-56 rounded-3xl", "h-56 w-80 rounded-3xl", "h-56 w-64 rounded-3xl"];

export function Gallery() {
  return (
    <section aria-labelledby="gallery-heading" className="py-16 sm:py-20 overflow-hidden">
      <h2
        id="gallery-heading"
        data-reveal
        className="max-w-[80rem] mx-auto px-5 sm:px-8 text-[clamp(2.25rem,4.2vw,3.75rem)] font-semibold tracking-[-0.045em]"
      >
        Life at <span className="serif font-normal text-sky">UBI.</span>
      </h2>
      <ul className="film mt-10 flex w-max items-center gap-5" role="list" style={{ animationDuration: "60s" }}>
        {[...photos, ...photos].map((p, i) => (
          <li
            key={i}
            aria-hidden={i >= photos.length}
            className={`group relative shrink-0 overflow-hidden ${shapes[i % shapes.length]}`}
          >
            <Image
              src={p.src}
              alt={i < photos.length ? p.alt : ""}
              fill
              sizes="320px"
              className="object-cover transition duration-700 group-hover:scale-110"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
