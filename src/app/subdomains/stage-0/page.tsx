import Link from "next/link";
import { redirect } from "next/navigation";
import StageShell from "@/components/stage/StageShell";
import { STAGE_THEMES } from "@/components/stage/themes";
import { getDoorSession } from "@/lib/stage-login";
import { stageUrl } from "@/lib/stage-routes";
import { prisma } from "@/lib/db";

function statusLabel(status: string | undefined | null): { label: string; tone: "pending" | "submitted" | "graded" | "late" } {
  const s = (status ?? "").toUpperCase();
  if (s === "GRADED") return { label: "graded", tone: "graded" };
  if (s === "LATE") return { label: "late", tone: "late" };
  if (s === "SUBMITTED" || s === "PENDING_REVIEW") return { label: "submitted", tone: "submitted" };
  return { label: "pending", tone: "pending" };
}

export default async function Stage0RoomPage() {
  const session = await getDoorSession("stage-0");
  if (!session) redirect(stageUrl("stage-0", "/login"));

  const theme = STAGE_THEMES["stage-0"];

  const room = await prisma.room.findUnique({
    where: { slug: "induction-at-the-gate" },
    include: { assignments: { orderBy: { order: "asc" } } },
  });

  if (!room) {
    return (
      <StageShell theme={theme} internCode={session.internCode}>
        <div className="stage-0-panel p-8">
          <h1 className="stage-0-heading text-2xl">Induction at the Gate</h1>
          <p className="text-neutral-600 mt-3 text-sm">
            Room not yet provisioned. Check back once the seed script has been run.
          </p>
        </div>
      </StageShell>
    );
  }

  const assignmentIds = room.assignments.map((a) => a.id);
  const submissions = assignmentIds.length
    ? await prisma.submission.findMany({
        where: { internId: session.internId, assignmentId: { in: assignmentIds } },
      })
    : [];

  const subByAssignment = new Map(submissions.map((s) => [s.assignmentId, s]));

  const allGraded =
    room.assignments.length > 0 &&
    room.assignments.every((a) => {
      const sub = subByAssignment.get(a.id);
      return sub && (sub.status === "GRADED");
    });

  const toneStyles: Record<string, { bg: string; color: string; border: string }> = {
    pending: { bg: "#f5f5f5", color: "#737373", border: "#e5e5e5" },
    submitted: { bg: "#fef3c7", color: "#b45309", border: "rgba(217, 119, 6, 0.35)" },
    graded: { bg: "#d1fae5", color: "#047857", border: "rgba(5, 150, 105, 0.45)" },
    late: { bg: "#fee2e2", color: "#b91c1c", border: "rgba(220, 38, 38, 0.35)" },
  };

  return (
    <StageShell theme={theme} internCode={session.internCode}>
      <div className="space-y-8">
        <section className="stage-0-panel p-8 relative overflow-hidden">
          <div className="stage-0-pill mb-3">{room.codename}</div>
          <h1 className="stage-0-heading text-3xl md:text-4xl font-bold">{room.title}</h1>
          <p className="mt-4 text-neutral-700 whitespace-pre-wrap leading-relaxed">
            {room.synopsis}
          </p>
          <hr className="my-5 border-neutral-200" />
          <p className="text-neutral-600 whitespace-pre-wrap leading-relaxed text-sm">
            {room.briefing}
          </p>
        </section>

        <section>
          <div className="flex items-end justify-between mb-4">
            <h2 className="stage-0-heading text-xl">Tasks</h2>
            <span className="text-xs font-mono text-neutral-500">
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
                  href={`/tasks/${a.order}`}
                  className="stage-0-panel p-5 transition block group"
                >
                  <div className="flex items-center justify-between">
                    <span className="stage-0-pill">
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
                  <h3 className="mt-3 font-semibold text-neutral-900 group-hover:text-emerald-700 transition">
                    {a.title}
                  </h3>
                  <p className="mt-1 text-xs font-mono text-neutral-500">
                    {a.maxPoints} pts · {a.widget.replace(/_/g, " ").toLowerCase()}
                  </p>
                </Link>
              );
            })}
            {Array.from({ length: Math.max(0, 10 - room.assignments.length) }).map((_, i) => (
              <div
                key={`placeholder-${i}`}
                className="rounded-2xl border border-dashed border-neutral-300 p-5 text-neutral-400 text-xs font-mono"
              >
                awaiting task {String(room.assignments.length + i + 1).padStart(2, "0")}
              </div>
            ))}
          </div>
        </section>

        <section className="stage-0-panel p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="stage-0-pill mb-2">Debrief</div>
              <h3 className="stage-0-heading text-lg">Amaka&apos;s close-out</h3>
            </div>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wide"
              style={{
                backgroundColor: allGraded ? "rgba(52, 211, 153, 0.2)" : "rgba(52, 211, 153, 0.08)",
                color: allGraded ? "#34d399" : "#6ee7b7",
                border: `1px solid ${allGraded ? "rgba(52, 211, 153, 0.55)" : "rgba(52, 211, 153, 0.25)"}`,
              }}
            >
              {allGraded ? "unlocked" : "locked"}
            </span>
          </div>
          <p className="mt-3 text-sm text-emerald-100/75 whitespace-pre-wrap leading-relaxed">
            {allGraded
              ? room.debrief
              : "Complete and graded all ten inductions to unlock Amaka's debrief."}
          </p>
        </section>
      </div>
    </StageShell>
  );
}
