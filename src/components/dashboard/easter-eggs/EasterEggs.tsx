"use client";

import { useEffect, useState } from "react";
import { onEggToast, emitEggToast, useKeySequence } from "./hooks";

// Globally-mounted (in dashboard layout) host for the document-level eggs and
// the shared toast renderer. Renders nothing until an egg fires.
export function EasterEggs() {
  const [toast, setToast] = useState<string | null>(null);
  const [operator, setOperator] = useState(false);
  const [palette, setPalette] = useState(false);

  // Toast bus: any egg anywhere can call emitEggToast().
  useEffect(() => onEggToast((msg) => setToast(msg)), []);
  useEffect(() => {
    if (toast == null) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  // 1. Konami → "Operator mode" toast + a 5s accent pulse.
  useKeySequence(
    ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"],
    () => {
      emitEggToast("Operator mode enabled.");
      setOperator(true);
      setTimeout(() => setOperator(false), 5000);
    }
  );

  // 14. Command-palette-lite: "." then "?" → cosmetic command modal.
  useKeySequence([".", "?"], () => setPalette(true));

  return (
    <>
      {operator && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1 bg-blue animate-pulse"
        />
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-lg border border-blue/30 bg-[#0F172A] px-4 py-2 font-mono text-xs text-blue-100 shadow-lg"
        >
          {toast}
        </div>
      )}

      {palette && (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center bg-black/30 pt-32"
          onClick={() => setPalette(false)}
        >
          <div
            className="w-80 rounded-xl border border-border bg-surface p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="px-3 py-2 text-[11px] uppercase tracking-wide text-muted-foreground">
              Operator console
            </p>
            {[
              { cmd: "scan", hint: "sweep the perimeter" },
              { cmd: "trace", hint: "follow the packet" },
              { cmd: "brief", hint: "read the room" },
            ].map((c) => (
              <button
                key={c.cmd}
                onClick={() => {
                  emitEggToast(`> ${c.cmd}: nothing to see here.`);
                  setPalette(false);
                }}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted/50"
              >
                <span className="font-mono text-foreground">{c.cmd}</span>
                <span className="text-[11px] text-muted-foreground">{c.hint}</span>
              </button>
            ))}
            <p className="px-3 py-1.5 text-[10px] text-muted-foreground">esc / click away to close</p>
          </div>
        </div>
      )}
    </>
  );
}
