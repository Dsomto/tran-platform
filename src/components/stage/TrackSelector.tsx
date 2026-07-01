"use client";

import { useState } from "react";

const TRACKS = [
  { id: "SOC_ANALYSIS", label: "SOC Analysis", desc: "Detection, monitoring, triage, incident response." },
  { id: "ETHICAL_HACKING", label: "Ethical Hacking", desc: "Offensive testing, exploitation, red-team work." },
  { id: "GRC", label: "GRC", desc: "Governance, risk, compliance, audit, policy." },
] as const;

export function TrackSelector({ currentTrack }: { currentTrack: string | null }) {
  const [selected, setSelected] = useState<string | null>(currentTrack);
  const [saving, setSaving] = useState("");
  const [registered, setRegistered] = useState<string | null>(currentTrack);
  const [error, setError] = useState("");

  async function choose(id: string) {
    setSelected(id);
    setSaving(id);
    setError("");
    try {
      const res = await fetch("/api/track-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not register your track. Try again.");
        return;
      }
      setRegistered(id);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving("");
    }
  }

  const registeredLabel = TRACKS.find((t) => t.id === registered)?.label;

  return (
    <div className="mb-6 rounded-2xl border border-cyan-400/25 bg-slate-900/50 p-5">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
          Choose your track
        </h3>
        {registered && (
          <span className="text-xs font-medium text-emerald-300">
            Registered: {registeredLabel}
          </span>
        )}
      </div>
      <p className="text-[13px] text-slate-300/80 mb-4 leading-relaxed">
        Pick the specialist track you are committing to. It registers to your profile the moment you
        choose. Write your reasons in the box below, and remember the choice becomes final once graded.
      </p>

      <div className="grid sm:grid-cols-3 gap-3">
        {TRACKS.map((t) => {
          const isSel = selected === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => choose(t.id)}
              disabled={!!saving}
              className={`text-left rounded-xl border p-3.5 transition disabled:opacity-60 ${
                isSel
                  ? "border-cyan-400 bg-cyan-400/10 ring-1 ring-cyan-400/40"
                  : "border-slate-600/50 bg-slate-800/40 hover:border-cyan-400/50 hover:bg-slate-800/70"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    isSel ? "border-cyan-300 bg-cyan-300" : "border-slate-500"
                  }`}
                >
                  {isSel && <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />}
                </span>
                <span className="text-sm font-semibold text-slate-100">{t.label}</span>
              </div>
              <p className="mt-1.5 text-[12px] leading-snug text-slate-400">{t.desc}</p>
              {saving === t.id && <p className="mt-2 text-[11px] text-cyan-300">Registering…</p>}
            </button>
          );
        })}
      </div>

      {registered && (
        <p className="mt-3 text-[13px] text-emerald-300">
          ✓ Your track is registered as <strong>{registeredLabel}</strong>. You can change it here until it is graded.
        </p>
      )}
      {error && <p className="mt-3 text-[13px] text-rose-300">{error}</p>}
    </div>
  );
}
