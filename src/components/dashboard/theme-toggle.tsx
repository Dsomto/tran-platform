"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Light/dark toggle for the topbar. The actual initial class is set by the
 * no-flash script in the root layout before paint; this button just reflects
 * the current state and flips + persists it. `mounted` guards against a
 * hydration mismatch (the server can't know the visitor's stored choice).
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* private mode — choice just won't persist */
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
    >
      {/* Until mounted, render the moon as a neutral placeholder so the markup
          matches on the server and we don't flash the wrong icon. */}
      {mounted && dark ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}
