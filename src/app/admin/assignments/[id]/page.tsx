import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import { StageAdminPanel } from "./stage-admin-panel";

export const dynamic = "force-dynamic";

const STAGES = ["STAGE_0", "STAGE_1", "STAGE_2", "STAGE_3", "STAGE_4"] as const;
type StageKey = (typeof STAGES)[number];

function isStageKey(v: string): v is StageKey {
  return (STAGES as readonly string[]).includes(v);
}

export default async function AssignmentStagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  // Accept both `STAGE_0` and `stage-0` / `stage_0` forms so paths are robust.
  const normalized = id.toUpperCase().replace(/-/g, "_");
  if (!isStageKey(normalized)) notFound();
  const stage = normalized;

  const [stageWindow, eligible, reports] = await Promise.all([
    prisma.stageWindow.findUnique({ where: { stage } }),
    prisma.intern.count({ where: { isActive: true, currentStage: stage } }),
    prisma.stageReport.findMany({
      where: { stage },
      include: {
        intern: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    }),
  ]);

  const submissions = reports.map((r) => ({
    id: r.id,
    internId: r.internId,
    internName: `${r.intern.user.firstName} ${r.intern.user.lastName}`.trim(),
    internEmail: r.intern.user.email,
    status: r.status,
    score: r.score,
    feedback: r.feedback,
    submittedAt: r.submittedAt ? r.submittedAt.toISOString() : null,
    gradedAt: r.gradedAt ? r.gradedAt.toISOString() : null,
  }));

  return (
    <div className="min-h-screen">
      <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
        <Link
          href="/admin/assignments"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All stages
        </Link>

        <StageAdminPanel
          stage={stage}
          initialWindow={
            stageWindow
              ? {
                  passingScore: stageWindow.passingScore,
                  isLocked: stageWindow.isLocked,
                }
              : null
          }
          eligible={eligible}
          submissions={submissions}
        />
      </div>
    </div>
  );
}
