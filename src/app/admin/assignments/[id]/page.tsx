import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import { AssignmentAdminPanel } from "./assignment-admin-panel";

export const dynamic = "force-dynamic";

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      submissions: {
        include: {
          intern: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!assignment) notFound();

  const eligible = await prisma.intern.count({
    where: { isActive: true, currentStage: assignment.stage },
  });

  const submissions = assignment.submissions.map((s) => ({
    id: s.id,
    internId: s.internId,
    internName: `${s.intern.user.firstName} ${s.intern.user.lastName}`.trim(),
    internEmail: s.intern.user.email,
    status: s.status,
    score: s.score,
    feedback: s.feedback,
    submittedAt: s.submittedAt ? s.submittedAt.toISOString() : null,
    gradedAt: s.gradedAt ? s.gradedAt.toISOString() : null,
  }));

  return (
    <div className="min-h-screen">
      <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
        <Link
          href="/admin/assignments"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All assignments
        </Link>

        <AssignmentAdminPanel
          assignment={{
            id: assignment.id,
            order: assignment.order,
            title: assignment.title,
            description: assignment.description,
            stage: assignment.stage,
            track: assignment.track,
            kind: assignment.kind,
            widget: assignment.widget,
            dueDate: assignment.dueDate ? assignment.dueDate.toISOString() : null,
            maxPoints: assignment.maxPoints,
            passingScore: assignment.passingScore,
            isClosed: assignment.isClosed,
            closedAt: assignment.closedAt ? assignment.closedAt.toISOString() : null,
            publishedAt: assignment.publishedAt
              ? assignment.publishedAt.toISOString()
              : null,
          }}
          eligible={eligible}
          submissions={submissions}
        />
      </div>
    </div>
  );
}
