"use client";

import { useState, useEffect, useCallback } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Megaphone, Pin, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AnnouncementData {
  id: string;
  title: string;
  content: string;
  stage: string | null;
  track: string | null;
  isPinned: boolean;
  createdAt: string;
  author: {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

const stageOptions = [
  { value: "", label: "All Stages" },
  ...Array.from({ length: 10 }, (_, i) => ({
    value: `STAGE_${i}`,
    label: `Stage ${i}`,
  })),
];

const trackOptions = [
  { value: "", label: "All Tracks" },
  { value: "SOC_ANALYSIS", label: "SOC Analysis" },
  { value: "ETHICAL_HACKING", label: "Ethical Hacking" },
  { value: "GRC", label: "GRC" },
];

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [stage, setStage] = useState("");
  const [track, setTrack] = useState("");
  const [isPinned, setIsPinned] = useState(false);
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

  const fetchAnnouncements = useCallback(async () => {
    const res = await fetch("/api/announcements?limit=50");
    const data = await res.json();
    setAnnouncements(data.announcements || []);
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          stage: stage || null,
          track: track || null,
          isPinned,
        }),
      });
      setShowCreate(false);
      setTitle("");
      setContent("");
      setStage("");
      setTrack("");
      setIsPinned(false);
      fetchAnnouncements();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Topbar
        title="Announcements"
        subtitle="Broadcast messages to interns"
        firstName={adminUser.firstName}
        lastName={adminUser.lastName}
        avatarUrl={adminUser.avatarUrl}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-end mb-6">
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Announcement
          </Button>
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4">
            <Card variant="glass" className="w-full max-w-lg shadow-2xl">
              <CardContent>
                <h3 className="text-lg font-bold text-foreground mb-4">
                  New Announcement
                </h3>
                <form onSubmit={handleCreate} className="space-y-4">
                  <Input
                    label="Title"
                    placeholder="Announcement title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                  <Textarea
                    label="Content"
                    placeholder="Write your announcement..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    className="min-h-[120px]"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Target Stage"
                      options={stageOptions}
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                    />
                    <Select
                      label="Target Track"
                      options={trackOptions}
                      value={track}
                      onChange={(e) => setTrack(e.target.value)}
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-foreground">
                      Pin this announcement
                    </span>
                  </label>
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      isLoading={isLoading}
                      className="flex-1"
                    >
                      Publish
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

        {/* Announcements List */}
        {announcements.length === 0 ? (
          <div className="text-center py-20">
            <Megaphone className="w-16 h-16 text-muted/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Announcements
            </h3>
            <p className="text-sm text-muted">
              Create your first announcement to broadcast to interns.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((a) => (
              <Card key={a.id} variant="glass">
                <CardContent>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-2">
                      {a.isPinned && (
                        <Pin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h3 className="text-base font-semibold text-foreground">
                          {a.title}
                        </h3>
                        <p className="text-xs text-muted mt-0.5">
                          {a.author.firstName} {a.author.lastName} &bull;{" "}
                          {formatDate(a.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {a.stage && (
                        <Badge variant="primary" size="sm">
                          {a.stage.replace("STAGE_", "Stage ")}
                        </Badge>
                      )}
                      {a.track && (
                        <Badge variant="secondary" size="sm">
                          {a.track.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">
                    {a.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
