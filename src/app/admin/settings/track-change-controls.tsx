"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2, Save, Lock } from "lucide-react";

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Sets the deadline after which interns can no longer switch their track.
// Clearing the field closes track switching immediately.
export function TrackChangeControls({ initialIso }: { initialIso: string | null }) {
  const router = useRouter();
  const [input, setInput] = useState(toLocalInput(initialIso));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const deadline = input ? new Date(input) : null;
  const isOpen = !!deadline && deadline.getTime() > Date.now();

  async function save(clear = false) {
    setBusy(true);
    setErr(null);
    setOk(false);
    try {
      const res = await fetch("/api/admin/settings/track-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackChangeDeadline: clear ? null : input ? new Date(input).toISOString() : null,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error || "Could not save.");
        return;
      }
      if (clear) setInput("");
      setOk(true);
      router.refresh();
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <CalendarClock className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">Track change window</h3>
          <p className="text-xs text-muted">
            Interns can switch their specialisation track until this moment. A live countdown shows
            on their settings page.
          </p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Deadline</label>
          <input
            type="datetime-local"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full max-w-sm p-2 border border-border rounded-lg text-sm bg-surface text-foreground"
          />
          <p className="text-xs text-muted mt-1.5">
            {isOpen ? (
              <>Track switching is <strong className="text-emerald-600">open</strong> until this time.</>
            ) : (
              <>Track switching is <strong className="text-foreground">closed</strong>. Set a future date to open it.</>
            )}
          </p>
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}
        {ok && <p className="text-sm text-emerald-600">Saved.</p>}

        <div className="flex items-center gap-3">
          <button
            onClick={() => save(false)}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save deadline
          </button>
          <button
            onClick={() => save(true)}
            disabled={busy || !input}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground disabled:opacity-40"
          >
            <Lock className="h-4 w-4" />
            Close now
          </button>
        </div>
      </div>
    </div>
  );
}
