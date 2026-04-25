import { requireGrader } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GraderQueue } from "./grader-queue";

export default async function AdminReportsPage() {
  const session = await requireGrader();
  const isSuper = session.role === "SUPER_ADMIN";

  // Two-grader claimable queue: status SUBMITTED or UNDER_REVIEW, not divergent,
  // fewer than 2 graders, this grader not already on it, this grader has not
  // skipped it for conflict-of-interest.
  const candidates = await prisma.stageReport.findMany({
    where: {
      status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      submittedAt: { not: null },
      divergent: false,
    },
    orderBy: { submittedAt: "asc" },
    include: {
      grades: { select: { graderId: true } },
      intern: {
        select: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
    },
    take: 100,
  });

  const claimable = candidates.filter(
    (r) =>
      r.grades.length < 2 &&
      !r.grades.some((g) => g.graderId === session.id) &&
      !r.skippedByGraderIds.includes(session.id)
  );
  const queue = claimable.slice(0, 25);
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
      pendingCount={pendingCount}
      passedToday={passedToday}
      failedToday={failedToday}
      isSuper={isSuper}
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
