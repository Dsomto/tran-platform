import Link from "next/link";
import { redirect } from "next/navigation";
import StageShell from "@/components/stage/StageShell";
import { STAGE_THEMES } from "@/components/stage/themes";
import { BoardRecap } from "@/components/stage/BoardRecap";
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

export default async function Stage3BoardPage() {
  const result = await getStageAccess("stage-3");
  if (!result.ok) {
    if (result.reason === "no-session") redirect("/login");
    redirect("/dashboard");
  }
  const { internId, internCode } = result.access;

  const theme = STAGE_THEMES["stage-3"];

  const room = await prisma.room.findUnique({
    where: { slug: "inside-the-walls" },
    include: { assignments: { orderBy: { order: "asc" } } },
  });

  if (!room) {
    return (
      <StageShell theme={theme} internCode={internCode}>
        <div className="stage-3-panel p-8">
          <h1 className="stage-3-heading text-2xl">Inside the Walls</h1>
          <p className="text-amber-200/70 mt-3 text-sm">
            Room not yet provisioned. Drop task scenarios into
            <span className="font-mono"> prisma/seed-rooms-scenarios/stage-3/</span> and re-run the seed.
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

  const completed = room.assignments.filter((a) => {
    const sub = subByAssignment.get(a.id);
    return sub && (sub.status === "GRADED" || sub.status === "SUBMITTED");
  }).length;

  const toneStyles: Record<string, { bg: string; color: string; border: string }> = {
    pending: { bg: "rgba(251, 191, 36, 0.06)", color: "#fde68a", border: "rgba(251, 146, 60, 0.3)" },
    submitted: { bg: "rgba(234, 179, 8, 0.12)", color: "#fef3c7", border: "rgba(234, 179, 8, 0.4)" },
    graded: { bg: "rgba(34, 197, 94, 0.15)", color: "#86efac", border: "rgba(34, 197, 94, 0.45)" },
    late: { bg: "rgba(220, 38, 38, 0.18)", color: "#fca5a5", border: "rgba(220, 38, 38, 0.45)" },
  };

  return (
    <StageShell theme={theme} internCode={internCode}>
      <div className="space-y-8">
        <BoardRecap
          brief={STAGE_BRIEFS.STAGE_3}
          landingHref={stageUrl("stage-3")}
          submitHref="/dashboard/reports/STAGE_3"
          theme={{
            panelClass: "stage-3-panel",
            headingClass: "stage-3-heading",
            pillClass: "stage-3-pill",
            accentTextClass: "text-amber-400",
            bodyTextClass: "text-amber-50/85",
            mutedTextClass: "text-amber-200/55",
            ctaBgClass: "bg-amber-500",
            ctaHoverClass: "hover:bg-amber-600",
            dividerClass: "border-amber-500/20",
          }}
        />

        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="stage-3-heading text-xl tracking-wider">EVIDENCE LOG</h2>
              <p className="mt-1 text-[11px] font-mono tracking-widest text-amber-300/50 uppercase">
                Artefacts collected from the compromised host
              </p>
            </div>
            <div className="text-right">
              <div className="stage-3-row-index">STATUS</div>
              <div className="font-mono text-sm text-amber-200">
                {completed.toString().padStart(2, "0")} / {String(Math.max(room.assignments.length, 10)).padStart(2, "0")} logged
              </div>
              <div className="stage-3-threat-bar w-32 mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {room.assignments.map((a) => {
              const sub = subByAssignment.get(a.id);
              const s = statusLabel(sub?.status as string | undefined);
              const toneStyle = toneStyles[s.tone];
              return (
                <Link
                  key={a.id}
                  href={stageUrl("stage-3", `/tasks/${a.order}`)}
                  className="stage-3-panel p-5 transition block group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="stage-3-pill">
                      <span className="opacity-70">EXB</span>
                      <span className="font-bold text-amber-300">
                        {String(a.order).padStart(3, "0")}
                      </span>
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-sm font-mono uppercase tracking-[0.15em] font-bold"
                      style={{
                        backgroundColor: toneStyle.bg,
                        color: toneStyle.color,
                        border: `1px solid ${toneStyle.border}`,
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <h3 className="font-semibold text-amber-50 group-hover:text-amber-300 transition leading-snug">
                    {a.title}
                  </h3>
                  <div className="mt-3 flex items-center justify-between text-[10.5px] font-mono text-amber-200/55 tracking-wider uppercase">
                    <span>{a.widget.replace(/_/g, " ")}</span>
                    <span className="text-amber-300/80">{a.maxPoints} pts</span>
                  </div>
                </Link>
              );
            })}
            {Array.from({ length: Math.max(0, 10 - room.assignments.length) }).map((_, i) => (
              <div
                key={`placeholder-${i}`}
                className="rounded-sm border border-dashed border-amber-400/12 p-5 text-amber-200/25 text-[11px] font-mono uppercase tracking-widest"
              >
                <div>awaiting exhibit</div>
                <div className="mt-1 font-bold text-amber-400/30">
                  {String(room.assignments.length + i + 1).padStart(3, "0")}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="stage-3-panel p-6 relative">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="stage-3-pill">§ DEBRIEF</span>
              <h3 className="stage-3-heading text-lg">Amaka&apos;s close-out</h3>
            </div>
            <span
              className="text-[10px] px-2 py-1 rounded-sm font-mono uppercase tracking-[0.2em] font-bold"
              style={{
                backgroundColor: allGraded ? "rgba(34, 197, 94, 0.15)" : "rgba(220, 38, 38, 0.12)",
                color: allGraded ? "#86efac" : "#fca5a5",
                border: `1px solid ${allGraded ? "rgba(34, 197, 94, 0.5)" : "rgba(220, 38, 38, 0.45)"}`,
              }}
            >
              {allGraded ? "UNSEALED" : "SEALED"}
            </span>
          </div>
          <div className="mt-4 text-sm text-amber-100/80 whitespace-pre-wrap leading-relaxed">
            {allGraded ? (
              room.debrief
            ) : (
              <span className="italic text-amber-200/60">
                <span className="stage-3-redact">████████████████████</span>{" "}
                — this debrief stays redacted until every exhibit clears grading.
              </span>
            )}
          </div>
        </section>
      </div>
    </StageShell>
  );
}
