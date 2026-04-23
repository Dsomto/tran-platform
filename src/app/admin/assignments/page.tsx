"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Clock,
  Lock,
  LockOpen,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

interface AssignmentRow {
  id: string;
  order: number | null;
  title: string;
  stage: string;
  track: string | null;
  kind: string;
  dueDate: string | null;
  maxPoints: number;
  passingScore: number | null;
  isClosed: boolean;
  publishedAt: string | null;
  eligible: number;
  started: number;
  submitted: number;
  graded: number;
}

const STAGE_ORDER = [
  "STAGE_0",
  "STAGE_1",
  "STAGE_2",
  "STAGE_3",
  "STAGE_4",
  "STAGE_5",
  "STAGE_6",
  "STAGE_7",
  "STAGE_8",
  "STAGE_9",
];

function stageLabel(s: string) {
  return s.replace("STAGE_", "Stage ");
}

function formatDeadline(iso: string | null): { text: string; overdue: boolean } {
  if (!iso) return { text: "No deadline", overdue: false };
  const d = new Date(iso);
  const now = new Date();
  const overdue = d < now;
  return {
    text: d.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }),
    overdue,
  };
}

export default function AssignmentsPage() {
  const [rows, setRows] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "CLOSED" | "PUBLISHED">(
    "ALL"
  );
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
    fetch("/api/admin/assignments-analytics")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setRows(d.assignments ?? []);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (stageFilter !== "ALL" && r.stage !== stageFilter) return false;
      if (statusFilter === "OPEN" && r.isClosed) return false;
      if (statusFilter === "CLOSED" && !r.isClosed) return false;
      if (statusFilter === "PUBLISHED" && !r.publishedAt) return false;
      if (q && !r.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, query, stageFilter, statusFilter]);

  const grouped = useMemo(() => {
    const byStage = new Map<string, AssignmentRow[]>();
    for (const r of filtered) {
      const arr = byStage.get(r.stage) ?? [];
      arr.push(r);
      byStage.set(r.stage, arr);
    }
    return STAGE_ORDER
      .filter((s) => byStage.has(s))
      .map((s) => ({
        stage: s,
        items: (byStage.get(s) ?? []).sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0)
        ),
      }));
  }, [filtered]);

  const summary = useMemo(() => {
    return {
      total: rows.length,
      open: rows.filter((r) => !r.isClosed).length,
      closed: rows.filter((r) => r.isClosed).length,
      published: rows.filter((r) => r.publishedAt).length,
    };
  }, [rows]);

  return (
    <>
      <Topbar
        title="Assignments"
        subtitle={`${summary.total} total · ${summary.open} open · ${summary.closed} closed`}
        firstName={admin.firstName}
        lastName={admin.lastName}
        avatarUrl={admin.avatarUrl}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <Input
            type="search"
            placeholder="Search by title…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-white"
          >
            <option value="ALL">All stages</option>
            {STAGE_ORDER.map((s) => (
              <option key={s} value={s}>
                {stageLabel(s)}
              </option>
            ))}
          </select>
          <div className="flex gap-1 border border-border rounded-lg p-1 bg-white">
            {(["ALL", "OPEN", "CLOSED", "PUBLISHED"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 text-xs font-medium rounded ${
                  statusFilter === s ? "bg-foreground text-background" : "text-muted hover:text-foreground"
                }`}
              >
                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground text-sm">Loading…</div>
        ) : grouped.length === 0 ? (
          <Card variant="glass" className="text-center py-12">
            <BookOpen className="w-10 h-10 text-muted/40 mx-auto mb-3" />
            <p className="text-sm text-muted">No assignments match your filters.</p>
          </Card>
        ) : (
          <div className="space-y-8">
            {grouped.map(({ stage, items }) => (
              <section key={stage}>
                <header className="flex items-center gap-3 mb-3">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    {stageLabel(stage)}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {items.length} assignment{items.length === 1 ? "" : "s"}
                  </span>
                </header>
                <div className="space-y-2">
                  {items.map((a) => (
                    <AssignmentRowCard key={a.id} row={a} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function AssignmentRowCard({ row }: { row: AssignmentRow }) {
  const deadline = formatDeadline(row.dueDate);
  const submissionPct =
    row.eligible > 0 ? Math.round((row.submitted / row.eligible) * 100) : 0;

  return (
    <Link href={`/admin/assignments/${row.id}`}>
      <div className="group p-4 bg-white border border-border rounded-xl hover:border-blue/40 hover:shadow-sm transition-all flex items-center gap-4">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-muted/40 flex items-center justify-center text-xs font-mono text-muted-foreground">
          {row.order ?? "·"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground text-sm truncate">
              {row.title}
            </h3>
            <Badge variant="default" size="sm">
              {row.kind}
            </Badge>
            {row.isClosed && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                <Lock className="w-3 h-3" /> Closed
              </span>
            )}
            {row.publishedAt && row.passingScore != null && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Pass ≥ {row.passingScore}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span className={deadline.overdue ? "text-rose-700 font-medium" : ""}>
                {deadline.text}
              </span>
            </span>
            <span>
              {row.started}/{row.eligible} started
            </span>
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {row.submitted} submitted ({submissionPct}%)
            </span>
            <span>{row.graded} graded</span>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0" />
      </div>
    </Link>
  );
}
