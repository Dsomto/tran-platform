"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Medal } from "lucide-react";
import { trackLabel } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatarUrl: string | null;
  points: number;
  stage: string;
  track: string;
  team: string | null;
}

interface TeamEntry {
  rank: number;
  id: string;
  name: string;
  points: number;
  memberCount: number;
}

export default function AdminLeaderboardPage() {
  const [type, setType] = useState<"individual" | "team">("individual");
  const [individual, setIndividual] = useState<LeaderboardEntry[]>([]);
  const [teams, setTeams] = useState<TeamEntry[]>([]);
  const [adminUser, setAdminUser] = useState({
    firstName: "",
    lastName: "",
    avatarUrl: null as string | null,
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => d.user && setAdminUser(d.user));
  }, []);

  useEffect(() => {
    fetch(`/api/leaderboard?type=${type}&limit=100`)
      .then((r) => r.json())
      .then((d) => {
        if (type === "individual") setIndividual(d.leaderboard || []);
        else setTeams(d.leaderboard || []);
      });
  }, [type]);

  const medalColors = [
    "bg-amber-100 text-amber-700",
    "bg-gray-100 text-gray-600",
    "bg-orange-100 text-orange-700",
  ];

  return (
    <>
      <Topbar
        title="Leaderboard"
        subtitle="Rankings overview"
        firstName={adminUser.firstName}
        lastName={adminUser.lastName}
        avatarUrl={adminUser.avatarUrl}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setType("individual")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              type === "individual"
                ? "gradient-primary text-white shadow-lg shadow-primary/20"
                : "bg-white border border-border text-muted hover:text-foreground"
            }`}
          >
            <Medal className="w-4 h-4" />
            Individual
          </button>
          <button
            onClick={() => setType("team")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              type === "team"
                ? "gradient-primary text-white shadow-lg shadow-primary/20"
                : "bg-white border border-border text-muted hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4" />
            Teams
          </button>
        </div>

        <Card variant="glass">
          <CardContent>
            {type === "individual" ? (
              <div className="space-y-2">
                {individual.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-hover transition-colors"
                  >
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        entry.rank <= 3
                          ? medalColors[entry.rank - 1]
                          : "bg-border-light text-muted"
                      }`}
                    >
                      {entry.rank}
                    </span>
                    <Avatar
                      firstName={entry.name.split(" ")[0]}
                      lastName={entry.name.split(" ")[1] || ""}
                      src={entry.avatarUrl}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {entry.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="primary" size="sm">
                          Stage {entry.stage.replace("STAGE_", "")}
                        </Badge>
                        <span className="text-xs text-muted">
                          {trackLabel(entry.track)}
                        </span>
                      </div>
                    </div>
                    {entry.team && (
                      <span className="text-xs text-muted hidden sm:block">
                        {entry.team}
                      </span>
                    )}
                    <span className="text-base font-bold text-primary">
                      {entry.points}
                    </span>
                  </div>
                ))}
                {individual.length === 0 && (
                  <div className="text-center py-12">
                    <Trophy className="w-12 h-12 text-muted/20 mx-auto mb-3" />
                    <p className="text-sm text-muted">No interns yet.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-hover transition-colors"
                  >
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        team.rank <= 3
                          ? medalColors[team.rank - 1]
                          : "bg-border-light text-muted"
                      }`}
                    >
                      {team.rank}
                    </span>
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {team.name}
                      </p>
                      <p className="text-xs text-muted">
                        {team.memberCount} members
                      </p>
                    </div>
                    <span className="text-base font-bold text-primary">
                      {team.points}
                    </span>
                  </div>
                ))}
                {teams.length === 0 && (
                  <div className="text-center py-12">
                    <Trophy className="w-12 h-12 text-muted/20 mx-auto mb-3" />
                    <p className="text-sm text-muted">No teams yet.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
