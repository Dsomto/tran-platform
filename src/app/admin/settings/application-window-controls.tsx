"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Lock, LockOpen, Loader2, Save } from "lucide-react";

interface State {
  applicationsOpen: boolean;
  applicationsOpensAt: string | null;
  applicationsClosesAt: string | null;
  applicationsClosedNote: string | null;
  isAcceptingApplications: boolean;
  reason: string;
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ApplicationWindowControls({ initial }: { initial: State }) {
  const router = useRouter();
  const [s, setS] = useState<State>(initial);
  const [opensInput, setOpensInput] = useState(toLocalInput(initial.applicationsOpensAt));
  const [closesInput, setClosesInput] = useState(toLocalInput(initial.applicationsClosesAt));
  const [note, setNote] = useState(initial.applicationsClosedNote ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setErr(null);
    setOkMsg(null);
    try {
      const res = await fetch("/api/admin/settings/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error || "Failed to save");
        return;
      }
      setS({
        applicationsOpen: j.state.applicationsOpen,
        applicationsOpensAt: j.state.applicationsOpensAt?.toISOString?.() ?? j.state.applicationsOpensAt ?? null,
        applicationsClosesAt: j.state.applicationsClosesAt?.toISOString?.() ?? j.state.applicationsClosesAt ?? null,
        applicationsClosedNote: j.state.applicationsClosedNote ?? null,
        isAcceptingApplications: j.state.isAcceptingApplications,
        reason: j.state.reason,
      });
      setOkMsg("Saved.");
      router.refresh();
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  function toggleOpen() {
    patch({ applicationsOpen: !s.applicationsOpen });
  }

  function saveSchedule() {
    patch({
      applicationsOpensAt: opensInput ? new Date(opensInput).toISOString() : null,
      applicationsClosesAt: closesInput ? new Date(closesInput).toISOString() : null,
      applicationsClosedNote: note.trim() || null,
    });
  }

  const currentLabel = s.isAcceptingApplications
    ? { text: "Applications are OPEN", tone: "ok" as const }
    : s.reason === "not_yet_open"
      ? { text: "Scheduled — not open yet", tone: "wait" as const }
      : { text: "Applications are CLOSED", tone: "stop" as const };

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-border/60">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-blue/10 flex items-center justify-center">
                <CalendarClock className="w-5 h-5 text-blue" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Application form</h3>
            </div>
            <p className="text-xs text-muted ml-[3.25rem]">
              Control whether <code>/apply</code> accepts submissions, and set an optional scheduled open/close window.
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${
              currentLabel.tone === "ok"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : currentLabel.tone === "wait"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            {currentLabel.tone === "ok" ? (
              <LockOpen className="w-3.5 h-3.5" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
            {currentLabel.text}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {err && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
            {err}
          </div>
        )}
        {okMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-900">
            {okMsg}
          </div>
        )}

        {/* Master switch */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-border/60">
          <div>
            <p className="text-sm font-semibold text-foreground">Master switch</p>
            <p className="text-xs text-muted mt-0.5">
              If OFF, /apply is closed no matter what the scheduled dates say.
            </p>
          </div>
          <button
            onClick={toggleOpen}
            disabled={busy}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full border transition ${
              s.applicationsOpen
                ? "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700"
                : "bg-slate-700 text-white border-slate-800 hover:bg-slate-800"
            } disabled:opacity-50`}
          >
            {busy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : s.applicationsOpen ? (
              <LockOpen className="w-3.5 h-3.5" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
            {s.applicationsOpen ? "Open — click to close" : "Closed — click to open"}
          </button>
        </div>

        {/* Schedule */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">
              Opens at (optional)
            </label>
            <input
              type="datetime-local"
              value={opensInput}
              onChange={(e) => setOpensInput(e.target.value)}
              className="w-full p-2.5 border border-border rounded-lg text-sm bg-white"
            />
            <p className="text-[11px] text-muted mt-1">
              Until this time, applicants see a countdown instead of the form.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">
              Closes at (optional)
            </label>
            <input
              type="datetime-local"
              value={closesInput}
              onChange={(e) => setClosesInput(e.target.value)}
              className="w-full p-2.5 border border-border rounded-lg text-sm bg-white"
            />
            <p className="text-[11px] text-muted mt-1">
              After this time, the form auto-locks.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">
            Message shown when closed (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Applications for the 2026 cohort reopen in September. Leave your email to be notified."
            className="w-full p-2.5 border border-border rounded-lg text-sm bg-white resize-y"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={saveSchedule}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-lg bg-foreground text-background hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save schedule &amp; message
          </button>
          <button
            onClick={() => {
              setOpensInput("");
              setClosesInput("");
              setNote("");
              patch({
                applicationsOpensAt: null,
                applicationsClosesAt: null,
                applicationsClosedNote: null,
              });
            }}
            disabled={busy}
            className="text-xs font-medium text-muted hover:text-foreground"
          >
            Clear schedule
          </button>
        </div>
      </div>
    </div>
  );
}
