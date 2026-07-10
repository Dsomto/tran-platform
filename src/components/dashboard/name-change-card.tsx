"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, BadgeCheck } from "lucide-react";

// Lets an intern fix their own name. The name here is what gets printed on the
// certificate, the letters and the completion card, so we say so plainly.
export function NameChangeCard({
  firstName: initialFirst,
  lastName: initialLast,
}: {
  firstName: string;
  lastName: string;
}) {
  const router = useRouter();
  const [first, setFirst] = useState(initialFirst);
  const [last, setLast] = useState(initialLast);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const dirty = first.trim() !== initialFirst || last.trim() !== initialLast;
  const valid = first.trim().length > 0 && last.trim().length > 0;

  async function save() {
    if (!dirty || !valid || saving) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/account/name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: first, lastName: last }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || "Could not update your name.");
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

  const input =
    "w-full p-2.5 border border-border rounded-lg text-sm bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-blue/40";

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-base font-bold text-foreground">Your name</h3>
        <p className="text-xs text-muted mt-0.5">
          Fix it if it is wrong or spelled differently to how you use it.
        </p>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex items-start gap-2.5 rounded-xl border border-blue/30 bg-blue/5 px-3.5 py-3">
          <BadgeCheck className="h-4 w-4 text-blue shrink-0 mt-0.5" />
          <p className="text-xs text-foreground leading-relaxed">
            This is the exact name printed on your <strong>certificate</strong>, your letters and
            your completion card. Get it right here and it is right everywhere.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">First name</label>
            <input
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              maxLength={60}
              className={input}
              placeholder="First name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Last name</label>
            <input
              value={last}
              onChange={(e) => setLast(e.target.value)}
              maxLength={60}
              className={input}
              placeholder="Last name"
            />
          </div>
        </div>

        <div className="text-xs text-muted">
          Will appear as:{" "}
          <span className="font-semibold text-foreground">
            {`${first.trim()} ${last.trim()}`.trim() || "—"}
          </span>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {saved && !dirty && (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            Saved. Your name is updated everywhere, including your certificate.
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={!dirty || !valid || saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save name"}
          </button>
          {dirty && !saving && (
            <button
              onClick={() => {
                setFirst(initialFirst);
                setLast(initialLast);
                setError("");
              }}
              className="text-sm text-muted hover:text-foreground"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
