"use client";

import { useEffect, useRef, useState } from "react";
import { useClickStreak, useTypedPhrase, markEggSeen, eggSeen } from "./hooks";

// Reusable drop-in egg widgets so server pages can stay server components and
// just render a tiny client island. All cosmetic.

/** Click the text `clicks` times to briefly reveal `secret`. */
export function EggClickText({
  normal,
  secret,
  clicks = 5,
  className = "",
}: {
  normal: string;
  secret: string;
  clicks?: number;
  className?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const onClick = useClickStreak(clicks, () => {
    setRevealed(true);
    setTimeout(() => setRevealed(false), 2500);
  });
  return (
    <span onClick={onClick} className={`cursor-default select-none ${className}`}>
      {revealed ? secret : normal}
    </span>
  );
}

/** Hover the children for `holdMs` to reveal a hidden one-liner beneath them. */
export function EggHoverNote({
  children,
  note,
  holdMs = 3000,
}: {
  children: React.ReactNode;
  note: string;
  holdMs?: number;
}) {
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (
    <span
      onMouseEnter={() => {
        timer.current = setTimeout(() => setShow(true), holdMs);
      }}
      onMouseLeave={() => {
        if (timer.current) clearTimeout(timer.current);
      }}
    >
      {children}
      {show && <span className="ml-1 text-[11px] italic text-muted-foreground">{note}</span>}
    </span>
  );
}

/** Type "/whoami" anywhere to flash a tiny terminal card with your details. */
export function EggWhoami({ firstName, stage, track }: { firstName: string; stage: string; track: string }) {
  const [open, setOpen] = useState(false);
  useTypedPhrase("/whoami", () => {
    setOpen(true);
    setTimeout(() => setOpen(false), 4000);
  });
  if (!open) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[70] rounded-lg border border-blue/30 bg-[#0F172A] px-4 py-3 font-mono text-xs text-blue-100 shadow-lg">
      <p className="text-blue-300">$ whoami</p>
      <p>operator: {firstName.toLowerCase()}</p>
      <p>stage: {stage}</p>
      <p>track: {track}</p>
    </div>
  );
}

/** Click the wrapped codename `clicks` times to flip its container monochrome. */
export function EggCodename({ children, clicks = 3 }: { children: React.ReactNode; clicks?: number }) {
  const [mono, setMono] = useState(false);
  const onClick = useClickStreak(clicks, () => {
    setMono(true);
    setTimeout(() => setMono(false), 2500);
  });
  return (
    <span
      onClick={onClick}
      className={`cursor-default transition-[filter] duration-300 ${mono ? "grayscale" : ""}`}
    >
      {children}
    </span>
  );
}

/** One-time subtle glow the first time a value hits 100%. */
export function EggProgressGlow({ value, className = "" }: { value: number; className?: string }) {
  const [glow, setGlow] = useState(false);
  useEffect(() => {
    if (value >= 100 && !eggSeen("progress100")) {
      markEggSeen("progress100");
      setGlow(true);
      const t = setTimeout(() => setGlow(false), 1800);
      return () => clearTimeout(t);
    }
  }, [value]);
  return glow ? (
    <span aria-hidden className={`pointer-events-none animate-pulse rounded-full bg-blue/30 blur-md ${className}`} />
  ) : null;
}
