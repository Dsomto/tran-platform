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

  // Writeup desk-task submissions for the same intern + stage. These are
  // tasks 8, 9, 10 on Stage 0 (Read the hash on sight, Ethics dilemma,
  // Password-policy critique) — short writeups that auto-grading cannot
  // judge, so a human grader needs to read them alongside the capstone.
  // Any future writeup tasks added to this stage will be picked up
  // automatically by the kind=WRITEUP filter.
  const writeupSubmissions = await prisma.submission.findMany({
    where: {
      internId: report.internId,
      assignment: {
        stage: report.stage,
        kind: "WRITEUP",
      },
    },
    include: {
      assignment: {
        select: { title: true, order: true, maxPoints: true, kind: true },
      },
    },
    orderBy: { assignment: { order: "asc" } },
  });

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
          Executive summary (75-word, from the platform)
        </h2>
        <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
          {report.executiveSummary}
        </div>
      </section>

      {writeupSubmissions.length > 0 && (
        <section className="mb-6 bg-white border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wide">
            Desk-task writeups ({writeupSubmissions.length})
          </h2>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            On Stage 0 these are tasks 08 (Read the hash on sight), 09 (Ethics dilemma), and 10 (Password-policy critique). They are submitted on the platform and graded by you — not by the capstone graders separately. Score them as part of this intern&apos;s overall Stage 0 performance.
          </p>
          <div className="space-y-4">
            {writeupSubmissions.map((s) => (
              <article key={s.id} className="border border-border/70 rounded-lg p-4 bg-slate-50/50">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground">
                      Task {String(s.assignment.order ?? 0).padStart(2, "0")} · {s.assignment.title}
                    </h3>
                    <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                      max {s.assignment.maxPoints} pts
                      {s.submittedAt && (
                        <> · submitted {new Date(s.submittedAt).toLocaleString()}</>
                      )}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded border ${
                      s.status === "GRADED"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : s.status === "LATE"
                          ? "bg-rose-100 text-rose-800 border-rose-300"
                          : "bg-amber-100 text-amber-800 border-amber-300"
                    }`}
                  >
                    {s.status}
                    {s.score !== null && s.score !== undefined && <> · {s.score}/{s.assignment.maxPoints}</>}
                  </span>
                </div>
                {s.content ? (
                  <div className="mt-2 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed bg-white border border-border/60 rounded p-3 max-h-[420px] overflow-y-auto">
                    {s.content}
                  </div>
                ) : (
                  <p className="mt-2 text-xs italic text-muted-foreground">
                    No content stored. (The intern may have used an attachment-only widget; check the attachment URL if one is on the StageReport.)
                  </p>
                )}
                {s.feedback && (
                  <div className="mt-2 text-xs text-foreground/70 italic">
                    Auto-feedback: {s.feedback}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Graders need the marking guide + the original evidence pack files to
          verify the intern's citations during grading. Hardcoded to STAGE_0
          for the current cohort; when STAGE_1+ open, add a stage→resources
          map and look it up by report.stage. */}
      {report.stage === "STAGE_0" && (
        <section className="mb-6 bg-amber-50 border border-amber-300 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-amber-900 mb-3 uppercase tracking-wide">
            Grading resources
          </h2>

          <div className="mb-4">
            <a
              href="/grading/006fdacc-d42b-491c-bb29-8e2f74015fbb/stage-0-marking-guide.pdf"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-amber-900 underline font-semibold text-sm hover:text-amber-950"
            >
              Open the Stage 0 marking guide (PDF, graders only) →
            </a>
            <p className="text-xs text-amber-800/80 mt-0.5">
              The full rubric, per-deliverable scoring bands, AI-use signals, and worked grading example. Keep this open in a tab while you grade.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide mb-2">
              Evidence pack — for verifying the intern&apos;s citations
            </p>
            <ul className="space-y-1.5 text-sm">
              <li>
                <a href="/capstone/stage-0/00-mission-brief.pdf" target="_blank" rel="noreferrer noopener" className="text-amber-800 underline hover:text-amber-950 font-mono text-xs">
                  00-mission-brief.pdf
                </a>
                <span className="text-xs text-amber-800/80"> — the brief the intern read</span>
              </li>
              <li>
                <a href="/capstone/stage-0/auth-log-q2.txt" target="_blank" rel="noreferrer noopener" className="text-amber-800 underline hover:text-amber-950 font-mono text-xs">
                  auth-log-q2.txt
                </a>
                <span className="text-xs text-amber-800/80"> — the SSH auth log (D1 citations resolve here by line number)</span>
              </li>
              <li>
                <a href="/capstone/stage-0/encoded-strings.txt" target="_blank" rel="noreferrer noopener" className="text-amber-800 underline hover:text-amber-950 font-mono text-xs">
                  encoded-strings.txt
                </a>
                <span className="text-xs text-amber-800/80"> — four encoded payloads; one decodes to the threat-actor name (D1 row 3)</span>
              </li>
              <li>
                <a href="/capstone/stage-0/tier-1-ticket-history.csv" target="_blank" rel="noreferrer noopener" className="text-amber-800 underline hover:text-amber-950 font-mono text-xs">
                  tier-1-ticket-history.csv
                </a>
                <span className="text-xs text-amber-800/80"> — Q2 SOC tickets (D2 verbatim quotes resolve here)</span>
              </li>
              <li>
                <a href="/capstone/stage-0/sankofa-roster.csv" target="_blank" rel="noreferrer noopener" className="text-amber-800 underline hover:text-amber-950 font-mono text-xs">
                  sankofa-roster.csv
                </a>
                <span className="text-xs text-amber-800/80"> — staff offboarding dates (D1 row 4 corroboration)</span>
              </li>
            </ul>
          </div>
        </section>
      )}

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
        currentAiFlagged={myGrade?.aiFlagged ?? false}
        currentAiFlagReason={myGrade?.aiFlagReason ?? null}
        status={report.status}
        alreadyGraded={!!myGrade?.gradedAt}
      />
    </div>
  );
}
