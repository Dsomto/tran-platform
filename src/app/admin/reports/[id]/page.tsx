import { notFound } from "next/navigation";
import { requireGrader } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GradeForm } from "./grade-form";
import { TiebreakForm } from "./tiebreak-form";
import { DIVERGENCE_THRESHOLD } from "@/lib/grading";

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
      grades: { orderBy: { createdAt: "asc" } },
      intern: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
    },
  });
  if (!report) notFound();

  const isAdmin = session.role === "ADMIN" || session.role === "SUPER_ADMIN";
  const isSuper = session.role === "SUPER_ADMIN";
  const myGrade = report.grades.find((g) => g.graderId === session.id);

  const mySlot = myGrade
    ? report.grades.findIndex((g) => g.graderId === session.id) + 1
    : null;

  const canGrade =
    (report.status === "UNDER_REVIEW" || report.status === "SUBMITTED") &&
    (!!myGrade || isAdmin);

  // Anonymity: a peer's identity (graderId) is never sent to the client.
  // We only forward score+feedback, and only when policy allows it.
  const bothDone = report.grades.length === 2 && report.grades.every((g) => g.gradedAt);
  const otherGrade = report.grades.find((g) => g.graderId !== session.id);
  const peerVisible = bothDone || isSuper;
  const peerPayload =
    peerVisible && otherGrade && otherGrade.gradedAt
      ? { score: otherGrade.score, feedback: otherGrade.feedback }
      : null;

  // Tiebreak panel (super admins only) when scores diverge.
  const tiebreakScores = report.grades
    .map((g) => g.score)
    .filter((s): s is number => s !== null && s !== undefined);
  const showTiebreak = isSuper && report.divergent && tiebreakScores.length === 2;

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
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-2 text-xs px-2 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded">
            {mySlot
              ? `You are grader ${mySlot} of 2`
              : report.grades.length < 2
              ? `${report.grades.length} of 2 graders assigned`
              : "Two graders assigned"}
          </span>
          {report.divergent && (
            <span className="inline-flex items-center gap-2 text-xs px-2 py-1 bg-amber-50 text-amber-900 border border-amber-300 rounded">
              Divergent — needs tiebreak
            </span>
          )}
        </div>
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

      {peerPayload && (
        <section className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-emerald-900 mb-2 uppercase tracking-wide">
            Other reviewer&apos;s grade
          </h2>
          <div className="text-sm text-emerald-900/90">
            Score: <strong>{peerPayload.score}</strong> / 100
          </div>
          {peerPayload.feedback && (
            <div className="mt-3 text-sm text-emerald-900/80 whitespace-pre-wrap leading-relaxed">
              {peerPayload.feedback}
            </div>
          )}
        </section>
      )}

      {!peerVisible && otherGrade && (
        <section className="mb-6 bg-neutral-50 border border-dashed border-neutral-300 rounded-xl p-5 text-sm text-neutral-600">
          A second reviewer has been assigned. Their score is hidden until both of you submit, to keep your judgment independent.
        </section>
      )}

      {showTiebreak && (
        <TiebreakForm
          reportId={report.id}
          scores={tiebreakScores}
          divergenceThreshold={DIVERGENCE_THRESHOLD}
        />
      )}

      <GradeForm
        reportId={report.id}
        canGrade={canGrade && !report.divergent}
        currentScore={myGrade?.score ?? null}
        currentFeedback={myGrade?.feedback ?? null}
        status={report.status}
        alreadyGraded={!!myGrade?.gradedAt}
      />
    </div>
  );
}
