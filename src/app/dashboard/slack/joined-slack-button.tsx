"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

// Self-attested "I've joined the Slack workspace" confirmation. Posts to the
// existing /api/intern/slack-joined endpoint which flips Intern.slackJoined.
export function JoinedSlackButton() {
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      const res = await fetch("/api/intern/slack-joined", { method: "POST" });
      if (res.ok) {
        window.location.reload();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={confirm}
      disabled={busy}
      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-40"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
      I&apos;ve joined Slack
    </button>
  );
}
