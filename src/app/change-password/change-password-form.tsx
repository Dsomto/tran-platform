"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function ChangePasswordForm() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (next.length < 12) {
      setError("New password must be at least 12 characters.");
      return;
    }
    if (next !== confirm) {
      setError("New password and confirmation don't match.");
      return;
    }
    if (next === current) {
      setError("New password must be different from the current one.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't update password.");
        setBusy(false);
        return;
      }
      // Land them on their normal home; the gate will no longer redirect.
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5" htmlFor="cp-cur">
          Current (temporary) password
        </label>
        <input
          id="cp-cur"
          type="password"
          autoComplete="current-password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue/30"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5" htmlFor="cp-new">
          New password (12+ characters)
        </label>
        <input
          id="cp-new"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue/30"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5" htmlFor="cp-confirm">
          Confirm new password
        </label>
        <input
          id="cp-confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue/30"
        />
      </div>

      {error && (
        <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-blue text-white hover:opacity-90 disabled:opacity-40"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Save new password
      </button>
    </form>
  );
}
