"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Lock, Clock } from "lucide-react";

const TRACKS = [
  {
    key: "SOC_ANALYSIS",
    name: "SOC Analysis",
    blurb: "Detection, triage and incident response. You live in the logs and stop the attacker.",
  },
  {
    key: "ETHICAL_HACKING",
    name: "Ethical Hacking",
    blurb: "Offensive testing. You break the application the way an attacker would, then write the fix.",
  },
  {
    key: "GRC",
    name: "GRC",
    blurb: "Governance, risk and compliance. You turn technical findings into board-ready decisions.",
  },
] as const;

// Live countdown, recomputed every second. Returns null once the deadline passes.
function useCountdown(deadlineIso: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!deadlineIso) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [deadlineIso]);

  if (!deadlineIso) return null;
  const ms = new Date(deadlineIso).getTime() - now;
  if (ms <= 0) return null;
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor((ms % 86400000) / 3600000),
    minutes: Math.floor((ms % 3600000) / 60000),
    seconds: Math.floor((ms % 60000) / 1000),
  };
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}

export function TrackChangeCard({
  currentTrack,
  deadlineIso,
}: {
  currentTrack: string;
  deadlineIso: string | null;
}) {
  const router = useRouter();
  const left = useCountdown(deadlineIso);
  const open = !!deadlineIso && !!left;

  const [selected, setSelected] = useState(currentTrack);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const dirty = selected !== currentTrack;

  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/intern/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track: selected }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || "Could not change your track.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground">Your specialisation track</h3>
          <p className="text-xs text-muted mt-0.5">
            {open
              ? "You can still change this. Once the deadline passes, it is locked."
              : "Track changes are closed."}
          </p>
        </div>
        {open ? (
          <div className="flex items-center gap-3 rounded-xl border border-blue/30 bg-blue/5 px-3 py-2">
            <Clock className="h-4 w-4 text-blue shrink-0" />
            <div className="flex items-center gap-3">
              <Unit value={left!.days} label="days" />
              <Unit value={left!.hours} label="hrs" />
              <Unit value={left!.minutes} label="min" />
              <Unit value={left!.seconds} label="sec" />
            </div>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted rounded-full border border-border px-3 py-1.5">
            <Lock className="h-3.5 w-3.5" /> Locked
          </span>
        )}
      </div>

      <div className="p-6 space-y-3">
        {TRACKS.map((t) => {
          const active = selected === t.key;
          const isCurrent = currentTrack === t.key;
          return (
            <button
              key={t.key}
              type="button"
              disabled={!open}
              onClick={() => setSelected(t.key)}
              className={`w-full text-left rounded-xl border-2 p-4 transition disabled:opacity-60 disabled:cursor-not-allowed ${
                active ? "border-blue bg-blue/5" : "border-border hover:border-blue/40"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-foreground">{t.name}</span>
                <span className="flex items-center gap-2">
                  {isCurrent && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted border border-border rounded-full px-2 py-0.5">
                      Current
                    </span>
                  )}
                  {active && <Check className="h-4 w-4 text-blue" />}
                </span>
              </div>
              <p className="text-xs text-muted mt-1.5 leading-relaxed">{t.blurb}</p>
            </button>
          );
        })}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}
        {saved && !dirty && (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            Saved. Your track is now {TRACKS.find((t) => t.key === selected)?.name}.
          </p>
        )}

        {open && (
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={save}
              disabled={!dirty || saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving…" : "Save track"}
            </button>
            {dirty && !saving && (
              <button
                onClick={() => setSelected(currentTrack)}
                className="text-sm text-muted hover:text-foreground"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
