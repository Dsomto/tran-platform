"use client";

import { useCallback, useEffect, useState } from "react";
import { Send, Loader2, Search, Users, Mail, Eye, EyeOff } from "lucide-react";
import { renderBroadcastEmail, personalizeText, firstNameOf } from "@/lib/broadcast-email";
import { canSendEmails } from "@/lib/email-permissions";

interface Recipient {
  id: string;
  fullName: string;
  email: string;
  status: string;
  trackInterest: string;
  country: string;
  stage: number;
}

type SendMode = "all" | "selected";

// Newsletter sender (super-admin only). Filter the applicant pool, write a
// message, preview it, and send — either to everyone matching the filters or
// to a hand-picked set. Sending enqueues the emails; the email-drain cron
// delivers them and the Email Queue page tracks delivery.
export function BroadcastClient() {
  const [status, setStatus] = useState("all");
  const [track, setTrack] = useState("");
  const [country, setCountry] = useState("");
  const [stage, setStage] = useState("all");

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [total, setTotal] = useState(0);
  const [capped, setCapped] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const [sendMode, setSendMode] = useState<SendMode>("all");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  // Sending is locked to one account (see canSendEmails) regardless of role —
  // the co-super-admin can compose/preview but cannot send.
  const [allowedToSend, setAllowedToSend] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setAllowedToSend(canSendEmails(d.user?.email)))
      .catch(() => setAllowedToSend(false));
  }, []);

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
      const list: Recipient[] = data.applicants ?? [];
      setRecipients(list);
      setTotal(typeof data.total === "number" ? data.total : list.length);
      setCapped(data.capped === true);
      setSelected(new Set(list.map((a) => a.id)));
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

  const recipientCount = sendMode === "all" ? total : selected.size;

  async function send() {
    if (recipientCount === 0 || !subject.trim() || !message.trim()) return;
    const who =
      sendMode === "all"
        ? `all ${total} applicant${total === 1 ? "" : "s"} matching the current filters`
        : `the ${selected.size} hand-picked recipient${selected.size === 1 ? "" : "s"}`;
    if (!confirm(`Send this newsletter to ${who}? It queues for delivery and sends in the background.`)) {
      return;
    }
    setSending(true);
    setToast(null);
    try {
      const payload =
        sendMode === "all"
          ? { subject, message, sendToAll: true, filters: { status, track, country, stage } }
          : { subject, message, applicationIds: Array.from(selected) };
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
        setShowPreview(false);
      }
    } catch {
      setToast("Network error while queueing.");
    } finally {
      setSending(false);
    }
  }

  const allChecked = recipients.length > 0 && selected.size === recipients.length;
  const canSend = recipientCount > 0 && subject.trim() !== "" && message.trim() !== "";

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Mail className="h-6 w-6 text-blue" />
          <h1 className="text-2xl font-bold text-foreground">Newsletter</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Filter the applicant list, write your message, preview it, and send —
          to everyone matching the filters or to a hand-picked set. Emails queue
          and send in the background; track them on the Email Queue page.
        </p>
      </header>

      {toast && (
        <div className="mb-4 p-3 bg-blue/10 border border-blue/30 rounded-lg text-sm text-foreground">
          {toast}
        </div>
      )}

      {!allowedToSend && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          Sending is restricted to the programme owner&apos;s account. You can compose and preview a
          broadcast, but the send button is disabled.
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
          <span className="text-sm font-semibold text-foreground inline-flex items-center gap-1.5">
            <Users className="h-4 w-4 text-blue" />
            {loading ? "Loading…" : `${total.toLocaleString()} ${total === 1 ? "person" : "people"} match these filters`}
          </span>
          {capped && (
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">
              Showing the most recent {recipients.length.toLocaleString()} below
            </span>
          )}
        </div>

        {capped && (
          <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border bg-amber-50/50">
            The list below is a sample for hand-picking individuals. To reach
            <strong className="text-foreground"> all {total.toLocaleString()}</strong>,
            use <strong className="text-foreground">&ldquo;Everyone matching the filters&rdquo;</strong> in the compose box.
          </div>
        )}

        <div className="flex items-center justify-between gap-3 p-3 border-b border-border">
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={toggleAll}
              className="accent-blue"
            />
            <span>
              {selected.size.toLocaleString()} of {recipients.length.toLocaleString()} ticked
              <span className="text-muted-foreground"> (for hand-picked sends)</span>
            </span>
          </label>
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
          placeholder="Newsletter subject"
          className="w-full p-2 border border-border rounded-lg text-sm mb-3"
        />
        <label className="block text-xs text-muted-foreground mb-1">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={8}
          placeholder="Write your message. Plain text — line breaks are kept."
          className="w-full p-2 border border-border rounded-lg text-sm mb-1.5 resize-y"
        />
        <p className="text-xs text-muted-foreground mb-3">
          Tip: type <span className="font-mono text-blue">{"{First name}"}</span>{" "}
          to drop in each recipient&apos;s real name. Turn words into a link with{" "}
          <span className="font-mono text-blue">{"[your words](https://link)"}</span>{" "}
          — plain URLs become clickable on their own.
        </p>

        {/* Recipients mode */}
        <div className="mb-3 rounded-lg border border-border p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Send to
          </p>
          <label className="flex items-start gap-2 text-sm text-foreground cursor-pointer mb-2">
            <input
              type="radio"
              name="sendmode"
              checked={sendMode === "all"}
              onChange={() => setSendMode("all")}
              className="accent-blue mt-0.5"
            />
            <span>
              <strong>Everyone matching the filters</strong> — {total.toLocaleString()}{" "}
              {total === 1 ? "person" : "people"}
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-foreground cursor-pointer">
            <input
              type="radio"
              name="sendmode"
              checked={sendMode === "selected"}
              onChange={() => setSendMode("selected")}
              className="accent-blue mt-0.5"
            />
            <span>
              <strong>Only the people I ticked</strong> above — {selected.size.toLocaleString()}{" "}
              selected
            </span>
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={() => setShowPreview((v) => !v)}
            disabled={!subject.trim() || !message.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted/50 disabled:opacity-40"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? "Hide preview" : "Preview email"}
          </button>
          <button
            onClick={send}
            disabled={!canSend || sending || !allowedToSend}
            title={allowedToSend ? undefined : "Only the authorised account can send emails."}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue text-white hover:opacity-90 disabled:opacity-40"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send to {recipientCount.toLocaleString()} recipient{recipientCount === 1 ? "" : "s"}
          </button>
        </div>

        {/* Preview */}
        {showPreview && (() => {
          const previewName = recipients[0] ? firstNameOf(recipients[0].fullName) : "Ada";
          return (
            <div className="mt-4 border border-border rounded-xl overflow-hidden">
              <div className="bg-muted/30 border-b border-border px-4 py-2.5 text-xs">
                <div className="text-muted-foreground">
                  How the email looks in the inbox. Merge fields are shown filled with a
                  sample name (<strong className="text-foreground">{previewName}</strong>)
                  — each recipient gets their own.
                </div>
                <div className="mt-1 text-foreground">
                  <span className="text-muted-foreground">Subject:</span>{" "}
                  <strong>{personalizeText(subject, previewName).trim() || "(no subject)"}</strong>
                </div>
              </div>
              <iframe
                title="Newsletter preview"
                className="w-full bg-white"
                style={{ height: 460, border: 0 }}
                srcDoc={renderBroadcastEmail({ message: personalizeText(message, previewName) })}
              />
            </div>
          );
        })()}
      </section>
    </div>
  );
}
