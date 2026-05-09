"use client";

import { useEffect, useState } from "react";
import { Mail, AlertTriangle, CheckCircle2, Clock, RefreshCw, Loader2 } from "lucide-react";

interface EmailItem {
  id: string;
  toEmail: string;
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
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [retrying, setRetrying] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "ALL") params.set("status", filter);
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
    load();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function retry(ids: string[]) {
    if (ids.length === 0) return;
    if (!confirm(`Retry ${ids.length} email${ids.length === 1 ? "" : "s"}? Each will be re-sent immediately.`)) return;
    setRetrying(true);
    setToast(null);
    try {
      const res = await fetch(`/api/admin/emails/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
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

      {toast && (
        <div className="mb-4 p-3 bg-blue/10 border border-blue/30 rounded-lg text-sm text-foreground">
          {toast}
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
            disabled={selected.size === 0 || retrying}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-blue text-white hover:opacity-90 disabled:opacity-40"
          >
            {retrying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Retry selected
          </button>
          {filter === "FAILED" && items.length > 0 && (
            <button
              onClick={() => retry(items.map((i) => i.id))}
              disabled={retrying}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-border hover:bg-muted/50 disabled:opacity-40"
            >
              Retry all failed
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
          {filter === "FAILED"
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
                  <td className="p-3 font-mono text-xs">{item.toEmail}</td>
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
