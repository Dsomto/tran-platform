import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminAssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  await requireSuperAdmin();
  const { id, taskId } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id: taskId },
    include: {
      _count: { select: { submissions: true } },
    },
  });
  if (!assignment) notFound();

  const stageNum = assignment.stage.replace("STAGE_", "");

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-4xl">
      <Link
        href={`/admin/assignments/${id}/tasks`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3"
      >
        <ArrowLeft className="h-4 w-4" />
        All Stage {stageNum} tasks
      </Link>

      <div className="bg-white border border-border rounded-xl p-6 mb-4">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {assignment.order != null && (
            <span className="text-xs font-mono text-muted-foreground">
              #{assignment.order}
            </span>
          )}
          <h1 className="text-2xl font-bold text-foreground">{assignment.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 font-mono">
            {assignment.kind}
          </span>
          {assignment.widget !== "NONE" && (
            <span className="text-xs px-2 py-0.5 rounded bg-blue/10 text-blue border border-blue/30 font-mono">
              widget: {assignment.widget}
            </span>
          )}
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
            {assignment.maxPoints} pts
          </span>
          {assignment.isClosed && (
            <span className="text-xs px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-mono">
              CLOSED
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            · {assignment._count.submissions} submission
            {assignment._count.submissions === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mb-4 pb-4 border-b border-border text-sm text-muted-foreground">
          Stage {stageNum} · {assignment.track ?? "all tracks"} ·{" "}
          {assignment.dueDate
            ? `Due ${assignment.dueDate.toLocaleString("en-GB")}`
            : "No deadline set"}
        </div>

        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
            Brief / Description (what interns see)
          </h2>
          <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans">
            {assignment.description}
          </div>
        </section>

        {assignment.resources && (
          <section className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
              Resources
            </h2>
            <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-mono bg-slate-50 border border-slate-200 rounded-lg p-3">
              {assignment.resources}
            </div>
          </section>
        )}

        {assignment.minWords != null && (
          <section className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">
              Minimum word count
            </h2>
            <p className="text-sm text-foreground">{assignment.minWords} words</p>
          </section>
        )}

        {assignment.choices != null && (
          <section className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
              Multiple-choice options
            </h2>
            <ol className="text-sm text-foreground space-y-1 list-decimal pl-5">
              {(assignment.choices as string[]).map((c, i) => (
                <li
                  key={i}
                  className={
                    i === assignment.correctIndex
                      ? "font-semibold text-emerald-800"
                      : ""
                  }
                >
                  {c}
                  {i === assignment.correctIndex && (
                    <span className="ml-2 text-xs text-emerald-700">(correct)</span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        {assignment.flagSalt && (
          <section className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">
              Flag verification
            </h2>
            <p className="text-xs text-muted-foreground font-mono">
              Salt configured · expected flag is computed at submit time
            </p>
          </section>
        )}

        <div className="pt-4 border-t border-border text-xs text-muted-foreground font-mono">
          Assignment ID: {assignment.id}
        </div>
      </div>

      <Link
        href={`/admin/assignments/${id}/submissions?assignmentId=${assignment.id}`}
        className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-blue text-white hover:opacity-90"
      >
        View submissions for this task →
      </Link>
    </div>
  );
}
