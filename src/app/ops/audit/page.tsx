import Link from "next/link";
import { prisma } from "@/lib/db";
import { ClipboardList, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  "report.grade": "Graded a report",
  "stage-results.publish": "Published stage results",
  "scholarship.approved": "Approved a scholarship",
  "scholarship.rejected": "Rejected a scholarship",
  "scholarship.note": "Updated scholarship notes",
  "application.approve": "Approved an application",
  "application.reject": "Rejected an application",
  "announcement.create": "Created an announcement",
};

function prettyAction(a: string) {
  return ACTION_LABEL[a] ?? a;
}

function prettyDetails(details: unknown): string {
  if (!details || typeof details !== "object") return "";
  const d = details as Record<string, unknown>;
  const parts: string[] = [];
  for (const [k, v] of Object.entries(d)) {
    if (v == null) continue;
    parts.push(`${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`);
  }
  return parts.join(" · ");
}

interface SearchParams {
  searchParams?: Promise<{ actor?: string; action?: string; targetType?: string }>;
}

export default async function AuditPage({ searchParams }: SearchParams) {
  const sp = (await searchParams) ?? {};
  const where: Record<string, unknown> = {};
  if (sp.actor) where.actorEmail = { contains: sp.actor, mode: "insensitive" };
  if (sp.action) where.action = sp.action;
  if (sp.targetType) where.targetType = sp.targetType;

  const entries = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const actionCounts = await prisma.auditLog.groupBy({
    by: ["action"],
    _count: { _all: true },
    orderBy: { _count: { action: "desc" } },
    take: 10,
  });

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full">
      <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <Link
            href="/ops"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Operations
          </Link>
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-blue" />
            <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
            Every privileged action — grading, publishing, approving — is
            recorded here. Append-only. If something went wrong, this is how
            you find out who did it and when.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
            Filter
          </h2>
          <form method="get" className="space-y-3 text-sm">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                By actor (email contains)
              </label>
              <input
                name="actor"
                defaultValue={sp.actor ?? ""}
                placeholder="e.g. somto"
                className="w-full p-2 border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                By action (exact)
              </label>
              <input
                name="action"
                defaultValue={sp.action ?? ""}
                placeholder="e.g. report.grade"
                className="w-full p-2 border border-border rounded-lg text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium rounded-lg bg-blue text-white hover:opacity-90"
              >
                Apply
              </button>
              {(sp.actor || sp.action || sp.targetType) && (
                <Link
                  href="/ops/audit"
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted/50"
                >
                  Clear
                </Link>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
            Most frequent actions
          </h2>
          <div className="space-y-1.5">
            {actionCounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No audit entries yet.</p>
            ) : (
              actionCounts.map((a) => (
                <Link
                  key={a.action}
                  href={`/ops/audit?action=${encodeURIComponent(a.action)}`}
                  className="flex items-center justify-between text-sm p-2 rounded hover:bg-muted/30 transition-colors"
                >
                  <span>{prettyAction(a.action)}</span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {a._count._all}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="bg-white border border-border rounded-xl overflow-hidden">
        <h2 className="text-sm font-semibold text-foreground p-5 pb-3 uppercase tracking-wide">
          Recent activity ({entries.length})
        </h2>
        {entries.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            No audit entries for this filter.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {entries.map((e) => (
              <div key={e.id} className="p-4 text-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-foreground">{prettyAction(e.action)}</strong>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground font-mono">
                        {e.targetType}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {e.actorEmail} <span className="opacity-50">({e.actorRole})</span>
                      {e.targetId && <span> · target: <code>{e.targetId.slice(-8)}</code></span>}
                    </p>
                    {e.details !== null && (
                      <p className="text-xs text-foreground/70 mt-2 font-mono">
                        {prettyDetails(e.details)}
                      </p>
                    )}
                    {e.ip && (
                      <p className="text-[11px] text-muted-foreground/70 mt-1 font-mono">
                        {e.ip}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0 text-right">
                    <div>{e.createdAt.toLocaleDateString()}</div>
                    <div>{e.createdAt.toLocaleTimeString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
