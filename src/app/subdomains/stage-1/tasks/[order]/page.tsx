import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import StageShell from "@/components/stage/StageShell";
import TaskPage from "@/components/stage/TaskPage";
import { STAGE_THEMES } from "@/components/stage/themes";
import { getStageAccess } from "@/lib/stage-access";
import { stageUrl } from "@/lib/stage-routes";
import { prisma } from "@/lib/db";
import type { WidgetKind } from "@/components/widgets/types";

export default async function Stage1TaskPage({
  params,
}: {
  params: Promise<{ order: string }>;
}) {
  const result = await getStageAccess("stage-1");
  if (!result.ok) {
    if (result.reason === "no-session") redirect("/login");
    redirect("/dashboard");
  }
  const { internId, internCode } = result.access;

  const { order } = await params;
  const orderNum = Number(order);
  if (!Number.isFinite(orderNum)) notFound();

  const room = await prisma.room.findUnique({
    where: { slug: "ciphers-and-secrets" },
  });
  if (!room) notFound();

  const assignment = await prisma.assignment.findFirst({
    where: { roomId: room.id, order: orderNum },
  });
  if (!assignment) notFound();

  const submission = await prisma.submission.findFirst({
    where: { internId: internId, assignmentId: assignment.id },
  });

  const theme = STAGE_THEMES["stage-1"];

  const widgetConfig =
    assignment.widgetConfig && typeof assignment.widgetConfig === "object"
      ? (assignment.widgetConfig as Record<string, unknown>)
      : null;

  return (
    <StageShell theme={theme} internCode={internCode}>
      <div className="mb-6">
        <Link
          href={stageUrl("stage-1")}
          className="text-xs font-mono text-violet-300/70 hover:text-violet-200 transition"
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
          flagSalt: assignment.flagSalt ?? null,
          stage: "stage-1",
          accentColor: "#a78bfa",
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
