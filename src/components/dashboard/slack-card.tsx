"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, CheckCircle2, Loader2, ExternalLink } from "lucide-react";

interface Props {
  inviteUrl: string | null;
  joined: boolean;
  joinedAt: string | null;
}

export function SlackCard({ inviteUrl, joined, joinedAt }: Props) {
  const router = useRouter();
  const [localJoined, setLocalJoined] = useState(joined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmJoined() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/intern/slack-joined", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joined: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed");
      } else {
        setLocalJoined(true);
        router.refresh();
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (localJoined) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-900">You're in the cohort Slack.</p>
          <p className="text-xs text-emerald-800 mt-0.5">
            Announcements, mentor office-hours, and cohort help happen there.
            {joinedAt && ` Confirmed ${new Date(joinedAt).toLocaleDateString()}.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#4A154B] rounded-xl p-5 text-white">
      <div className="flex items-start gap-3 mb-3">
        <MessageSquare className="h-5 w-5 shrink-0 mt-0.5 text-purple-200" />
        <div>
          <h3 className="font-semibold">Join the cohort Slack</h3>
          <p className="text-sm text-purple-100 mt-1 leading-relaxed">
            Most of what happens outside the platform — announcements, office-hours,
            help from other participants — lives in Slack. Join before Stage 0 closes.
          </p>
        </div>
      </div>
      {error && (
        <div className="mb-3 p-2 bg-white/10 border border-white/20 rounded text-xs">
          {error}
        </div>
      )}
      <div className="flex flex-wrap gap-2 mt-2">
        {inviteUrl ? (
          <a
            href={inviteUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 bg-white text-[#4A154B] px-4 py-2 rounded-full text-sm font-semibold hover:opacity-90"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open Slack invite
          </a>
        ) : (
          <span className="text-xs text-purple-200 italic">
            Invite link not yet configured — check your welcome email.
          </span>
        )}
        <button
          onClick={confirmJoined}
          disabled={saving}
          className="inline-flex items-center gap-1.5 bg-white/10 border border-white/30 px-4 py-2 rounded-full text-sm font-medium hover:bg-white/20 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          I've joined
        </button>
      </div>
    </div>
  );
}
