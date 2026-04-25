import Link from "next/link";
import { redirect } from "next/navigation";
import StageShell from "@/components/stage/StageShell";
import { STAGE_THEMES } from "@/components/stage/themes";
import { BoardRecap } from "@/components/stage/BoardRecap";
import { CapstoneReminder } from "@/components/stage/CapstoneReminder";
import { getStageAccess } from "@/lib/stage-access";
import { stageUrl } from "@/lib/stage-routes";
import { prisma } from "@/lib/db";
import { STAGE_BRIEFS } from "@/lib/stage-briefs";

function statusLabel(status: string | undefined | null): { label: string; tone: "pending" | "submitted" | "graded" | "late" } {
  const s = (status ?? "").toUpperCase();
  if (s === "GRADED") return { label: "graded", tone: "graded" };
  if (s === "LATE") return { label: "late", tone: "late" };
  if (s === "SUBMITTED" || s === "PENDING_REVIEW") return { label: "submitted", tone: "submitted" };
  return { label: "pending", tone: "pending" };
}

export default async function Stage2BoardPage() {
  const result = await getStageAccess("stage-2");
  if (!result.ok) {
    if (result.reason === "no-session") redirect("/login");
    redirect("/dashboard");
  }
  const { internId, internCode } = result.access;

  const theme = STAGE_THEMES["stage-2"];

  const room = await prisma.room.findUnique({
    where: { slug: "the-attack-surface" },
    include: { assignments: { orderBy: { order: "asc" } } },
  });

  if (!room) {
    return (
      <StageShell theme={theme} internCode={internCode}>
        <div className="stage-2-panel p-8">
          <h1 className="stage-2-heading text-2xl">The Attack Surface</h1>
          <p className="text-rose-200/70 mt-3 text-sm">
            Room not yet provisioned. Check back once the seed script has been run.
          </p>
        </div>
      </StageShell>
    );
  }

  const assignmentIds = room.assignments.map((a) => a.id);
  const submissions = assignmentIds.length
    ? await prisma.submission.findMany({
        where: { internId: internId, assignmentId: { in: assignmentIds } },
      })
    : [];

  const subByAssignment = new Map(submissions.map((s) => [s.assignmentId, s]));

  const allGraded =
    room.assignments.length > 0 &&
    room.assignments.every((a) => {
      const sub = subByAssignment.get(a.id);
      return sub && sub.status === "GRADED";
    });

  const toneStyles: Record<string, { bg: string; color: string; border: string }> = {
    pending: { bg: "rgba(251, 113, 133, 0.08)", color: "#fda4af", border: "rgba(251, 113, 133, 0.25)" },
    submitted: { bg: "rgba(234, 179, 8, 0.12)", color: "#fde68a", border: "rgba(234, 179, 8, 0.35)" },
    graded: { bg: "rgba(251, 113, 133, 0.2)", color: "#fb7185", border: "rgba(251, 113, 133, 0.55)" },
    late: { bg: "rgba(244, 63, 94, 0.18)", color: "#fecdd3", border: "rgba(244, 63, 94, 0.45)" },
  };

  return (
    <StageShell theme={theme} internCode={internCode}>
      <div className="space-y-8">
        <BoardRecap
          brief={STAGE_BRIEFS.STAGE_2}
          landingHref={stageUrl("stage-2")}
          submitHref="/dashboard/reports/STAGE_2"
          theme={{
            panelClass: "stage-2-panel",
            headingClass: "stage-2-heading",
            pillClass: "stage-2-pill",
            accentTextClass: "text-rose-700",
            bodyTextClass: "text-neutral-700",
            mutedTextClass: "text-neutral-500",
            ctaBgClass: "bg-rose-600",
            ctaHoverClass: "hover:bg-rose-700",
            dividerClass: "border-rose-100",
          }}
        />

        <CapstoneReminder
          landingHref={stageUrl("stage-2")}
          theme={{
            panelClass: "stage-2-panel",
            headingClass: "stage-2-heading",
            accentTextClass: "text-rose-700",
            bodyTextClass: "text-neutral-700",
            mutedTextClass: "text-neutral-500",
            ctaBgClass: "bg-rose-600",
            ctaHoverClass: "hover:bg-rose-700",
            dividerClass: "border-rose-100",
          }}
        />

        <section>
          <div className="flex items-end justify-between mb-4">
            <h2 className="stage-2-heading text-xl">Tasks</h2>
            <span className="text-xs font-mono text-rose-200/60">
              {room.assignments.length} / 10 logged
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {room.assignments.map((a) => {
              const sub = subByAssignment.get(a.id);
              const s = statusLabel(sub?.status as string | undefined);
              const toneStyle = toneStyles[s.tone];
              return (
                <Link
                  key={a.id}
                  href={stageUrl("stage-2", `/tasks/${a.order}`)}
                  className="stage-2-panel p-5 transition block group"
                >
                  <div className="flex items-center justify-between">
                    <span className="stage-2-pill">
                      <span className="opacity-70">TASK</span>
                      <span className="font-semibold">
                        {String(a.order).padStart(2, "0")}
                      </span>
                    </span>
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wide"
                      style={{
                        backgroundColor: toneStyle.bg,
                        color: toneStyle.color,
                        border: `1px solid ${toneStyle.border}`,
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <h3 className="mt-3 font-semibold text-rose-50 group-hover:text-rose-200 transition">
                    {a.title}
                  </h3>
                  <p className="mt-1 text-xs font-mono text-rose-200/55">
                    {a.maxPoints} pts · {a.widget.replace(/_/g, " ").toLowerCase()}
                  </p>
                </Link>
              );
            })}
            {Array.from({ length: Math.max(0, 10 - room.assignments.length) }).map((_, i) => (
              <div
                key={`placeholder-${i}`}
                className="rounded-2xl border border-dashed border-rose-400/15 p-5 text-rose-200/30 text-xs font-mono"
              >
                awaiting task {String(room.assignments.length + i + 1).padStart(2, "0")}
              </div>
            ))}
          </div>
        </section>

        <section className="stage-2-panel p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="stage-2-pill mb-2">Debrief</div>
              <h3 className="stage-2-heading text-lg">Amaka&apos;s close-out</h3>
            </div>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wide"
              style={{
                backgroundColor: allGraded ? "rgba(251, 113, 133, 0.2)" : "rgba(251, 113, 133, 0.08)",
                color: allGraded ? "#fb7185" : "#fda4af",
                border: `1px solid ${allGraded ? "rgba(251, 113, 133, 0.55)" : "rgba(251, 113, 133, 0.25)"}`,
              }}
            >
              {allGraded ? "unlocked" : "locked"}
            </span>
          </div>
          <p className="mt-3 text-sm text-rose-100/75 whitespace-pre-wrap leading-relaxed">
            {allGraded
              ? room.debrief
              : "Reconstruct and pass all ten perimeter tasks to unlock Amaka's debrief."}
          </p>
        </section>
      </div>
    </StageShell>
  );
}
