"use client";

import { useCallback, useEffect, useState } from "react";
import { Send, Loader2, Search, Users, Mail } from "lucide-react";

interface Recipient {
  id: string;
  fullName: string;
  email: string;
  status: string;
  trackInterest: string;
  country: string;
  stage: number;
}

// Email tool — filter the applicant pool, hand-pick recipients, write a
// message and send. Sending only enqueues the emails; the email-drain cron
// delivers them in the background and the Email Queue page tracks delivery.
export default function BroadcastPage() {
  const [status, setStatus] = useState("all");
  const [track, setTrack] = useState("");
  const [country, setCountry] = useState("");
  const [stage, setStage] = useState("all");

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setToast(null);
    try {
      const params = new URLSearchParams({ status, stage });
      if (track) params.set("track", track);
      if (country) params.set("country", country);
      const res = await fetch(`/api/admin/broadcast?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setToast(data.error || "Couldn't load recipients.");
        return;
      }
      setRecipients(data.applicants ?? []);
      // Pre-select every match — the common case is "email this whole segment".
      setSelected(new Set((data.applicants ?? []).map((a: Recipient) => a.id)));
    } catch {
      setToast("Network error while loading recipients.");
    } finally {
      setLoading(false);
    }
  }, [status, track, country, stage]);

  // Load the full pool once on mount.
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === recipients.length ? new Set() : new Set(recipients.map((r) => r.id))
    );
  }

  async function send() {
    if (selected.size === 0 || !subject.trim() || !message.trim()) return;
    if (
      !confirm(
        `Send this email to ${selected.size} recipient${selected.size === 1 ? "" : "s"}? ` +
          "It queues for delivery and sends in the background."
      )
    ) {
      return;
    }
    setSending(true);
    setToast(null);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          message,
          applicationIds: Array.from(selected),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast(`Couldn't queue: ${data.error || "unknown error"}`);
      } else {
        setToast(
          `${data.queued} email${data.queued === 1 ? "" : "s"} queued for delivery. ` +
            "Track delivery on the Email Queue page."
        );
        setSubject("");
        setMessage("");
      }
    } catch {
      setToast("Network error while queueing.");
    } finally {
      setSending(false);
    }
  }

  const allChecked = recipients.length > 0 && selected.size === recipients.length;
  const canSend = selected.size > 0 && subject.trim() !== "" && message.trim() !== "";

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Mail className="h-6 w-6 text-blue" />
          <h1 className="text-2xl font-bold text-foreground">Send Email</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Filter the applicant list, tick the people you want, write a message and send.
          Emails queue for delivery and send in the background — track them on the Email
          Queue page.
        </p>
      </header>

      {toast && (
        <div className="mb-4 p-3 bg-blue/10 border border-blue/30 rounded-lg text-sm text-foreground">
          {toast}
        </div>
      )}

      {/* Filters */}
      <section className="mb-4 bg-white border border-border rounded-xl p-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Filter recipients
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 border border-border rounded-lg text-sm bg-white"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="queued_approved">Awaiting welcome email</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Track contains</label>
            <input
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              placeholder="e.g. SOC, GRC"
              className="w-full p-2 border border-border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Country contains</label>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Nigeria"
              className="w-full p-2 border border-border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Stage</label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full p-2 border border-border rounded-lg text-sm bg-white"
            >
              <option value="all">Any</option>
              <option value="-1">Not started</option>
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i} value={i}>
                  Stage {i}
                </option>
              ))}
              <option value="10">Finalist</option>
            </select>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted/50 disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Apply filters
        </button>
      </section>

      {/* Recipient list */}
      <section className="mb-4 bg-white border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-3 border-b border-border bg-muted/20">
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={toggleAll}
              className="accent-blue"
            />
            <span>
              {selected.size} of {recipients.length} selected
            </span>
          </label>
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {recipients.length} match the filters
          </span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
        ) : recipients.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No applicants match these filters.
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {recipients.map((r) => (
              <label
                key={r.id}
                className="flex items-center gap-3 p-3 text-sm hover:bg-muted/20 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(r.id)}
                  onChange={() => toggle(r.id)}
                  className="accent-blue shrink-0"
                />
                <span className="font-medium text-foreground w-44 truncate">{r.fullName}</span>
                <span className="font-mono text-xs text-muted-foreground flex-1 truncate">
                  {r.email}
                </span>
                <span className="text-xs text-muted-foreground w-24 truncate">{r.country}</span>
                <span className="text-xs text-muted-foreground w-20 capitalize">{r.status}</span>
              </label>
            ))}
          </div>
        )}
      </section>

      {/* Composer */}
      <section className="bg-white border border-border rounded-xl p-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Compose
        </h2>
        <label className="block text-xs text-muted-foreground mb-1">Subject</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject"
          className="w-full p-2 border border-border rounded-lg text-sm mb-3"
        />
        <label className="block text-xs text-muted-foreground mb-1">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={8}
          placeholder="Write your message. Plain text — line breaks are kept."
          className="w-full p-2 border border-border rounded-lg text-sm mb-3 resize-y"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Sent inside the standard UBI email template.
          </p>
          <button
            onClick={send}
            disabled={!canSend || sending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue text-white hover:opacity-90 disabled:opacity-40"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send to {selected.size} recipient{selected.size === 1 ? "" : "s"}
          </button>
        </div>
      </section>
    </div>
  );
}
