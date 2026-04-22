"use client";

import { useEffect, useState } from "react";

const sections = [
  { id: "hero-heading", label: "Home" },
  { id: "program", label: "Program" },
  { id: "why", label: "Why" },
  { id: "stages", label: "Stages" },
  { id: "tracks", label: "Tracks" },
  { id: "testimonials", label: "Graduates" },
  { id: "faq", label: "FAQ" },
];

export function ScrollIndicator() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      let current = 0;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && window.scrollY >= el.offsetTop - 200) {
          current = i;
          break;
        }
      }
      setActive(current);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="scroll-indicator hidden lg:flex"
      aria-label="Page sections"
    >
      {sections.map((s, i) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={`dot ${i === active ? "active" : ""}`}
          aria-label={s.label}
          title={s.label}
        />
      ))}
    </nav>
  );
}
