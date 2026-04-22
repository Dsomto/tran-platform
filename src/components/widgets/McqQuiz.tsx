"use client";

import { useState } from "react";
import type { WidgetProps } from "./types";

/**
 * Multiple-choice quiz.
 *
 * Uses the assignment's own `choices` + `correctIndex` (passed via config) for
 * the options. Config can optionally shuffle or supply richer labels:
 * { choices: string[], shuffle?: boolean, prompt?: string }
 */

type Config = { choices?: string[]; shuffle?: boolean; prompt?: string };

export default function McqQuiz({ config, onAnswerChange }: WidgetProps) {
  const c = (config as Config) ?? {};
  const [choices] = useState<string[]>(() => {
    const base = c.choices ?? [];
    return c.shuffle ? [...base].sort(() => Math.random() - 0.5) : base;
  });
  const [picked, setPicked] = useState<number | null>(null);

  function pick(i: number) {
    setPicked(i);
    // onAnswerChange gets the *original* index — the API re-resolves by label
    // in case we shuffled. Simplest: send label text too.
    onAnswerChange?.({ choiceIndex: i, choiceLabel: choices[i] });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-950 text-white p-6 space-y-4">
      {c.prompt && <p className="text-white/80 leading-relaxed">{c.prompt}</p>}
      <div className="space-y-2">
        {choices.map((label, i) => (
          <button
            key={`${i}-${label}`}
            onClick={() => pick(i)}
            className={`w-full text-left px-4 py-3 rounded-xl border transition ${
              picked === i
                ? "bg-blue-500/15 border-blue-400 text-white"
                : "bg-white/5 border-white/10 hover:bg-white/10 text-white/80"
            }`}
          >
            <span className="inline-block w-6 text-white/40 font-mono text-sm mr-2">
              {String.fromCharCode(65 + i)}.
            </span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
