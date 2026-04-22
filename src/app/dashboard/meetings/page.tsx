import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Calendar, ExternalLink } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default async function MeetingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const intern = await prisma.intern.findUnique({
    where: { userId: session.id },
  });

  if (!intern) redirect("/dashboard");

  const meetings = await prisma.meeting.findMany({
    where: {
      startTime: { gte: new Date() },
      OR: [
        { stage: intern.currentStage },
        { track: intern.track },
        { stage: null, track: null },
      ],
    },
    orderBy: { startTime: "asc" },
    take: 20,
  });

  return (
    <>
      <Topbar
        title="Meetings"
        subtitle="Upcoming team and track meetings"
        firstName={session.firstName}
        lastName={session.lastName}
        avatarUrl={session.avatarUrl}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Video className="w-16 h-16 text-muted/20 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Upcoming Meetings
            </h3>
            <p className="text-sm text-muted">
              Scheduled meetings will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <Card key={meeting.id} variant="glass">
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                      <Video className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        {meeting.title}
                      </h3>
                      {meeting.description && (
                        <p className="text-xs text-muted mt-1">
                          {meeting.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Calendar className="w-3.5 h-3.5 text-muted" />
                        <span className="text-xs text-muted">
                          {formatDateTime(meeting.startTime)} —{" "}
                          {formatDateTime(meeting.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        {meeting.stage && (
                          <Badge variant="primary" size="sm">
                            {meeting.stage.replace("STAGE_", "Stage ")}
                          </Badge>
                        )}
                        {meeting.track && (
                          <Badge variant="secondary" size="sm">
                            {meeting.track.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <a
                    href={meeting.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 gradient-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg transition-all shrink-0"
                  >
                    Join
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
