import Link from "next/link";
import { redirect } from "next/navigation";
import StageShell from "@/components/stage/StageShell";
import { STAGE_THEMES } from "@/components/stage/themes";
import { getDoorSession } from "@/lib/stage-login";
import { prisma } from "@/lib/db";

function statusLabel(status: string | undefined | null): { label: string; tone: "pending" | "submitted" | "graded" | "late" } {
  const s = (status ?? "").toUpperCase();
  if (s === "GRADED") return { label: "cleared", tone: "graded" };
  if (s === "LATE") return { label: "overdue", tone: "late" };
  if (s === "SUBMITTED" || s === "PENDING_REVIEW") return { label: "in review", tone: "submitted" };
  return { label: "open", tone: "pending" };
}

export default async function Stage4RoomPage() {
  const session = await getDoorSession("stage-4");
  if (!session) redirect("/login");

  const theme = STAGE_THEMES["stage-4"];

  const room = await prisma.room.findUnique({
    where: { slug: "the-debrief" },
    include: { assignments: { orderBy: { order: "asc" } } },
  });

  if (!room) {
    return (
      <StageShell theme={theme} internCode={session.internCode}>
        <div className="stage-4-panel p-8">
          <h1 className="stage-4-heading text-3xl">The Debrief</h1>
          <p className="text-cyan-100/75 mt-3 text-sm">
            Room not yet provisioned. Drop agenda items into
            <span className="font-mono"> prisma/seed-rooms-scenarios/stage-4/</span> and
            re-run the seed.
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
      return sub && sub.status === "GRADED";
    });

  const cleared = room.assignments.filter((a) => {
    const sub = subByAssignment.get(a.id);
    return sub && sub.status === "GRADED";
  }).length;

  const pointsEarned = room.assignments.reduce((total, a) => {
    const sub = subByAssignment.get(a.id);
    return total + (sub?.score ?? 0);
  }, 0);

  const toneStyles: Record<string, { bg: string; color: string; border: string }> = {
    pending: { bg: "rgba(103, 232, 249, 0.06)", color: "#bae6fd", border: "rgba(103, 232, 249, 0.3)" },
    submitted: { bg: "rgba(234, 179, 8, 0.12)", color: "#fde68a", border: "rgba(234, 179, 8, 0.4)" },
    graded: { bg: "rgba(34, 197, 94, 0.14)", color: "#86efac", border: "rgba(34, 197, 94, 0.45)" },
    late: { bg: "rgba(244, 63, 94, 0.18)", color: "#fecdd3", border: "rgba(244, 63, 94, 0.45)" },
  };

  return (
    <StageShell theme={theme} internCode={session.internCode}>
      <div className="space-y-10">
        {/* ── Executive hero ── */}
        <section className="stage-4-panel p-8 sm:p-10 relative overflow-hidden">
          <div className="stage-4-compass" aria-hidden="true" />

          <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="stage-4-pill">BRIEFING · 09:00</span>
              <span className="stage-4-pill">AUDIENCE · EXECUTIVE</span>
              <span className="stage-4-pill">CHAPTER FINALE</span>
            </div>
            <span className="stage-4-stamp">Capstone</span>
          </div>

          <p className="stage-4-heading-mono mb-4">
            {room.codename}
          </p>
          <h1 className="stage-4-heading text-4xl md:text-5xl lg:text-6xl tracking-tight">
            {room.title}.
          </h1>

          <div className="stage-4-rule"><span>§ AGENDA SYNOPSIS</span></div>

          <p className="text-cyan-50/85 text-lg leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "Georgia, serif" }}>
            {room.synopsis}
          </p>

          <div className="stage-4-rule"><span>§ BOARDROOM BRIEFING</span></div>

          <p className="text-cyan-100/80 whitespace-pre-wrap leading-relaxed">
            {room.briefing}
          </p>

          <div className="stage-4-rule"><span>§ DELIVERABLES</span></div>

          <ul className="space-y-2.5">
            <li className="stage-4-axis text-sm text-cyan-50/85 leading-relaxed">
              <span className="stage-4-coord mr-2">I.</span>
              An incident timeline — one page, board-readable, no jargon.
            </li>
            <li className="stage-4-axis text-sm text-cyan-50/85 leading-relaxed">
              <span className="stage-4-coord mr-2">II.</span>
              A risk register scored by likelihood and business impact.
            </li>
            <li className="stage-4-axis text-sm text-cyan-50/85 leading-relaxed">
              <span className="stage-4-coord mr-2">III.</span>
              A regulatory position (NDPR/NDPA) and a defensible notification plan.
            </li>
            <li className="stage-4-axis text-sm text-cyan-50/85 leading-relaxed">
              <span className="stage-4-coord mr-2">IV.</span>
              A 12-month roadmap: controls, owners, cost envelope.
            </li>
            <li className="stage-4-axis text-sm text-cyan-50/85 leading-relaxed">
              <span className="stage-4-coord mr-2">V.</span>
              Your track selection with a written rationale — this is binding.
            </li>
          </ul>
        </section>

        {/* ── KPI strip ── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="stage-4-kpi">
            <p className="stage-4-kpi-label">Agenda items</p>
            <p className="stage-4-kpi-value">
              {cleared} / {Math.max(room.assignments.length, 10)}
            </p>
            <p className="mt-1 text-[11px] text-cyan-200/55">cleared by chair</p>
          </div>
          <div className="stage-4-kpi">
            <p className="stage-4-kpi-label">Points earned</p>
            <p className="stage-4-kpi-value">{pointsEarned}</p>
            <p className="mt-1 text-[11px] text-cyan-200/55">of {room.totalPoints}</p>
          </div>
          <div className="stage-4-kpi">
            <p className="stage-4-kpi-label">Pass threshold</p>
            <p className="stage-4-kpi-value">{room.passThreshold}%</p>
            <p className="mt-1 text-[11px] text-cyan-200/55">required to advance</p>
          </div>
          <div className="stage-4-kpi">
            <p className="stage-4-kpi-label">Outcome</p>
            <p className="stage-4-kpi-value" style={{ color: allGraded ? "#86efac" : "#bae6fd" }}>
              {allGraded ? "Ready" : "In progress"}
            </p>
            <p className="mt-1 text-[11px] text-cyan-200/55">track selection</p>
          </div>
        </section>

        {/* ── Agenda (tasks) ── */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="stage-4-heading-mono mb-1">THE AGENDA</p>
              <h2 className="stage-4-heading text-2xl">Boardroom walkthrough</h2>
            </div>
            <span className="stage-4-coord">{room.assignments.length.toString().padStart(2, "0")} items</span>
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
                  className="stage-4-panel p-5 transition block group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="stage-4-pill">
                      <span className="opacity-70">ITEM</span>
                      <span className="font-bold text-cyan-200">
                        {String.fromCharCode(64 + (a.order ?? 0))}
                      </span>
                    </span>
                    <span
                      className="text-[10.5px] px-2 py-0.5 rounded-sm font-mono uppercase tracking-[0.18em] font-semibold"
                      style={{
                        backgroundColor: toneStyle.bg,
                        color: toneStyle.color,
                        border: `1px solid ${toneStyle.border}`,
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <h3
                    className="font-semibold text-cyan-50 group-hover:text-cyan-200 transition leading-snug"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {a.title}
                  </h3>
                  <div className="mt-3 flex items-center justify-between text-[10.5px] font-mono text-cyan-200/55 tracking-[0.15em] uppercase">
                    <span>{a.widget.replace(/_/g, " ").toLowerCase()}</span>
                    <span className="text-cyan-300/80 font-semibold">{a.maxPoints} pts</span>
                  </div>
                </Link>
              );
            })}
            {Array.from({ length: Math.max(0, 10 - room.assignments.length) }).map((_, i) => (
              <div
                key={`placeholder-${i}`}
                className="rounded-sm border border-dashed border-cyan-400/15 p-5 text-cyan-200/30 text-[11px] font-mono uppercase tracking-[0.18em]"
              >
                <div>awaiting agenda</div>
                <div className="mt-1 font-bold text-cyan-400/35" style={{ fontFamily: "Georgia, serif", fontSize: 22 }}>
                  {String.fromCharCode(65 + room.assignments.length + i)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Sealed debrief — chairman's note ── */}
        <section className="stage-4-panel p-8 relative">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <p className="stage-4-heading-mono mb-2">§ CHAIRMAN&apos;S NOTE</p>
              <h3 className="stage-4-heading text-2xl">The handoff</h3>
            </div>
            <span
              className="text-[10px] px-2.5 py-1 rounded-sm font-mono uppercase tracking-[0.2em] font-bold"
              style={{
                backgroundColor: allGraded ? "rgba(34, 197, 94, 0.14)" : "rgba(103, 232, 249, 0.08)",
                color: allGraded ? "#86efac" : "#67e8f9",
                border: `1px solid ${allGraded ? "rgba(34, 197, 94, 0.5)" : "rgba(103, 232, 249, 0.3)"}`,
              }}
            >
              {allGraded ? "SIGNED OFF" : "HELD"}
            </span>
          </div>

          {allGraded ? (
            <p
              className="text-cyan-50/85 whitespace-pre-wrap leading-relaxed"
              style={{ fontFamily: "Georgia, serif", fontSize: 16 }}
            >
              {room.debrief}
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-cyan-100/70 italic text-[15px]" style={{ fontFamily: "Georgia, serif" }}>
                &ldquo;The chair will release the handoff once every agenda item has
                cleared review. No exceptions — this is the record that goes on file.&rdquo;
              </p>
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-300/55">
                — Tunde Afolabi, Chair of the Board
              </p>
            </div>
          )}
        </section>
      </div>
    </StageShell>
  );
}
