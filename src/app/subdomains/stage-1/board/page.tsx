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

export default async function Stage1BoardPage() {
  const result = await getStageAccess("stage-1");
  if (!result.ok) {
    if (result.reason === "no-session") redirect("/login");
    redirect("/dashboard");
  }
  const { internId, internCode } = result.access;

  const theme = STAGE_THEMES["stage-1"];

  const room = await prisma.room.findUnique({
    where: { slug: "ciphers-and-secrets" },
    include: { assignments: { orderBy: { order: "asc" } } },
  });

  if (!room) {
    return (
      <StageShell theme={theme} internCode={internCode}>
        <div className="stage-1-panel p-8">
          <h1 className="stage-1-heading text-2xl">Ciphers &amp; Secrets</h1>
          <p className="text-violet-200/70 mt-3 text-sm">
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
    pending: { bg: "rgba(167, 139, 250, 0.08)", color: "#c4b5fd", border: "rgba(167, 139, 250, 0.25)" },
    submitted: { bg: "rgba(234, 179, 8, 0.12)", color: "#fde68a", border: "rgba(234, 179, 8, 0.35)" },
    graded: { bg: "rgba(167, 139, 250, 0.2)", color: "#a78bfa", border: "rgba(167, 139, 250, 0.55)" },
    late: { bg: "rgba(244, 63, 94, 0.14)", color: "#fda4af", border: "rgba(244, 63, 94, 0.4)" },
  };

  return (
    <StageShell theme={theme} internCode={internCode}>
      <div className="space-y-8">
        <BoardRecap
          brief={STAGE_BRIEFS.STAGE_1}
          landingHref={stageUrl("stage-1")}
          submitHref="/dashboard/reports/STAGE_1"
          theme={{
            panelClass: "stage-1-panel",
            headingClass: "stage-1-heading",
            pillClass: "stage-1-pill",
            accentTextClass: "text-violet-300",
            bodyTextClass: "text-violet-50/85",
            mutedTextClass: "text-violet-200/55",
            ctaBgClass: "bg-violet-500",
            ctaHoverClass: "hover:bg-violet-600",
            dividerClass: "border-violet-400/20",
          }}
        />

        <CapstoneReminder
          landingHref={stageUrl("stage-1")}
          theme={{
            panelClass: "stage-1-panel",
            headingClass: "stage-1-heading",
            accentTextClass: "text-violet-300",
            bodyTextClass: "text-violet-50/85",
            mutedTextClass: "text-violet-200/55",
            ctaBgClass: "bg-violet-500",
            ctaHoverClass: "hover:bg-violet-600",
            dividerClass: "border-violet-400/20",
          }}
        />

        <section>
          <div className="flex items-end justify-between mb-4">
            <h2 className="stage-1-heading text-xl">Tasks</h2>
            <span className="text-xs font-mono text-violet-200/60">
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
                  href={stageUrl("stage-1", `/tasks/${a.order}`)}
                  className="stage-1-panel p-5 transition block group"
                >
                  <div className="flex items-center justify-between">
                    <span className="stage-1-pill">
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
                  <h3 className="mt-3 font-semibold text-violet-50 group-hover:text-violet-200 transition">
                    {a.title}
                  </h3>
                  <p className="mt-1 text-xs font-mono text-violet-200/55">
                    {a.maxPoints} pts · {a.widget.replace(/_/g, " ").toLowerCase()}
                  </p>
                </Link>
              );
            })}
            {Array.from({ length: Math.max(0, 10 - room.assignments.length) }).map((_, i) => (
              <div
                key={`placeholder-${i}`}
                className="rounded-2xl border border-dashed border-violet-400/15 p-5 text-violet-200/30 text-xs font-mono"
              >
                awaiting task {String(room.assignments.length + i + 1).padStart(2, "0")}
              </div>
            ))}
          </div>
        </section>

        <section className="stage-1-panel p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="stage-1-pill mb-2">Debrief</div>
              <h3 className="stage-1-heading text-lg">Amaka&apos;s close-out</h3>
            </div>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wide"
              style={{
                backgroundColor: allGraded ? "rgba(167, 139, 250, 0.2)" : "rgba(167, 139, 250, 0.08)",
                color: allGraded ? "#a78bfa" : "#c4b5fd",
                border: `1px solid ${allGraded ? "rgba(167, 139, 250, 0.55)" : "rgba(167, 139, 250, 0.25)"}`,
              }}
            >
              {allGraded ? "unlocked" : "locked"}
            </span>
          </div>
          <p className="mt-3 text-sm text-violet-100/75 whitespace-pre-wrap leading-relaxed">
            {allGraded
              ? room.debrief
              : "Complete and pass all ten cipher tasks to unlock Amaka's debrief."}
          </p>
        </section>
      </div>
    </StageShell>
  );
}
