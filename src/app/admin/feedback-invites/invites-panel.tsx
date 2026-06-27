"use client";

import { useMemo, useState } from "react";

type Row = {
  id: string;
  token: string;
  email: string;
  name: string | null;
  outcome: string | null;
  lastStage: number | null;
  sentAt: string | null;
  respondedAt: string | null;
  link: string;
};

export function FeedbackInvitesPanel({
  rows,
  internCount,
}: {
  rows: Row[];
  internCount: number;
  origin: string;
}) {
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState("");
  const [filter, setFilter] = useState("");

  const stats = useMemo(() => {
    const responded = rows.filter((r) => r.respondedAt).length;
    const sent = rows.filter((r) => r.sentAt).length;
    return { total: rows.length, sent, responded };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = filter.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter(
      (r) => (r.name ?? "").toLowerCase().includes(q) || r.email.includes(q)
    );
  }, [rows, filter]);

  async function post(action: string) {
    setBusy(action);
    setMsg("");
    try {
      const res = await fetch("/api/admin/feedback-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Failed.");
        return;
      }
      if (action === "generate") {
        setMsg(`Generated ${data.created} new invite(s). ${data.total} total. Reloading...`);
      } else {
        setMsg(`Marked ${data.updated} as sent. Reloading...`);
      }
      setTimeout(() => window.location.reload(), 900);
    } catch {
      setMsg("Network error.");
    } finally {
      setBusy("");
    }
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(""), 1500);
    });
  }

  function downloadCsv() {
    const header = "name,email,outcome,lastStage,sent,responded,link\n";
    const body = rows
      .map((r) =>
        [
          `"${(r.name ?? "").replace(/"/g, "'")}"`,
          r.email,
          r.outcome ?? "",
          r.lastStage ?? "",
          r.sentAt ? "yes" : "no",
          r.respondedAt ? "yes" : "no",
          r.link,
        ].join(",")
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "feedback-invites.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Feedback Invites</h1>
        <p className="text-sm text-muted mt-1">
          Generate a unique, no-login feedback link for every intern (including those who can no
          longer sign in), export them for a mail-merge, then track responses. Aggregates appear on
          the Analytics dashboard.
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          ["Interns in DB", internCount],
          ["Invites", stats.total],
          ["Marked sent", stats.sent],
          ["Responded", stats.responded],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-surface border border-border p-4">
            <div className="text-xs text-muted uppercase tracking-wide">{label}</div>
            <div className="text-2xl font-bold text-foreground tabular-nums">{value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => post("generate")}
          disabled={!!busy}
          className="px-5 py-2.5 rounded-full bg-blue text-white text-sm font-semibold disabled:opacity-50 hover:bg-blue/90"
        >
          {busy === "generate" ? "Generating..." : "Generate missing invites"}
        </button>
        <button
          onClick={downloadCsv}
          disabled={rows.length === 0}
          className="px-5 py-2.5 rounded-full border border-border text-sm font-semibold disabled:opacity-50 hover:bg-surface-hover"
        >
          Download CSV
        </button>
        <button
          onClick={() => post("mark-sent")}
          disabled={!!busy || rows.length === 0}
          className="px-5 py-2.5 rounded-full border border-border text-sm font-semibold disabled:opacity-50 hover:bg-surface-hover"
        >
          {busy === "mark-sent" ? "Marking..." : "Mark all as sent"}
        </button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>

      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter by name or email..."
        className="w-full sm:w-80 rounded-xl border border-border bg-surface px-4 py-2 text-sm"
      />

      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-border bg-surface-hover">
                <th className="py-2.5 px-4 font-medium">Name</th>
                <th className="py-2.5 px-3 font-medium">Email</th>
                <th className="py-2.5 px-3 font-medium">Outcome</th>
                <th className="py-2.5 px-3 font-medium text-center">Sent</th>
                <th className="py-2.5 px-3 font-medium text-center">Responded</th>
                <th className="py-2.5 px-3 font-medium text-right">Link</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border/40">
                  <td className="py-2 px-4 text-foreground">{r.name || "—"}</td>
                  <td className="py-2 px-3 text-muted">{r.email}</td>
                  <td className="py-2 px-3 capitalize">{r.outcome ?? "—"}</td>
                  <td className="py-2 px-3 text-center">{r.sentAt ? "✓" : ""}</td>
                  <td className="py-2 px-3 text-center">{r.respondedAt ? "✅" : ""}</td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => copy(r.link, r.id)}
                      className="text-blue hover:underline text-xs font-medium"
                    >
                      {copied === r.id ? "Copied!" : "Copy link"}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    {rows.length === 0 ? "No invites yet. Click Generate." : "No matches."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
