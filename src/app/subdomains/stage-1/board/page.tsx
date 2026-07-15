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

export default async function Stage1BoardPage() {
  const result = await getStageAccess("stage-1");
  if (!result.ok) {
    if (result.reason === "no-session") redirect("/login");
    redirect("/dashboard");
  }
  const { internId, internCode, firstName } = result.access;

  const theme = STAGE_THEMES["stage-1"];
  const lt = STAGE_LANDING_THEMES["stage-1"];
  const story = STAGE_STORIES["stage-1"];
  const brief = STAGE_BRIEFS.STAGE_1;

  const { room, subByAssignment, allGraded } = await getBoardData(
    internId,
    "ciphers-and-secrets",
    result.access.track
  );

  if (!room) {
    return (
      <StageShell theme={theme} internCode={internCode}>
        <div className="stage-1-panel p-8">
          <h1 className="stage-1-heading text-2xl">Ciphers &amp; Secrets</h1>
          <p className="text-violet-100/70 mt-3 text-sm">
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
          landingHref={stageUrl("stage-1")}
          capstoneHref={`${stageUrl("stage-1")}#capstone`}
          submitHref="/dashboard/reports/STAGE_1"
          doneCount={doneCount}
          totalCount={totalCount}
          theme={lt}
        />

        <StageJourneyMap
          theme={lt}
          current="board"
          landingHref={stageUrl("stage-1")}
          boardHref={stageUrl("stage-1", "/board")}
          capstoneHref={`${stageUrl("stage-1")}#capstone`}
          submitHref="/dashboard/reports/STAGE_1"
          nextChapter={nextChapter}
        />

        <section>
          <div className="flex items-end justify-between mb-4">
            <h2 className="stage-1-heading text-xl">The cipher desk</h2>
            <span className="text-xs font-mono text-violet-200/60">
              {room.assignments.length} tasks
            </span>
          </div>
          <BoardTaskList
            slug="stage-1"
            theme={lt}
            tasks={tasks}
            statusByTask={statusByTask}
          />
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
          {allGraded && (
            <div className="mt-5 pt-5 border-t border-violet-400/20">
              <p
                className="text-[15px] text-violet-50/90 leading-relaxed"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {story.cliffhanger}
              </p>
              <Link
                href="/dashboard"
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-[0.14em] text-white bg-violet-500 hover:bg-violet-600 transition-colors"
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
