import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  ClipboardList,
  Award,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { trackLabel } from "@/lib/utils";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [
    totalInterns,
    activeInterns,
    pendingPublicApps,
    totalPublicApps,
    totalTeams,
    totalAssignments,
    stageDistribution,
    trackDistribution,
    recentPublicApps,
  ] = await Promise.all([
    prisma.intern.count(),
    prisma.intern.count({ where: { isActive: true } }),
    prisma.publicApplication.count({ where: { status: "pending" } }),
    prisma.publicApplication.count(),
    prisma.team.count(),
    prisma.assignment.count(),
    prisma.intern.groupBy({
      by: ["currentStage"],
      _count: { id: true },
      where: { isActive: true },
    }),
    prisma.intern.groupBy({
      by: ["track"],
      _count: { id: true },
      where: { isActive: true },
    }),
    prisma.publicApplication.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const stats = [
    {
      label: "Pending Applications",
      value: pendingPublicApps,
      total: totalPublicApps,
      icon: UserCheck,
      color: "bg-warning/10 text-warning",
      href: "/admin/applicants",
    },
    {
      label: "Total Applications",
      value: totalPublicApps,
      icon: ClipboardList,
      color: "bg-primary/10 text-primary",
      href: "/admin/applicants",
    },
    {
      label: "Active Interns",
      value: activeInterns,
      total: totalInterns,
      icon: Users,
      color: "bg-accent/10 text-accent",
      href: "/admin/interns",
    },
    {
      label: "Teams",
      value: totalTeams,
      icon: Award,
      color: "bg-secondary/10 text-secondary",
      href: "/admin/teams",
    },
  ];

  // Prepare stage data for chart-like display
  const stages = Array.from({ length: 10 }, (_, i) => {
    const stage = `STAGE_${i}`;
    const found = stageDistribution.find((s) => s.currentStage === stage);
    return { stage: i, count: found?._count.id || 0 };
  });

  const maxStageCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <>
      <Topbar
        title="Admin Dashboard"
        subtitle="Manage the UBI program"
        firstName={session.firstName}
        lastName={session.lastName}
        avatarUrl={session.avatarUrl}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <Card variant="glass" hover className="h-full">
                <CardContent className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center shrink-0`}
                  >
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Stage Distribution */}
          <Card variant="glass" className="lg:col-span-2">
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">
                  Stage Distribution
                </h3>
                <TrendingUp className="w-5 h-5 text-muted" />
              </div>
              <div className="space-y-3">
                {stages.map((s) => (
                  <div key={s.stage} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-muted w-16">
                      Stage {s.stage}
                    </span>
                    <div className="flex-1 bg-border-light rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full gradient-primary rounded-full flex items-center justify-end px-2 transition-all duration-500"
                        style={{
                          width: `${Math.max(
                            (s.count / maxStageCount) * 100,
                            s.count > 0 ? 8 : 0
                          )}%`,
                        }}
                      >
                        {s.count > 0 && (
                          <span className="text-[10px] font-bold text-white">
                            {s.count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Track Distribution */}
          <Card variant="glass">
            <CardContent>
              <h3 className="text-lg font-semibold text-foreground mb-6">
                Track Breakdown
              </h3>
              <div className="space-y-4">
                {trackDistribution.map((t) => (
                  <div key={t.track} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full gradient-primary" />
                      <span className="text-sm text-muted">
                        {trackLabel(t.track)}
                      </span>
                    </div>
                    <Badge variant="primary">{t._count.id}</Badge>
                  </div>
                ))}
                {trackDistribution.length === 0 && (
                  <p className="text-sm text-muted text-center py-4">
                    No interns yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Pending Applications */}
        <Card variant="glass">
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Recent Pending Applications
              </h3>
              <Link
                href="/admin/applicants"
                className="text-sm text-primary hover:text-primary-dark font-medium"
              >
                View All →
              </Link>
            </div>
            {recentPublicApps.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">
                No pending applications.
              </p>
            ) : (
              <div className="space-y-3">
                {recentPublicApps.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-hover transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {app.fullName}
                      </p>
                      <p className="text-xs text-muted">{app.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="primary" size="sm">
                        {app.trackInterest}
                      </Badge>
                      <span className="text-xs text-muted">{app.country}</span>
                      <Badge variant="warning" size="sm">Pending</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
