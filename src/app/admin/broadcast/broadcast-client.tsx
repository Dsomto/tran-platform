"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Send, Loader2, Search, Users, Mail, Eye, EyeOff, Sparkles, FileText } from "lucide-react";
import { renderBroadcastEmail, personalizeText, firstNameOf } from "@/lib/broadcast-email";
import { promptTotpCode } from "@/lib/totp-prompt";
import { NEWSLETTER_TEMPLATES, renderTemplate, getTemplate } from "@/lib/newsletter-templates";

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
  // Live-cohort targeting — message the people actually IN a stage right now
  // (resolved from Intern.currentStage). When set, it overrides the applicant
  // filters above. "" = off.
  const [cohortStage, setCohortStage] = useState("");
  const [cohortActive, setCohortActive] = useState("active");

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

  // Template mode — when set, the composer uses one of the designed
  // newsletter templates from src/lib/newsletter-templates.ts instead of the
  // plain-text composer below.
  const [templateId, setTemplateId] = useState<string>("");
  const [templateVars, setTemplateVars] = useState<Record<string, string>>({});
  const activeTemplate = useMemo(() => (templateId ? getTemplate(templateId) ?? null : null), [templateId]);
  // Sending is locked to one account server-side regardless of role —
  // the co-super-admin can compose/preview but cannot send.
  const [allowedToSend, setAllowedToSend] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setAllowedToSend(d.permissions?.emailSendAllowed === true))
      .catch(() => setAllowedToSend(false));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setToast(null);
    try {
      const params = new URLSearchParams({ status, stage });
      if (track) params.set("track", track);
      if (country) params.set("country", country);
      if (cohortStage) {
        params.set("cohortStage", cohortStage);
        params.set("cohortActive", cohortActive);
      }
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
  }, [status, track, country, stage, cohortStage, cohortActive]);

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

  // When a template is picked, prefill the subject with its default, seed
  // every variable from its `defaultValue` so the admin can preview right
  // away and edit any field before sending.
  function pickTemplate(id: string) {
    if (!id) {
      setTemplateId("");
      setTemplateVars({});
      return;
    }
    const tpl = getTemplate(id);
    if (!tpl) return;
    setTemplateId(id);
    setSubject(tpl.defaultSubject);
    setMessage(""); // template mode ignores the message textarea
    const seed: Record<string, string> = {};
    for (const v of tpl.variables) seed[v.name] = v.defaultValue ?? "";
    setTemplateVars(seed);
    setShowPreview(false);
  }

  const missingTemplateVars = activeTemplate
    ? activeTemplate.variables.filter((v) => v.required && !(templateVars[v.name]?.trim() ?? ""))
    : [];

  async function send() {
    if (recipientCount === 0 || !subject.trim()) return;
    if (!activeTemplate && !message.trim()) return;
    if (activeTemplate && missingTemplateVars.length > 0) {
      setToast(`Fill the required template fields: ${missingTemplateVars.map((v) => v.label).join(", ")}.`);
      return;
    }
    const who =
      sendMode === "all"
        ? `all ${total} applicant${total === 1 ? "" : "s"} matching the current filters`
        : `the ${selected.size} hand-picked recipient${selected.size === 1 ? "" : "s"}`;
    const what = activeTemplate ? `the "${activeTemplate.name}" template` : "this newsletter";
    if (!confirm(`Send ${what} to ${who}? It queues for delivery and sends in the background.`)) {
      return;
    }
    const totpCode = promptTotpCode();
    if (totpCode === null) return;
    setSending(true);
    setToast(null);
    try {
      const baseFields = activeTemplate
        ? { subject, templateId: activeTemplate.id, variables: templateVars }
        : { subject, message };
      const payload =
        sendMode === "all"
          ? {
              ...baseFields,
              totpCode,
              sendToAll: true,
              filters: cohortStage
                ? { cohortStage, cohortActive }
                : { status, track, country, stage },
            }
          : { ...baseFields, totpCode, applicationIds: Array.from(selected) };
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
        setTemplateId("");
        setTemplateVars({});
        setShowPreview(false);
      }
    } catch {
      setToast("Network error while queueing.");
    } finally {
      setSending(false);
    }
  }

  const allChecked = recipients.length > 0 && selected.size === recipients.length;
  const canSend =
    recipientCount > 0 &&
    subject.trim() !== "" &&
    (activeTemplate ? missingTemplateVars.length === 0 : message.trim() !== "");

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

        {/* Live-cohort targeting — the people actually IN a stage right now. */}
        <div className="mb-3 rounded-lg border border-blue/30 bg-blue/[0.03] p-3">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-blue" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Message a live stage cohort
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Reach the people <strong className="text-foreground">currently in a stage</strong> (the
            actual interns competing, not the applicant pool). When set, this
            overrides the applicant filters below.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Currently in stage</label>
              <select
                value={cohortStage}
                onChange={(e) => setCohortStage(e.target.value)}
                className="w-full p-2 border border-border rounded-lg text-sm bg-white"
              >
                <option value="">— off (use applicant filters) —</option>
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i} value={`STAGE_${i}`}>
                    Stage {i}
                    {i === 4 ? " (current)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Who</label>
              <select
                value={cohortActive}
                onChange={(e) => setCohortActive(e.target.value)}
                disabled={!cohortStage}
                className="w-full p-2 border border-border rounded-lg text-sm bg-white disabled:opacity-50"
              >
                <option value="active">Still in the running (active only)</option>
                <option value="all">Everyone who reached this stage (incl. eliminated)</option>
              </select>
            </div>
          </div>
        </div>

        <div
          className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-3 ${
            cohortStage ? "opacity-40 pointer-events-none" : ""
          }`}
        >
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 border border-border rounded-lg text-sm bg-white"
            >
              <option value="all">Everyone who applied (joined + eliminated)</option>
              <option value="pending">Pending</option>
              <option value="queued_approved">Awaiting welcome email</option>
              <option value="approved">Approved (joined)</option>
              <option value="rejected">Rejected (did not continue)</option>
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

      {/* ───────── Templates ───────── */}
      <section className="mb-4 bg-white border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-blue" />
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Start from a designed template
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Pre-built HTML emails with the UBI design, accessible colours, subtle animations, and the sponsor block. Pick one to skip the plain-text composer.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {NEWSLETTER_TEMPLATES.map((tpl) => {
            const isActive = templateId === tpl.id;
            return (
              <button
                key={tpl.id}
                onClick={() => pickTemplate(isActive ? "" : tpl.id)}
                className={`text-left p-4 rounded-xl border-2 transition ${
                  isActive
                    ? "border-blue bg-blue/5 ring-2 ring-blue/20"
                    : "border-border bg-white hover:border-blue/40 hover:bg-blue/[0.02]"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-sm font-bold text-foreground">{tpl.name}</span>
                  {isActive && (
                    <span className="text-[10px] font-bold text-blue bg-blue/10 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{tpl.description}</p>
                <div className="mt-2 text-[11px] text-muted-foreground/70">
                  {(() => {
                    const filled = tpl.variables.filter((v) => v.defaultValue && v.defaultValue.length > 0).length;
                    const total = tpl.variables.length;
                    if (total === 0) return "✓ No fields — pre-loaded";
                    if (filled === total) return `✓ ${total} field${total === 1 ? "" : "s"} — all pre-filled, editable`;
                    if (filled > 0) return `${filled}/${total} pre-filled · ${total - filled} to fill`;
                    return `${total} field${total === 1 ? "" : "s"} to fill`;
                  })()}
                </div>
              </button>
            );
          })}
        </div>
        {activeTemplate && (
          <button
            onClick={() => pickTemplate("")}
            className="mt-3 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            ← back to plain-text composer
          </button>
        )}
      </section>

      {/* Composer */}
      <section className="bg-white border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          {activeTemplate ? (
            <Sparkles className="h-4 w-4 text-blue" />
          ) : (
            <FileText className="h-4 w-4 text-muted-foreground" />
          )}
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {activeTemplate ? `Compose · ${activeTemplate.name}` : "Compose · plain text"}
          </h2>
        </div>

        <label className="block text-xs text-muted-foreground mb-1">Subject</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={activeTemplate?.defaultSubject ?? "Newsletter subject"}
          className="w-full p-2 border border-border rounded-lg text-sm mb-3"
        />

        {activeTemplate ? (
          <>
            {activeTemplate.variables.length > 0 ? (
              <div className="mb-3 space-y-3">
                {activeTemplate.variables.map((v) => (
                  <div key={v.name}>
                    <label className="block text-xs text-muted-foreground mb-1">
                      {v.label}
                      {v.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    {v.multiline ? (
                      <textarea
                        value={templateVars[v.name] ?? ""}
                        onChange={(e) => setTemplateVars((prev) => ({ ...prev, [v.name]: e.target.value }))}
                        rows={4}
                        placeholder={v.placeholder}
                        className="w-full p-2 border border-border rounded-lg text-sm resize-y"
                      />
                    ) : (
                      <input
                        value={templateVars[v.name] ?? ""}
                        onChange={(e) => setTemplateVars((prev) => ({ ...prev, [v.name]: e.target.value }))}
                        placeholder={v.placeholder}
                        className="w-full p-2 border border-border rounded-lg text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                ✓ This template has no fields — pre-loaded and ready. Preview, then send.
              </div>
            )}
            <div className="text-xs text-muted-foreground mb-3 leading-relaxed space-y-1">
              <p>
                The body is rendered from the designed template. Each recipient&apos;s
                real name fills in for <span className="font-mono text-blue">{"{First name}"}</span> in both the subject and the body.
              </p>
              <p>
                <strong>Links</strong> in any prose field: turn words into a link with{" "}
                <span className="font-mono text-blue">{"[your words](https://link)"}</span>. Plain http(s) URLs become clickable on their own.{" "}
                <strong>Emphasis:</strong> <span className="font-mono text-blue">{"<strong>bold</strong>"}</span> and{" "}
                <span className="font-mono text-blue">{"<em>italic</em>"}</span> work too.
              </p>
            </div>
          </>
        ) : (
          <>
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
          </>
        )}

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
            disabled={!subject.trim() || (!activeTemplate && !message.trim())}
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
          const previewBody = activeTemplate
            ? renderTemplate({ templateId: activeTemplate.id, vars: templateVars, firstName: previewName })?.body ?? ""
            : renderBroadcastEmail({ message: personalizeText(message, previewName) });
          const previewSubject = activeTemplate
            ? personalizeText(subject || activeTemplate.defaultSubject, previewName).replace(/\{\{(\w+)\}\}/g, (_m, k) => templateVars[k] ?? "")
            : personalizeText(subject, previewName);
          return (
            <div className="mt-4 border border-border rounded-xl overflow-hidden">
              <div className="bg-muted/30 border-b border-border px-4 py-2.5 text-xs">
                <div className="text-muted-foreground">
                  How the email looks in the inbox. Merge fields show a sample name
                  (<strong className="text-foreground">{previewName}</strong>) — each
                  recipient gets their own. {activeTemplate && (
                    <span className="text-blue font-medium">Template: {activeTemplate.name}.</span>
                  )}
                </div>
                <div className="mt-1 text-foreground">
                  <span className="text-muted-foreground">Subject:</span>{" "}
                  <strong>{previewSubject.trim() || "(no subject)"}</strong>
                </div>
              </div>
              <iframe
                title="Newsletter preview"
                className="w-full bg-white"
                style={{ height: 540, border: 0 }}
                srcDoc={previewBody}
              />
            </div>
          );
        })()}
      </section>
    </div>
  );
}
