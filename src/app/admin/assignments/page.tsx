"use client";

import { useState, useEffect, useCallback } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { BookOpen, Plus, Calendar, Users } from "lucide-react";
import { formatDate, trackLabel } from "@/lib/utils";
import Link from "next/link";

interface AssignmentData {
  id: string;
  title: string;
  description: string;
  stage: string;
  track: string | null;
  dueDate: string;
  maxPoints: number;
  resources: string | null;
  _count: { submissions: number };
}

const stageOptions = Array.from({ length: 10 }, (_, i) => ({
  value: `STAGE_${i}`,
  label: `Stage ${i}`,
}));

const trackOptions = [
  { value: "", label: "All Tracks" },
  { value: "SOC_ANALYSIS", label: "SOC Analysis" },
  { value: "ETHICAL_HACKING", label: "Ethical Hacking" },
  { value: "GRC", label: "GRC" },
];

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [adminUser, setAdminUser] = useState({
    firstName: "",
    lastName: "",
    avatarUrl: null as string | null,
  });

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formStage, setFormStage] = useState("STAGE_0");
  const [formTrack, setFormTrack] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formMaxPoints, setFormMaxPoints] = useState("100");
  const [formResources, setFormResources] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => d.user && setAdminUser(d.user));
  }, []);

  const fetchAssignments = useCallback(async () => {
    const res = await fetch("/api/assignments");
    const data = await res.json();
    setAssignments(data.assignments || []);
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          description: formDesc,
          stage: formStage,
          track: formTrack || null,
          dueDate: formDueDate,
          maxPoints: parseInt(formMaxPoints),
          resources: formResources || null,
        }),
      });
      setShowCreate(false);
      setFormTitle("");
      setFormDesc("");
      setFormStage("STAGE_0");
      setFormTrack("");
      setFormDueDate("");
      setFormMaxPoints("100");
      setFormResources("");
      fetchAssignments();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Topbar
        title="Assignments"
        subtitle="Create and manage stage tasks"
        firstName={adminUser.firstName}
        lastName={adminUser.lastName}
        avatarUrl={adminUser.avatarUrl}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-end mb-6">
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Assignment
          </Button>
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4">
            <Card
              variant="glass"
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <CardContent>
                <h3 className="text-lg font-bold text-foreground mb-4">
                  New Assignment
                </h3>
                <form onSubmit={handleCreate} className="space-y-4">
                  <Input
                    label="Title"
                    placeholder="e.g. SQL Injection Lab"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                  />
                  <Textarea
                    label="Description"
                    placeholder="Detailed instructions for the assignment..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    required
                    className="min-h-[120px]"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Stage"
                      options={stageOptions}
                      value={formStage}
                      onChange={(e) => setFormStage(e.target.value)}
                      required
                    />
                    <Select
                      label="Track (optional)"
                      options={trackOptions}
                      value={formTrack}
                      onChange={(e) => setFormTrack(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Due Date"
                      type="datetime-local"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      required
                    />
                    <Input
                      label="Max Points"
                      type="number"
                      value={formMaxPoints}
                      onChange={(e) => setFormMaxPoints(e.target.value)}
                      required
                    />
                  </div>
                  <Textarea
                    label="Resources (optional)"
                    placeholder="Links, references, documentation..."
                    value={formResources}
                    onChange={(e) => setFormResources(e.target.value)}
                  />
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      isLoading={isLoading}
                      className="flex-1"
                    >
                      Create Assignment
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

        {/* Assignments List */}
        {assignments.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-muted/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Assignments
            </h3>
            <p className="text-sm text-muted">
              Create your first assignment for interns.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((a) => {
              const isPastDue = new Date() > new Date(a.dueDate);

              return (
                <Card key={a.id} variant="glass">
                  <CardContent>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-base font-semibold text-foreground">
                          {a.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="primary" size="sm">
                            {a.stage.replace("STAGE_", "Stage ")}
                          </Badge>
                          {a.track && (
                            <Badge variant="secondary" size="sm">
                              {trackLabel(a.track)}
                            </Badge>
                          )}
                          {isPastDue && (
                            <Badge variant="danger" size="sm">
                              Past Due
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          {a.maxPoints} pts
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted mt-1">
                          <Users className="w-3.5 h-3.5" />
                          {a._count.submissions} submissions
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted leading-relaxed line-clamp-2 mb-2">
                      {a.description}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-xs text-muted">
                        <Calendar className="w-3.5 h-3.5" />
                        Due: {formatDate(a.dueDate)}
                      </div>
                      <Link
                        href={`/admin/assignments/${a.id}/submissions`}
                        className="text-xs font-semibold text-blue hover:text-blue-dark"
                      >
                        Grade submissions →
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
