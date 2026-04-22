import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Megaphone, Pin } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function InternAnnouncementsPage() {
  const session = await requireAuth();
  const intern = await prisma.intern.findUnique({
    where: { userId: session.id },
  });

  if (!intern) {
    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto w-full">
        <p className="text-muted-foreground">Intern profile not found.</p>
      </div>
    );
  }

  const announcements = await prisma.announcement.findMany({
    where: {
      AND: [
        { OR: [{ stage: null }, { stage: intern.currentStage }] },
        { OR: [{ track: null }, { track: intern.track }] },
      ],
    },
    include: {
      author: { select: { firstName: true, lastName: true } },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto w-full">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Megaphone className="h-6 w-6 text-blue" />
          <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Programme announcements from the team. Pinned messages sit at the top.
        </p>
      </header>

      {announcements.length === 0 ? (
        <div className="p-10 bg-white border border-border rounded-xl text-center text-muted-foreground">
          <Megaphone className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm">No announcements yet. You'll see them here when the team posts.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <article
              key={a.id}
              id={a.id}
              className={`bg-white border rounded-xl p-5 scroll-mt-20 ${
                a.isPinned ? "border-blue/30 bg-blue/5" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                <div className="flex items-start gap-2 min-w-0">
                  {a.isPinned && <Pin className="h-4 w-4 text-blue shrink-0 mt-1" />}
                  <h2 className="text-base font-semibold text-foreground">
                    {a.title}
                  </h2>
                </div>
                <div className="flex gap-2 shrink-0">
                  {a.stage && (
                    <span className="text-xs px-2 py-0.5 rounded bg-muted/50 text-muted-foreground">
                      {a.stage.replace("STAGE_", "Stage ")}
                    </span>
                  )}
                  {a.track && (
                    <span className="text-xs px-2 py-0.5 rounded bg-muted/50 text-muted-foreground">
                      {a.track.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {a.content}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {a.author.firstName} {a.author.lastName} · {formatDate(a.createdAt)}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
