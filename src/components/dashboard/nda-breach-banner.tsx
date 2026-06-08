"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, X } from "lucide-react";

// Persistent dashboard banner that links to the pinned NDA breach
// announcement. Dismissible per-browser via localStorage so we don't
// hammer interns who have already read it.
const DISMISS_KEY = "ubi-nda-breach-banner-dismissed-v1";

export function NdaBreachBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const dismissed = window.localStorage.getItem(DISMISS_KEY);
      if (!dismissed) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    } catch {
      // ignore
    }
    setVisible(false);
  }

  return (
    <div
      role="alert"
      className="animate-slide-down sticky top-0 z-40 bg-rose-700 text-white px-4 py-2.5 flex items-center gap-3 flex-wrap shadow-lg"
    >
      <span className="animate-pulse-soft inline-flex items-center justify-center w-7 h-7 rounded-full bg-rose-900/40 shrink-0">
        <ShieldAlert className="h-4 w-4" />
      </span>
      <div className="flex-1 min-w-0 text-sm leading-snug">
        <strong className="font-semibold">Internal communication — NDA breach.</strong>{" "}
        <span className="text-white/90">
          Some interns posted internal Stage 0 material externally. Read the full
          notice before continuing.
        </span>
      </div>
      <Link
        href="/dashboard/announcements"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-white text-rose-900 hover:bg-rose-50"
      >
        Read the notice
      </Link>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="inline-flex items-center justify-center w-7 h-7 rounded-md text-white/80 hover:text-white hover:bg-rose-900/30"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
