import Link from "next/link";
import { redirect } from "next/navigation";
import StageShell from "@/components/stage/StageShell";
import { STAGE_THEMES } from "@/components/stage/themes";
import { BoardRecap } from "@/components/stage/BoardRecap";
import { StageJourneyMap } from "@/components/stage/StageJourneyMap";
import { previewOf } from "@/components/stage/BoardTaskList";
import { getStageAccess } from "@/lib/stage-access";
import { stageUrl } from "@/lib/stage-routes";
import { getBoardData } from "@/lib/stage-board";
import { STAGE_BRIEFS } from "@/lib/stage-briefs";
import { STAGE_STORIES, TOTAL_CHAPTERS } from "@/lib/stage-story";
import { STAGE_LANDING_THEMES } from "@/lib/stage-landing-theme";

function statusLabel(status: string | undefined | null): { label: string; tone: "pending" | "submitted" | "graded" | "late" } {
  const s = (status ?? "").toUpperCase();
  if (s === "GRADED") return { label: "cleared", tone: "graded" };
  if (s === "LATE") return { label: "overdue", tone: "late" };
  if (s === "SUBMITTED" || s === "PENDING_REVIEW") return { label: "in review", tone: "submitted" };
  return { label: "open", tone: "pending" };
}

export default async function Stage4BoardPage() {
  const result = await getStageAccess("stage-4");
  if (!result.ok) {
    if (result.reason === "no-session") redirect("/login");
    redirect("/dashboard");
  }
  const { internId, internCode, firstName } = result.access;

  const theme = STAGE_THEMES["stage-4"];
  const lt = STAGE_LANDING_THEMES["stage-4"];
  const story = STAGE_STORIES["stage-4"];
  const brief = STAGE_BRIEFS.STAGE_4;

  const { room, subByAssignment, allGraded } = await getBoardData(
    internId,
    "the-debrief"
  );

  if (!room) {
    return (
      <StageShell theme={theme} internCode={internCode}>
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

  const doneCount = room.assignments.filter((a) => subByAssignment.has(a.id)).length;
  const nextChapter = story.chapter < TOTAL_CHAPTERS ? story.chapter + 1 : null;

  const toneStyles: Record<string, { bg: string; color: string; border: string }> = {
    pending: { bg: "rgba(103, 232, 249, 0.06)", color: "#bae6fd", border: "rgba(103, 232, 249, 0.3)" },
    submitted: { bg: "rgba(234, 179, 8, 0.12)", color: "#fde68a", border: "rgba(234, 179, 8, 0.4)" },
    graded: { bg: "rgba(34, 197, 94, 0.14)", color: "#86efac", border: "rgba(34, 197, 94, 0.45)" },
    late: { bg: "rgba(244, 63, 94, 0.18)", color: "#fecdd3", border: "rgba(244, 63, 94, 0.45)" },
  };

  return (
    <StageShell theme={theme} internCode={internCode}>
      <div className="space-y-10">
        <BoardRecap
          brief={brief}
          story={story}
          firstName={firstName}
          landingHref={stageUrl("stage-4")}
          capstoneHref={`${stageUrl("stage-4")}#capstone`}
          submitHref="/dashboard/reports/STAGE_4"
          doneCount={doneCount}
          totalCount={room.assignments.length}
          theme={lt}
        />

        <StageJourneyMap
          theme={lt}
          current="board"
          landingHref={stageUrl("stage-4")}
          boardHref={stageUrl("stage-4", "/board")}
          capstoneHref={`${stageUrl("stage-4")}#capstone`}
          submitHref="/dashboard/reports/STAGE_4"
          nextChapter={nextChapter}
        />

        <section className="grid grid-cols-2 gap-4">
          <div className="stage-4-kpi">
            <p className="stage-4-kpi-label">Agenda items</p>
            <p className="stage-4-kpi-value">
              {doneCount} / {room.assignments.length}
            </p>
            <p className="mt-1 text-[11px] text-cyan-200/55">walked through</p>
          </div>
          <div className="stage-4-kpi">
            <p className="stage-4-kpi-label">Pass mark</p>
            <p className="stage-4-kpi-value">{room.passThreshold}%</p>
            <p className="mt-1 text-[11px] text-cyan-200/55">on your stage report</p>
          </div>
        </section>

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
                  href={stageUrl("stage-4", `/tasks/${a.order}`)}
                  className="stage-4-panel stage-4-card p-5 transition block group"
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
                  <p className="mt-1.5 text-[12px] leading-relaxed text-cyan-200/55">
                    {previewOf(a.description)}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[10.5px] font-mono text-cyan-200/55 tracking-[0.15em] uppercase">
                    <span>{a.widget.replace(/_/g, " ").toLowerCase()}</span>
                    <span className="text-cyan-300/80 font-semibold">{a.maxPoints} pts</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

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
            <div className="space-y-5">
              <p
                className="text-cyan-50/85 whitespace-pre-wrap leading-relaxed"
                style={{ fontFamily: "Georgia, serif", fontSize: 16 }}
              >
                {room.debrief}
              </p>
              <div className="pt-5 border-t border-cyan-400/20">
                <p
                  className="text-[15px] text-cyan-50/90 leading-relaxed"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {story.cliffhanger}
                </p>
                <Link
                  href="/dashboard"
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-[0.14em] text-white bg-cyan-500 hover:bg-cyan-600 transition-colors"
                >
                  Return to your dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-cyan-100/70 italic text-[15px]" style={{ fontFamily: "Georgia, serif" }}>
                &ldquo;The chair will release the handoff once every agenda item has
                cleared review. No exceptions — this is the record that goes on file.&rdquo;
              </p>
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-300/55">
                — Adaeze Okonkwo, Chair of the Board
              </p>
            </div>
          )}
        </section>
      </div>
    </StageShell>
  );
}
