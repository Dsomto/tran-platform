"use client";

import { useState, useEffect, useCallback } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Trophy, Users, Plus } from "lucide-react";

interface TeamData {
  id: string;
  name: string;
  description: string | null;
  totalPoints: number;
  _count: { members: number };
  members: {
    id: string;
    points: number;
    track: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    };
  }[];
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

  const fetchTeams = useCallback(async () => {
    const res = await fetch("/api/teams");
    const data = await res.json();
    setTeams(data.teams || []);
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDesc }),
      });
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
      fetchTeams();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Topbar
        title="Teams"
        subtitle="Manage intern teams"
        firstName={adminUser.firstName}
        lastName={adminUser.lastName}
        avatarUrl={adminUser.avatarUrl}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Create Team Button */}
        <div className="flex justify-end mb-6">
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Button>
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4">
            <Card variant="glass" className="w-full max-w-md shadow-2xl">
              <CardContent>
                <h3 className="text-lg font-bold text-foreground mb-4">
                  Create New Team
                </h3>
                <form onSubmit={handleCreate} className="space-y-4">
                  <Input
                    label="Team Name"
                    placeholder="e.g. Firewall Breakers"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                  <Textarea
                    label="Description (optional)"
                    placeholder="What this team focuses on..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                  <div className="flex gap-3">
                    <Button type="submit" isLoading={isLoading} className="flex-1">
                      Create
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreate(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Teams Grid */}
        {teams.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-muted/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Teams Yet
            </h3>
            <p className="text-sm text-muted">
              Create your first team to get started.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team, i) => (
              <Card key={team.id} variant="glass" className="flex flex-col">
                <CardContent className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-sm">
                        {i + 1}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-foreground">
                          {team.name}
                        </h3>
                        <p className="text-xs text-muted">
                          {team._count.members} members
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span className="text-lg font-bold text-primary">
                        {team.totalPoints}
                      </span>
                    </div>
                  </div>

                  {team.description && (
                    <p className="text-xs text-muted mb-4">{team.description}</p>
                  )}

                  <div className="space-y-2">
                    {team.members.slice(0, 5).map((m) => (
                      <div key={m.id} className="flex items-center gap-2">
                        <Avatar
                          firstName={m.user.firstName}
                          lastName={m.user.lastName}
                          src={m.user.avatarUrl}
                          size="sm"
                        />
                        <span className="text-xs text-foreground truncate flex-1">
                          {m.user.firstName} {m.user.lastName}
                        </span>
                        <Badge variant="primary" size="sm">
                          {m.points} pts
                        </Badge>
                      </div>
                    ))}
                    {team.members.length > 5 && (
                      <p className="text-xs text-muted pl-10">
                        +{team.members.length - 5} more
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
