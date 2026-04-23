"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Lock,
  LockOpen,
  Award,
  Users,
} from "lucide-react";

interface StageRow {
  stage: string;
  label: string;
  activeFrom: string | null;
  submitUntil: string | null;
  passingScore: number | null;
  isClosed: boolean;
  atStage: number;
  submitted: number;
  graded: number;
  passed: number;
  failed: number;
}

function formatDue(iso: string | null): { text: string; overdue: boolean } {
  if (!iso) return { text: "No deadline set", overdue: false };
  const d = new Date(iso);
  const now = new Date();
  const overdue = d < now;
  return {
    text: d.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    overdue,
  };
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
              <StageRowCard key={r.stage} row={r} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function StageRowCard({ row }: { row: StageRow }) {
  const due = formatDue(row.submitUntil);
  const published = row.passed + row.failed > 0;

  return (
    <Link href={`/admin/assignments/${row.stage}`}>
      <div className="group p-5 bg-white border border-border rounded-xl hover:border-blue/40 hover:shadow-sm transition-all">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-semibold text-foreground">{row.label}</h2>
              {row.isClosed ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  <Lock className="w-3 h-3" /> Closed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <LockOpen className="w-3 h-3" /> Open
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
                icon={Calendar}
                label="Deadline"
                value={due.text}
                tone={due.overdue ? "rose" : undefined}
              />
              <Metric
                icon={Award}
                label="Passing score"
                value={row.passingScore != null ? `${row.passingScore}/100` : "Not set"}
                tone={row.passingScore == null ? "muted" : undefined}
              />
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
      </div>
    </Link>
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
