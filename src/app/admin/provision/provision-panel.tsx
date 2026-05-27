"use client";

import { useState } from "react";
import { UserPlus, Loader2, Send, CheckCircle2, AlertCircle } from "lucide-react";

interface ResultRow {
  email: string;
  name: string;
  status: "created" | "existing-updated" | "error";
}

const PLACEHOLDER = `Paste names + emails, e.g.

Name: Jane Doe
Email: jane@example.com

Name: John Smith
Email: john@example.com

(also accepts "Jane Doe <jane@example.com>" or "Jane Doe, jane@example.com")`;

export function ProvisionPanel() {
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState<null | "preview" | "provision">(null);
  const [parsed, setParsed] = useState<number | null>(null);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function post(body: Record<string, unknown>) {
    const res = await fetch("/api/admin/provision-graders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError((data as { error?: string }).error || "Request failed");
      return null;
    }
    return data;
  }

  async function preview() {
    setError(null);
    setResults(null);
    setSummary(null);
    setBusy("preview");
    try {
      const data = await post({ raw, dryRun: true });
      if (data) setParsed(data.parsed as number);
    } finally {
      setBusy(null);
    }
  }

  async function provision() {
    setError(null);
    if (
      !confirm(
        "Provision these grader accounts and email each their login?\n\n" +
          "Each person gets a grader account (or has their password reset if they already exist) " +
          "and a login email is queued. This sends real emails."
      )
    ) {
      return;
    }
    setBusy("provision");
    setResults(null);
    setSummary(null);
    try {
      const data = await post({ raw });
      if (data) {
        setResults(data.results as ResultRow[]);
        setSummary(
          `${data.created} created, ${data.existing} updated, ${data.failed} failed — ${data.total} total. Login emails queued.`
        );
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <UserPlus className="h-6 w-6 text-blue" />
          <h1 className="text-2xl font-bold text-foreground">Provision Graders</h1>
        </div>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Create grader accounts for people brought on to score stage reports. Paste their names +
          emails and each gets a grader account plus a login email. They sign in with their{" "}
          <strong>email</strong> and a temporary password, and set a new password on first login.
          Re-running for an existing email just resets the password and re-sends the email.
        </p>
      </header>

      {error && (
        <div className="mb-5 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {summary && (
        <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-900 flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{summary}</span>
        </div>
      )}

      <section className="bg-white border border-border rounded-xl p-5">
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-2">Names &amp; emails</label>
          <textarea
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              setParsed(null);
            }}
            placeholder={PLACEHOLDER}
            rows={12}
            className="w-full p-3 border border-border rounded-lg bg-white text-sm font-mono"
          />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <button
            onClick={preview}
            disabled={busy != null || !raw.trim()}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted/50 disabled:opacity-50"
          >
            {busy === "preview" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Preview"}
          </button>
          <button
            onClick={provision}
            disabled={busy != null || !raw.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy === "provision" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Provision &amp; email
          </button>
          {parsed != null && (
            <span className="text-sm text-muted-foreground">
              Parsed <strong className="text-foreground">{parsed}</strong> {parsed === 1 ? "entry" : "entries"}.
            </span>
          )}
        </div>
      </section>

      {results && (
        <section className="mt-6 bg-white border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border text-xs font-semibold uppercase tracking-wide text-foreground">
            Results ({results.length})
          </div>
          <ul className="divide-y divide-border max-h-[28rem] overflow-y-auto">
            {results.map((r) => (
              <li key={r.email} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">{r.name}</p>
                  <p className="text-[11px] font-mono text-muted-foreground truncate">{r.email}</p>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ResultRow["status"] }) {
  const map = {
    created: { label: "Created", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    "existing-updated": { label: "Updated", cls: "bg-blue/5 text-blue border-blue/30" },
    error: { label: "Failed", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  } as const;
  const s = map[status];
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-md border uppercase tracking-wide ${s.cls}`}>
      {s.label}
    </span>
  );
}
