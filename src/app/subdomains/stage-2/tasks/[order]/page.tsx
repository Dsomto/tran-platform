import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import StageShell from "@/components/stage/StageShell";
import TaskPage from "@/components/stage/TaskPage";
import { STAGE_THEMES } from "@/components/stage/themes";
import { getStageAccess } from "@/lib/stage-access";
import { stageUrl } from "@/lib/stage-routes";
import { prisma } from "@/lib/db";
import type { WidgetKind } from "@/components/widgets/types";

export default async function Stage2TaskPage({
  params,
}: {
  params: Promise<{ order: string }>;
}) {
  const result = await getStageAccess("stage-2");
  if (!result.ok) {
    if (result.reason === "no-session") redirect("/login");
    redirect("/dashboard");
  }
  const { internId, internCode } = result.access;

  const { order } = await params;
  const orderNum = Number(order);
  if (!Number.isFinite(orderNum)) notFound();

  const room = await prisma.room.findUnique({
    where: { slug: "the-attack-surface" },
  });
  if (!room) notFound();

  const assignment = await prisma.assignment.findFirst({
    where: {
      roomId: room.id,
      order: orderNum,
      isClosed: false,
      OR: [{ track: null }, { track: result.access.track }],
    },
  });
  if (!assignment) notFound();

  const submission = await prisma.submission.findFirst({
    where: { internId: internId, assignmentId: assignment.id },
  });

  const theme = STAGE_THEMES["stage-2"];

  const widgetConfig =
    assignment.widgetConfig && typeof assignment.widgetConfig === "object"
      ? (assignment.widgetConfig as Record<string, unknown>)
      : null;

  // Tasks that carry a `verify` block (T3/T6) are graded through the server-side
  // /verify route, so we withhold the salt from the client to stop the devtools
  // flag derivation. The candidate gets the flag from POST /verify instead.
  const verifyServerSide = widgetConfig?.verify != null;

  return (
    <StageShell theme={theme} internCode={internCode}>
      <div className="mb-6">
        <Link
          href={stageUrl("stage-2")}
          className="text-xs font-mono text-rose-300/70 hover:text-rose-200 transition"
        >
          ← back to {room.title}
        </Link>
      </div>
      <TaskPage
        theme={theme}
        taskId={assignment.id}
        order={assignment.order ?? orderNum}
        title={assignment.title}
        briefing={assignment.description}
        kind={assignment.kind}
        widgetKind={assignment.widget as WidgetKind}
        widgetConfig={widgetConfig}
        maxPoints={assignment.maxPoints}
        context={{
          internId: internId,
          internCode: internCode,
          taskId: assignment.id,
          flagSalt: verifyServerSide ? null : (assignment.flagSalt ?? null),
          stage: "stage-2",
          accentColor: "#fb7185",
        }}
        initial={
          submission
            ? {
                score: submission.score,
                status: submission.status,
                feedback: submission.feedback,
              }
            : undefined
        }
      />
    </StageShell>
  );
}
