"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const API = "/api/admin/showcase/cohort-one";

async function send(method: "PATCH" | "POST", path: string, body: unknown): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await fetch(`${API}/${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, data };
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Settings = { published: boolean; votingState: string; opensAt: string | null; closesAt: string | null };

export function ShowcaseControls({ settings, prepared, blockers }: { settings: Settings; prepared: boolean; blockers: string[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [totp, setTotp] = useState("");
  const [closesAt, setClosesAt] = useState(toLocalInput(settings.closesAt));

  async function patch(body: Record<string, unknown>, label: string) {
    setBusy(true);
    setErr(null);
    setOkMsg(null);
    const res = await send("PATCH", "settings", body);
    setBusy(false);
    if (!res.ok) {
      const list = Array.isArray(res.data.blockers) ? ` ${(res.data.blockers as string[]).join(" ")}` : "";
      setErr(`${String(res.data.error ?? "Update failed.")}${list}`);
      return;
    }
    setOkMsg(label);
    setTotp("");
    router.refresh();
  }

  const btn = "inline-flex items-center gap-2 border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-hover disabled:opacity-50";
  const state = settings.votingState;

  if (!prepared) return <p className="mt-4 text-sm text-muted">Controls appear once the showcase is prepared.</p>;

  return (
    <div className="mt-5 space-y-4">
      <div className="flex flex-wrap gap-2">
        <button className={btn} disabled={busy} onClick={() => patch({ published: !settings.published }, settings.published ? "Showcase unpublished." : "Showcase published.")}>
          {settings.published ? "Unpublish showcase" : "Publish showcase"}
        </button>
        {state === "OPEN" && <button className={btn} disabled={busy} onClick={() => patch({ votingState: "PAUSED" }, "Voting paused.")}>Pause voting</button>}
        {state === "OPEN" && <button className={btn} disabled={busy} onClick={() => confirm("Close voting? Closing is meant to be final.") && patch({ votingState: "CLOSED" }, "Voting closed.")}>Close voting</button>}
        {state === "PAUSED" && <button className={btn} disabled={busy} onClick={() => confirm("Close voting? Closing is meant to be final.") && patch({ votingState: "CLOSED" }, "Voting closed.")}>Close voting</button>}
      </div>

      {state !== "OPEN" && state !== "CLOSED" && (
        <form
          className="flex flex-wrap items-end gap-3 border border-border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!confirm(state === "PAUSED" ? "Resume voting now?" : "Open voting to the Cohort One roll now?")) return;
            void patch({ votingState: "OPEN", totpCode: totp }, state === "PAUSED" ? "Voting resumed." : "Voting opened.");
          }}
        >
          <div>
            <label htmlFor="sc-totp" className="block text-xs font-semibold text-muted">2FA code (authorised account only)</label>
            <input id="sc-totp" inputMode="numeric" maxLength={6} value={totp} onChange={(e) => setTotp(e.target.value.replace(/\D/g, ""))} className="mt-1 w-32 border border-border bg-background px-3 py-2 text-sm text-foreground" />
          </div>
          <button type="submit" className="inline-flex items-center gap-2 bg-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={busy || totp.length !== 6 || blockers.length > 0}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {state === "PAUSED" ? "Resume voting" : "Open voting"}
          </button>
          {blockers.length > 0 && <p className="text-xs text-danger">Resolve the launch blockers first.</p>}
        </form>
      )}

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void patch({ closesAt: closesAt ? new Date(closesAt).toISOString() : null }, closesAt ? "Deadline saved." : "Deadline removed.");
        }}
      >
        <div>
          <label htmlFor="sc-closes" className="block text-xs font-semibold text-muted">Optional voting deadline (your local time)</label>
          <input id="sc-closes" type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} className="mt-1 border border-border bg-background px-3 py-2 text-sm text-foreground" />
        </div>
        <button type="submit" className={btn} disabled={busy}>Save deadline</button>
      </form>

      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      {okMsg && <p role="status" className="text-sm text-emerald">{okMsg}</p>}
    </div>
  );
}

export function EntryControls({ entryId, published, linkNote }: { entryId: string; published: boolean; linkNote: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(linkNote ?? "");
  const [err, setErr] = useState<string | null>(null);

  async function update(body: Record<string, unknown>) {
    setBusy(true);
    setErr(null);
    const res = await send("PATCH", "entries", { entryId, ...body });
    setBusy(false);
    if (!res.ok) setErr(String(res.data.error ?? "Update failed."));
    else router.refresh();
  }

  return (
    <div className="space-y-2">
      <button
        className="border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-hover disabled:opacity-50"
        disabled={busy}
        onClick={() => (published ? confirm("Unpublish this entry? It will disappear from the public page and cannot receive votes.") : true) && update({ published: !published })}
      >
        {published ? "Published · unpublish" : "Unpublished · publish"}
      </button>
      <form
        className="flex gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          void update({ linkNote: note || null });
        }}
      >
        <input aria-label="Link disposition note" placeholder="Link disposition note" value={note} onChange={(e) => setNote(e.target.value)} className="w-48 border border-border bg-background px-2 py-1 text-xs text-foreground" />
        <button className="border border-border px-2 py-1 text-xs text-foreground hover:bg-surface-hover" disabled={busy}>Save</button>
      </form>
      {err && <p className="text-xs text-danger">{err}</p>}
    </div>
  );
}

type Check = { entryId: string; kind: string; url: string | null; ok: boolean; status: number | null; note: string };

export function LinkCheckPanel({ entries }: { entries: { id: string; label: string; linkNote: string | null }[] }) {
  const [busy, setBusy] = useState(false);
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [at, setAt] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    const res = await send("POST", "link-check", {});
    setBusy(false);
    if (res.ok) {
      setChecks(res.data.checks as Check[]);
      setAt(String(res.data.checkedAt));
    }
  }

  return (
    <section className="border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Pre-launch link check</h2>
          <p className="text-sm text-muted">Probes every project and video link from the server. A Drive file that redirects to Google sign-in is not publicly shared.</p>
        </div>
        <button onClick={() => void run()} disabled={busy} className="inline-flex items-center gap-2 border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-hover disabled:opacity-50">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Check all links
        </button>
      </div>
      {checks && (
        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-xs uppercase text-muted"><tr><th className="py-2">Entry</th><th>Link</th><th>Result</th><th>Disposition</th></tr></thead>
          <tbody className="divide-y divide-border">
            {checks.map((c) => {
              const entry = entries.find((e) => e.id === c.entryId);
              return (
                <tr key={`${c.entryId}-${c.kind}`}>
                  <td className="py-2 pr-3 text-foreground">{entry?.label}</td>
                  <td className="pr-3 text-muted">{c.kind}</td>
                  <td className={`pr-3 font-semibold ${c.ok ? "text-emerald" : "text-danger"}`}>{c.ok ? "OK" : "Check"} · {c.note}</td>
                  <td className="text-muted">{entry?.linkNote ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {at && <p className="mt-2 text-xs text-muted">Checked {at}</p>}
    </section>
  );
}

export function BallotResetForm() {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [totp, setTotp] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const router = useRouter();

  return (
    <form
      className="border border-border bg-surface p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!confirm("Delete this voter's ballot so they can vote again? This is audited.")) return;
        setBusy(true);
        setMsg(null);
        const res = await send("POST", "ballot-reset", { email, reason, totpCode: totp });
        setBusy(false);
        setMsg(res.ok ? { ok: true, text: "Ballot reset and audited." } : { ok: false, text: String(res.data.error ?? "Reset failed.") });
        if (res.ok) {
          setEmail("");
          setReason("");
          setTotp("");
          router.refresh();
        }
      }}
    >
      <h2 className="text-lg font-bold text-foreground">Reset a ballot</h2>
      <p className="mt-1 text-sm text-muted">Only for a documented reason (for example, a voter reports a mistaken submission). Requires the authorised account and a fresh 2FA code.</p>
      <label className="mt-4 block text-xs font-semibold text-muted" htmlFor="rs-email">Voter email</label>
      <input id="rs-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm text-foreground" />
      <label className="mt-3 block text-xs font-semibold text-muted" htmlFor="rs-reason">Reason (recorded in the audit log)</label>
      <textarea id="rs-reason" required minLength={10} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm text-foreground" rows={3} />
      <label className="mt-3 block text-xs font-semibold text-muted" htmlFor="rs-totp">2FA code</label>
      <input id="rs-totp" inputMode="numeric" maxLength={6} value={totp} onChange={(e) => setTotp(e.target.value.replace(/\D/g, ""))} className="mt-1 w-32 border border-border bg-background px-3 py-2 text-sm text-foreground" />
      <div className="mt-4">
        <button type="submit" disabled={busy || totp.length !== 6} className="inline-flex items-center gap-2 border border-danger px-4 py-2 text-sm font-semibold text-danger disabled:opacity-50">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Reset ballot
        </button>
      </div>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`mt-3 text-sm ${msg.ok ? "text-emerald" : "text-danger"}`}>{msg.text}</p>}
    </form>
  );
}
