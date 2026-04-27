import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StageAdminPanel } from "./stage-admin-panel";

export const dynamic = "force-dynamic";

const STAGES = ["STAGE_0", "STAGE_1", "STAGE_2", "STAGE_3", "STAGE_4"] as const;
type StageKey = (typeof STAGES)[number];

const STAGE_NAMES: Record<StageKey, string> = {
  STAGE_0: "Induction at the Gate",
  STAGE_1: "Ciphers & Secrets",
  STAGE_2: "The Attack Surface",
  STAGE_3: "Inside the Walls",
  STAGE_4: "The Debrief",
};

function isStageKey(v: string): v is StageKey {
  return (STAGES as readonly string[]).includes(v);
}

export default async function StageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdmin();
  const { id } = await params;

  const normalized = id.toUpperCase().replace(/-/g, "_");
  if (!isStageKey(normalized)) notFound();
  const stage = normalized;

  const [stageWindow, accesses, reports] = await Promise.all([
    prisma.stageWindow.findUnique({ where: { stage } }),
    // No FK relation on StageAccess — fetch interns separately below.
    prisma.stageAccess.findMany({
      where: { stage },
      orderBy: { lastAccessedAt: "desc" },
    }),
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

  // Resolve intern names for the access list — Prisma's MongoDB layer
  // doesn't auto-join on StageAccess since there's no @relation declared.
  const internIds = Array.from(new Set(accesses.map((a) => a.internId)));
  const interns = internIds.length
    ? await prisma.intern.findMany({
        where: { id: { in: internIds } },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      })
    : [];
  const internById = new Map(interns.map((i) => [i.id, i]));

  const accessRows = accesses.map((a) => {
    const intern = internById.get(a.internId);
    return {
      internId: a.internId,
      name: intern ? `${intern.user.firstName} ${intern.user.lastName}`.trim() : "Unknown",
      email: intern?.user.email ?? "—",
      firstAccessedAt: a.firstAccessedAt.toISOString(),
      lastAccessedAt: a.lastAccessedAt.toISOString(),
      visitCount: a.visitCount,
    };
  });

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
    divergent: r.divergent,
  }));

  const status = (stageWindow?.status ?? "CLOSED") as "OPEN" | "PAUSED" | "CLOSED";
  const passingScore = stageWindow?.passingScore ?? null;

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
          stageName={STAGE_NAMES[stage]}
          initialStatus={status}
          initialPassingScore={passingScore}
          accessRows={accessRows}
          submissions={submissions}
        />
      </div>
    </div>
  );
}
