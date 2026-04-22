import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubmitForm } from "@/components/dashboard/submit-form";
import { formatDate, formatDateTime } from "@/lib/utils";
import { BookOpen, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";

export default async function AssignmentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const intern = await prisma.intern.findUnique({
    where: { userId: session.id },
  });

  if (!intern) redirect("/dashboard");

  const assignments = await prisma.assignment.findMany({
    where: {
      stage: intern.currentStage,
      OR: [{ track: intern.track }, { track: null }],
    },
    include: {
      submissions: {
        where: { internId: intern.id },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  return (
    <>
      <Topbar
        title="Assignments"
        subtitle={`Stage ${intern.currentStage.replace("STAGE_", "")} tasks`}
        firstName={session.firstName}
        lastName={session.lastName}
        avatarUrl={session.avatarUrl}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <BookOpen className="w-16 h-16 text-muted/20 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Assignments Yet
            </h3>
            <p className="text-sm text-muted">
              Assignments for your current stage will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const submission = assignment.submissions[0];
              const isPastDue = assignment.dueDate != null && new Date() > assignment.dueDate;

              let statusIcon;
              let statusBadge;
              if (submission) {
                if (submission.status === "GRADED") {
                  statusIcon = <CheckCircle className="w-5 h-5 text-accent" />;
                  statusBadge = (
                    <Badge variant="success">
                      Graded: {submission.score}/{assignment.maxPoints}
                    </Badge>
                  );
                } else if (submission.status === "LATE") {
                  statusIcon = <AlertCircle className="w-5 h-5 text-warning" />;
                  statusBadge = <Badge variant="warning">Late Submission</Badge>;
                } else {
                  statusIcon = <CheckCircle className="w-5 h-5 text-accent" />;
                  statusBadge = <Badge variant="success">Submitted</Badge>;
                }
              } else if (isPastDue) {
                statusIcon = <XCircle className="w-5 h-5 text-danger" />;
                statusBadge = <Badge variant="danger">Overdue</Badge>;
              } else {
                statusIcon = <Clock className="w-5 h-5 text-warning" />;
                statusBadge = <Badge variant="warning">Pending</Badge>;
              }

              return (
                <Card key={assignment.id} variant="glass">
                  <CardContent>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        {statusIcon}
                        <div>
                          <h3 className="text-base font-semibold text-foreground">
                            {assignment.title}
                          </h3>
                          <p className="text-xs text-muted mt-1">
                            {assignment.dueDate
                              ? `Due: ${formatDateTime(assignment.dueDate)} • `
                              : "No due date • "}
                            Max {assignment.maxPoints} points
                          </p>
                        </div>
                      </div>
                      {statusBadge}
                    </div>

                    <p className="text-sm text-muted leading-relaxed mb-4 pl-8">
                      {assignment.description}
                    </p>

                    {assignment.resources && (
                      <div className="pl-8 mb-4">
                        <p className="text-xs font-medium text-foreground mb-1">
                          Resources:
                        </p>
                        <p className="text-xs text-muted">{assignment.resources}</p>
                      </div>
                    )}

                    {submission && submission.feedback && (
                      <div className="pl-8 bg-accent/5 border border-accent/10 rounded-xl p-4">
                        <p className="text-xs font-medium text-accent mb-1">
                          Feedback:
                        </p>
                        <p className="text-sm text-muted">
                          {submission.feedback}
                        </p>
                      </div>
                    )}

                    {!submission && !isPastDue && assignment.dueDate && (
                      <div className="pl-8">
                        <p className="text-xs text-muted">
                          Submit your work before {formatDate(assignment.dueDate)}
                        </p>
                      </div>
                    )}

                    <SubmitForm
                      assignmentId={assignment.id}
                      existingContent={submission?.content}
                      existingAttachmentUrl={submission?.attachmentUrl}
                      alreadySubmitted={Boolean(submission)}
                      locked={submission?.status === "GRADED"}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
