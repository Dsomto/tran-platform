import { requireGrader } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GraderQueue } from "./grader-queue";

export default async function AdminReportsPage() {
  const session = await requireGrader();

  const [queue, mine, pendingCount, passedToday, failedToday] = await Promise.all([
    prisma.stageReport.findMany({
      where: { status: "SUBMITTED", graderId: null },
      orderBy: { submittedAt: "asc" },
      take: 25,
      include: {
        intern: {
          select: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    }),
    prisma.stageReport.findMany({
      where: { status: "UNDER_REVIEW", graderId: session.id },
      orderBy: { claimedAt: "asc" },
      include: {
        intern: {
          select: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    }),
    prisma.stageReport.count({ where: { status: "SUBMITTED", graderId: null } }),
    prisma.stageReport.count({
      where: {
        graderId: session.id,
        status: "PASSED",
        gradedAt: { gte: startOfToday() },
      },
    }),
    prisma.stageReport.count({
      where: {
        graderId: session.id,
        status: "FAILED",
        gradedAt: { gte: startOfToday() },
      },
    }),
  ]);

  return (
    <GraderQueue
      queue={queue.map(serialize)}
      mine={mine.map(serialize)}
      pendingCount={pendingCount}
      passedToday={passedToday}
      failedToday={failedToday}
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

function serialize(r: ReportWithIntern) {
  return {
    id: r.id,
    stage: r.stage,
    status: r.status,
    version: r.version,
    submittedAt: r.submittedAt ? r.submittedAt.toISOString() : null,
    claimedAt: r.claimedAt ? r.claimedAt.toISOString() : null,
    internName: `${r.intern.user.firstName} ${r.intern.user.lastName}`,
    internEmail: r.intern.user.email,
  };
}
