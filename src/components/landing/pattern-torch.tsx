"use client";

import { useEffect, useRef } from "react";

// Lights up the kente pattern under the mouse. The light trails the pointer
// slightly, and widens briefly on click. Mouse/trackpad only; touch screens
// never see it.
export function PatternTorch() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = { x: -999, y: -999 };
    const pos = { x: -999, y: -999 };
    let radius = 190;
    let raf = 0;

    const frame = () => {
      raf = 0;
      const k = instant ? 1 : 0.16;
      pos.x += (target.x - pos.x) * k;
      pos.y += (target.y - pos.y) * k;
      radius += (190 - radius) * (instant ? 1 : 0.08);
      el.style.setProperty("--mx", `${pos.x.toFixed(1)}px`);
      el.style.setProperty("--my", `${pos.y.toFixed(1)}px`);
      el.style.setProperty("--tr", `${radius.toFixed(1)}px`);
      if (Math.abs(target.x - pos.x) > 0.5 || Math.abs(target.y - pos.y) > 0.5 || Math.abs(radius - 190) > 0.5) {
        raf = requestAnimationFrame(frame);
      }
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (pos.x === -999) {
        pos.x = e.clientX;
        pos.y = e.clientY;
      }
      target.x = e.clientX;
      target.y = e.clientY;
      el.classList.add("is-on");
      kick();
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || instant) return;
      radius = 320;
      kick();
    };
    const onLeave = () => el.classList.remove("is-on");

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return <div ref={ref} className="site-torch" aria-hidden="true" />;
}
