"use client";

import { useEffect, useRef } from "react";

// ──────────────────────────────────────────────────────────────────────────
// Easter-egg primitives. Everything here is cosmetic + client-only. To remove
// all eggs: delete this folder, the <EasterEggs/> mount in dashboard/layout,
// and the per-page hook calls. Nothing is tied to auth, scoring, or APIs.
// ──────────────────────────────────────────────────────────────────────────

// One-time gate via localStorage (so rare reveals don't repeat forever).
export function eggSeen(key: string): boolean {
  try {
    return typeof window !== "undefined" && localStorage.getItem(`egg:${key}`) === "1";
  } catch {
    return false;
  }
}
export function markEggSeen(key: string): void {
  try {
    localStorage.setItem(`egg:${key}`, "1");
  } catch {
    /* ignore */
  }
}

// Tiny toast bus: a globally-mounted <EasterEggs/> renders toasts; any egg
// anywhere can fire one via emitEggToast().
type ToastCb = (msg: string) => void;
const toastSubs = new Set<ToastCb>();
export function emitEggToast(msg: string): void {
  toastSubs.forEach((cb) => cb(msg));
}
export function onEggToast(cb: ToastCb): () => void {
  toastSubs.add(cb);
  return () => {
    toastSubs.delete(cb);
  };
}

// Match a fixed key sequence (e.g. Konami, or "." then "?"). Binds once.
export function useKeySequence(sequence: string[], onMatch: () => void): void {
  const seqRef = useRef(sequence);
  seqRef.current = sequence;
  const cbRef = useRef(onMatch);
  cbRef.current = onMatch;
  const buf = useRef<string[]>([]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const seq = seqRef.current;
      if (seq.length === 0) return;
      buf.current = [...buf.current, e.key].slice(-seq.length);
      const hit = seq.every((k, i) => (buf.current[i] ?? "").toLowerCase() === k.toLowerCase());
      if (hit) {
        buf.current = [];
        cbRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

// Match a phrase typed anywhere (printable keys only). Binds once.
export function useTypedPhrase(phrase: string, onMatch: () => void): void {
  const cbRef = useRef(onMatch);
  cbRef.current = onMatch;
  const buf = useRef("");
  useEffect(() => {
    const target = phrase.toLowerCase();
    function onKey(e: KeyboardEvent) {
      if (e.key.length !== 1) return;
      buf.current = (buf.current + e.key).toLowerCase().slice(-target.length);
      if (buf.current === target) {
        buf.current = "";
        cbRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phrase]);
}

// Returns a click handler that fires onMatch after `n` clicks within ~1.2s.
export function useClickStreak(n: number, onMatch: () => void): () => void {
  const count = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cbRef = useRef(onMatch);
  cbRef.current = onMatch;
  return () => {
    count.current += 1;
    if (timer.current) clearTimeout(timer.current);
    if (count.current >= n) {
      count.current = 0;
      cbRef.current();
      return;
    }
    timer.current = setTimeout(() => {
      count.current = 0;
    }, 1200);
  };
}
