import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GradeForm } from "./grade-form";
import { formatDateTime } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function SubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") redirect("/dashboard");

  const { id } = await params;
  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment) notFound();

  const submissions = await prisma.submission.findMany({
    where: { assignmentId: id },
    include: {
      intern: {
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      },
    },
    orderBy: [{ status: "asc" }, { submittedAt: "asc" }],
  });

  return (
    <>
      <Topbar
        title={assignment.title}
        subtitle={`${submissions.length} submission${submissions.length === 1 ? "" : "s"} · Max ${assignment.maxPoints} pts`}
        firstName={session.firstName}
        lastName={session.lastName}
        avatarUrl={session.avatarUrl}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <Link
          href="/admin/assignments"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> All assignments
        </Link>

        {submissions.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm text-muted">No submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((s) => (
              <Card key={s.id} variant="glass">
                <CardContent>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        {s.intern.user.firstName} {s.intern.user.lastName}
                      </h3>
                      <p className="text-xs text-muted mt-0.5">
                        {s.intern.user.email} · submitted{" "}
                        {formatDateTime(s.submittedAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {s.status === "GRADED" ? (
                        <Badge variant="success">
                          {s.score}/{assignment.maxPoints}
                        </Badge>
                      ) : s.status === "LATE" ? (
                        <Badge variant="warning">Late</Badge>
                      ) : (
                        <Badge variant="primary">Pending</Badge>
                      )}
                    </div>
                  </div>

                  <div className="whitespace-pre-wrap text-sm text-muted bg-background/60 border border-border rounded-xl p-3 mb-3">
                    {s.content}
                  </div>

                  {s.attachmentUrl && (
                    <a
                      href={s.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs font-semibold text-blue hover:text-blue-dark mb-3"
                    >
                      View attachment ↗
                    </a>
                  )}

                  {s.feedback && (
                    <div className="bg-accent/5 border border-accent/10 rounded-xl p-3 mb-3">
                      <p className="text-xs font-medium text-accent mb-1">
                        Existing feedback
                      </p>
                      <p className="text-sm text-muted">{s.feedback}</p>
                    </div>
                  )}

                  <GradeForm
                    submissionId={s.id}
                    maxPoints={assignment.maxPoints}
                    initialScore={s.score ?? null}
                    initialFeedback={s.feedback ?? ""}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
