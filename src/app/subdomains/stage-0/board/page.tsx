import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";
import StageShell from "@/components/stage/StageShell";
import { STAGE_THEMES } from "@/components/stage/themes";
import { BoardRecap } from "@/components/stage/BoardRecap";
import { BoardTaskList } from "@/components/stage/BoardTaskList";
import { StageJourneyMap } from "@/components/stage/StageJourneyMap";
import { getStageAccess } from "@/lib/stage-access";
import { stageUrl } from "@/lib/stage-routes";
import { getBoardData } from "@/lib/stage-board";
import { STAGE_BRIEFS } from "@/lib/stage-briefs";
import { STAGE_STORIES, TOTAL_CHAPTERS } from "@/lib/stage-story";
import { STAGE_LANDING_THEMES } from "@/lib/stage-landing-theme";

export default async function Stage0BoardPage() {
  const result = await getStageAccess("stage-0");
  if (!result.ok) {
    if (result.reason === "no-session") redirect("/login");
    redirect("/dashboard");
  }
  const { internId, internCode, firstName } = result.access;

  const theme = STAGE_THEMES["stage-0"];
  const lt = STAGE_LANDING_THEMES["stage-0"];
  const story = STAGE_STORIES["stage-0"];
  const brief = STAGE_BRIEFS.STAGE_0;

  const { room, subByAssignment, allGraded } = await getBoardData(
    internId,
    "induction-at-the-gate"
  );

  if (!room) {
    return (
      <StageShell theme={theme} internCode={internCode}>
        <div className="stage-0-panel p-8">
          <h1 className="stage-0-heading text-2xl">Induction at the Gate</h1>
          <p className="text-neutral-600 mt-3 text-sm">
            Room not yet provisioned. Check back once the seed script has been run.
          </p>
        </div>
      </StageShell>
    );
  }

  const doneCount = room.assignments.filter((a) => subByAssignment.has(a.id)).length;
  const totalCount = room.assignments.length;
  const nextChapter = story.chapter < TOTAL_CHAPTERS ? story.chapter + 1 : null;

  const tasks = room.assignments.map((a) => ({
    id: a.id,
    order: a.order ?? 0,
    title: a.title,
    description: a.description,
    maxPoints: a.maxPoints,
    widget: a.widget,
  }));
  const statusByTask = new Map(
    room.assignments.map((a) => [a.id, subByAssignment.get(a.id)?.status as string | undefined])
  );

  return (
    <StageShell theme={theme} internCode={internCode}>
      <div className="space-y-8">
        <BoardRecap
          brief={brief}
          story={story}
          firstName={firstName}
          landingHref={stageUrl("stage-0")}
          capstoneHref={`${stageUrl("stage-0")}#capstone`}
          submitHref="/dashboard/reports/STAGE_0"
          doneCount={doneCount}
          totalCount={totalCount}
          theme={lt}
        />

        <StageJourneyMap
          theme={lt}
          current="board"
          landingHref={stageUrl("stage-0")}
          boardHref={stageUrl("stage-0", "/board")}
          capstoneHref={`${stageUrl("stage-0")}#capstone`}
          submitHref="/dashboard/reports/STAGE_0"
          nextChapter={nextChapter}
        />

        <section>
          <div className="flex items-end justify-between mb-4">
            <h2 className="stage-0-heading text-xl">The desk queue</h2>
            <span className="text-xs font-mono text-neutral-500">
              {room.assignments.length} tasks
            </span>
          </div>
          <BoardTaskList
            slug="stage-0"
            theme={lt}
            tasks={tasks}
            statusByTask={statusByTask}
          />
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
                backgroundColor: allGraded ? "rgba(5, 150, 105, 0.18)" : "rgba(5, 150, 105, 0.06)",
                color: allGraded ? "#047857" : "#6b7280",
                border: `1px solid ${allGraded ? "rgba(5, 150, 105, 0.4)" : "rgba(5, 150, 105, 0.2)"}`,
              }}
            >
              {allGraded ? "unlocked" : "locked"}
            </span>
          </div>
          <p className="mt-3 text-sm text-neutral-600 whitespace-pre-wrap leading-relaxed">
            {allGraded
              ? room.debrief
              : "Complete and pass all ten inductions to unlock Amaka's debrief."}
          </p>
          {allGraded && (
            <div className="mt-5 pt-5 border-t border-neutral-200">
              <p
                className="text-[15px] text-neutral-700 leading-relaxed"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {story.cliffhanger}
              </p>
              <Link
                href="/dashboard"
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-[0.14em] text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
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
