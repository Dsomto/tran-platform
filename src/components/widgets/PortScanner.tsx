"use client";

import { useState } from "react";
import type { WidgetProps } from "./types";

/**
 * Scripted nmap-style scanner.
 *
 * config shape:
 * {
 *   target?: string,           // defaults to "legacy.sankofa.internal"
 *   ports: Array<{ port: number, service: string, banner?: string, state?: "open"|"filtered"|"closed" }>
 * }
 */

type Row = { port: number; service: string; banner?: string; state?: "open" | "filtered" | "closed" };

export default function PortScanner({ config, onAnswerChange }: WidgetProps) {
  const c = (config as { target?: string; ports?: Row[] }) ?? {};
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [discovered, setDiscovered] = useState<Row[]>([]);
  const ports = c.ports ?? [];

  function run() {
    setProgress(0);
    setDone(false);
    setDiscovered([]);
    let i = 0;
    const tick = () => {
      setProgress((p) => Math.min(100, p + 2));
      if (i < ports.length) {
        setDiscovered((d) => [...d, ports[i]]);
        i++;
      }
    };
    const interval = setInterval(() => {
      tick();
    }, 80);
    const stopAt = setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setDone(true);
      setDiscovered(ports);
      const openPorts = ports.filter((p) => (p.state ?? "open") === "open").map((p) => p.port).sort((a, b) => a - b);
      onAnswerChange?.({ openPorts: openPorts.join(",") });
    }, 80 * ports.length + 200);
    return () => {
      clearInterval(interval);
      clearTimeout(stopAt);
    };
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black text-emerald-300 overflow-hidden font-mono text-sm">
      <div className="px-4 py-2 bg-neutral-950 border-b border-white/10 flex items-center justify-between text-white/70">
        <span className="text-xs">nmap-lite · {c.target ?? "legacy.sankofa.internal"}</span>
        <button
          onClick={run}
          className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 text-xs"
        >
          Scan
        </button>
      </div>
      <div className="p-4 space-y-2 min-h-[260px]">
        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-400 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="pt-2">
          <div className="grid grid-cols-12 text-white/50 text-xs border-b border-white/10 pb-1">
            <div className="col-span-2">PORT</div>
            <div className="col-span-2">STATE</div>
            <div className="col-span-3">SERVICE</div>
            <div className="col-span-5">BANNER</div>
          </div>
          {discovered.map((r) => (
            <div
              key={r.port}
              className="grid grid-cols-12 py-1 border-b border-white/5 text-sm animate-in fade-in slide-in-from-left-1"
            >
              <div className="col-span-2 text-emerald-200">{r.port}/tcp</div>
              <div className={`col-span-2 ${r.state === "filtered" ? "text-yellow-300" : r.state === "closed" ? "text-red-300" : "text-emerald-400"}`}>
                {r.state ?? "open"}
              </div>
              <div className="col-span-3 text-cyan-200">{r.service}</div>
              <div className="col-span-5 text-white/60">{r.banner ?? ""}</div>
            </div>
          ))}
        </div>
        {done && (
          <div className="pt-3 text-xs text-white/50">Scan complete · {discovered.length} ports probed</div>
        )}
      </div>
    </div>
  );
}
