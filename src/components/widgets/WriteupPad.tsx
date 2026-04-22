"use client";

import { useMemo, useState } from "react";
import type { WidgetProps } from "./types";

type Config = { minWords?: number; placeholder?: string; maxChars?: number };

export default function WriteupPad({ config, onAnswerChange }: WidgetProps) {
  const c = (config as Config) ?? {};
  const [text, setText] = useState("");
  const words = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text]);
  const minWords = c.minWords ?? 0;
  const maxChars = c.maxChars ?? 20000;

  const belowMin = minWords > 0 && words < minWords;
  const pct = minWords > 0 ? Math.min(100, Math.round((words / minWords) * 100)) : 100;

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-950 text-white p-6 space-y-3">
      <textarea
        value={text}
        onChange={(e) => {
          const v = e.target.value.slice(0, maxChars);
          setText(v);
          onAnswerChange?.({ text: v });
        }}
        placeholder={c.placeholder ?? "Your writeup…"}
        className="w-full h-64 bg-black/60 rounded-lg p-4 border border-white/10 outline-none focus:border-white/30 font-mono text-sm leading-relaxed"
      />
      <div className="flex items-center justify-between text-xs">
        <div className={belowMin ? "text-amber-300" : "text-emerald-300"}>
          {words} / {minWords || "∞"} words
          {minWords > 0 && belowMin && " · below minimum"}
        </div>
        <div className="text-white/40">{text.length}/{maxChars} chars</div>
      </div>
      {minWords > 0 && (
        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${belowMin ? "bg-amber-400" : "bg-emerald-400"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
