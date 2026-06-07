"use client";

import { useEffect, useState } from "react";
import { Mail, AlertTriangle, CheckCircle2, Clock, RefreshCw, Loader2, Search, Trash2, Pencil } from "lucide-react";
import { promptTotpCode } from "@/lib/totp-prompt";

interface EmailItem {
  id: string;
  toEmail: string;
  applicantName: string | null;
  subject: string;
  status: "PENDING" | "SENT" | "FAILED";
  attempts: number;
  sentAt: string | null;
  failReason: string | null;
  enqueuedAt: string;
  context: Record<string, unknown> | null;
}

type StatusFilter = "FAILED" | "PENDING" | "SENT" | "ALL";

export default function AdminEmailsPage() {
  const [items, setItems] = useState<EmailItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<StatusFilter>("FAILED");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [retrying, setRetrying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // Retrying re-sends mail, so it is locked to the single authorised account.
  const [canSend, setCanSend] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setCanSend(d.permissions?.emailSendAllowed === true))
      .catch(() => setCanSend(false));
  }, []);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "ALL") params.set("status", filter);
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/admin/emails?${params}`);
      const data = await res.json();
      setItems(data.items ?? []);
      setCounts(data.counts ?? {});
      setSelected(new Set());
    } catch {
      setToast("Failed to load emails.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [filter, search]); // eslint-disable-line react-hooks/exhaustive-deps

  async function retry(ids: string[]) {
    if (ids.length === 0) return;
    if (!confirm(`Retry ${ids.length} email${ids.length === 1 ? "" : "s"}? Each will be re-sent immediately.`)) return;
    const totpCode = promptTotpCode();
    if (totpCode === null) return;
    setRetrying(true);
    setToast(null);
    try {
      const res = await fetch(`/api/admin/emails/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, totpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast(`Retry failed: ${data.error || "unknown"}`);
      } else {
        setToast(`Retry complete: ${data.sent} sent, ${data.failed} failed.`);
        load();
      }
    } catch {
      setToast("Network error during retry.");
    } finally {
      setRetrying(false);
    }
  }

  async function removeEmails(ids: string[]) {
    if (ids.length === 0) return;
    if (
      !confirm(
        `Delete ${ids.length} email${ids.length === 1 ? "" : "s"} from the queue? ` +
          "They will NOT be sent — this just removes them. This cannot be undone."
      )
    ) {
      return;
    }
    setDeleting(true);
    setToast(null);
    try {
      const res = await fetch(`/api/admin/emails`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast(`Delete failed: ${data.error || "unknown"}`);
      } else {
        setToast(`Deleted ${data.deleted} email${data.deleted === 1 ? "" : "s"}.`);
        load();
      }
    } catch {
      setToast("Network error during delete.");
    } finally {
      setDeleting(false);
    }
  }

  async function editRecipient(item: EmailItem) {
    const newEmail = window.prompt(
      `Correct the recipient for this email.\n\nCurrent: ${item.toEmail}\n\nNew email:`,
      item.toEmail
    );
    if (newEmail == null) return; // cancelled
    const cleaned = newEmail.trim();
    if (!cleaned || cleaned.toLowerCase() === item.toEmail.toLowerCase()) return;
    const totpCode = promptTotpCode();
    if (totpCode === null) return;

    setEditingId(item.id);
    setToast(null);
    try {
      const res = await fetch(`/api/admin/emails/${item.id}/edit-recipient`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: cleaned, totpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast(`Couldn't update: ${data.error || "unknown error"}`);
      } else {
        setToast(
          `Recipient updated to ${data.newEmail}. The email will resend within ~5 minutes (or click "Retry selected" to send it now).`
        );
        load();
      }
    } catch {
      setToast("Network error while updating the recipient.");
    } finally {
      setEditingId(null);
    }
  }

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function toggleAll() {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i.id)));
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Mail className="h-6 w-6 text-blue" />
          <h1 className="text-2xl font-bold text-foreground">Email Queue</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Every email the system tried to send. Failed sends stay here for you to retry.
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <FilterChip
          label="Failed"
          count={counts.FAILED ?? 0}
          icon={AlertTriangle}
          color="text-rose-700"
          active={filter === "FAILED"}
          onClick={() => setFilter("FAILED")}
        />
        <FilterChip
          label="Pending"
          count={counts.PENDING ?? 0}
          icon={Clock}
          color="text-amber-700"
          active={filter === "PENDING"}
          onClick={() => setFilter("PENDING")}
        />
        <FilterChip
          label="Sent"
          count={counts.SENT ?? 0}
          icon={CheckCircle2}
          color="text-emerald-700"
          active={filter === "SENT"}
          onClick={() => setFilter("SENT")}
        />
        <FilterChip
          label="All"
          count={(counts.FAILED ?? 0) + (counts.PENDING ?? 0) + (counts.SENT ?? 0)}
          icon={Mail}
          color="text-blue"
          active={filter === "ALL"}
          onClick={() => setFilter("ALL")}
        />
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search decision emails by applicant name…"
          className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue/30"
        />
      </div>
      {search.trim() && (
        <p className="mb-4 text-xs text-muted-foreground">
          Showing stage pass/fail emails for applicants matching “{search.trim()}”.
        </p>
      )}

      {toast && (
        <div className="mb-4 p-3 bg-blue/10 border border-blue/30 rounded-lg text-sm text-foreground">
          {toast}
        </div>
      )}

      {!canSend && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          Retrying re-sends email, so it is restricted to the programme owner&apos;s account. You can
          view the queue here, but the retry buttons are disabled.
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-muted-foreground">
          {selected.size > 0
            ? `${selected.size} selected`
            : `${items.length} email${items.length === 1 ? "" : "s"}`}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => retry(Array.from(selected))}
            disabled={selected.size === 0 || retrying || !canSend}
            title={canSend ? undefined : "Only the authorised account can send emails."}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-blue text-white hover:opacity-90 disabled:opacity-40"
          >
            {retrying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Retry selected
          </button>
          {filter === "FAILED" && items.length > 0 && (
            <button
              onClick={() => retry(items.map((i) => i.id))}
              disabled={retrying || !canSend}
              title={canSend ? undefined : "Only the authorised account can send emails."}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-border hover:bg-muted/50 disabled:opacity-40"
            >
              Retry all failed
            </button>
          )}
          <button
            onClick={() => removeEmails(Array.from(selected))}
            disabled={selected.size === 0 || deleting}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-40"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Delete selected
          </button>
          {filter === "FAILED" && items.length > 0 && (
            <button
              onClick={() => removeEmails(items.map((i) => i.id))}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-40"
            >
              Delete all failed
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-8 bg-white border border-border rounded-xl text-center text-muted-foreground">
          Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 bg-white border border-border rounded-xl text-center text-muted-foreground">
          {search.trim()
            ? `No stage pass/fail emails for applicants matching “${search.trim()}”.`
            : filter === "FAILED"
            ? "No failed emails. Everything that tried to send made it."
            : filter === "PENDING"
            ? "No pending emails."
            : filter === "SENT"
            ? "Nothing sent yet."
            : "No emails."}
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                <th className="p-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === items.length && items.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th className="p-3 text-left">Recipient</th>
                <th className="p-3 text-left">Subject</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">When</th>
                <th className="p-3 text-left">Reason</th>
                {canSend && <th className="p-3 text-left w-32">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-muted/20">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggle(item.id)}
                    />
                  </td>
                  <td className="p-3">
                    {item.applicantName && (
                      <div className="text-sm text-foreground">{item.applicantName}</div>
                    )}
                    <div className="font-mono text-xs text-muted-foreground">{item.toEmail}</div>
                  </td>
                  <td className="p-3">{item.subject}</td>
                  <td className="p-3">
                    <StatusPill status={item.status} attempts={item.attempts} />
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(item.sentAt ?? item.enqueuedAt).toLocaleString()}
                  </td>
                  <td className="p-3 text-xs text-rose-700 max-w-xs truncate">
                    {item.failReason ?? ""}
                  </td>
                  {canSend && (
                    <td className="p-3">
                      <button
                        onClick={() => editRecipient(item)}
                        disabled={editingId === item.id}
                        title="Correct a typo'd recipient and resend"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted/50 disabled:opacity-40"
                      >
                        {editingId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Pencil className="h-3.5 w-3.5" />
                        )}
                        Edit & resend
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  count,
  icon: Icon,
  color,
  active,
  onClick,
}: {
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-left transition-colors ${
        active
          ? "bg-blue/10 border-blue/40"
          : "bg-white border-border hover:bg-muted/30"
      }`}
    >
      <Icon className={`h-4 w-4 ${color}`} />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className="text-lg font-bold text-foreground">{count}</div>
      </div>
    </button>
  );
}

function StatusPill({ status, attempts }: { status: string; attempts: number }) {
  if (status === "FAILED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
        <AlertTriangle className="h-3 w-3" />
        Failed{attempts > 1 ? ` (${attempts}×)` : ""}
      </span>
    );
  }
  if (status === "SENT") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="h-3 w-3" />
        Sent
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
      <Clock className="h-3 w-3" />
      Pending
    </span>
  );
}
