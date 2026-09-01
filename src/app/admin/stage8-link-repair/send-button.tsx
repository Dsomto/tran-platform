"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";

const CONFIRMATION = "QUEUE_FINAL_STAGE8_LINK_REPAIR";

export function Stage8LinkRepairSendButton({ ready }: { ready: boolean }) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function send() {
    setSending(true);
    setResult(null);
    try {
      const response = await fetch("/api/admin/stage8-link-repair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: CONFIRMATION }),
      });
      const data = (await response.json()) as { queued?: number; error?: string };
      if (!response.ok) throw new Error(data.error || `Request failed with HTTP ${response.status}`);
      setResult(`${data.queued ?? 0} final correction emails queued successfully.`);
    } catch (error) {
      setResult(error instanceof Error ? error.message : "The correction could not be queued.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-8 border-t border-border pt-6">
      <button
        type="button"
        disabled={!ready || sending}
        onClick={send}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-700 px-5 text-sm font-bold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
        {sending ? "Queueing final correction..." : "Send final correction to 65 recipients"}
      </button>
      {result ? <p className="mt-3 text-sm font-medium text-foreground">{result}</p> : null}
    </div>
  );
}
