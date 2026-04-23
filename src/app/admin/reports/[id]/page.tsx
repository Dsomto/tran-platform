import { notFound } from "next/navigation";
import { requireGrader } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GradeForm } from "./grade-form";

export default async function GradePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireGrader();
  const { id } = await params;

  const report = await prisma.stageReport.findUnique({
    where: { id },
    include: {
      intern: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
    },
  });
  if (!report) notFound();

  const isAdmin = session.role === "ADMIN" || session.role === "SUPER_ADMIN";
  const canGrade =
    (report.status === "UNDER_REVIEW" || report.status === "GRADED") &&
    (report.graderId === session.id || isAdmin);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Stage {report.stage.replace("STAGE_", "")} Report
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {report.intern.user.firstName} {report.intern.user.lastName} ·{" "}
          {report.intern.user.email}
          {report.version > 1 && <span className="ml-2 text-amber-700">· v{report.version}</span>}
        </p>
      </header>

      {report.reportUrl && (
        <section className="mb-6 bg-blue/5 border border-blue/20 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wide">
            Report folder (open in a new tab to review)
          </h2>
          <a
            href={report.reportUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="text-blue underline text-sm break-all font-medium"
          >
            {report.reportUrl}
          </a>
        </section>
      )}

      <section className="mb-6 bg-white border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wide">
          Executive summary
        </h2>
        <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
          {report.executiveSummary}
        </div>
      </section>

      {report.attachmentUrl && (
        <section className="mb-6 bg-white border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wide">
            Additional attachment
          </h2>
          <a
            href={report.attachmentUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="text-blue underline text-sm break-all"
          >
            {report.attachmentUrl}
          </a>
        </section>
      )}

      <GradeForm
        reportId={report.id}
        canGrade={canGrade}
        currentScore={report.score}
        currentFeedback={report.feedback}
        status={report.status}
      />
    </div>
  );
}
