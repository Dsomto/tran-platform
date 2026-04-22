"use client";

import { useEffect, useMemo, useState } from "react";
import type { WidgetProps } from "./types";
import { resolveTemplates } from "./template";

type LogMap = Record<string, string>;

export default function LogViewer({ config, context, onAnswerChange }: WidgetProps) {
  const c = (config as { logs?: LogMap; instructions?: string }) ?? {};
  const rawLogs = c.logs ?? { auth: "no logs configured" };

  const [logs, setLogs] = useState<LogMap>(rawLogs);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next = await resolveTemplates(rawLogs, context);
      if (!cancelled) {
        setLogs(next);
        setResolved(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rawLogs, context]);

  const tabs = Object.keys(logs);
  const [active, setActive] = useState(tabs[0] ?? "auth");
  const [filter, setFilter] = useState("");
  const [scratch, setScratch] = useState("");

  useEffect(() => {
    if (!tabs.includes(active) && tabs[0]) setActive(tabs[0]);
  }, [tabs, active]);

  const visible = useMemo(() => {
    const body = logs[active] ?? "";
    const lines = body.split("\n");
    if (!filter.trim()) return lines;
    try {
      const re = new RegExp(filter, "i");
      return lines.filter((l) => re.test(l));
    } catch {
      return lines.filter((l) => l.toLowerCase().includes(filter.toLowerCase()));
    }
  }, [active, filter, logs]);

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-950 text-white overflow-hidden">
      <div className="flex items-center gap-1 p-2 bg-black/40 border-b border-white/10 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap ${
              active === t ? "bg-white/10" : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            {t}.log
          </button>
        ))}
      </div>
      <div className="p-4 space-y-3">
        {c.instructions && (
          <div className="text-xs text-white/60 bg-white/5 border border-white/10 rounded-lg p-2">
            {c.instructions}
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="grep / regex filter…"
            className="flex-1 bg-black/60 rounded-lg p-2.5 border border-white/10 outline-none focus:border-white/30 font-mono text-sm"
          />
          <span className="text-xs text-white/40 self-center">
            {resolved ? `${visible.length} lines` : "loading…"}
          </span>
        </div>
        <div className="bg-black rounded-lg border border-white/10 overflow-auto max-h-[420px] font-mono text-xs">
          {visible.map((line, i) => (
            <div
              key={i}
              onClick={() => setScratch((s) => (s ? `${s}\n${line}` : line))}
              className="px-3 py-0.5 hover:bg-white/5 cursor-pointer whitespace-pre"
            >
              <span className="text-white/30 mr-3">{String(i + 1).padStart(4, "0")}</span>
              {line}
            </div>
          ))}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1 text-xs text-white/50">
            <span>Evidence scratchpad (click a line to mark it)</span>
            <button
              onClick={() => {
                setScratch("");
                onAnswerChange?.({ evidence: "" });
              }}
              className="text-white/40 hover:text-white"
            >
              clear
            </button>
          </div>
          <textarea
            value={scratch}
            onChange={(e) => {
              setScratch(e.target.value);
              onAnswerChange?.({ evidence: e.target.value });
            }}
            className="w-full h-24 bg-black/60 rounded-lg p-3 border border-white/10 outline-none focus:border-white/30 font-mono text-xs"
            placeholder="Paste notes, IPs, usernames…"
          />
        </div>
      </div>
    </div>
  );
}
