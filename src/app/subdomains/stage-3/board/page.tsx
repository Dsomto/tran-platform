import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
  const { internId, internCode, firstName } = result.access;

  const theme = STAGE_THEMES["stage-3"];
  const lt = STAGE_LANDING_THEMES["stage-3"];
  const story = STAGE_STORIES["stage-3"];
  const brief = STAGE_BRIEFS.STAGE_3;

  const { room, subByAssignment, allGraded } = await getBoardData(
    internId,
    "inside-the-walls"
  );

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

  const doneCount = room.assignments.filter((a) => subByAssignment.has(a.id)).length;
  const nextChapter = story.chapter < TOTAL_CHAPTERS ? story.chapter + 1 : null;

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
          brief={brief}
          story={story}
          firstName={firstName}
          landingHref={stageUrl("stage-3")}
          capstoneHref={`${stageUrl("stage-3")}#capstone`}
          submitHref="/dashboard/reports/STAGE_3"
          doneCount={doneCount}
          totalCount={room.assignments.length}
          theme={lt}
        />

        <StageJourneyMap
          theme={lt}
          current="board"
          landingHref={stageUrl("stage-3")}
          boardHref={stageUrl("stage-3", "/board")}
          capstoneHref={`${stageUrl("stage-3")}#capstone`}
          submitHref="/dashboard/reports/STAGE_3"
          nextChapter={nextChapter}
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
                {doneCount.toString().padStart(2, "0")} / {String(room.assignments.length).padStart(2, "0")} logged
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
                  className="stage-3-panel stage-3-card p-5 transition block group"
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
                  <p className="mt-1.5 text-[12px] leading-relaxed text-amber-200/55">
                    {previewOf(a.description)}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[10.5px] font-mono text-amber-200/55 tracking-wider uppercase">
                    <span>{a.widget.replace(/_/g, " ")}</span>
                    <span className="text-amber-300/80">{a.maxPoints} pts</span>
                  </div>
                </Link>
              );
            })}
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
          {allGraded && (
            <div className="mt-5 pt-5 border-t border-amber-500/20">
              <p
                className="text-[15px] text-amber-50/90 leading-relaxed"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {story.cliffhanger}
              </p>
              <Link
                href="/dashboard"
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-[0.14em] text-white bg-amber-500 hover:bg-amber-600 transition-colors"
              >
                Continue to the next chapter
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </section>
      </div>
    </StageShell>
  );
}
