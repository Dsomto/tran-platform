import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import StageShell from "@/components/stage/StageShell";
import TaskPage from "@/components/stage/TaskPage";
import { STAGE_THEMES } from "@/components/stage/themes";
import { getDoorSession } from "@/lib/stage-login";
import { prisma } from "@/lib/db";
import type { WidgetKind } from "@/components/widgets/types";

export default async function Stage4TaskPage({
  params,
}: {
  params: Promise<{ order: string }>;
}) {
  const session = await getDoorSession("stage-4");
  if (!session) redirect("/login");

  const { order } = await params;
  const orderNum = Number(order);
  if (!Number.isFinite(orderNum)) notFound();

  const room = await prisma.room.findUnique({
    where: { slug: "the-debrief" },
  });
  if (!room) notFound();

  const assignment = await prisma.assignment.findFirst({
    where: { roomId: room.id, order: orderNum },
  });
  if (!assignment) notFound();

  const submission = await prisma.submission.findFirst({
    where: { internId: session.internId, assignmentId: assignment.id },
  });

  const theme = STAGE_THEMES["stage-4"];

  const widgetConfig =
    assignment.widgetConfig && typeof assignment.widgetConfig === "object"
      ? (assignment.widgetConfig as Record<string, unknown>)
      : null;

  return (
    <StageShell theme={theme} internCode={session.internCode}>
      <div className="mb-6">
        <Link
          href="/"
          className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-300/65 hover:text-cyan-200 transition"
        >
          ← agenda · {room.title}
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
          internId: session.internId,
          internCode: session.internCode,
          flagSalt: assignment.flagSalt ?? null,
          stage: "stage-4",
          accentColor: "#22d3ee",
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
