import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import {
  Trophy,
  Target,
  Users,
  Star,
  Clock,
  BookOpen,
  ArrowUpRight,
  Pin,
} from "lucide-react";
import { formatDate, stageToNumber, trackLabel } from "@/lib/utils";
import Link from "next/link";
import { SlackCard } from "@/components/dashboard/slack-card";
import { OnboardingWalkthrough } from "@/components/dashboard/onboarding-walkthrough";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const intern = await prisma.intern.findUnique({
    where: { userId: session.id },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: {
                select: { firstName: true, lastName: true, avatarUrl: true },
              },
            },
            orderBy: { points: "desc" },
            take: 5,
          },
        },
      },
    },
  });

  if (!intern) {
    // User has no intern profile yet — check application status
    const app = await prisma.application.findUnique({
      where: { userId: session.id },
    });

    return (
      <>
        <Topbar
          title="Dashboard"
          firstName={session.firstName}
          lastName={session.lastName}
          avatarUrl={session.avatarUrl}
        />
        <div className="flex-1 flex items-center justify-center p-8">
          <Card variant="glass" className="max-w-md text-center p-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              {app
                ? app.status === "PENDING"
                  ? "Application Under Review"
                  : "Application Not Approved"
                : "No Application Found"}
            </h2>
            <p className="text-sm text-muted mb-6">
              {app
                ? app.status === "PENDING"
                  ? "Your application is being reviewed. You'll receive an email once a decision is made."
                  : "Unfortunately your application was not approved for this cohort."
                : "You haven't submitted an application yet."}
            </p>
            {!app && (
              <Link
                href="/apply"
                className="inline-flex items-center gap-2 gradient-primary text-white px-6 py-3 rounded-xl font-semibold text-sm"
              >
                Apply Now
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            )}
          </Card>
        </div>
      </>
    );
  }

  // Fetch data in parallel
  const [assignments, announcements, leaderboardData] = await Promise.all([
    prisma.assignment.findMany({
      where: {
        stage: intern.currentStage,
        OR: [{ track: intern.track }, { track: null }],
      },
      include: {
        submissions: {
          where: { internId: intern.id },
          take: 1,
        },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.announcement.findMany({
      where: {
        // Show announcements targeted to everyone, or this intern's stage, or this intern's track.
        AND: [
          {
            OR: [{ stage: null }, { stage: intern.currentStage }],
          },
          {
            OR: [{ track: null }, { track: intern.track }],
          },
        ],
      },
      include: {
        author: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 4,
    }),
    prisma.intern.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: { firstName: true, lastName: true, avatarUrl: true },
        },
      },
      orderBy: { points: "desc" },
      take: 5,
    }),
  ]);

  const stageNum = stageToNumber(intern.currentStage);
  const stageProgress = ((stageNum + 1) / 10) * 100;

  // Find intern's rank
  const rank =
    leaderboardData.findIndex((l) => l.id === intern.id) + 1 || "50+";

  return (
    <>
      <Topbar
        title={`Welcome back, ${session.firstName}`}
        subtitle={`Stage ${stageNum} — ${trackLabel(intern.track)}`}
        firstName={session.firstName}
        lastName={session.lastName}
        avatarUrl={session.avatarUrl}
      />

      <OnboardingWalkthrough />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div id="slack-card">
          <SlackCard
            inviteUrl={process.env.SLACK_CHANNEL_URL ?? null}
            joined={intern.slackJoined ?? false}
            joinedAt={intern.slackJoinedAt ? intern.slackJoinedAt.toISOString() : null}
          />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="glass">
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  Stage {stageNum}
                </p>
                <p className="text-xs text-muted">Current Stage</p>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <Star className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {intern.points}
                </p>
                <p className="text-xs text-muted">Total Points</p>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">#{rank}</p>
                <p className="text-xs text-muted">Leaderboard Rank</p>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {intern.team?.name || "—"}
                </p>
                <p className="text-xs text-muted">Team</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stage Progress */}
        <Card variant="glass">
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">
                Stage Progress
              </h3>
              <Badge variant="primary">
                Stage {stageNum} of 9
              </Badge>
            </div>
            <Progress value={stageProgress} size="lg" />
            <div className="flex justify-between mt-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`text-xs font-medium ${
                    i <= stageNum ? "text-primary" : "text-muted/40"
                  }`}
                >
                  {i}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Active Assignments */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Active Assignments
              </h3>
              <Link
                href="/dashboard/assignments"
                className="text-sm text-primary hover:text-primary-dark font-medium"
              >
                View All →
              </Link>
            </div>
            {assignments.length === 0 ? (
              <Card variant="glass" className="text-center py-8">
                <BookOpen className="w-10 h-10 text-muted/30 mx-auto mb-3" />
                <p className="text-sm text-muted">
                  No assignments for your current stage yet.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => {
                  const submitted = assignment.submissions.length > 0;
                  const isPastDue = assignment.dueDate != null && new Date() > assignment.dueDate;

                  return (
                    <Card key={assignment.id} variant="glass" hover>
                      <CardContent className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-foreground truncate">
                              {assignment.title}
                            </h4>
                            {submitted ? (
                              <Badge variant="success" size="sm">
                                Submitted
                              </Badge>
                            ) : isPastDue ? (
                              <Badge variant="danger" size="sm">
                                Overdue
                              </Badge>
                            ) : (
                              <Badge variant="warning" size="sm">
                                Pending
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted">
                            {assignment.dueDate
                              ? `Due: ${formatDate(assignment.dueDate)} • `
                              : "No due date • "}
                            {assignment.maxPoints} pts
                          </p>
                        </div>
                        <Link
                          href={`/dashboard/assignments`}
                          className="ml-4 p-2 rounded-xl hover:bg-surface-hover transition-colors"
                        >
                          <ArrowUpRight className="w-4 h-4 text-muted" />
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Announcements */}
            <div className="flex items-center justify-between mt-8">
              <h3 className="text-lg font-semibold text-foreground">
                Announcements
              </h3>
              {announcements.length > 0 && (
                <Link
                  href="/dashboard/announcements"
                  className="text-sm text-primary hover:text-primary-dark font-medium"
                >
                  See all →
                </Link>
              )}
            </div>
            {announcements.length === 0 ? (
              <Card variant="glass" className="text-center py-8">
                <p className="text-sm text-muted">No announcements yet.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {announcements.map((a) => (
                  <Link
                    key={a.id}
                    href={`/dashboard/announcements#${a.id}`}
                    className="block"
                  >
                    <Card variant="glass" className="hover:bg-white/60 transition-colors cursor-pointer">
                      <CardContent>
                        <div className="flex items-start gap-2 mb-2">
                          {a.isPinned && (
                            <Pin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          )}
                          <h4 className="text-sm font-semibold text-foreground">
                            {a.title}
                          </h4>
                        </div>
                        <p className="text-sm text-muted leading-relaxed line-clamp-2">
                          {a.content}
                        </p>
                        <p className="text-xs text-muted/60 mt-2">
                          {a.author.firstName} {a.author.lastName} &bull;{" "}
                          {formatDate(a.createdAt)}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: Leaderboard + Team */}
          <div className="space-y-6">
            {/* Mini Leaderboard */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Top Interns
                </h3>
                <Link
                  href="/dashboard/leaderboard"
                  className="text-sm text-primary hover:text-primary-dark font-medium"
                >
                  Full Board →
                </Link>
              </div>
              <Card variant="glass">
                <CardContent className="space-y-3">
                  {leaderboardData.map((entry, i) => (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-3 p-2 rounded-xl ${
                        entry.id === intern.id
                          ? "bg-primary/5 border border-primary/10"
                          : ""
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          i === 0
                            ? "bg-amber-100 text-amber-700"
                            : i === 1
                            ? "bg-gray-100 text-gray-600"
                            : i === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-border-light text-muted"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <Avatar
                        firstName={entry.user.firstName}
                        lastName={entry.user.lastName}
                        src={entry.user.avatarUrl}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {entry.user.firstName} {entry.user.lastName}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-primary">
                        {entry.points}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Team Members */}
            {intern.team && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {intern.team.name}
                  </h3>
                  <Link
                    href="/dashboard/team"
                    className="text-sm text-primary hover:text-primary-dark font-medium"
                  >
                    View →
                  </Link>
                </div>
                <Card variant="glass">
                  <CardContent className="space-y-3">
                    {intern.team.members.map((m) => (
                      <div key={m.id} className="flex items-center gap-3">
                        <Avatar
                          firstName={m.user.firstName}
                          lastName={m.user.lastName}
                          src={m.user.avatarUrl}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {m.user.firstName} {m.user.lastName}
                          </p>
                          <p className="text-xs text-muted">
                            {m.points} pts
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
