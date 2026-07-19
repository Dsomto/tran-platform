import {
  ChevronDown,
  CircleHelp,
  PackageCheck,
  TerminalSquare,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  advancedProjectFaq,
  type AdvancedFaqCategory,
} from "@/lib/advanced-faq";
import type { AdvancedProject, AdvancedTrack } from "@/lib/advanced-stage";

type Props = {
  project: AdvancedProject;
  track: AdvancedTrack;
  trackLabel: string;
};

const CATEGORIES: Array<{
  label: AdvancedFaqCategory;
  icon: LucideIcon;
  description: string;
}> = [
  {
    label: "Setup & access",
    icon: TerminalSquare,
    description: "Environment, artifacts, scope, and safe starting conditions.",
  },
  {
    label: "Build & prove",
    icon: Wrench,
    description: "Technical decisions, failure diagnosis, tests, and evidence.",
  },
  {
    label: "Package & submit",
    icon: PackageCheck,
    description:
      "Folder contract, integrity checks, permissions, and deadline.",
  },
];

export function AdvancedProjectFaq({ project, track, trackLabel }: Props) {
  const faq = advancedProjectFaq(track, project);

  return (
    <section
      className="advanced-faq"
      id="project-faq"
      aria-labelledby="project-faq-title"
    >
      <header className="advanced-faq__header">
        <div className="advanced-faq__icon">
          <CircleHelp aria-hidden="true" />
        </div>
        <div>
          <div className="advanced-eyebrow">
            {trackLabel} · Stage {project.number + 4}
          </div>
          <h2 id="project-faq-title">Project FAQ</h2>
          <p>{faq.intro}</p>
        </div>
      </header>

      <div className="advanced-faq__groups">
        {CATEGORIES.map(({ label, icon: Icon, description }) => {
          const items = faq.items.filter((item) => item.category === label);
          const categoryId = `faq-${project.slug}-${label.toLowerCase().replaceAll("&", "and").replaceAll(" ", "-")}`;

          return (
            <section
              className="advanced-faq__group"
              key={label}
              aria-labelledby={categoryId}
            >
              <header>
                <Icon aria-hidden="true" />
                <div>
                  <h3 id={categoryId}>{label}</h3>
                  <p>{description}</p>
                </div>
                <span>{items.length}</span>
              </header>

              <div className="advanced-faq__questions">
                {items.map((item, index) => (
                  <details key={item.question}>
                    <summary>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{item.question}</strong>
                      <ChevronDown aria-hidden="true" />
                    </summary>
                    <div className="advanced-faq__answer">
                      <p>{item.answer}</p>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
