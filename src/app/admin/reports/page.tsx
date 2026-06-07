import { requireGrader } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isSoloGradingEnabled } from "@/lib/system-settings";
import { GraderQueue } from "./grader-queue";

export default async function AdminReportsPage() {
  const session = await requireGrader();
  const isSuper = session.role === "SUPER_ADMIN";
  const solo = await isSoloGradingEnabled();

  // Two-grader claimable queue: status SUBMITTED or UNDER_REVIEW, not divergent,
  // fewer than 2 graders, this grader not already on it, this grader has not
  // skipped it for conflict-of-interest. In solo mode the second-grader slot
  // doesn't exist, so reports with any existing grade are already finalised
  // and drop out of the candidate set.
  const candidates = await prisma.stageReport.findMany({
    where: {
      status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      submittedAt: { not: null },
      divergent: false,
    },
    orderBy: { submittedAt: "asc" },
    include: {
      // Include score so we can distinguish orphan claims (score=null) from
      // real submitted grades. Orphan claims shouldn't make a report look
      // "already graded" — they were never submitted.
      grades: { select: { graderId: true, score: true } },
      intern: {
        select: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
    },
    take: isSuper ? 1000 : 100,
  });

  // A "submitted" grade has a score on it; a grade row with score=null is
  // an orphan claim (some grader clicked Claim and never finished).
  // Orphan claims should not block the report from being graded.
  // Second-grader slot is reserved for super-admin. Non-super-admin graders
  // only see reports nobody has submitted a grade on. Super-admins see both
  // the empty queue and any report sitting with one submitted grade waiting
  // for a second. In solo mode the second slot is disabled — any submitted
  // grade means the report should be finalised and drops out of the queue.
  const claimable = candidates.filter((r) => {
    const submittedGradeCount = r.grades.filter((g) => g.score !== null).length;
    if (submittedGradeCount >= 2) return false;
    // Super-admin can take over even when they already claimed it (resume).
    if (
      session.role !== "SUPER_ADMIN" &&
      r.grades.some((g) => g.graderId === session.id && g.score !== null)
    ) {
      return false;
    }
    if (r.skippedByGraderIds.includes(session.id)) return false;
    if (solo && submittedGradeCount >= 1) return false;
    if (!solo && submittedGradeCount === 1 && session.role !== "SUPER_ADMIN") return false;
    return true;
  });
  // Super-admin in solo mode wants the whole list scrollable, so don't slice.
  const queue = isSuper ? claimable : claimable.slice(0, 25);
  const pendingCount = claimable.length;

  const myUnfinished = await prisma.reportGrade.findMany({
    where: { graderId: session.id, gradedAt: null },
    orderBy: { claimedAt: "asc" },
    include: {
      report: {
        include: {
          grades: { select: { graderId: true } },
          intern: {
            select: {
              user: { select: { firstName: true, lastName: true, email: true } },
            },
          },
        },
      },
    },
  });

  const tiebreakReports = isSuper
    ? await prisma.stageReport.findMany({
        where: { divergent: true },
        orderBy: { updatedAt: "asc" },
        include: {
          grades: { select: { score: true } },
          intern: {
            select: {
              user: { select: { firstName: true, lastName: true, email: true } },
            },
          },
        },
      })
    : [];

  const startToday = startOfToday();
  const myGradesToday = await prisma.reportGrade.findMany({
    where: { graderId: session.id, gradedAt: { gte: startToday } },
    select: { id: true, score: true },
  });
  const passingScoreDefault = 70;
  const passedToday = myGradesToday.filter(
    (g) => (g.score ?? 0) >= passingScoreDefault
  ).length;
  const failedToday = myGradesToday.filter(
    (g) => g.score !== null && (g.score ?? 0) < passingScoreDefault
  ).length;

  // Super-admin view: every intern who ever submitted a report, across all
  // stages and statuses, with a clickable submission link. Lets the
  // programme office scan who's where without bouncing between admin pages.
  // Falls back from reportUrl to attachmentUrl the same way Result Review
  // does so attachment-only submissions still surface a clickable link.
  const allSubmissions = isSuper
    ? await prisma.stageReport.findMany({
        where: { submittedAt: { not: null } },
        orderBy: [{ stage: "asc" }, { submittedAt: "desc" }],
        select: {
          id: true,
          stage: true,
          status: true,
          score: true,
          submittedAt: true,
          reportUrl: true,
          attachmentUrl: true,
          intern: {
            select: {
              user: { select: { firstName: true, lastName: true, email: true } },
            },
          },
        },
      })
    : [];

  return (
    <GraderQueue
      queue={queue.map((r) => serialize(r, r.grades.length))}
      mine={myUnfinished.map((g) => serialize(g.report, g.report.grades.length))}
      tiebreak={tiebreakReports.map((r) => ({
        id: r.id,
        stage: r.stage,
        version: r.version,
        submittedAt: r.submittedAt ? r.submittedAt.toISOString() : null,
        internName: `${r.intern.user.firstName} ${r.intern.user.lastName}`,
        internEmail: r.intern.user.email,
        scores: r.grades
          .map((g) => g.score)
          .filter((s): s is number => s !== null && s !== undefined),
      }))}
      allSubmissions={allSubmissions.map((r) => ({
        id: r.id,
        stage: r.stage,
        status: r.status,
        score: r.score,
        submittedAt: r.submittedAt ? r.submittedAt.toISOString() : null,
        submissionUrl: r.reportUrl ?? r.attachmentUrl ?? null,
        internName: `${r.intern.user.firstName} ${r.intern.user.lastName}`,
        internEmail: r.intern.user.email,
      }))}
      pendingCount={pendingCount}
      passedToday={passedToday}
      failedToday={failedToday}
      isSuper={isSuper}
      soloGrading={solo}
    />
  );
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

type ReportWithIntern = {
  id: string;
  stage: string;
  status: string;
  version: number;
  submittedAt: Date | null;
  claimedAt: Date | null;
  intern: {
    user: { firstName: string; lastName: string; email: string };
  };
};

function serialize(r: ReportWithIntern, gradeCount: number) {
  return {
    id: r.id,
    stage: r.stage,
    status: r.status,
    version: r.version,
    submittedAt: r.submittedAt ? r.submittedAt.toISOString() : null,
    claimedAt: r.claimedAt ? r.claimedAt.toISOString() : null,
    internName: `${r.intern.user.firstName} ${r.intern.user.lastName}`,
    internEmail: r.intern.user.email,
    gradeCount,
  };
}
