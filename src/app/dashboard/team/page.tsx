import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, Star } from "lucide-react";
import { trackLabel } from "@/lib/utils";

export default async function TeamPage() {
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
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
            orderBy: { points: "desc" },
          },
        },
      },
    },
  });

  if (!intern) redirect("/dashboard");

  return (
    <>
      <Topbar
        title="My Team"
        subtitle={intern.team?.name || "Not assigned to a team yet"}
        firstName={session.firstName}
        lastName={session.lastName}
        avatarUrl={session.avatarUrl}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {!intern.team ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Users className="w-16 h-16 text-muted/20 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Team Yet
            </h3>
            <p className="text-sm text-muted">
              You&apos;ll be assigned to a team by an admin soon.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Team Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <Card variant="glass">
                <CardContent className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {intern.team.totalPoints}
                    </p>
                    <p className="text-xs text-muted">Team Points</p>
                  </div>
                </CardContent>
              </Card>

              <Card variant="glass">
                <CardContent className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {intern.team.members.length}
                    </p>
                    <p className="text-xs text-muted">Members</p>
                  </div>
                </CardContent>
              </Card>

              <Card variant="glass">
                <CardContent className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Star className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {Math.round(
                        intern.team.totalPoints / (intern.team.members.length || 1)
                      )}
                    </p>
                    <p className="text-xs text-muted">Avg Points</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Members List */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Team Members
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {intern.team.members.map((member, i) => (
                  <Card key={member.id} variant="glass">
                    <CardContent className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar
                          firstName={member.user.firstName}
                          lastName={member.user.lastName}
                          src={member.user.avatarUrl}
                          size="lg"
                        />
                        {i < 3 && (
                          <span
                            className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                              i === 0
                                ? "bg-amber-100 text-amber-700 border-amber-200"
                                : i === 1
                                ? "bg-gray-100 text-gray-600 border-gray-200"
                                : "bg-orange-100 text-orange-700 border-orange-200"
                            }`}
                          >
                            {i + 1}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {member.user.firstName} {member.user.lastName}
                          {member.id === intern.id && (
                            <span className="text-primary ml-1">(You)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted">{trackLabel(member.track)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="primary" size="sm">
                            Stage {member.currentStage.replace("STAGE_", "")}
                          </Badge>
                          <span className="text-xs font-medium text-accent">
                            {member.points} pts
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
