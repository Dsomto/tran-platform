import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, FileText } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

const STAGES = ["STAGE_0", "STAGE_1", "STAGE_2", "STAGE_3", "STAGE_4"] as const;
type StageKey = (typeof STAGES)[number];

const STAGE_NAMES: Record<StageKey, string> = {
  STAGE_0: "Induction at the Gate",
  STAGE_1: "Ciphers & Secrets",
  STAGE_2: "The Attack Surface",
  STAGE_3: "Inside the Walls",
  STAGE_4: "The Debrief",
};

function isStageKey(v: string): v is StageKey {
  return (STAGES as readonly string[]).includes(v);
}

export const dynamic = "force-dynamic";

export default async function StageTasksListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdmin();
  const { id } = await params;
  const stage = id.toUpperCase().replace(/-/g, "_");
  if (!isStageKey(stage)) notFound();

  const assignments = await prisma.assignment.findMany({
    where: { stage },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  // Submission counts per assignment, so the admin can see at-a-glance which
  // tasks the cohort is actually engaging with vs ignoring.
  const subCounts = await prisma.submission.groupBy({
    by: ["assignmentId"],
    where: { assignmentId: { in: assignments.map((a) => a.id) } },
    _count: { _all: true },
  });
  const subByAssignment = new Map(subCounts.map((s) => [s.assignmentId, s._count._all]));

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-4xl">
      <Link
        href={`/admin/assignments/${id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Stage {stage.replace("STAGE_", "")}
      </Link>
      <h1 className="text-2xl font-bold text-foreground mb-1">
        Stage {stage.replace("STAGE_", "")} · {STAGE_NAMES[stage]}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        {assignments.length} assignment{assignments.length === 1 ? "" : "s"} on this stage.
        Click any task to read what the intern sees.
      </p>

      {assignments.length === 0 ? (
        <div className="p-8 bg-white border border-border rounded-xl text-center text-muted-foreground">
          No assignments seeded on this stage yet.
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map((a, idx) => {
            const subs = subByAssignment.get(a.id) ?? 0;
            return (
              <Link
                key={a.id}
                href={`/admin/assignments/${id}/tasks/${a.id}`}
                className="block group p-4 bg-white border border-border rounded-xl hover:border-blue/40 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-mono text-muted-foreground">
                        #{a.order ?? idx + 1}
                      </span>
                      <h2 className="text-base font-semibold text-foreground">
                        {a.title}
                      </h2>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                        {a.kind}
                      </span>
                      {a.widget !== "NONE" && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue/10 text-blue border border-blue/30 font-mono">
                          {a.widget}
                        </span>
                      )}
                      {a.isClosed && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-mono">
                          CLOSED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {subs} submission{subs === 1 ? "" : "s"}
                      </span>
                      <span>{a.maxPoints} pts</span>
                      {a.dueDate && (
                        <span>Due {a.dueDate.toLocaleDateString("en-GB")}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
