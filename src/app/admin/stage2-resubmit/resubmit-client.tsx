"use client";

import { useState } from "react";
import { Send, Loader2, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { promptTotpCode } from "@/lib/totp-prompt";

type Row = { name: string; email: string; template: "permission" | "reorg" | "missing"; specifics: string };

const TEMPLATE_LABEL: Record<Row["template"], string> = {
  permission: "Can't open the link (re-share / move off OneDrive)",
  reorg: "Submission came through empty (reorganize)",
  missing: "Some deliverables missing (add the rest)",
};

const PLACEHOLDER = `[
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "template": "permission",
    "specifics": "Your Google Drive folder asks us to sign in and shows no files."
  }
]`;

export function Stage2ResubmitClient() {
  const [raw, setRaw] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: string[]; failed: { email: string; error: string }[] } | null>(null);

  function load() {
    setResult(null);
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error("Top level must be a JSON array.");
      const valid: Row[] = [];
      for (const r of parsed) {
        if (!r?.email || !r?.specifics || !["permission", "reorg", "missing"].includes(r?.template)) {
          throw new Error(`Each row needs email, specifics, and template (permission/reorg/missing). Bad row: ${JSON.stringify(r)}`);
        }
        valid.push({ name: r.name ?? "", email: r.email, template: r.template, specifics: r.specifics });
      }
      setRows(valid);
      setParseError(null);
    } catch (e) {
      setRows([]);
      setParseError(e instanceof Error ? e.message : "Could not parse JSON.");
    }
  }

  async function send() {
    if (rows.length === 0) return;
    const code = promptTotpCode();
    if (!code) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/stage2-resubmit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totpCode: code, recipients: rows }),
      });
      const data = await res.json();
      if (!res.ok) {
        setParseError(data?.error ?? "Send failed.");
      } else {
        setResult({ sent: data.sent ?? [], failed: data.failed ?? [] });
      }
    } catch {
      setParseError("Network error while sending.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <Mail size={22} color="#2563EB" />
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>Stage 2 re-share emails</h1>
      </div>
      <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, margin: "0 0 22px" }}>
        Sends the &quot;we could not open your capstone&quot; email to interns whose Stage 2 submission could not be
        read. Paste the recipients below, review, then send. Sending is locked to the authorised account and asks
        for your 2FA code.
      </p>

      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
        Recipients (JSON)
      </label>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={12}
        style={{
          width: "100%", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12.5, lineHeight: 1.6,
          padding: 14, border: "1px solid #CBD5E1", borderRadius: 10, color: "#0F172A", resize: "vertical",
        }}
      />
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button
          onClick={load}
          style={{ background: "#0F172A", color: "white", border: "none", borderRadius: 9, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          Load &amp; preview
        </button>
        {rows.length > 0 && (
          <button
            onClick={send}
            disabled={sending}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: sending ? "#93C5FD" : "#2563EB", color: "white", border: "none", borderRadius: 9, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: sending ? "default" : "pointer" }}
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Send {rows.length} email{rows.length === 1 ? "" : "s"}
          </button>
        )}
      </div>

      {parseError && (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 16, padding: "12px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, color: "#991B1B", fontSize: 13, lineHeight: 1.6 }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{parseError}</span>
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: "0 0 10px" }}>
            {rows.length} recipient{rows.length === 1 ? "" : "s"} ready
          </p>
          <div style={{ border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
            {rows.map((r, i) => (
              <div key={r.email} style={{ padding: "12px 14px", borderTop: i === 0 ? "none" : "1px solid #F1F5F9" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontWeight: 600, color: "#0F172A", fontSize: 14 }}>{r.name || r.email}</span>
                  <span style={{ color: "#64748B", fontSize: 13 }}>{r.email}</span>
                </div>
                <div style={{ color: "#2563EB", fontSize: 12, fontWeight: 600, margin: "4px 0 6px" }}>{TEMPLATE_LABEL[r.template]}</div>
                <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.6 }}>{r.specifics}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div style={{ marginTop: 22, padding: "14px 16px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#166534", fontWeight: 700, fontSize: 14 }}>
            <CheckCircle2 size={16} /> Sent {result.sent.length} of {result.sent.length + result.failed.length}
          </div>
          {result.failed.length > 0 && (
            <ul style={{ margin: "10px 0 0", paddingLeft: 18, color: "#991B1B", fontSize: 13, lineHeight: 1.6 }}>
              {result.failed.map((f) => (
                <li key={f.email}>{f.email}: {f.error}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
