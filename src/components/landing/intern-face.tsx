import Image from "next/image";
import { initials, type Intern } from "@/lib/interns";

// Until someone's headshot is imported they get a coloured initials tile.
const tones = ["bg-signal/30 text-foreground", "bg-blue/15 text-foreground", "bg-surface text-lime", "bg-sky/15 text-sky"];

export function InternFace({
  intern,
  className = "",
  sizes = "160px",
  index = 0,
}: {
  intern: Intern;
  className?: string;
  sizes?: string;
  index?: number;
}) {
  return (
    <div className={`relative overflow-hidden bg-surface ${className}`} style={{ containerType: "size" }}>
      {intern.photo ? (
        <Image src={intern.photo} alt={intern.name} fill sizes={sizes} className="object-cover" />
      ) : (
        <div
          role="img"
          aria-label={intern.name}
          className={`grid h-full w-full place-items-center font-semibold tracking-tight ${tones[index % tones.length]}`}
          style={{ fontSize: "clamp(0.7rem, 26cqw, 2.25rem)" }}
        >
          {initials(intern.name)}
        </div>
      )}
    </div>
  );
}
