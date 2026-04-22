"use client";

import { useState, useEffect, useCallback } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import {
  ArrowUp,
  ArrowDown,
  Plus,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { trackLabel } from "@/lib/utils";

interface InternData {
  id: string;
  currentStage: string;
  track: string;
  points: number;
  isActive: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
  team: { id: string; name: string } | null;
}

export default function InternsPage() {
  const [interns, setInterns] = useState<InternData[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pointsModal, setPointsModal] = useState<InternData | null>(null);
  const [pointsValue, setPointsValue] = useState("");
  const [pointsReason, setPointsReason] = useState("");
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

  const fetchInterns = useCallback(async () => {
    const res = await fetch(`/api/interns?page=${page}&limit=50`);
    const data = await res.json();
    setInterns(data.interns || []);
    setTotalPages(data.pagination?.totalPages || 1);
  }, [page]);

  useEffect(() => {
    fetchInterns();
  }, [fetchInterns]);

  async function handlePromote(internId: string, action: "promote" | "demote") {
    await fetch(`/api/interns/${internId}/promote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    fetchInterns();
  }

  async function handleBulkAction(action: "promote" | "demote") {
    if (selectedIds.size === 0) return;
    await fetch("/api/admin/bulk-promote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ internIds: Array.from(selectedIds), action }),
    });
    setSelectedIds(new Set());
    fetchInterns();
  }

  async function handleAwardPoints() {
    if (!pointsModal || !pointsValue || !pointsReason) return;
    await fetch(`/api/interns/${pointsModal.id}/points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        points: parseInt(pointsValue),
        reason: pointsReason,
      }),
    });
    setPointsModal(null);
    setPointsValue("");
    setPointsReason("");
    fetchInterns();
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function toggleAll() {
    if (selectedIds.size === interns.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(interns.map((i) => i.id)));
    }
  }

  return (
    <>
      <Topbar
        title="Interns"
        subtitle={`${interns.length} active interns`}
        firstName={adminUser.firstName}
        lastName={adminUser.lastName}
        avatarUrl={adminUser.avatarUrl}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 mb-4 p-4 glass rounded-2xl">
            <span className="text-sm font-medium text-foreground">
              {selectedIds.size} selected
            </span>
            <Button size="sm" onClick={() => handleBulkAction("promote")}>
              <ArrowUp className="w-4 h-4 mr-1" />
              Promote All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction("demote")}
            >
              <ArrowDown className="w-4 h-4 mr-1" />
              Demote All
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        )}

        {/* Points Modal */}
        {pointsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4">
            <Card variant="glass" className="w-full max-w-md shadow-2xl">
              <CardContent>
                <h3 className="text-lg font-bold text-foreground mb-4">
                  Award Points to {pointsModal.user.firstName}
                </h3>
                <div className="space-y-4">
                  <Input
                    label="Points"
                    type="number"
                    placeholder="e.g. 10"
                    value={pointsValue}
                    onChange={(e) => setPointsValue(e.target.value)}
                  />
                  <Input
                    label="Reason"
                    placeholder="e.g. Excellent assignment submission"
                    value={pointsReason}
                    onChange={(e) => setPointsReason(e.target.value)}
                  />
                  <div className="flex gap-3">
                    <Button onClick={handleAwardPoints} className="flex-1">
                      Award Points
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPointsModal(null)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Table Header */}
        <Card variant="glass">
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === interns.length && interns.length > 0}
                        onChange={toggleAll}
                        className="rounded"
                      />
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-muted uppercase">
                      Intern
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-muted uppercase">
                      Track
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-muted uppercase">
                      Stage
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-muted uppercase">
                      Points
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-muted uppercase">
                      Team
                    </th>
                    <th className="text-right p-3 text-xs font-medium text-muted uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {interns.map((intern) => (
                    <tr
                      key={intern.id}
                      className="border-b border-border/50 hover:bg-surface-hover transition-colors"
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(intern.id)}
                          onChange={() => toggleSelect(intern.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            firstName={intern.user.firstName}
                            lastName={intern.user.lastName}
                            src={intern.user.avatarUrl}
                            size="sm"
                          />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {intern.user.firstName} {intern.user.lastName}
                            </p>
                            <p className="text-xs text-muted">
                              {intern.user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="primary" size="sm">
                          {trackLabel(intern.track)}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="text-sm font-semibold text-foreground">
                          {intern.currentStage.replace("STAGE_", "Stage ")}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm font-bold text-primary">
                          {intern.points}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-muted">
                          {intern.team?.name || "—"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => handlePromote(intern.id, "promote")}
                            className="p-1.5 rounded-lg hover:bg-accent/10 text-accent transition-colors cursor-pointer"
                            title="Promote"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePromote(intern.id, "demote")}
                            className="p-1.5 rounded-lg hover:bg-danger/10 text-danger transition-colors cursor-pointer"
                            title="Demote"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPointsModal(intern)}
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors cursor-pointer"
                            title="Award Points"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {interns.length === 0 && (
                <div className="text-center py-16">
                  <Users className="w-12 h-12 text-muted/20 mx-auto mb-3" />
                  <p className="text-sm text-muted">No interns found.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="flex items-center text-sm text-muted px-3">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
