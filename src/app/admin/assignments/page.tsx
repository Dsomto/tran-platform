"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { Card } from "@/components/ui/card";
import {
  CheckCircle2,
  ChevronRight,
  Lock,
  LockOpen,
  Users,
  Megaphone,
  Loader2,
} from "lucide-react";

interface StageRow {
  stage: string;
  label: string;
  isLocked: boolean;
  openedAt: string | null;
  atStage: number;
  submitted: number;
  graded: number;
  passed: number;
  failed: number;
}

export default function AssignmentsPage() {
  const [rows, setRows] = useState<StageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState({
    firstName: "",
    lastName: "",
    avatarUrl: null as string | null,
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => d.user && setAdmin(d.user));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/admin/stages-overview")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setRows(d.stages ?? []);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Topbar
        title="Assignments"
        subtitle="One per stage — set the deadline, set the passing grade, close submissions"
        firstName={admin.firstName}
        lastName={admin.lastName}
        avatarUrl={admin.avatarUrl}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="py-16 text-center text-muted-foreground text-sm">Loading…</div>
        ) : rows.length === 0 ? (
          <Card variant="glass" className="text-center py-12">
            <p className="text-sm text-muted">No stages configured yet.</p>
          </Card>
        ) : (
          <div className="space-y-3 max-w-4xl">
            {rows.map((r) => (
              <StageRowCard
                key={r.stage}
                row={r}
                onMutate={(next) =>
                  setRows((prev) => prev.map((row) => (row.stage === next.stage ? next : row)))
                }
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function StageRowCard({
  row,
  onMutate,
}: {
  row: StageRow;
  onMutate: (next: StageRow) => void;
}) {
  const published = row.passed + row.failed > 0;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [title, setTitle] = useState(`Stage ${row.label.replace("Stage ", "")} is open`);
  const [message, setMessage] = useState(
    `Stage ${row.label.replace("Stage ", "")} is now open. Log into your dashboard to begin.`
  );

  async function openStage() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/stage-windows/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: row.stage, title, message }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error || "Failed to open stage");
        return;
      }
      onMutate({
        ...row,
        isLocked: false,
        openedAt: j.window?.openedAt ?? new Date().toISOString(),
      });
      setOpen(false);
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function lockStage() {
    if (!confirm(`Lock ${row.label}? Interns will lose access until you open it again.`)) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/stage-windows/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: row.stage }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error || "Failed to lock stage");
        return;
      }
      onMutate({ ...row, isLocked: true });
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="group bg-white border border-border rounded-xl hover:border-blue/40 hover:shadow-sm transition-all overflow-hidden">
      <Link href={`/admin/assignments/${row.stage}`} className="block p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-foreground">{row.label}</h2>
              {row.isLocked ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <LockOpen className="w-3 h-3" /> Open to interns
                </span>
              )}
              {published && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-blue/10 text-blue border border-blue/30">
                  <CheckCircle2 className="w-3 h-3" /> Results published
                </span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Metric
                icon={Users}
                label="Interns at stage"
                value={String(row.atStage)}
              />
              <Metric
                icon={CheckCircle2}
                label="Reports"
                value={`${row.submitted} in · ${row.graded} graded`}
              />
            </div>

            {published && (
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span>
                  <strong className="text-emerald-700">{row.passed}</strong> passed
                </span>
                <span>
                  <strong className="text-rose-700">{row.failed}</strong> below threshold
                </span>
              </div>
            )}
          </div>

          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0" />
        </div>
      </Link>

      {/* Lock / Open control strip */}
      <div className="border-t border-border bg-slate-50/60 px-5 py-3">
        {err && (
          <div className="mb-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-1">
            {err}
          </div>
        )}

        {open && row.isLocked ? (
          <div className="space-y-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
              className="w-full p-2 border border-border rounded-lg text-sm bg-white"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What should participants know?"
              rows={3}
              className="w-full p-2 border border-border rounded-lg text-sm bg-white resize-y"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={openStage}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:opacity-90 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Megaphone className="h-3.5 w-3.5" />}
                Open &amp; announce
              </button>
              <button
                onClick={() => setOpen(false)}
                disabled={busy}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-white"
              >
                Cancel
              </button>
              <span className="text-xs text-muted-foreground ml-auto">
                Every active intern gets an email + dashboard announcement.
              </span>
            </div>
          </div>
        ) : row.isLocked ? (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:opacity-90"
          >
            <Megaphone className="h-3.5 w-3.5" /> Open &amp; announce
          </button>
        ) : (
          <button
            onClick={lockStage}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-700 text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
            Lock stage
          </button>
        )}
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone?: "rose" | "muted";
}) {
  const color =
    tone === "rose"
      ? "text-rose-700"
      : tone === "muted"
        ? "text-muted-foreground"
        : "text-foreground";
  return (
    <div className="min-w-0">
      <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground uppercase tracking-wide">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className={`text-sm font-medium truncate ${color}`}>{value}</div>
    </div>
  );
}
